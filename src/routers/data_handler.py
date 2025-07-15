from fastapi import APIRouter, UploadFile, HTTPException, Query, File, Depends
import uuid as uuid_pkg
import os
from sqlalchemy.orm import Session
from src.db import SessionLocal
from src.models import Document
from src.utils.pdf_processor import extract_text_from_pdf
from src.utils.llm_client import get_llm_response

router = APIRouter()

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload/{uuid}", status_code=201)
def upload_pdf(uuid: uuid_pkg.UUID, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400, detail="Invalid file type. Please upload a PDF file."
        )
    uuid_str = str(uuid)
    existing = db.query(Document).filter_by(uuid=uuid_str).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"UUID {uuid_str} already exists. Use PUT to update the PDF.",
        )
    file_path = os.path.join(UPLOAD_DIR, f"{uuid_str}_{file.filename}")
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
        extracted_text = extract_text_from_pdf(file_path)
        if not extracted_text:
            raise HTTPException(
                status_code=500, detail="Error extracting text from PDF."
            )
        doc = Document(
            uuid=uuid_str,
            filename=file.filename,
            user_id=1,  # Placeholder until user auth is implemented
            extracted_text=extracted_text,
            file_path=file_path
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return {
            "message": f"PDF {file.filename} uploaded and text extracted successfully.",
            "uuid": uuid_str,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during file processing: {str(e)}",
        )

@router.put("/update/{uuid}", status_code=200)
def update_pdf_data(uuid: uuid_pkg.UUID, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400, detail="Invalid file type. Please upload a PDF file."
        )
    uuid_str = str(uuid)
    doc = db.query(Document).filter_by(uuid=uuid_str).first()
    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"UUID {uuid_str} not found. Use POST to upload the PDF.",
        )
    file_path = os.path.join(UPLOAD_DIR, f"{uuid_str}_update_{file.filename}")
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
        new_text = extract_text_from_pdf(file_path)
        if not new_text:
            raise HTTPException(
                status_code=500, detail="Error extracting text from PDF."
            )
        doc.extracted_text += "\n\n" + new_text
        doc.filename = file.filename
        doc.file_path = file_path
        db.commit()
        return {
            "message": f"PDF {file.filename} updated and text extracted successfully.",
            "uuid": uuid_str,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during file processing: {str(e)}",
        )

@router.get("/query/{uuid}", status_code=200)
def query_data(
    uuid: uuid_pkg.UUID,
    query: str = Query(
        ..., description="The query to ask the LLM.", min_length=1, max_length=1000
    ),
    db: Session = Depends(get_db),
):
    uuid_str = str(uuid)
    doc = db.query(Document).filter_by(uuid=uuid_str).first()
    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"UUID {uuid_str} not found. Use POST to upload the PDF.",
        )
    llm_response = get_llm_response(context=doc.extracted_text, query=query)
    return {
        "uuid": uuid_str,
        "query": query,
        "llm_response": llm_response,
    }

@router.delete("/delete/{uuid}", status_code=200)
def delete_data(uuid: uuid_pkg.UUID, db: Session = Depends(get_db)):
    uuid_str = str(uuid)
    doc = db.query(Document).filter_by(uuid=uuid_str).first()
    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"UUID {uuid_str} not found. Use POST to upload the PDF.",
        )
    db.delete(doc)
    db.commit()
    # Optionally remove the file from disk
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    return {"message": f"Data for UUID {uuid_str} deleted successfully."}

@router.get("/list_uuids", status_code=200)
def list_all_uuids(db: Session = Depends(get_db)):
    uuids = [doc.uuid for doc in db.query(Document).all()]
    return {"uuids": uuids}