import os
import glob
from app.database import SessionLocal, Base, engine
from app.models import Document, DocumentChunk, DocumentEntity
from app.services.pdf_processor import extract_text_and_entities
from app.services.rag import add_document_chunks
from datetime import datetime

def seed_sample_reports():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        sample_dir = os.path.join(os.path.dirname(__file__), "..", "sample_reports")
        pdf_files = glob.glob(os.path.join(sample_dir, "*.pdf"))
        
        print(f"Found {len(pdf_files)} PDF files to index.")
        for pdf_path in pdf_files:
            filename = os.path.basename(pdf_path)
            existing = db.query(Document).filter(Document.filename == filename).first()
            if existing:
                print(f"Document {filename} already indexed.")
                continue
                
            with open(pdf_path, "rb") as f:
                content = f.read()
                
            chunks_data, entities_data = extract_text_and_entities(content)
            well_id = next((e["value"] for e in entities_data if e["type"] == "Well"), None)
            
            doc = Document(
                filename=filename,
                upload_date=datetime.utcnow(),
                status="INDEXED",
                well_id=well_id
            )
            db.add(doc)
            db.flush()
            db.refresh(doc)
            
            texts = [c["text"] for c in chunks_data]
            embedding_ids = add_document_chunks(texts)
            
            for i, c in enumerate(chunks_data):
                chunk_obj = DocumentChunk(
                    document_id=doc.id,
                    chunk_text=c["text"],
                    page_number=c["page_number"],
                    embedding_id=embedding_ids[i] if i < len(embedding_ids) else -1
                )
                db.add(chunk_obj)
                
            for e in entities_data:
                entity_obj = DocumentEntity(
                    document_id=doc.id,
                    entity_type=e["type"],
                    entity_value=e["value"],
                    context=e["context"]
                )
                db.add(entity_obj)
                
            db.commit()
            print(f"Successfully indexed {filename} with {len(chunks_data)} chunks and {len(entities_data)} entities.")
            
    finally:
        db.close()

if __name__ == "__main__":
    seed_sample_reports()
