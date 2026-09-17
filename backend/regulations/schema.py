"""룰셋 YAML ↔ 파이썬 모델, 그리고 검증 결과 스키마.

rulesets/*.yaml 이 이 스키마로 파싱된다.
Violation / ComplianceReport 는 API 응답에도 그대로 쓸 수 있게 pydantic 모델로 둔다.
"""

from pydantic import BaseModel, Field

# 규제 카테고리 (국가 공통, 내용만 국가별로 교체)
CATEGORIES = ("prohibited_claim", "exaggeration", "mandatory_statement", "other")
# 심각도
SEVERITIES = ("critical", "major", "minor")


class Detect(BaseModel):
    """한 규칙의 탐지 방법. Layer 1 은 keywords/regex/require_any_of 만 사용하고,
    llm_check 는 Layer 2(의미 기반 심의관)용 질문 문자열이다."""

    keywords: list[str] = Field(default_factory=list)          # 부분 문자열 매칭 (대소문자 무시)
    regex: list[str] = Field(default_factory=list)             # 정규식 매칭 (re.IGNORECASE)
    require_any_of: list[str] = Field(default_factory=list)    # 이 중 하나는 반드시 포함돼야 함
    llm_check: str | None = None                               # Layer 2 판정용 질문


class Rule(BaseModel):
    id: str
    category: str = "other"
    severity: str = "major"
    description: str = ""
    detect: Detect = Field(default_factory=Detect)
    fix_hint: str | None = None            # 위반 시 사용자/재작성 프롬프트에 줄 수정 힌트
    source: str | None = None             # 근거 조문 (예: "약사법 제68조")
    source_excerpt: str | None = None     # 근거 조문 원문 일부 (Layer 2 인용용, RAG 없이)
    channels: list[str] = Field(default_factory=list)  # 비면 전 채널, 채우면 해당 채널에서만 적용
    active: bool = True


class Ruleset(BaseModel):
    country: str
    version: str = ""
    source: str = ""
    rules: list[Rule] = Field(default_factory=list)

    def active_rules(self, channel: str | None = None) -> list[Rule]:
        ch = (channel or "").strip().lower()
        out = []
        for r in self.rules:
            if not r.active:
                continue
            if r.channels and ch and ch not in [c.lower() for c in r.channels]:
                continue
            out.append(r)
        return out


class Violation(BaseModel):
    rule_id: str
    category: str
    severity: str
    matched_text: str | None = None   # 걸린 실제 문구 (필수문구 누락이면 None)
    message: str                      # 사용자 표시용 설명
    suggestion: str | None = None     # 수정 제안
    source: str | None = None         # 근거 조문


class ComplianceReport(BaseModel):
    country: str
    passed: bool                      # critical/major 0건이면 True
    score: int                        # 100 - 가중 감점 (0~100)
    violations: list[Violation] = Field(default_factory=list)
    auto_fixed: bool = False
    checked_layers: list[str] = Field(default_factory=lambda: ["deterministic"])
