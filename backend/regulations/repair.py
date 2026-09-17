"""Layer 1 검증 결과 -> 재작성 지시문. 자동 교정 루프(generate.py)에서 사용.

원본 system prompt 뒤에 이 지시문을 이어붙여 재생성하면, 모델이 지적된
위반 사항만 정확히 고치고 나머지 톤·구조는 유지하도록 유도한다.
"""

from .schema import Violation


def build_repair_instructions(violations: list[Violation]) -> str:
    if not violations:
        return ""

    lines = [
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "▌ 규제 위반 수정 지시 (자동 검수 결과)",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "방금 작성한 카피가 아래 규정을 위반했습니다. 톤·핵심 메시지·구조는 유지하되, "
        "지적된 부분만 정확히 고쳐서 다시 작성하세요.",
        "",
    ]
    for v in violations:
        if v.matched_text:
            lines.append(
                f"- [{v.severity}] \"{v.matched_text}\" 표현을 삭제하거나 다른 표현으로 바꾸세요"
                f" — {v.suggestion or v.message}"
            )
        else:
            lines.append(
                f"- [{v.severity}] 다음 필수 안내 문구가 빠졌습니다. 자연스러운 위치에 추가하세요"
                f" — {v.suggestion or v.message}"
            )
    lines.append("")
    lines.append("응답은 완성된 광고 문구만 출력하세요. 설명·해설·번호 매기기 없이.")
    return "\n".join(lines)
