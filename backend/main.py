from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import generate
from dotenv import load_dotenv
import os
from pathlib import Path

# 명시적으로 .env 파일 경로 지정
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)
    from backend.api import auth, history, product
except Exception:
    auth = None
    history = None
    product = None

app = FastAPI()
# Load local .env (no-op if file missing)
load_dotenv()
# backend(uvicorn) = "http://localhost:8000"
# CORS 설정 (Next.js 프론트엔드 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
if auth is not None:
    app.include_router(auth.router,     prefix="/api/auth")
app.include_router(generate.router, prefix="/api/generate")
if history is not None:
    app.include_router(history.router,  prefix="/api/history")
if product is not None:
    app.include_router(product.router,  prefix="/api/product")


@app.get("/")
def root():
    return {"message": "The server is running.."}
