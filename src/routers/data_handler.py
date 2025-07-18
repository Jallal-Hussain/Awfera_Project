from fastapi import APIRouter, UploadFile, HTTPException, Query, File, Depends, status
import uuid as uuid_pkg
import os
from sqlalchemy.orm import Session
from src.db import SessionLocal
from src.models import Document, User
from src.utils.pdf_processor import extract_text_from_pdf
from src.utils.llm_client import get_llm_response
from src.utils.auth import decode_access_token
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import FileResponse
from pypdf import PdfReader
import re
from loguru import logger

router = APIRouter()

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_PDF_PAGES = 100
UUID_REGEX = re.compile(r"^[a-fA-F0-9\-]{36}$")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if not payload or "user_id" not in payload:
        raise credentials_exception
    user = db.query(User).filter_by(id=payload["user_id"]).first()
    if not user:
        raise credentials_exception
    return user

def validate_uuid(uuid_str):
    if not UUID_REGEX.match(uuid_str):
        raise HTTPException(status_code=400, detail="Invalid UUID format.")

@router.post("/upload/{uuid}", status_code=201)
def upload_pdf(uuid: uuid_pkg.UUID, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uuid_str = str(uuid)
    validate_uuid(uuid_str)
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400, detail="Invalid file type. Please upload a PDF file."
        )
    if file.size is not None and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Max size is {MAX_FILE_SIZE // (1024*1024)}MB.")
    # Save file temporarily to check page count
    file_path = os.path.join(UPLOAD_DIR, f"{uuid_str}_{file.filename}")
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File too large. Max size is {MAX_FILE_SIZE // (1024*1024)}MB.")
        buffer.write(content)
    if os.path.getsize(file_path) == 0:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    try:
        reader = PdfReader(file_path)
        if len(reader.pages) > MAX_PDF_PAGES:
            os.remove(file_path)
            raise HTTPException(status_code=400, detail=f"PDF too long. Max {MAX_PDF_PAGES} pages allowed.")
    except Exception:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Invalid or corrupted PDF file.")
    existing = db.query(Document).filter_by(uuid=uuid_str, user_id=current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"UUID {uuid_str} already exists. Use PUT to update the PDF.",
        )
    try:
        extracted_text = extract_text_from_pdf(file_path)
        if not extracted_text:
            raise HTTPException(
                status_code=500, detail="Error extracting text from PDF."
            )
        doc = Document(
            uuid=uuid_str,
            filename=file.filename,
            user_id=current_user.id,
            extracted_text=extracted_text,
            file_path=file_path
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        logger.info(f"User {current_user.username} uploaded PDF {file.filename} with UUID {uuid_str}")
        return {
            "message": f"PDF {file.filename} uploaded and text extracted successfully.",
            "uuid": uuid_str,
        }
    except Exception as e:
        logger.error(f"Upload failed for user {current_user.username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during file processing: {str(e)}",
        )

@router.put("/update/{uuid}", status_code=200)
def update_pdf_data(uuid: uuid_pkg.UUID, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uuid_str = str(uuid)
    validate_uuid(uuid_str)
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400, detail="Invalid file type. Please upload a PDF file."
        )
    if file.size is not None and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Max size is {MAX_FILE_SIZE // (1024*1024)}MB.")
    file_path = os.path.join(UPLOAD_DIR, f"{uuid_str}_update_{file.filename}")
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File too large. Max size is {MAX_FILE_SIZE // (1024*1024)}MB.")
        buffer.write(content)
    try:
        reader = PdfReader(file_path)
        if len(reader.pages) > MAX_PDF_PAGES:
            os.remove(file_path)
            raise HTTPException(status_code=400, detail=f"PDF too long. Max {MAX_PDF_PAGES} pages allowed.")
    except Exception:
        os.remove(file_path)
        logger.error(f"Update failed for user {current_user.username}: Invalid or corrupted PDF file.")
        raise HTTPException(status_code=400, detail="Invalid or corrupted PDF file.")
    doc = db.query(Document).filter_by(uuid=uuid_str, user_id=current_user.id).first()
    if not doc:
        logger.error(f"Update failed: Document {uuid_str} not found for user {current_user.username}")
        raise HTTPException(
            status_code=404,
            detail=f"UUID {uuid_str} not found. Use POST to upload the PDF.",
        )
    new_text = extract_text_from_pdf(file_path)
    if not new_text:
        logger.error(f"Update failed: Text extraction failed for user {current_user.username}, file {file.filename}")
        raise HTTPException(
            status_code=500, detail="Error extracting text from PDF."
        )
    doc.extracted_text += "\n\n" + new_text
    doc.filename = file.filename
    doc.file_path = file_path
    db.commit()
    logger.info(f"User {current_user.username} updated PDF {file.filename} with UUID {uuid_str}")
    return {
        "message": f"PDF {file.filename} updated and text extracted successfully.",
        "uuid": uuid_str,
    }

@router.get("/query/{uuid}", status_code=200)
def query_data(
    uuid: uuid_pkg.UUID,
    query: str = Query(
        ..., description="The query to ask the LLM.", min_length=1, max_length=1000
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uuid_str = str(uuid)
    doc = db.query(Document).filter_by(uuid=uuid_str, user_id=current_user.id).first()
    if not doc:
        logger.error(f"Query failed: Document {uuid_str} not found for user {current_user.username}")
        raise HTTPException(
            status_code=404,
            detail=f"UUID {uuid_str} not found. Use POST to upload the PDF.",
        )
    llm_response = get_llm_response(context=doc.extracted_text, query=query)
    logger.info(f"User {current_user.username} queried document {uuid_str}")
    return {
        "uuid": uuid_str,
        "query": query,
        "llm_response": llm_response,
    }

@router.delete("/delete/{uuid}", status_code=200)
def delete_data(uuid: uuid_pkg.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uuid_str = str(uuid)
    doc = db.query(Document).filter_by(uuid=uuid_str, user_id=current_user.id).first()
    if not doc:
        logger.error(f"Delete failed: Document {uuid_str} not found for user {current_user.username}")
        raise HTTPException(
            status_code=404,
            detail=f"UUID {uuid_str} not found. Use POST to upload the PDF.",
        )
    db.delete(doc)
    db.commit()
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    logger.info(f"User {current_user.username} deleted document {uuid_str}")
    return {"message": f"Data for UUID {uuid_str} deleted successfully."}

@router.get("/list_uuids", status_code=200)
def list_all_uuids(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pdfs = [
        {"uuid": doc.uuid, "filename": doc.filename}
        for doc in db.query(Document).filter_by(user_id=current_user.id).all()
    ]
    return {"pdfs": pdfs}

@router.get("/download/{uuid}", response_class=FileResponse)
def download_pdf(uuid: uuid_pkg.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uuid_str = str(uuid)
    doc = db.query(Document).filter_by(uuid=uuid_str, user_id=current_user.id).first()
    if not doc:
        logger.error(f"Download failed: Document {uuid_str} not found for user {current_user.username}")
        raise HTTPException(status_code=404, detail="Document not found or access denied.")
    if not os.path.exists(doc.file_path):
        logger.error(f"Download failed: File not found for document {uuid_str} by user {current_user.username}")
        raise HTTPException(status_code=404, detail="File not found on server.")
    logger.info(f"User {current_user.username} downloaded document {uuid_str}")
    return FileResponse(path=doc.file_path, filename=doc.filename, media_type="application/pdf")