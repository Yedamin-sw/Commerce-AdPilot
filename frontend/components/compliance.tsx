// 규제 검증(backend/regulations, /api/compliance/validate) 결과를 보여주는 공용 UI.
// 개별 생성 결과 화면(workspace/result)과 CSV 업로드 결과 화면(workspace/csv-result)이
// 같은 걸 가져다 쓴다 — 두 화면의 점수 배지·위반 카드 모양이 항상 같게 유지하기 위함.

import React from 'react';

export type Severity = 'critical' | 'major' | 'minor';

export interface Violation {
  rule_id: string;
  category: string;
  severity: Severity;
  matched_text: string | null;
  message: string;
  suggestion: string | null;
  source: string | null;
}

export interface ComplianceReport {
  country: string;
  passed: boolean;
  score: number;
  violations: Violation[];
  auto_fixed: boolean;
  checked_layers: string[];
}

export const SEVERITY_STYLE: Record<Severity, { icon: string; box: string }> = {
  critical: { icon: '⛔', box: 'border-red-200 bg-red-50' },
  major:    { icon: '⚠️', box: 'border-amber-200 bg-amber-50' },
  minor:    { icon: 'ℹ️', box: 'border-slate-200 bg-slate-50' },
};
export const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, major: 1, minor: 2 };

// score → 등급 배지 (A/B 90·70 이상 통과, C 40 이상 조건부, 그 아래 반려)
export function gradeFromScore(score: number): { label: string; icon: string; classes: string } {
  if (score >= 90) return { label: 'A', icon: '✅', classes: 'bg-emerald-100 text-emerald-700' };
  if (score >= 70) return { label: 'B', icon: '✅', classes: 'bg-emerald-100 text-emerald-700' };
  if (score >= 40) return { label: 'C', icon: '⚠️', classes: 'bg-amber-100 text-amber-700' };
  return { label: 'F', icon: '⛔', classes: 'bg-red-100 text-red-700' };
}

// 생성된 카피 안에서 위반으로 걸린 문구(matched_text)를 하이라이트
export function highlightViolations(text: string, terms: string[]): React.ReactNode {
  const unique = Array.from(new Set(terms.filter(Boolean)));
  if (!text || unique.length === 0) return text;
  const escaped = unique
    .sort((a, b) => b.length - a.length)
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'g');
  return text.split(pattern).map((part, i) =>
    unique.includes(part)
      ? <mark key={i} className="bg-red-200/70 text-red-900 rounded px-0.5">{part}</mark>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );
}

// 카드 헤더에 붙는 등급/자동교정 배지들
export function ComplianceBadges({ compliance, loading }: { compliance?: ComplianceReport; loading?: boolean }) {
  if (loading) return <span className="text-[10px] font-bold text-slate-300">검사중...</span>;
  if (!compliance) return null;
  const grade = gradeFromScore(compliance.score);
  return (
    <>
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${grade.classes}`}>
        {grade.icon} {grade.label} · {compliance.score}점
      </span>
      {compliance.auto_fixed && (
        <span
          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700"
          title="규제 위반이 감지돼 AI가 자동으로 다시 작성했습니다"
        >
          ✨ 자동 교정
        </span>
      )}
      {compliance.auto_fixed && !compliance.passed && (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700">
          사람 검수 필요
        </span>
      )}
    </>
  );
}

// "수정이 필요해요" 위반 카드 목록
export function ViolationCards({ violations }: { violations: Violation[] }) {
  if (!violations || violations.length === 0) return null;
  const sorted = [...violations].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  return (
    <div>
      <p className="text-[10px] font-bold text-red-400 uppercase mb-2">
        수정이 필요해요 ({sorted.length}건)
      </p>
      <div className="space-y-2">
        {sorted.map((v, i) => (
          <div key={`${v.rule_id}-${i}`} className={`p-3 rounded-xl border text-xs ${SEVERITY_STYLE[v.severity].box}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-700">{SEVERITY_STYLE[v.severity].icon} {v.rule_id}</span>
              {v.source && <span className="text-[10px] text-slate-400">{v.source}</span>}
            </div>
            {v.matched_text && (
              <p className="text-slate-600 mb-1">
                원문: <mark className="bg-red-200/70 text-red-900 rounded px-1">{v.matched_text}</mark>
              </p>
            )}
            <p className="text-slate-600 mb-1">{v.message}</p>
            {v.suggestion && <p className="text-slate-500 italic">→ {v.suggestion}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// 여러 건(채널별 / CSV 행별) ComplianceReport를 한 줄 요약으로
export function summarizeCompliance(reports: ComplianceReport[]) {
  const failCount = reports.filter(r => !r.passed).length;
  const avgScore = reports.length
    ? Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length)
    : null;
  return { total: reports.length, failCount, passCount: reports.length - failCount, avgScore };
}
