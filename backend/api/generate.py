from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel
from typing import Optional
from backend.database import supabase_admin as supabase
import pandas as pd
import io
import os
import asyncio
import uuid
import time

router = APIRouter()


# ──────────────────────────────────────────────────────────────────────────────
# 생성 결과 자동 저장 (ad_contents 테이블)
# product_id 가 있어야 저장 가능 (NN FK). 없으면 스킵.
# DB 저장은 best-effort: 실패해도 생성 결과 자체는 반환한다.
# ──────────────────────────────────────────────────────────────────────────────
def _save_ad_content(
    product_id: Optional[int],
    platform_type: str,
    generated_text: str,
) -> Optional[dict]:
    if not product_id:
        return None
    try:
        resp = supabase.table("ad_contents").insert({
            "product_id": int(product_id),
            "platform_type": platform_type or "default",
            "generated_text": generated_text,
            "is_saved": False,
        }).execute()
        return resp.data[0] if resp.data else None
    except Exception as e:
        print(f"[WARN] ad_contents auto-save failed: {e}")
        return None

# AsyncOpenAI 사용 → asyncio.gather 로 병렬 호출 가능
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 일괄 생성 작업 상태 보관소.
# 운영에서는 Redis / Supabase 로 옮길 것 (서버 재시작 시 휘발됨)
Products: dict[str, dict] = {}

# OpenAI 동시 호출 수 제한 (rate limit 보호)
MAX_CONCURRENCY = 10

# 실패 시 재시도 기본 횟수
DEFAULT_RETRY = 2


# ──────────────────────────────────────────────────────────────────────────────
# 플랫폼별 시스템 프롬프트
# 채널이 정해지면 해당 채널의 톤/길이/포맷 규칙을 system prompt 에 주입.
# (line 74 주석: "플랫폼 설정시 해당 플랫폼에 맞는 문구 생성하도록 하기")
# ──────────────────────────────────────────────────────────────────────────────
PLATFORM: dict[str, str] = {
    "instagram": (
        "Instagram 피드용. 짧고 감각적인 광고 문구 1~2문장 + 핵심 해시태그 3~5개. "
        "이모지를 적극 활용하고 시각적 호기심을 자극할 것."
    ),
    "youtube": (
        "YouTube 영상 설명/인트로용. 첫 문장은 강한 후킹, 본문은 2~4문장. "
        "마지막에 클릭/구독을 유도하는 CTA 한 줄 포함."
    ),
    "facebook": (
        "Facebook 광고 톤. 30~50대 타겟에 맞는 차분하고 신뢰감 있는 어조. "
        "이모지는 절제, 길이는 3~5문장."
    ),
    "tiktok": (
        "TikTok 영상 캡션. 매우 짧고 트렌디하게, Z세대 어휘와 트렌드 해시태그 사용. "
        "한 문장 + 해시태그 형태."
    ),
    "naver": (
        "네이버 블로그/쇼핑광고. 정보 전달형 어조, SEO 키워드를 자연스럽게 배치. "
        "5~7문장의 본문 + 핵심 키워드 강조."
    ),
    "default": "일반적인 광고 문구. 간결하고 매력적으로, 2~3문장.",
}


# ──────────────────────────────────────────────────────────────────────────────
# Persona (Role) Prompting
# AI 에게 명확한 전문가 역할을 부여해서 결과물의 품질과 일관성을 끌어올린다.
# ──────────────────────────────────────────────────────────────────────────────
PERSONA = (
    "You are a senior e-commerce marketing copywriter with 15+ years of experience.\n"
    "You specialize in writing platform-optimized ad copy that drives engagement and conversions\n"
    "across Instagram, YouTube, Facebook, TikTok, and Naver.\n"
    "\n"
    "Your expertise:\n"
    "- Korean and international consumer psychology\n"
    "- Each platform's unique tone, format, and audience expectations\n"
    "- Translating product features into emotional hooks and customer benefits\n"
    "- Brand voice consistency\n"
    "\n"
    "Strict rules you must always follow:\n"
    "1. Match the language of the input data (Korean input -> Korean output).\n"
    "2. NEVER use any of the forbidden words listed in the team guide.\n"
    "3. Reflect the requested tone, core message, length, and purpose exactly.\n"
    "4. Adapt format and length to the target platform's conventions.\n"
    "5. Output ONLY the ad copy itself. No preamble, no explanation, no meta commentary."
)


# ──────────────────────────────────────────────────────────────────────────────
# Few-Shot Prompting
# 채널별로 (input -> output) 예시를 1건씩 제공해서 원하는 형식을 학습시킨다.
# 예시의 톤/길이/해시태그 개수가 곧 출력의 기준이 된다.
# ──────────────────────────────────────────────────────────────────────────────
FEW_SHOT_EXAMPLES: dict[str, str] = {
    "instagram": (
        "Example:\n"
        "Input:\n"
        "  name: 무선 이어폰 ZenBuds\n"
        "  category: 전자기기/이어폰\n"
        "  features: 24시간 배터리, 노이즈캔슬링, 방수\n"
        "  target_audience: 20~30대 출퇴근 직장인\n"
        "Output:\n"
        "  하루를 통째로 함께할 사운드 🎧\n"
        "  ZenBuds로 출근길도 운동도 끊김 없이.\n"
        "  #무선이어폰 #출근템 #노이즈캔슬링 #ZenBuds"
    ),
    "youtube": (
        "Example:\n"
        "Input:\n"
        "  name: 무선 이어폰 ZenBuds\n"
        "  category: 전자기기/이어폰\n"
        "  features: 24시간 배터리, 노이즈캔슬링, 방수\n"
        "  target_audience: 20~30대 출퇴근 직장인\n"
        "Output:\n"
        "  매일 충전하는 거, 이제 지치셨죠?\n"
        "  ZenBuds는 한 번 충전으로 24시간을 갑니다. 노이즈캔슬링으로 출퇴근길 소음도 깔끔하게,\n"
        "  갑자기 비가 와도 걱정 없는 방수 설계까지.\n"
        "  지금 영상 설명란 링크에서 확인하세요. 좋아요 & 구독 부탁드립니다."
    ),
    "facebook": (
        "Example:\n"
        "Input:\n"
        "  name: 프리미엄 무선청소기 A100\n"
        "  category: 가전/청소기\n"
        "  features: 강력한 흡입력, 60분 연속 사용, 저소음 설계\n"
        "  target_audience: 30~50대 1인/가족 가구\n"
        "Output:\n"
        "  매일 쓰는 청소기, 이제 무게도 소음도 신경 쓰지 마세요.\n"
        "  프리미엄 무선청소기 A100은 가벼운 본체에 강력한 흡입력을 담았습니다.\n"
        "  한 번 충전으로 60분, 집 안 구석구석을 조용히 정리할 수 있습니다.\n"
        "  소중한 가족의 시간을 청소에 빼앗기지 않도록, A100이 도와드립니다."
    ),
    "tiktok": (
        "Example:\n"
        "Input:\n"
        "  name: 무선 이어폰 ZenBuds\n"
        "  category: 전자기기/이어폰\n"
        "  features: 24시간 배터리, 노이즈캔슬링, 방수\n"
        "  target_audience: 20~30대 출퇴근 직장인\n"
        "Output:\n"
        "  충전 하루 한 번? 우린 일주일 한 번 ✨ #ZenBuds #출근템 #무선이어폰추천"
    ),
    "naver": (
        "Example:\n"
        "Input:\n"
        "  name: 프리미엄 무선청소기 A100\n"
        "  category: 가전/청소기\n"
        "  features: 강력한 흡입력, 60분 연속 사용, 저소음 설계\n"
        "  target_audience: 30~50대 1인/가족 가구\n"
        "Output:\n"
        "  프리미엄 무선청소기 A100, 강력한 흡입력으로 미세먼지까지 깔끔하게 제거합니다.\n"
        "  60분 연속 사용 가능한 대용량 배터리로 집 전체를 한 번에 청소할 수 있고,\n"
        "  저소음 설계 덕분에 늦은 시간에도 부담 없이 사용 가능합니다.\n"
        "  1인 가구부터 가족 단위 가정까지 모두에게 적합한 무선청소기, A100을 만나보세요.\n"
        "  #무선청소기 #프리미엄청소기 #A100 #저소음청소기"
    ),
    "default": (
        "Example:\n"
        "Input:\n"
        "  name: 무선 이어폰 ZenBuds\n"
        "  category: 전자기기/이어폰\n"
        "  features: 24시간 배터리, 노이즈캔슬링, 방수\n"
        "  target_audience: 20~30대 직장인\n"
        "Output:\n"
        "  24시간 동행하는 사운드, ZenBuds.\n"
        "  노이즈캔슬링으로 출퇴근길도 운동도 더 몰입감 있게 즐기세요."
    ),
}


# 선택된 항목들로 프롬프트 조합. PERSONA + 플랫폼 스타일 + Few-shot 예시 + 팀 가이드 + 옵션.
def build_prompt(
    tone: str, core_message: str,
    forbidden_words: str, channel,
    tnm: str, length: str, purpose: str):

    # channel이 리스트로 넘어오는 경우 첫 번째 값 사용
    if isinstance(channel, list):
        channel = channel[0] if channel else "default"
    if not channel or channel.strip().lower() not in PLATFORM:
        channel = "default"
    channel = channel.strip().lower()

    style = PLATFORM.get(channel, PLATFORM["default"])
    example = FEW_SHOT_EXAMPLES.get(channel, FEW_SHOT_EXAMPLES["default"])

    team_guide = (
        f"- Tone: {tone}\n"
        f"- Core message: {core_message}\n"
        f"- Forbidden words (NEVER use these): {forbidden_words}"
    )
    options = (
        f"- Target channel: {channel}\n"
        f"- Tone & manner: {tnm}\n"
        f"- Length: {length}\n"
        f"- Purpose: {purpose}"
    )

    return (
        f"{PERSONA}\n\n"
        f"## Platform style ({channel})\n{style}\n\n"
        f"## Few-shot example (follow this format and tone)\n{example}\n\n"
        f"## Team guide\n{team_guide}\n\n"
        f"## Options\n{options}\n\n"
        f"Now generate the ad copy for the product info that will be provided next. "
        f"Output ONLY the copy."
    )
    # 만든 프롬프트를 OpenAI에 넘기기
    


# 요청 모델
class request(BaseModel):
    # 자동 저장용 (있으면 ad_contents 에 자동 insert, 없으면 생성만)
    product_id: Optional[int] = None
    # 팀 가이드 부문
    tone: str
    core_message: str
    forbidden_words: str
    # 옵션 부문
    channel: list[str]
    tnm: str
    length: str
    purpose: str

#각 상품별 요청(컬럼에서 읽어야함 ','을 기준으로 열거돼있다고 가정 파일을 읽어서 이대로 넣기 수작성 폼일 경우 그대로 사용)
# products 테이블 스키마와 동일 (category, target_audience 는 NN 아님)
class request_file(BaseModel):
    name: str                                  # NN
    category: Optional[str] = None
    features: str                              # NN
    target_audience: Optional[str] = None


# 각 컬럼 별로 , 로 된거 리스트로 바꾸기
def _join(value) -> str:
    if value is None:
        return ""
    parts = [x.strip() for x in str(value).split(",")]
    return ", ".join(parts) if parts else ""
    

# 받은 파일을 문자열로 변환
def _format_user_content(row: dict) -> str:
    return (
        f"name: {_join(row.get('name'))}\n"
        f"category: {_join(row.get('category'))}\n"
        f"features: {_join(row.get('features'))}\n"
        f"target_audience: {_join(row.get('target_audience'))}\n"
    )


async def _call_openai(
    prompt: str,
    user_content: str,
    semaphore: asyncio.Semaphore,# 개수 제한
    retry: int = DEFAULT_RETRY,
) -> tuple[bool, str]:
    """
    OpenAI 호출 1회 (재시도 포함).
    반환: (성공 여부, 본문 또는 에러메시지)
    """
    last_err = ""
    for attempt in range(retry + 1):
        async with semaphore:
            try:
                response = await client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": user_content},
                    ],
                )
                return True, response.choices[0].message.content
            except Exception as e:
                last_err = str(e)
        # 지수 백오프 (rate limit / 일시적 오류 대응)
        if attempt < retry:
            await asyncio.sleep(2 ** attempt)
    return False, f"[ERROR] {last_err}"

# ──────────────────────────────────────────────────────────────────────────────
# 1) 일반 텍스트 폼으로 광고 문구 생성(팀가이드, 옵션, 상품폼)
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/normal")
async def generate_normal(req: request, req1: request_file):
    print("[DEBUG] generate_normal")
    user_content = _format_user_content(req1.dict())

    semaphore = asyncio.Semaphore(1)
    prompt = build_prompt(
        tone=req.tone,
        core_message=req.core_message,
        forbidden_words=req.forbidden_words,
        channel=req.channel,
        tnm=req.tnm,
        length=req.length,
        purpose=req.purpose
    )
    ok, text = await _call_openai(
        prompt = prompt,
        user_content=user_content,
        semaphore=semaphore
    )

    # 생성 성공 시 ad_contents 에 자동 저장 (product_id 있을 때만)
    saved = None
    if ok:
        ch = req.channel[0] if req.channel else "default"
        saved = _save_ad_content(
            product_id=req.product_id,
            platform_type=ch,
            generated_text=text,
        )
    return {"ok": ok, "result": text, "saved": saved}



# ──────────────────────────────────────────────────────────────────────────────
# 2) 플랫폼별 광고 문구 생성
#    - channel 리스트의 모든 플랫폼에 대해 병렬로 한 번에 생성.
#    - 각 플랫폼의 스타일이 system prompt 에 자동 주입된다.
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/platform")
async def generate_platform(req: request):
    print("[DEBUG] generate_platform")
    channels = req.channel or ["default"]
    user_content = _format_user_content(req.dict())
    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)
    tasks = []

    for ch in channels:
        prompt = build_prompt(
            tone=req.tone,
            core_message=req.core_message,
            forbidden_words=req.forbidden_words,
            channel=[ch.strip().lower()],
            tnm=req.tnm,
            length=req.length,
            purpose=req.purpose,
        )
        tasks.append(_call_openai(prompt, user_content, semaphore))

    pairs = await asyncio.gather(*tasks)

    # 채널별 결과 + 자동 저장
    results = []
    for ch, (ok, txt) in zip(channels, pairs):
        saved = None
        if ok:
            saved = _save_ad_content(
                product_id=req.product_id,
                platform_type=ch,
                generated_text=txt,
            )
        results.append({"channel": ch, "ok": ok, "text": txt, "saved": saved})

    return {"results": results}
#2026-05-03에 여기까지

# ──────────────────────────────────────────────────────────────────────────────
# 3) CSV/엑셀 일괄 생성(입력 파일 읽기)
#    - 각 행을 asyncio.gather + Semaphore 로 병렬 처리.
#    - 행 수가 많거나 async_mode=True 면 BackgroundTasks 로 비동기 처리하고
#      job_id 를 즉시 반환 → 상태/미리보기/재시도 엔드포인트로 후속 조회
#   job_id 가 아니라 product_id로
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/csv")
async def generate_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    language: str = Form("ko"),
    channel: str | None = Form(None),  # CSV 행에 channel 컬럼이 없을 때 쓸 기본 채널
    default_product_id: Optional[int] = Form(None),  # CSV 행에 product_id 컬럼이 없을 때 쓸 기본 product_id
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
        raise HTTPException(
            status_code=400,
            detail="지원하지 않는 파일 형식입니다. CSV 또는 엑셀 파일을 업로드해주세요.",
        )

    rows = df.to_dict(orient="records")
    if not rows:
        raise HTTPException(status_code=400, detail="비어있는 파일입니다.")

    # 큰 파일은 비동기 처리, job_id 즉시 반환
    if async_mode or len(rows) > async_threshold:
        job_id = _create_job(rows, language, channel, default_product_id)
        background_tasks.add_task(_run_bulk_job, job_id)
        return {
            "job_id": job_id,
            "status": "queued",
            "total": len(rows),
            "poll": f"/api/generate/csv/status/{job_id}",
        }

    # 작은 파일은 즉시 병렬 처리
    results = await _process_rows(rows, language, channel, default_product_id)
    return {"results": results, "total": len(results)}


# ──────────────────────────────────────────────────────────────────────────────
# 일괄 작업 관리용 내부 함수 (생성된 결과물의 성공/실패를 기록하고 실패한 것이 있다면 여기서 특정해서 재시도 할 수 있도록 한다.)
# ──────────────────────────────────────────────────────────────────────────────
def _create_job(
    rows: list[dict],
    language: str,
    channel: str | None,
    default_product_id: Optional[int] = None,
) -> str:
    product_id = str(uuid.uuid4())
    Products[product_id] = {
        "status": "queued",            # queued | running | completed | failed
        "total": len(rows),
        "done": 0,
        "success": 0,
        "failed": 0,
        "results": [],                 # [{index, input, ok, result, saved}]
        "started_at": None,
        "finished_at": None,
        # 재시도용으로 원본 입력 보관
        "_rows": rows,
        "_language": language,
        "_channel": channel,
        "_default_product_id": default_product_id,
    }
    return product_id

####################################################################
async def _process_rows(
    rows: list[dict],
    language: str,
    default_channel: str | None,
    default_product_id: Optional[int] = None,
) -> list[dict]:
    """동기 응답용: CSV 행들을 병렬 처리해서 결과 리스트 반환."""
    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)

    async def _one(i: int, row: dict) -> dict:
        row_channel = (row.get("channel") or default_channel or "default").strip().lower()
        prompt = build_prompt(
            tone=row.get("tone", ""),
            core_message=row.get("core_message", ""),
            forbidden_words=row.get("forbidden_words", ""),
            channel=row_channel,
            tnm=row.get("tnm", ""),
            length=row.get("length", ""),
            purpose=row.get("purpose", ""),
        )
        ok, text = await _call_openai(
            prompt=prompt,
            user_content=_format_user_content(row),
            semaphore=semaphore,
        )
        # 자동 저장: 행에 product_id 컬럼이 있으면 그걸, 없으면 default_product_id
        saved = None
        if ok:
            row_pid = row.get("product_id") or default_product_id
            saved = _save_ad_content(
                product_id=row_pid,
                platform_type=row_channel,
                generated_text=text,
            )
        return {"index": i, "input": row, "ok": ok, "result": text, "saved": saved}

    return await asyncio.gather(*[_one(i, r) for i, r in enumerate(rows)])
####################################################################


async def _run_bulk_job(product_id: str):
    job = Products[product_id]
    job["status"] = "running"
    job["started_at"] = time.time()
    rows = job["_rows"]
    language = job["_language"]
    default_channel = job["_channel"]
    default_product_id = job.get("_default_product_id")

    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)


    async def _one(i: int, row: dict):
        row_channel = (row.get("channel") or default_channel or "default").strip().lower()

        prompt = build_prompt(
            tone=row.get("tone", ""),
            core_message=row.get("core_message", ""),
            forbidden_words=row.get("forbidden_words", ""),
            channel=row_channel,
            tnm=row.get("tnm", ""),
            length=row.get("length", ""),
            purpose=row.get("purpose", ""),
        )
        user_content = _format_user_content(row)

        ok, text = await _call_openai(
            prompt=prompt,
            user_content=user_content,
            semaphore=semaphore,
            retry=DEFAULT_RETRY,
        )

        # 자동 저장: 행 product_id 우선, 없으면 job 기본값
        saved = None
        if ok:
            row_pid = row.get("product_id") or default_product_id
            saved = _save_ad_content(
                product_id=row_pid,
                platform_type=row_channel,
                generated_text=text,
            )

        job["results"].append({"index": i, "input": row, "ok": ok, "result": text, "saved": saved})
        job["done"] = len(job["results"])
        if ok:
            job["success"] += 1
        else:
            job["failed"] += 1
            
    try:
        await asyncio.gather(*[_one(i, r) for i, r in enumerate(rows)])
        # 결과를 원래 순서대로 정렬
        job["results"].sort(key=lambda x: x["index"])
        job["status"] = "completed"
    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
    finally:
        job["finished_at"] = time.time()
        
def _eta_seconds(job: dict) -> float | None:
    """남은 시간(초) 추정. 진행률이 0 이거나 끝났으면 None."""
    if job["status"] in ("completed", "failed"):
        return 0
    if not job["started_at"] or job["done"] == 0:
        return None
    elapsed = time.time() - job["started_at"]
    rate = job["done"] / elapsed  # rows/sec
    if rate <= 0:
        return None
    remaining = job["total"] - job["done"]
    return remaining / rate

# 현재 처리 개수를 세기 위해
def _public_view(job: dict, include_results: bool = True) -> dict:
    """JOBS dict 에서 내부 필드(_rows 등) 빼고 외부에 보낼 형태로 가공."""
    eta = _eta_seconds(job)
    elapsed = (
        (job["finished_at"] or time.time()) - job["started_at"]
        if job["started_at"] else None
    )
    view = {
        "status": job["status"],
        "total": job["total"],
        "done": job["done"],
        "success": job["success"],
        "failed": job["failed"],
        "progress": (job["done"] / job["total"]) if job["total"] else 0,
        "elapsed_sec": round(elapsed, 1) if elapsed is not None else None,
        "eta_sec": round(eta, 1) if eta is not None else None,
        "error": job.get("error"),
    }
    if include_results:
        view["results"] = job["results"]
    return view


# ──────────────────────────────────────────────────────────────────────────────
# 4) 일괄 작업 상태 조회 (현재 완료된 항목 수 + 남은 시간)
#    (하단 주석: "현재 완료된 항목들", "남은 시간")
# ──────────────────────────────────────────────────────────────────────────────
## 여기서 완료된 작업개수를 세서 
@router.get("/csv/status/{job_id}")
async def get_csv_status(job_id: str):
    job = Products.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    return _public_view(job, include_results=False)


# ──────────────────────────────────────────────────────────────────────────────
# 5) 완료된 항목 미리보기
#    - 아직 진행 중이라도 지금까지 완료된 결과만 잘라서 반환.
#    - limit, offset 으로 페이지네이션 가능 (history 화면에서 무한스크롤용).
#    (하단 주석: "완료된 항목 미리 보기")
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/csv/preview/{job_id}")
async def preview_completed(
    job_id: str,
    limit: int = 20,
    offset: int = 0,
    only_success: bool = False,
):
    job = Products.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")

    items = sorted(job["results"], key=lambda x: x["index"])
    if only_success:
        items = [r for r in items if r["ok"]]

    return {
        "status": job["status"],
        "done": job["done"],
        "total": job["total"],
        "showing": {"offset": offset, "limit": limit, "count": len(items[offset:offset + limit])},
        "items": items[offset: offset + limit],
    }


# ──────────────────────────────────────────────────────────────────────────────
# 6) 실패시 재시도
#    - 해당 job 의 ok=False 결과만 다시 OpenAI 에 보낸다.
#    - 성공한 것은 그대로 두고 실패한 것만 result 가 갱신된다.
#    (하단 주석: "실패시 재시도")
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/csv/retry/{job_id}")
async def retry_failed(
    job_id: str,
    background_tasks: BackgroundTasks,
    retry: int = DEFAULT_RETRY,
):
    job = Products.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    if job["status"] == "running":
        raise HTTPException(status_code=409, detail="job is still running")

    failed_items = [r for r in job["results"] if not r["ok"]]
    if not failed_items:
        return {"message": "재시도할 실패 항목이 없습니다.", "failed": 0}

    background_tasks.add_task(_retry_failed_items, job_id, retry)
    return {
        "message": "재시도 시작",
        "failed": len(failed_items),
        "poll": f"/api/generate/csv/status/{job_id}",
    }


async def _retry_failed_items(job_id: str, retry: int):
    job = Products.get(job_id)
    job["status"] = "running"
    job["started_at"] = time.time()
    job["finished_at"] = None
    language = job["_language"]
    default_channel = job["_channel"]
    default_product_id = job.get("_default_product_id")

    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)
    failed_indices = [r["index"] for r in job["results"] if not r["ok"]]

    async def _one(idx: int):
        row = job["_rows"][idx]
        row_channel_raw = row.get("channel") or default_channel
        row_channel = (str(row_channel_raw).strip().lower() if row_channel_raw else "default")
        ok, text = await _call_openai(
            prompt=build_prompt(
                tone=row.get("tone", ""),
                core_message=row.get("core_message", ""),
                forbidden_words=row.get("forbidden_words", ""),
                channel=row_channel,
                tnm=row.get("tnm", ""),
                length=row.get("length", ""),
                purpose=row.get("purpose", ""),
            ),
            user_content=_format_user_content(row),
            semaphore=semaphore,
            retry=retry,
        )

        # 재시도 성공 시 자동 저장
        saved = None
        if ok:
            row_pid = row.get("product_id") or default_product_id
            saved = _save_ad_content(
                product_id=row_pid,
                platform_type=row_channel,
                generated_text=text,
            )

        # 기존 결과를 in-place 갱신
        for r in job["results"]:
            if r["index"] == idx:
                was_failed = not r["ok"]
                r["ok"] = ok
                r["result"] = text
                if saved is not None:
                    r["saved"] = saved
                if ok and was_failed:
                    job["success"] += 1
                    job["failed"] -= 1
                break

    try:
        await asyncio.gather(*[_one(idx) for idx in failed_indices])
        job["results"].sort(key=lambda x: x["index"])
        job["status"] = "completed"
    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
    finally:
        job["finished_at"] = time.time()
