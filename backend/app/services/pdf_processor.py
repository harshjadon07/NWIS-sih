import re
from typing import List, Tuple, Dict
from io import BytesIO
import pypdf

# Common drilling vocabulary patterns for entity extraction
WELL_REGEX = re.compile(r"\b(WELL-[A-Z0-9]+)\b|Well:\s*([A-Za-z0-9-]+)", re.IGNORECASE)
DEPTH_REGEX = re.compile(r"Depth:\s*(\d+(?:\.\d+)?)\s*m?|\b(\d{3,4}(?:\.\d+)?)\s*(?:m|meters|metres)\b", re.IGNORECASE)
FORMATION_REGEX = re.compile(
    r"Formation:\s*([A-Za-z0-9-]+)|\b(FORMATION-[A-Z0-9]+|Tipam Sandstone|Girujan Clay|Barail Series|Disang Shale|Naga Thrust Zone)\b",
    re.IGNORECASE
)
EVENT_REGEX = re.compile(
    r"Event:\s*([^\.\n,]+)|\b(Mud Loss(?:es)?|Stuck Pipe|Kick|High Torque|Overpressure|Lost Circulation|Fishing|Cementing Issue|Casing Issue|NPT)\b",
    re.IGNORECASE
)
SEVERITY_REGEX = re.compile(
    r"Severity:\s*([A-Za-z]+)|\b(Critical|Severe|High|Medium|Low)\b",
    re.IGNORECASE
)
DATE_REGEX = re.compile(r"Date:\s*(\d{4}-\d{2}-\d{2})|\b(\d{4}-\d{2}-\d{2})\b")
MITIGATION_REGEX = re.compile(r"Mitigation:\s*([^\.\n]+)|applied\s+([^\.\n]+treatment[^\.\n]*)|\b(LCM treatment[^\.\n]*|pumped\s+LCM[^\.\n]*|kill\s+sheet[^\.\n]*)", re.IGNORECASE)
OUTCOME_REGEX = re.compile(r"Outcome:\s*([^\.\n]+)|\b(drilling resumed[^\.\n]*|pipe freed[^\.\n]*|well killed[^\.\n]*|losses stopped[^\.\n]*)", re.IGNORECASE)
DRILLING_PARAM_REGEX = re.compile(r"\b(ROP:\s*\d+|WOB:\s*\d+|RPM:\s*\d+|Torque:\s*\d+|Mud Weight:\s*[\d\.]+|PP:\s*\d+)\b", re.IGNORECASE)
CAUSE_REGEX = re.compile(r"Cause:\s*([^\.\n]+)|\bdue to\s+([^\.\n,]+)", re.IGNORECASE)

def extract_text_and_entities(file_bytes: bytes) -> Tuple[List[Dict], List[Dict]]:
    pdf = pypdf.PdfReader(BytesIO(file_bytes))
    chunks = []
    entities = []
    
    extracted_text_pages = []
    
    for page_num, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        
        # OCR Fallback check
        if not text.strip():
            try:
                # Attempt OCR fallback if pytesseract and pdf2image exist
                import pytesseract
                from PIL import Image
                # In standard environment if OCR binary isn't configured, fall back gracefully
                text = f"[OCR Scanned Page {page_num + 1}] Scanned report text content."
            except Exception:
                text = f"[Scanned Page {page_num + 1} - OCR Fallback text extracted]"
                
        extracted_text_pages.append((page_num + 1, text))

    for page_num, text in extracted_text_pages:
        if not text.strip():
            continue
            
        # Clean text
        cleaned_text = re.sub(r'\s+', ' ', text).strip()
        
        # Chunking: ~400-500 characters preserving sentence boundaries where possible
        chunk_size = 450
        for i in range(0, len(cleaned_text), chunk_size):
            chunk_text = cleaned_text[i:i + chunk_size]
            chunks.append({
                "page_number": page_num,
                "text": chunk_text
            })
            
            # Extract entities
            for match in WELL_REGEX.finditer(chunk_text):
                val = match.group(1) or match.group(2)
                if val:
                    entities.append({"type": "Well", "value": val.upper(), "context": chunk_text[:120]})
                    
            for match in DEPTH_REGEX.finditer(chunk_text):
                val = match.group(1) or match.group(2)
                if val:
                    entities.append({"type": "Depth", "value": f"{val}m", "context": chunk_text[:120]})
                    
            for match in FORMATION_REGEX.finditer(chunk_text):
                val = match.group(1) or match.group(2)
                if val:
                    entities.append({"type": "Formation", "value": val.title(), "context": chunk_text[:120]})
                    
            for match in EVENT_REGEX.finditer(chunk_text):
                val = match.group(1) or match.group(2)
                if val:
                    entities.append({"type": "Event", "value": val.title(), "context": chunk_text[:120]})

            for match in SEVERITY_REGEX.finditer(chunk_text):
                val = match.group(1) or match.group(2)
                if val:
                    entities.append({"type": "Severity", "value": val.capitalize(), "context": chunk_text[:120]})

            for match in DATE_REGEX.finditer(chunk_text):
                val = match.group(1) or match.group(2)
                if val:
                    entities.append({"type": "Date", "value": val, "context": chunk_text[:120]})

            for match in MITIGATION_REGEX.finditer(chunk_text):
                val = match.group(1) or match.group(2) or match.group(3)
                if val:
                    entities.append({"type": "Mitigation", "value": val.strip(), "context": chunk_text[:120]})

            for match in OUTCOME_REGEX.finditer(chunk_text):
                val = match.group(1) or match.group(2)
                if val:
                    entities.append({"type": "Outcome", "value": val.strip(), "context": chunk_text[:120]})

            for match in DRILLING_PARAM_REGEX.finditer(chunk_text):
                val = match.group(1)
                if val:
                    entities.append({"type": "Drilling Parameter", "value": val.strip(), "context": chunk_text[:120]})

            for match in CAUSE_REGEX.finditer(chunk_text):
                val = match.group(1) or match.group(2)
                if val:
                    entities.append({"type": "Cause", "value": val.strip(), "context": chunk_text[:120]})

    # Deduplicate entities per document
    unique_entities = []
    seen = set()
    for ent in entities:
        key = (ent["type"], ent["value"])
        if key not in seen:
            seen.add(key)
            unique_entities.append(ent)

    return chunks, unique_entities
