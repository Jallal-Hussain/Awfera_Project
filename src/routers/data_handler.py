from fastapi import APIRouter, UploadFile, HTTPException, Query, File, Depends, status
import uuid as uuid_pkg
import os
from sqlalchemy.orm import Session
from src.db import SessionLocal
from src.models import Document, User, Conversation, ChatMessage
from src.utils.pdf_processor import extract_text_from_pdf
from src.utils.llm_client import get_llm_response, get_chat_response, generate_document_summary, generate_conversation_title
from src.utils.auth import decode_access_token
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import FileResponse
from pypdf import PdfReader
import re
from loguru import logger
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, UTC

router = APIRouter()

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_PDF_PAGES = 100
UUID_REGEX = re.compile(r"^[a-fA-F0-9\-]{36}$")

# Pydantic models for request/response
class ChatMessageRequest(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    role: str
    content: str
    timestamp: datetime

class ConversationResponse(BaseModel):
    uuid: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse]

class DocumentSummaryResponse(BaseModel):
    uuid: str
    filename: str
    summary: str
    summary_generated_at: Optional[datetime]

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
    try:
        pdfs = [
            {"uuid": doc.uuid, "filename": doc.filename}
            for doc in db.query(Document).filter_by(user_id=current_user.id).all()
        ]
        return {"pdfs": pdfs}
    except Exception as e:
        print("Error in list_all_uuids:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

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


# ===== NEW CHAT ENDPOINTS =====

@router.post("/chat/start/{document_uuid}", response_model=ConversationResponse)
def start_conversation(
    document_uuid: uuid_pkg.UUID,
    message_request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new conversation with a document."""
    document_uuid_str = str(document_uuid)
    
    # Find the document
    doc = db.query(Document).filter_by(uuid=document_uuid_str, user_id=current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    # Create new conversation
    conversation_uuid = str(uuid_pkg.uuid4())
    conversation_title = generate_conversation_title(message_request.message)
    
    conversation = Conversation(
        uuid=conversation_uuid,
        title=conversation_title,
        user_id=current_user.id,
        document_id=doc.id
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    # Add user message
    user_message = ChatMessage(
        conversation_id=conversation.id,
        role="user",
        content=message_request.message
    )
    db.add(user_message)
    
    # Get LLM response (single message, no history yet)
    llm_response = get_llm_response(context=doc.extracted_text, query=message_request.message)
    
    # Add assistant message
    assistant_message = ChatMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=llm_response
    )
    db.add(assistant_message)
    
    # Update conversation timestamp
    conversation.updated_at = datetime.now(UTC)
    db.commit()
    
    # Return conversation with messages
    messages = [
        ChatMessageResponse(role=user_message.role, content=user_message.content, timestamp=user_message.timestamp),
        ChatMessageResponse(role=assistant_message.role, content=assistant_message.content, timestamp=assistant_message.timestamp)
    ]
    
    logger.info(f"User {current_user.username} started conversation {conversation_uuid} with document {document_uuid_str}")
    
    return ConversationResponse(
        uuid=conversation.uuid,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=messages
    )

@router.post("/chat/continue/{conversation_uuid}", response_model=ChatMessageResponse)
def continue_conversation(
    conversation_uuid: uuid_pkg.UUID,
    message_request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Continue an existing conversation."""
    conversation_uuid_str = str(conversation_uuid)
    
    # Find the conversation
    conversation = db.query(Conversation).filter_by(
        uuid=conversation_uuid_str, 
        user_id=current_user.id,
        is_active=True
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    
    # Get conversation history
    messages = db.query(ChatMessage).filter_by(conversation_id=conversation.id).order_by(ChatMessage.timestamp).all()
    conversation_history = [{"role": msg.role, "content": msg.content} for msg in messages]
    
    # Add user message
    user_message = ChatMessage(
        conversation_id=conversation.id,
        role="user",
        content=message_request.message
    )
    db.add(user_message)
    
    # Get LLM response with conversation history
    llm_response = get_chat_response(
        context=conversation.document.extracted_text,
        conversation_history=conversation_history,
        new_query=message_request.message
    )
    
    # Add assistant message
    assistant_message = ChatMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=llm_response
    )
    db.add(assistant_message)
    
    # Update conversation timestamp
    conversation.updated_at = datetime.now(UTC)
    db.commit()
    
    logger.info(f"User {current_user.username} continued conversation {conversation_uuid_str}")
    
    return ChatMessageResponse(
        role=assistant_message.role,
        content=assistant_message.content,
        timestamp=assistant_message.timestamp
    )

@router.get("/chat/conversations", response_model=List[dict])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all conversations for the current user."""
    conversations = db.query(Conversation).filter_by(
        user_id=current_user.id,
        is_active=True
    ).order_by(Conversation.updated_at.desc()).all()
    
    result = []
    for conv in conversations:
        result.append({
            "uuid": conv.uuid,
            "title": conv.title,
            "document_filename": conv.document.filename,
            "document_uuid": conv.document.uuid,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "message_count": len(conv.messages)
        })
    
    return result

@router.get("/chat/conversation/{conversation_uuid}", response_model=ConversationResponse)
def get_conversation(
    conversation_uuid: uuid_pkg.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific conversation with all messages."""
    conversation_uuid_str = str(conversation_uuid)
    
    conversation = db.query(Conversation).filter_by(
        uuid=conversation_uuid_str,
        user_id=current_user.id,
        is_active=True
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    
    messages = [
        ChatMessageResponse(role=msg.role, content=msg.content, timestamp=msg.timestamp)
        for msg in conversation.messages
    ]
    
    return ConversationResponse(
        uuid=conversation.uuid,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=messages
    )

@router.delete("/chat/conversation/{conversation_uuid}")
def delete_conversation(
    conversation_uuid: uuid_pkg.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation."""
    conversation_uuid_str = str(conversation_uuid)
    
    conversation = db.query(Conversation).filter_by(
        uuid=conversation_uuid_str,
        user_id=current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    
    # Soft delete
    conversation.is_active = False
    db.commit()
    
    logger.info(f"User {current_user.username} deleted conversation {conversation_uuid_str}")
    
    return {"message": "Conversation deleted successfully."}

# ===== SUMMARIZATION ENDPOINTS =====

@router.post("/summarize/{document_uuid}", response_model=DocumentSummaryResponse)
def generate_summary(
    document_uuid: uuid_pkg.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a summary for a document."""
    document_uuid_str = str(document_uuid)
    
    doc = db.query(Document).filter_by(uuid=document_uuid_str, user_id=current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    try:
        # Generate summary using LLM
        summary = generate_document_summary(doc.extracted_text, doc.filename)
        
        # Save summary to database
        doc.summary = summary
        doc.summary_generated_at = datetime.now(UTC)
        db.commit()
        
        logger.info(f"User {current_user.username} generated summary for document {document_uuid_str}")
        
        return DocumentSummaryResponse(
            uuid=doc.uuid,
            filename=doc.filename,
            summary=summary,
            summary_generated_at=doc.summary_generated_at
        )
    except Exception as e:
        logger.error(f"Summary generation failed for user {current_user.username}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

@router.get("/summary/{document_uuid}", response_model=DocumentSummaryResponse)
def get_summary(
    document_uuid: uuid_pkg.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the summary for a document."""
    document_uuid_str = str(document_uuid)
    
    doc = db.query(Document).filter_by(uuid=document_uuid_str, user_id=current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    if not doc.summary:
        raise HTTPException(status_code=404, detail="Summary not found. Generate one first.")
    
    return DocumentSummaryResponse(
        uuid=doc.uuid,
        filename=doc.filename,
        summary=doc.summary,
        summary_generated_at=doc.summary_generated_at
    )