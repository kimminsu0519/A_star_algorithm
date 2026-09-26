import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Tuple

app = FastAPI(title="A* Algorithm Interactive Web Bench", version="1.0")

# Request models for optional API-side verification
class CellModel(BaseModel):
    x: int
    y: int

class AStarRequest(BaseModel):
    rows: int = 10
    cols: int = 10
    start: CellModel
    goal: CellModel
    walls: List[CellModel]
    allow_diagonal: bool = True
    straight_cost: int = 10
    diagonal_cost: int = 14
    heuristic: str = "manhattan"  # manhattan | euclidean | chebyshev

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "A* Algorithm server running"}

# Serve static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def read_root():
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "A* Visualizer Frontend Loading..."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
