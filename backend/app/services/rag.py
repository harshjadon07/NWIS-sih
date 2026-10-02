import os
import json
import math
from typing import List, Tuple
from collections import defaultdict

# Pure Python TF-IDF / Vector Store mock for prototype to bypass Windows AppLocker compiled extension blocks
class PurePythonVectorDB:
    def __init__(self):
        self.documents = []  # List of chunks
        self.tf_idf = []
        self.vocab = set()
        self.idf = {}
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.index_file = os.path.join(base_dir, "mock_vector_db.json")
        self.load()

    def tokenize(self, text: str) -> List[str]:
        return [w.lower() for w in ''.join(c if c.isalnum() else ' ' for c in text).split()]

    def load(self):
        if os.path.exists(self.index_file):
            try:
                with open(self.index_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.documents = data.get('documents', [])
                    self.idf = data.get('idf', {})
            except Exception:
                pass

    def save(self):
        with open(self.index_file, 'w', encoding='utf-8') as f:
            json.dump({'documents': self.documents, 'idf': self.idf}, f)

    def _compute_idf(self):
        doc_count = len(self.documents)
        df = defaultdict(int)
        for doc in self.documents:
            words = set(self.tokenize(doc))
            for w in words:
                df[w] += 1
        
        self.idf = {w: math.log(doc_count / (1 + df[w])) for w in df}

    def add_chunks(self, chunks: List[str]) -> List[int]:
        start_id = len(self.documents)
        self.documents.extend(chunks)
        self._compute_idf()
        self.save()
        return list(range(start_id, start_id + len(chunks)))

    def _score(self, query: str, doc_id: int) -> float:
        q_words = self.tokenize(query)
        d_words = self.tokenize(self.documents[doc_id])
        
        score = 0
        for w in set(q_words):
            if w in d_words:
                tf = d_words.count(w) / len(d_words)
                idf = self.idf.get(w, 0)
                score += tf * idf
        return score

    def search(self, query: str, top_k: int = 5) -> List[Tuple[int, float]]:
        if not self.documents:
            return []
            
        scores = []
        for i in range(len(self.documents)):
            s = self.score_exact_match(query, self.documents[i]) + self._score(query, i)
            if s > 0:
                scores.append((i, s))
                
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]

    def score_exact_match(self, query: str, doc: str) -> float:
        # Boost for exact keyword presence
        q_lower = query.lower()
        d_lower = doc.lower()
        score = 0
        if "stuck pipe" in q_lower and "stuck pipe" in d_lower:
            score += 10
        if "mud loss" in q_lower and "mud loss" in d_lower:
            score += 10
        return score

db = PurePythonVectorDB()

def add_document_chunks(chunks: List[str]) -> List[int]:
    return db.add_chunks(chunks)

def search(query: str, top_k: int = 5) -> List[Tuple[int, float]]:
    # To mimic distance where lower is better in FAISS, we return inverse score
    results = db.search(query, top_k)
    return [(idx, 100.0 / (score + 0.1)) for idx, score in results]
