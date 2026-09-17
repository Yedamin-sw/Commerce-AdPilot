from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException
from pydantic import BaseModel
import pandas as pd
import io
import os
import asyncio
import uuid
import time

from .schemas import MultichannelCopyRequest
from backend.middlewares.openai import (
    generate_multichannel_copy,
    _create_client
)
from backend.regulations import Violation, build_repair_instructions, check_full as compliance_check, render_rules

router = APIRouter()

# 일괄 생성 작업 상태 보관소.
# 메모리에만 저장하므로 서버 재시작 시 사라짐. 나중에 DB로 옮길 것.
Products: dict[str, dict] = {}

MAX_CONCURRENCY = 10
DEFAULT_RETRY = 2


# ──────────────────────────────────────────────────────────────────────────────
# 채널별 스타일 지침
# ──────────────────────────────────────────────────────────────────────────────
PLATFORM: dict[str, str] = {
    "blog": (
        "【채널: 블로그 (네이버·티스토리)】\n"
        "- 형식: 소제목(▶ 또는 []) 포함 3개 이상 문단, 정보 전달형 어조\n"
        "- 독자가 검색으로 유입됨 → 제목과 첫 문단에 의약품명·효능 키워드 자연스럽게 배치\n"
        "- 마지막 문단에 '이 포스팅은 참고용이며, 복용 전 전문의 또는 약사와 상담하세요.' 포함\n"
        "- 이모지 사용 금지"
    ),
    "instagram": (
        "【채널: 인스타그램 피드·릴스】\n"
        "- 형식: 첫 줄 후킹 1문장 → 본문 2~3문장 → 해시태그 4~6개\n"
        "- 첫 줄은 스크롤을 멈추게 할 강렬한 한 줄로 시작 (질문형, 공감형 모두 가능)\n"
        "- 이모지를 문단 사이사이에 자연스럽게 활용해 가독성 확보\n"
        "- 의약품 과장 표현(완치, 100% 효과, 즉시 낫는) 절대 사용 금지\n"
        "- 캡션 맨 끝에 '※ 전문의·약사 상담 후 복용하세요' 한 줄 추가"
    ),
    "facebook": (
        "【채널: 페이스북 피드 광고】\n"
        "- 형식: 3~5문장, 이모지 1~2개로 절제\n"
        "- 주 타겟 30~50대 → 차분하고 신뢰감 있는 어조, 유행어·과장 금지\n"
        "- 제품 효능과 복용 대상을 명확하게 전달\n"
        "- 글 하단에 '※ 이 게시물은 의약품 광고입니다. 용법·용량을 반드시 확인하세요.' 포함"
    ),
    "youtube": (
        "【채널: 유튜브 영상 설명·인트로 자막】\n"
        "- 형식: 후킹 1문장 → 본문 3~4문장 → CTA 1문장\n"
        "- 첫 문장은 시청자가 즉시 공감할 질문이나 상황 묘사로 시작\n"
        "- 영상 끝까지 시청을 유도하는 CTA 포함 (예: '아래 설명란에서 복용법 확인하세요')\n"
        "- 이모지 사용 금지"
    ),
    "tiktok": (
        "【채널: 틱톡 영상 캡션】\n"
        "- 형식: 1~2문장 + 해시태그 3~5개, 전체 80자 이내\n"
        "- MZ세대가 공감하는 일상 상황(시험 전날 두통, 환절기 감기 등) 짧게 언급\n"
        "- 트렌디한 해시태그 포함, 마지막에 #약바로알기 추가"
    ),
    "naver": (
        "【채널: 네이버 쇼핑·파워링크 광고】\n"
        "- 형식: 2~3문장 + CTA 1문장\n"
        "- 검색 사용자 대상 → 의약품명·효능 키워드를 문구 앞쪽에 배치\n"
        "- 짧고 명확한 어조로 클릭을 유도하는 CTA 포함 (예: '지금 성분·복용법 확인하기')"
    ),
    "default": (
        "【채널: 일반】\n"
        "- 형식: 2~3문장, 간결하고 신뢰감 있는 어조\n"
        "- 의약품 주요 효능·복용 대상을 명확하게 전달\n"
        "- '복용 전 전문의 또는 약사와 상담하세요' 문구 포함"
    ),
}

# ──────────────────────────────────────────────────────────────────────────────
# 길이 × 채널 조합 지침
# ──────────────────────────────────────────────────────────────────────────────
def _build_length_instruction(length: str, channel: str) -> str:
    l = (length or "").lower()
    is_long  = any(k in l for k in ["상세", "long", "장문"])
    is_short = any(k in l for k in ["한 줄", "short", "단문"])

    if is_long:
        if channel in ("blog", "naver", "youtube"):
            return (
                "【분량: 장문 (상세 설명형)】\n"
                "공백 제외 최소 900자 이상으로 작성하세요.\n"
                "구조: ① 도입부 (타겟 독자가 겪는 상황 묘사, 100자 이상) "
                "→ ② 본문 (효능·성분·복용법 상세, 소제목 포함 3개 이상 문단) "
                "→ ③ 마무리 (복용 주의사항 + 전문의 상담 권장)\n"
                "각 문단은 ▶ 또는 [] 소제목으로 구분하고, 단순 나열이 아닌 "
                "실제 경험담처럼 살이 붙은 서술로 작성하세요."
            )
        elif channel == "instagram":
            return (
                "【분량: 장문 (인스타그램 허용 최대)】\n"
                "캡션 최대치(약 2,000자) 내에서 풍성하게 작성하세요.\n"
                "구조: 후킹 1줄 → 상황 공감 2~3문장 → 효능 상세 3~5문장 → 복용 팁 → 해시태그 5~7개\n"
                "각 문단 사이 이모지로 시각적 구분을 해주세요."
            )
        else:
            return (
                "【분량: 장문】\n"
                "해당 채널 허용 범위 내 최대한 풍성하게, 400자 이상으로 작성하세요.\n"
                "효능 → 복용 대상 → 주의사항 순서로 문단을 나눠 상세히 서술하세요."
            )

    elif is_short:
        return (
            "【분량: 단문 (한 줄 카피)】\n"
            "인사말·부연 설명·주의사항을 모두 생략하고 "
            "15자~30자 이내의 슬로건 한 줄만 작성하세요.\n"
            "평범하거나 밋밋한 표현은 절대 금지. "
            "임팩트 있고 기억에 남는 카피여야 합니다.\n"
            "예시 수준: '열이 나면, 타이레놀.' / '두통 잡는 단 하나의 선택.'"
        )

    else:  # medium (기본값)
        channel_guide = {
            "blog":      "소제목 포함 3~4문단, 공백 제외 250~400자",
            "instagram": "후킹 1문장 + 설명 2~3문장 + 해시태그 4~6개, 총 150자 내외",
            "facebook":  "3~5문장, 200~300자, 이모지 1~2개",
            "youtube":   "후킹 1문장 + 본문 3문장 + CTA 1문장, 총 200자 내외",
            "tiktok":    "1~2문장 + 해시태그 3~5개, 80자 이내",
            "naver":     "키워드 포함 2~3문장 + CTA 1문장, 150자 내외",
        }
        guide = channel_guide.get(channel, "2~3문장, 150자 내외")
        return (
            f"【분량: 표준 (채널 기본값)】\n"
            f"{guide}로 작성하세요.\n"
            f"너무 길거나 짧지 않게, 해당 채널 사용자가 읽기 편한 적당한 분량을 유지하세요."
        )


# ──────────────────────────────────────────────────────────────────────────────
# 목적(purpose) 지침
# ──────────────────────────────────────────────────────────────────────────────
def _build_purpose_instruction(purpose: str) -> str:
    p = (purpose or "").lower()

    if any(k in p for k in ["conversion", "전환", "구매"]):
        return (
            "【목적: 전환 (구매·행동 유도)】\n"
            "독자가 지금 바로 약국을 방문하거나 구매하도록 유도하세요.\n"
            "혜택(빠른 효과, 편의성)을 전면에 내세우고, "
            "글 마지막에 직접적인 CTA를 자연스럽게 배치하세요.\n"
            "예시 CTA: '가까운 약국에서 확인해보세요', '지금 성분과 복용법을 확인하세요'"
        )
    elif any(k in p for k in ["awareness", "인지", "브랜드"]):
        return (
            "【목적: 인지도 제고 (브랜드 각인)】\n"
            "직접 구매 유도보다는 브랜드명과 핵심 가치를 기억에 남기는 데 집중하세요.\n"
            "'이런 약이 있다'는 인상을 자연스럽게 심어주는 스토리텔링 방식으로 작성하세요."
        )
    elif any(k in p for k in ["engagement", "참여", "공유"]):
        return (
            "【목적: 참여·공유 유도】\n"
            "타겟 독자가 '이거 나 얘기다'라고 느낄 수 있는 공감형 상황 묘사로 시작하세요.\n"
            "댓글·공유를 자연스럽게 유도하는 질문형 마무리 문장을 사용하세요.\n"
            "예시: '혹시 여러분도 이런 경험 있으신가요?'"
        )
    elif any(k in p for k in ["정보", "informational"]):
        return (
            "【목적: 정보 전달】\n"
            "의약품의 효능·성분·복용법을 정확하고 이해하기 쉽게 전달하는 데 집중하세요.\n"
            "과장 없이 사실 기반으로 서술하되, 독자가 끝까지 읽고 싶게 흥미롭게 구성하세요."
        )
    else:
        return (
            f"【목적: {purpose or '일반'}】\n"
            f"위 목적이 달성되도록 카피의 흐름을 설계하세요."
        )


# ──────────────────────────────────────────────────────────────────────────────
# 프롬프트 빌더 (채널 × 길이 × 목적 통합)
# ──────────────────────────────────────────────────────────────────────────────
def build_prompt(
    tone: str, core_message: str,
    forbidden_words: str, channel,
    tnm: str, length: str, purpose: str,
    name: str = "", features: str = "", country: str = "KR"
) -> str:

    print("[DEBUG] build_prompt")

    # channel 정규화
    if isinstance(channel, list):
        channel = channel[0] if channel else "default"
    channel = (channel or "default").strip().lower()
    if channel not in PLATFORM:
        channel = "default"

    forbidden_clause = (
        f"\n금지 표현 (절대 사용 불가): {forbidden_words}"
        if forbidden_words and forbidden_words.strip() else ""
    )
    tnm_clause = (
        f"\n추가 톤앤매너 요청: {tnm}"
        if tnm and tnm.strip() else ""
    )

    # backend/regulations 룰셋 기반 준수사항 블록 (국가별). 룰셋이 없는 국가는
    # 최소 하드코딩 폴백으로 — 생성 자체가 막히면 안 되므로.
    try:
        rules_block = render_rules(country, None if channel == "default" else channel)
    except FileNotFoundError:
        rules_block = (
            "'완치 보장', '부작용 없음', '100% 효과', '즉시 낫는다' 등 과장·단정 표현 사용 금지\n"
            "모든 광고에 전문의·약사 상담 권장 또는 용법·용량 확인 안내 문구 포함\n"
            "효능·효과는 허가 범위 내 표현만 사용"
        )

    prompt = f"""당신은 국내 의약품 광고 전문 카피라이터입니다.
아래 지침을 모두 반영하여 완성도 높은 광고 문구를 작성하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▌ 브랜드 가이드
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
기본 톤: {tone}
핵심 전달 메시지: {core_message}{forbidden_clause}{tnm_clause}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▌ {PLATFORM[channel]}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▌ {_build_length_instruction(length, channel)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▌ {_build_purpose_instruction(purpose)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▌ {rules_block}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▌ 추가 규칙
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
오직 아래 입력된 제품명({name})만 사용할 것 — 다른 임의의 제품명 절대 사용 금지

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▌ 작성 방식
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 제품 정보를 단순 나열하지 말고, 타겟 고객의 실제 일상 상황 속에 자연스럽게 녹여 쓰세요.
- 기계적인 말투(~하십시오, ~에 도움을 줍니다)는 피하고, 실제 마케터가 쓰는 구어체로 작성하세요.
- 응답은 완성된 광고 문구만 출력하세요. 설명·해설·번호 매기기 없이.
"""
    return prompt


# ──────────────────────────────────────────────────────────────────────────────
# user content 포맷터 — 제품 정보만 간결하게 전달
# (스토리텔링 지침은 system prompt에서 처리하므로 여기선 사실 정보만)
# ──────────────────────────────────────────────────────────────────────────────
def _join(value) -> str:
    if value is None:
        return ""
    parts = [x.strip() for x in str(value).split(",")]
    return ", ".join(parts) if parts else ""


def _format_user_content(row: dict) -> str:
    return (
        f"[제품명] {_join(row.get('name'))}\n"
        f"[카테고리] {_join(row.get('category'))}\n"
        f"[주요 효능·특징] {_join(row.get('features'))}\n"
        f"[타겟 고객] {_join(row.get('target_audience'))}\n"
    )


# ──────────────────────────────────────────────────────────────────────────────
# OpenAI 호출 (재시도 포함)
# ──────────────────────────────────────────────────────────────────────────────
async def _call_openai(
    prompt: str,
    user_content: str,
    semaphore: asyncio.Semaphore,
    retry: int = DEFAULT_RETRY,
    temperature: float = 0.75,   # 창의성 ↑ (0.7보다 약간 높게). 교정 재생성 시엔 낮춰서 호출.
) -> tuple[bool, str]:
    client = _create_client()
    last_err = ""
    for attempt in range(retry + 1):
        async with semaphore:
            try:
                response = await client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user",   "content": user_content},
                    ],
                    temperature=temperature,
                    max_tokens=2000,    # 장문 생성 시 잘리지 않도록
                )
                return True, response.choices[0].message.content
            except Exception as e:
                last_err = str(e)
        if attempt < retry:
            await asyncio.sleep(2 ** attempt)
    return False, f"[ERROR] {last_err}"


# ──────────────────────────────────────────────────────────────────────────────
# 생성 + 규제 검증 (자동 재작성 없음 — 위반은 report로만 피드백, 수정은 사용자가 직접)
# ──────────────────────────────────────────────────────────────────────────────
async def _generate_checked(
    prompt: str,
    user_content: str,
    semaphore: asyncio.Semaphore,
    country: str,
    channel: str,
    forbidden_words: str,
    retry: int = DEFAULT_RETRY,
):
    ok, text = await _call_openai(prompt, user_content, semaphore, retry=retry)
    if not ok:
        return ok, text, None

    extra_banned = [w.strip() for w in (forbidden_words or "").split(",") if w.strip()]

    try:
        report = await compliance_check(text, country=country, channel=channel, extra_banned=extra_banned)
    except FileNotFoundError:
        return ok, text, None  # 알 수 없는 country → 검증 건너뜀 (카피는 그대로 반환)

    return ok, text, report


# ──────────────────────────────────────────────────────────────────────────────
# Pydantic 모델
# ──────────────────────────────────────────────────────────────────────────────
class request(BaseModel):
    tone: str
    core_message: str
    forbidden_words: str
    channel: list[str]
    tnm: str
    length: str
    purpose: str
    name: str = ""
    category: str = ""
    features: str = ""
    target_audience: str = ""
    country: str = "KR"

class request_file(BaseModel):
    name: str
    category: str
    features: str
    target_audience: str

class GenerateRequest(BaseModel):
    tone: str
    core_message: str
    forbidden_words: str
    channel: list[str]
    tnm: str
    length: str
    purpose: str
    name: str
    category: str
    features: str
    target_audience: str


# ──────────────────────────────────────────────────────────────────────────────
# 1) 단건 생성 (수기 입력 폼)
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/normal")
async def generate_normal(req: GenerateRequest):
    print("[DEBUG] generate_normal")
    user_content = _format_user_content(req.dict())
    semaphore = asyncio.Semaphore(1)
    prompt = build_prompt(
        tone=req.tone,
        core_message=req.core_message,
        forbidden_words=req.forbidden_words,
        channel=req.channel,
        tnm=req.tnm,
        length=req.length,
        purpose=req.purpose,
        name=req.name,
        features=req.features,
    )  # GenerateRequest엔 country 필드가 없음 → build_prompt 기본값(KR) 사용
    ok, text = await _call_openai(prompt=prompt, user_content=user_content, semaphore=semaphore)
    return {"ok": ok, "result": text}


# ──────────────────────────────────────────────────────────────────────────────
# 2) 멀티 채널 병렬 생성
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/platform")
async def generate_platform(req: request):
    print("[DEBUG] generate_platform")
    channels = req.channel or ["default"]
    user_content = _format_user_content(req.dict())
    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)
    tasks = []

    for ch in channels:
        ch_norm = ch.strip().lower()
        prompt = build_prompt(
            tone=req.tone,
            core_message=req.core_message,
            forbidden_words=req.forbidden_words,
            channel=[ch_norm],
            tnm=req.tnm,
            length=req.length,
            purpose=req.purpose,
            name=req.name,
            features=req.features,
            country=req.country,
        )
        tasks.append(_generate_checked(
            prompt, user_content, semaphore,
            country=req.country, channel=ch_norm, forbidden_words=req.forbidden_words,
        ))

    triples = await asyncio.gather(*tasks)
    return {
        "results": [
            {
                "channel": ch, "ok": ok, "text": txt,
                "compliance": report.model_dump() if report else None,
            }
            for ch, (ok, txt, report) in zip(channels, triples)
        ]
    }


# ──────────────────────────────────────────────────────────────────────────────
# 2-1) 피드백 반영 재생성 (자동 아님 — "재생성" 버튼 클릭 시에만 1회 호출)
# 화면에 이미 떠 있는 violations를 그대로 받아 build_repair_instructions로 재작성 지시문을 만들고,
# 같은 프롬프트 뒤에 붙여 1회 재생성 → 재검증까지 하고 결과를 돌려준다.
# ──────────────────────────────────────────────────────────────────────────────
class RegenerateRequest(BaseModel):
    tone: str
    core_message: str
    forbidden_words: str
    channel: str            # 재생성은 채널 하나만
    tnm: str
    length: str
    purpose: str
    name: str = ""
    category: str = ""
    features: str = ""
    target_audience: str = ""
    country: str = "KR"
    violations: list[Violation] = []   # 화면에 표시 중이던 위반 목록 그대로


@router.post("/regenerate-with-feedback")
async def regenerate_with_feedback(req: RegenerateRequest):
    print("[DEBUG] regenerate_with_feedback")
    ch = (req.channel or "default").strip().lower()
    prompt = build_prompt(
        tone=req.tone,
        core_message=req.core_message,
        forbidden_words=req.forbidden_words,
        channel=[ch],
        tnm=req.tnm,
        length=req.length,
        purpose=req.purpose,
        name=req.name,
        features=req.features,
        country=req.country,
    )
    if req.violations:
        prompt = prompt + "\n\n" + build_repair_instructions(req.violations)

    user_content = _format_user_content(req.dict())
    semaphore = asyncio.Semaphore(1)
    ok, text = await _call_openai(prompt, user_content, semaphore, temperature=0.4)
    if not ok:
        return {"ok": False, "text": text, "compliance": None}

    extra_banned = [w.strip() for w in (req.forbidden_words or "").split(",") if w.strip()]
    try:
        report = await compliance_check(text, country=req.country, channel=ch, extra_banned=extra_banned)
    except FileNotFoundError:
        report = None

    return {"ok": ok, "text": text, "compliance": report.model_dump() if report else None}


@router.post("/multichannel-copy")
async def generate_multichannel_copy_route(req: MultichannelCopyRequest):
    try:
        payload = req.model_dump(exclude_none=True) if hasattr(req, "model_dump") else req.dict(exclude_none=True)
        result = await generate_multichannel_copy(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# 3) CSV/엑셀 일괄 생성
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/csv")
async def generate_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    language: str = Form("ko"),
    channel: str | None = Form(None),
    country: str = Form("KR"),   # 행에 country 컬럼이 있으면 그게 우선, 없으면 이 값
    async_mode: bool = Form(False),
    async_threshold: int = Form(50),
):
    content = await file.read()
    fname = (file.filename or "").lower()

    if fname.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(content))
    elif fname.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(content))
    else:
        raise HTTPException(status_code=400, detail="CSV 또는 엑셀 파일만 업로드 가능합니다.")

    # 빈 칸은 NaN이 아니라 빈 문자열로 — build_prompt 등에서 .strip() 호출 시 NaN 크래시 방지
    rows = df.fillna("").to_dict(orient="records")
    if not rows:
        raise HTTPException(status_code=400, detail="비어있는 파일입니다.")

    if async_mode or len(rows) > async_threshold:
        job_id = _create_job(rows, language, channel, country)
        background_tasks.add_task(_run_bulk_job, job_id)
        return {"job_id": job_id, "status": "queued", "total": len(rows), "poll": f"/api/generate/csv/status/{job_id}"}

    results = await _process_rows(rows, language, channel, country)
    return {"results": results, "total": len(results)}


# ──────────────────────────────────────────────────────────────────────────────
# 일괄 처리 내부 함수들
# ──────────────────────────────────────────────────────────────────────────────
def _row_country(row: dict, default_country: str) -> str:
    return str(row.get("country") or default_country or "KR").strip().upper()


def _create_job(rows: list[dict], language: str, channel: str | None, country: str = "KR") -> str:
    product_id = str(uuid.uuid4())
    Products[product_id] = {
        "status": "queued",
        "total": len(rows), "done": 0, "success": 0, "failed": 0,
        "results": [], "started_at": None, "finished_at": None,
        "_rows": rows, "_language": language, "_channel": channel, "_country": country,
    }
    return product_id


async def _process_rows(rows: list[dict], language: str, default_channel: str | None, default_country: str = "KR") -> list[dict]:
    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)

    async def _one(i: int, row: dict) -> dict:
        ch = (row.get("channel") or default_channel or "default").strip().lower()
        row_country = _row_country(row, default_country)
        prompt = build_prompt(
            tone=row.get("tone", ""), core_message=row.get("core_message", ""),
            forbidden_words=row.get("forbidden_words", ""), channel=ch,
            tnm=row.get("tnm", ""), length=row.get("length", ""),
            purpose=row.get("purpose", ""),
            name=row.get("name", ""), features=row.get("features", ""),
            country=row_country,
        )
        ok, text, report = await _generate_checked(
            prompt, _format_user_content(row), semaphore,
            country=row_country, channel=ch,
            forbidden_words=row.get("forbidden_words", ""),
        )
        return {
            "index": i, "input": row, "ok": ok, "result": text,
            "compliance": report.model_dump() if report else None,
        }

    return await asyncio.gather(*[_one(i, r) for i, r in enumerate(rows)])


async def _run_bulk_job(product_id: str):
    job = Products[product_id]
    job["status"] = "running"
    job["started_at"] = time.time()
    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)

    async def _one(i: int, row: dict):
        ch = (row.get("channel") or job["_channel"] or "default").strip().lower()
        row_country = _row_country(row, job.get("_country", "KR"))
        prompt = build_prompt(
            tone=row.get("tone", ""), core_message=row.get("core_message", ""),
            forbidden_words=row.get("forbidden_words", ""), channel=ch,
            tnm=row.get("tnm", ""), length=row.get("length", ""),
            purpose=row.get("purpose", ""),
            name=row.get("name", ""), features=row.get("features", ""),
            country=row_country,
        )
        ok, text, report = await _generate_checked(
            prompt, _format_user_content(row), semaphore,
            country=row_country, channel=ch,
            forbidden_words=row.get("forbidden_words", ""), retry=DEFAULT_RETRY,
        )
        job["results"].append({
            "index": i, "input": row, "ok": ok, "result": text,
            "compliance": report.model_dump() if report else None,
        })
        job["done"] = len(job["results"])
        if ok: job["success"] += 1
        else:  job["failed"] += 1

    try:
        await asyncio.gather(*[_one(i, r) for i, r in enumerate(job["_rows"])])
        job["results"].sort(key=lambda x: x["index"])
        job["status"] = "completed"
    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
    finally:
        job["finished_at"] = time.time()


def _eta_seconds(job: dict) -> float | None:
    if job["status"] in ("completed", "failed"): return 0
    if not job["started_at"] or job["done"] == 0: return None
    elapsed = time.time() - job["started_at"]
    rate = job["done"] / elapsed
    return (job["total"] - job["done"]) / rate if rate > 0 else None


def _public_view(job: dict, include_results: bool = True) -> dict:
    eta = _eta_seconds(job)
    elapsed = ((job["finished_at"] or time.time()) - job["started_at"]) if job["started_at"] else None
    view = {
        "status": job["status"], "total": job["total"], "done": job["done"],
        "success": job["success"], "failed": job["failed"],
        "progress": (job["done"] / job["total"]) if job["total"] else 0,
        "elapsed_sec": round(elapsed, 1) if elapsed is not None else None,
        "eta_sec": round(eta, 1) if eta is not None else None,
        "error": job.get("error"),
    }
    if include_results:
        view["results"] = job["results"]
    return view


# ──────────────────────────────────────────────────────────────────────────────
# 4) 작업 상태 조회
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/csv/status/{job_id}")
async def get_csv_status(job_id: str):
    job = Products.get(job_id)
    if not job: raise HTTPException(status_code=404, detail="job not found")
    return _public_view(job, include_results=False)


# ──────────────────────────────────────────────────────────────────────────────
# 5) 완료 항목 미리보기
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/csv/preview/{job_id}")
async def preview_completed(job_id: str, limit: int = 20, offset: int = 0, only_success: bool = False):
    job = Products.get(job_id)
    if not job: raise HTTPException(status_code=404, detail="job not found")
    items = sorted(job["results"], key=lambda x: x["index"])
    if only_success: items = [r for r in items if r["ok"]]
    return {
        "status": job["status"], "done": job["done"], "total": job["total"],
        "showing": {"offset": offset, "limit": limit, "count": len(items[offset:offset + limit])},
        "items": items[offset: offset + limit],
    }


# ──────────────────────────────────────────────────────────────────────────────
# 6) 실패 항목 재시도
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/csv/retry/{job_id}")
async def retry_failed(job_id: str, background_tasks: BackgroundTasks, retry: int = DEFAULT_RETRY):
    job = Products.get(job_id)
    if not job: raise HTTPException(status_code=404, detail="job not found")
    if job["status"] == "running": raise HTTPException(status_code=409, detail="job is still running")
    failed_items = [r for r in job["results"] if not r["ok"]]
    if not failed_items: return {"message": "재시도할 실패 항목이 없습니다.", "failed": 0}
    background_tasks.add_task(_retry_failed_items, job_id, retry)
    return {"message": "재시도 시작", "failed": len(failed_items), "poll": f"/api/generate/csv/status/{job_id}"}


async def _retry_failed_items(job_id: str, retry: int):
    job = Products.get(job_id)
    job["status"] = "running"
    job["started_at"] = time.time()
    job["finished_at"] = None
    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)
    failed_indices = [r["index"] for r in job["results"] if not r["ok"]]

    async def _one(idx: int):
        row = job["_rows"][idx]
        ch = (row.get("channel") or job["_channel"] or "default").strip().lower()
        row_country = _row_country(row, job.get("_country", "KR"))
        prompt = build_prompt(
            tone=row.get("tone", ""), core_message=row.get("core_message", ""),
            forbidden_words=row.get("forbidden_words", ""), channel=ch,
            tnm=row.get("tnm", ""), length=row.get("length", ""),
            purpose=row.get("purpose", ""),
            name=row.get("name", ""), features=row.get("features", ""),
            country=row_country,
        )
        ok, text, report = await _generate_checked(
            prompt, _format_user_content(row), semaphore,
            country=row_country, channel=ch,
            forbidden_words=row.get("forbidden_words", ""), retry=retry,
        )
        for r in job["results"]:
            if r["index"] == idx:
                was_failed = not r["ok"]
                r["ok"] = ok; r["result"] = text
                r["compliance"] = report.model_dump() if report else None
                if ok and was_failed:
                    job["success"] += 1; job["failed"] -= 1
                break

    try:
        await asyncio.gather(*[_one(idx) for idx in failed_indices])
        job["results"].sort(key=lambda x: x["index"])
        job["status"] = "completed"
    except Exception as e:
        job["status"] = "failed"; job["error"] = str(e)
    finally:
        job["finished_at"] = time.time()