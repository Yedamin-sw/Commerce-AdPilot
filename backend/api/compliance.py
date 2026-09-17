# 광고 카피 규제 검증 (backend/regulations 룰셋 기반 Layer 1 + Layer 2 검사)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.regulations import ComplianceReport, check_full

router = APIRouter()


class ValidateRequest(BaseModel):
    text: str
    channel: str | None = None
    country: str = "KR"
    forbidden_words: str = ""   # generate.py 의 forbidden_words 와 동일하게 콤마 구분 문자열
    use_llm: bool = True        # False면 Layer 1(키워드/정규식)만, 빠르고 무료 — 실시간 타이핑 검사용


# 생성된 카피를 룰셋에 대조해 점수·위반 목록 반환 (Layer 1 결정론적 검사 + Layer 2 LLM 심의관)
@router.post("/validate", response_model=ComplianceReport)
async def validate(req: ValidateRequest):
    extra_banned = [w.strip() for w in req.forbidden_words.split(",") if w.strip()]
    try:
        return await check_full(
            req.text,
            country=req.country,
            channel=req.channel,
            extra_banned=extra_banned,
            use_llm=req.use_llm,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
