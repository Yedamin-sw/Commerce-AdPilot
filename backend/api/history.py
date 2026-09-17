# 콘텐츠 저장
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from backend.database import supabase_admin as supabase
import json
import csv
from io import StringIO
from datetime import datetime

router = APIRouter()

# id / created_at 은 DB가 자동 생성 (gen_random_uuid(), now()) 이므로 클라이언트가 보낼 필요 없음.
# product_id 도 nullable — 아직 저장된 상품이 없으면 없이도 저장 가능.
class ad_Content(BaseModel):#저장 양식
    product_id: Optional[int] = None
    platform_type: str
    generated_text: str
    is_saved: bool = True

class ContentUpdate(BaseModel):#편집 양식
    generated_text: str
    is_saved: bool

@router.post("/save", status_code=201)
async def save_content(content: ad_Content):
    try:
        response = supabase.table("ad_contents").insert(content.dict()).execute()
        return {"message": "Content saved successfully", "content": response.data[0] if response.data else {}}
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


# ──────────────────────────────────────────────────────────────────────────────
# 개별 콘텐츠 조회
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/{content_id}")
async def get_content(content_id: str):
    """특정 콘텐츠 조회"""
    try:
        response = supabase.table("ad_contents").select("*").eq("id", content_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Content not found")
        return {"content": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# 콘텐츠 편집
# ──────────────────────────────────────────────────────────────────────────────
@router.put("/{content_id}")
async def update_content(content_id: str, update: ContentUpdate):
    """생성된 콘텐츠 편집"""
    try:
        response = supabase.table("ad_contents").select("*").eq("id", content_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Content not found")
        
        update_data = update.dict()
        response = supabase.table("ad_contents").update(update_data).eq("id", content_id).execute()
        return {"message": "Content updated successfully", "content": response.data[0] if response.data else {}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# 콘텐츠 삭제
# ──────────────────────────────────────────────────────────────────────────────
@router.delete("/{content_id}")
async def delete_content(content_id: str):
    """저장된 콘텐츠 삭제"""
    try:
        response = supabase.table("ad_contents").select("*").eq("id", content_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Content not found")
        
        supabase.table("ad_contents").delete().eq("id", content_id).execute()
        return {"message": "Content deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# 결과 내보내기 (job_id 기반)
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/{job_id}/export")
async def export_results(job_id: str, format: str = Query("json", regex="^(json|csv|txt)$")):
    """생성된 결과를 파일 형식으로 내보내기"""
    try:
        # product_id로 해당 job의 모든 결과 조회
        response = supabase.table("ad_contents").select("*").eq("product_id", job_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="No results found for this job")
        
        contents = response.data
        
        if format == "json":
            return {
                "job_id": job_id,
                "total": len(contents),
                "exported_at": datetime.now().isoformat(),
                "results": contents
            }
        
        elif format == "csv":
            output = StringIO()
            if contents:
                fieldnames = contents[0].keys()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(contents)
            return {"content": output.getvalue(), "format": "csv", "filename": f"{job_id}_export.csv"}
        
        elif format == "txt":
            # TXT 형식: 각 콘텐츠를 구분선으로 나눔
            output_lines = [f"=== Export Report: {job_id} ===", f"Exported at: {datetime.now().isoformat()}", f"Total items: {len(contents)}", ""]
            for i, content in enumerate(contents, 1):
                output_lines.append(f"--- Item {i} ---")
                output_lines.append(f"ID: {content.get('id', 'N/A')}")
                output_lines.append(f"Platform: {content.get('platform_type', 'N/A')}")
                output_lines.append(f"Created: {content.get('created_at', 'N/A')}")
                output_lines.append(f"\n{content.get('generated_text', 'N/A')}\n")
            
            return {"content": "\n".join(output_lines), "format": "txt", "filename": f"{job_id}_export.txt"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))