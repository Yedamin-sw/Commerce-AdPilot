from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import auth, generate, history, product
app = FastAPI()
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
app.include_router(auth.router,     prefix="/api/auth")
app.include_router(generate.router, prefix="/api/generate")
app.include_router(history.router,  prefix="/api/history")
app.include_router(product.router,  prefix="/api/product")

@app.get("/")
def root():
    return {"message": "The server is running.."}
