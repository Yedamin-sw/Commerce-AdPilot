# 상품 관리 API
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.database import supabase_admin as supabase

router = APIRouter()


# 상품 등록 요청 모델 (products 테이블 스키마와 동일)
class Product(BaseModel):
    user_id: str                     # 소유자 uuid (NN, users.id FK)
    name: str                        # 상품명 (NN)
    category: Optional[str] = None   # 카테고리
    features: str                    # 주요 특징 (NN)
    target_audience: Optional[str] = None  # 타겟 고객


# 상품 등록
@router.post("/", status_code=201)
async def create_product(product: Product):
    try:
        response = supabase.table("products").insert(product.dict()).execute()
        return {"message": "Product created successfully", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 상품 단건 조회
@router.get("/{product_id}")
async def get_product(product_id: int):
    try:
        response = supabase.table("products").select("*").eq("id", product_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"data": response.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 상품 목록 조회 (페이지네이션)
@router.get("/")
async def list_products(page: int = 1):
    try:
        start = (page - 1) * 10
        end = start + 9
        response = supabase.table("products").select("*").range(start, end).execute()
        return {"contents": response.data, "page": page}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 상품 수정
@router.put("/{product_id}")
async def update_product(product_id: int, product: Product):
    try:
        response = supabase.table("products").update(product.dict()).eq("id", product_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product updated successfully", "data": response.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 상품 삭제
@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: int):
    try:
        response = supabase.table("products").delete().eq("id", product_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        return
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
