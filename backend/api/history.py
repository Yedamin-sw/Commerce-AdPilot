
# 콘텐츠 저장
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.database import supabase_admin as supabase
router = APIRouter()

class ad_Content(BaseModel):  # ad_contents 테이블 스키마와 동일
    id: Optional[int] = None             # DB 자동 생성 (integer)
    product_id: int                      # NN, products.id FK
    platform_type: str                   # NN
    generated_text: str                  # NN
    is_saved: Optional[bool] = False
    created_at: Optional[str] = None     # DB 자동 생성 (timestamp)

@router.post("/save", status_code=201)
async def save_content(content: ad_Content):
    try:
        response = supabase.table("ad_contents").insert(content.dict()).execute()
        return {"message": "Content saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 페이지 네이션
@router.get("/list/product")
async def list_content(page: int):
    try:
        response = supabase.table("products").select("*").range((page - 1) * 10, page * 10).execute()
        return {"contents": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

#해당 플랫폼 마크 띄우기
@router.get("/list/content/{product_id}")
async def list_content_by_product(product_id: int):
    try:
        response = supabase.table("ad_contents").select("*").eq("product_id", product_id).execute()
        return {"contents": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))