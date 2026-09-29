from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import Document, DocumentChunk, DocumentEntity, HistoricalEvent
from app.schemas import DocumentResponse, SearchResult
from app.services.pdf_processor import extract_text_and_entities
from app.services.rag import add_document_chunks, search

router = APIRouter()

@router.post("/upload", response_model=DocumentResponse)
async def upload_report(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    
    # Process PDF
    chunks_data, entities_data = extract_text_and_entities(content)
    
    # Identify Well ID
    well_id = next((e["value"] for e in entities_data if e["type"] == "Well"), None)
    
    # Save Document
    doc = Document(
        filename=file.filename,
        upload_date=datetime.utcnow(),
        status="INDEXED",
        well_id=well_id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Prepare chunks for Vector DB / RAG
    texts = [c["text"] for c in chunks_data]
    embedding_ids = add_document_chunks(texts)
    
    # Save Chunks with embedding links
    for i, c in enumerate(chunks_data):
        chunk_obj = DocumentChunk(
            document_id=doc.id,
            chunk_text=c["text"],
            page_number=c["page_number"],
            embedding_id=embedding_ids[i] if i < len(embedding_ids) else -1
        )
        db.add(chunk_obj)
        
    # Save Entities
    for e in entities_data:
        entity_obj = DocumentEntity(
            document_id=doc.id,
            entity_type=e["type"],
            entity_value=e["value"],
            context=e["context"]
        )
        db.add(entity_obj)
        
    db.commit()
    db.refresh(doc)
    
    return doc

@router.get("/stats")
def get_report_stats(db: Session = Depends(get_db)):
    total_docs = db.query(Document).count()
    indexed_chunks = db.query(DocumentChunk).count()
    total_entities = db.query(DocumentEntity).count()
    events_count = db.query(DocumentEntity).filter(DocumentEntity.entity_type == "Event").count()
    wells_covered = db.query(DocumentEntity.entity_value).filter(DocumentEntity.entity_type == "Well").distinct().count()
    
    return {
        "total_reports": total_docs,
        "indexed_chunks": indexed_chunks,
        "total_entities": total_entities,
        "historical_events": events_count,
        "wells_covered": wells_covered
    }

@router.get("/", response_model=List[DocumentResponse])
def list_reports(
    well_id: Optional[str] = None,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if well_id:
        query = query.filter(Document.well_id == well_id)
    if event_type:
        query = query.join(DocumentEntity).filter(
            DocumentEntity.entity_type == "Event",
            DocumentEntity.entity_value.ilike(f"%{event_type}%")
        )
    return query.all()

@router.get("/search", response_model=List[SearchResult])
def search_reports(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    results = search(q, top_k=6)
    
    search_results = []
    for emb_id, score in results:
        chunk = db.query(DocumentChunk).filter(DocumentChunk.embedding_id == emb_id).first()
        if chunk:
            doc = chunk.document
            entities = db.query(DocumentEntity).filter(DocumentEntity.document_id == doc.id).all()
            search_results.append({
                "chunk": chunk,
                "document": doc,
                "entities": entities,
                "score": score
            })
            
    return search_results

@router.get("/{document_id}", response_model=DocumentResponse)
def get_report(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
