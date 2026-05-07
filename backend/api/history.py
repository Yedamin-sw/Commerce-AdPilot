# 콘텐츠 저장 
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.database import supabase_admin as supabase
router = APIRouter()

class ad_Content(BaseModel):#저장 양식
    id: str
    product_id: int
    platform_type: str
    generated_text: str
    is_saved: bool
    created_at: str

#해당 product에 대한 광고명을 해당 product기준으로 저장?
@router.post("/save", status_code=201)
async def save_content(content: ad_Content):
    #db에 저장해야됨
    try:
        response = supabase.table("ad_contents").insert(content.dict()).execute()
        return {"message": "Content saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

#그럼 대시보드 리스트에는 일단 product만 보여주고 해당 product 클릭시에 광고문 history 보여주는 방식?
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
