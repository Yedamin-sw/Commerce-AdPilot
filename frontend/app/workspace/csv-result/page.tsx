'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Copy, Download, RefreshCw, Upload } from 'lucide-react';
import {
  type ComplianceReport,
  ComplianceBadges, ViolationCards, highlightViolations, summarizeCompliance,
} from '@/components/compliance';
import { CSV_RESULT_STORAGE_KEY, type StoredCsvResult } from '@/components/csv-result-shared';

export default function CsvResultPage() {
  const [stored, setStored] = useState<StoredCsvResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    // sessionStorage는 SSR에는 없어서 hydration 이후(useEffect)에만 읽을 수 있다 —
    // 렌더 중/lazy initializer에서 읽으면 서버-클라이언트 첫 렌더가 달라져 hydration mismatch가 난다.
    try {
      const raw = sessionStorage.getItem(CSV_RESULT_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setStored(JSON.parse(raw));
    } catch {
      // 세션 스토리지 접근 실패 — 빈 상태로 표시
    }
    setLoaded(true);
  }, []);

  const showToast = (msg: string) => setToastMsg(msg);
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(''), 2500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const toggle = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`✅ ${label} 카피가 복사되었습니다!`);
  };

  const handleDownload = (text: string, filename: string) => {
    if (!text) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `${filename}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`💾 ${filename}.txt 다운로드 완료!`);
  };

  const items = stored?.items ?? [];
  const reports = items.map(i => i.compliance).filter((r): r is ComplianceReport => !!r);
  const { failCount, avgScore } = summarizeCompliance(reports);
  const successCount = items.filter(i => i.ok).length;
  const tone: 'fail' | 'pass' = failCount > 0 ? 'fail' : 'pass';

  const handleCopyAll = () => {
    const all = items.map(i => `[${i.name} · ${i.channel}]\n${i.text}`).join('\n\n');
    navigator.clipboard.writeText(all);
    showToast('🔥 전체 결과가 복사되었습니다!');
  };

  const handleDownloadAll = () => {
    const all = items
      .map(i => `${'='.repeat(30)}\n[${i.name} · ${i.channel}]\n${'='.repeat(30)}\n${i.text}`)
      .join('\n\n');
    handleDownload(all, `${stored?.fileName ?? 'csv'}_전체결과`);
  };

  if (!loaded) {
    return (
      <div className="flex h-screen w-screen bg-[#F8FAFC] items-center justify-center font-sans">
        <RefreshCw size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-screen w-screen bg-[#F8FAFC] items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <p className="text-slate-500 font-medium">표시할 CSV 업로드 결과가 없습니다.</p>
          <Link
            href="/workspace/input"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition"
          >
            <Upload size={16} /> CSV 업로드하러 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] bg-slate-900 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2">
          {toastMsg}
        </div>
      )}

      <main className="max-w-5xl mx-auto p-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">CSV 업로드 결과</h1>
            <p className="text-sm text-slate-400 mt-0.5">{stored?.fileName} · {items.length}행</p>
          </div>
          <Link
            href="/workspace/input"
            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-blue-700 transition"
          >
            새 CSV 업로드
          </Link>
        </div>

        {/* 규정 검토 결과 — result 페이지와 동일한 요약 블록 */}
        <div className={`p-5 border rounded-2xl text-left mb-6 ${
          tone === 'fail' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <h4 className={`font-bold mb-2 text-sm ${tone === 'fail' ? 'text-red-800' : 'text-emerald-800'}`}>
            광고 규정 검토 결과 (Compliance Check)
          </h4>
          <p className={`text-sm font-medium mb-1 ${tone === 'fail' ? 'text-red-700' : 'text-emerald-700'}`}>
            평균 {avgScore}점 · {reports.length - failCount}/{reports.length}행 통과
            {failCount > 0 && ` · ${failCount}행 수정 필요`}
          </p>
          <p className="text-xs text-slate-500">
            생성 {items.length}행 중 성공 {successCount}행 · 행을 펼치면 수정 포인트를 볼 수 있습니다
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 mb-4">
          <button onClick={handleDownloadAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
          >
            <Download size={14} /> 전체 내보내기 (.txt)
          </button>
          <button onClick={handleCopyAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
          >
            <Copy size={14} /> 전체 복사
          </button>
        </div>

        {/* 결과 테이블 — 행 클릭 시 펼쳐서 개별 생성 결과와 동일한 카드(원본/AI카피/수정포인트)를 보여줌 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="text-left px-5 py-3 w-8"></th>
                  <th className="text-left px-2 py-3">제품명</th>
                  <th className="text-left px-2 py-3">채널</th>
                  <th className="text-left px-2 py-3">상태</th>
                  <th className="text-left px-2 py-3">규제 검증</th>
                  <th className="text-right px-5 py-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const isOpen = expanded.has(item.index);
                  const matchedTerms = item.compliance?.violations
                    .map(v => v.matched_text)
                    .filter((t): t is string => !!t) ?? [];

                  return (
                    <React.Fragment key={item.index}>
                      <tr
                        className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition"
                        onClick={() => toggle(item.index)}
                      >
                        <td className="px-5 py-3 text-slate-300">
                          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </td>
                        <td className="px-2 py-3 font-bold text-slate-700">{item.name}</td>
                        <td className="px-2 py-3 text-slate-500">{item.channel}</td>
                        <td className="px-2 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {item.ok ? '성공' : '실패'}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            <ComplianceBadges compliance={item.compliance} />
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex gap-2 justify-end text-slate-300">
                            <Copy
                              size={14}
                              className="hover:text-blue-500 cursor-pointer transition"
                              onClick={e => { e.stopPropagation(); handleCopy(item.text, item.name); }}
                            />
                            <Download
                              size={14}
                              className="hover:text-blue-500 cursor-pointer transition"
                              onClick={e => { e.stopPropagation(); handleDownload(item.text, `${item.name}_${item.channel}`); }}
                            />
                          </div>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="border-b border-slate-100 bg-slate-50/40">
                          <td colSpan={6} className="px-5 py-5">
                            <div className="grid md:grid-cols-2 gap-4 text-left">
                              <div className="space-y-4">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-300 uppercase mb-2">Original Context</p>
                                  <p className="text-xs text-slate-400 leading-relaxed bg-white p-3 rounded-xl min-h-[48px] border border-slate-100">
                                    {item.features || '—'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-blue-400 uppercase mb-2 italic">AI Generated Copy</p>
                                  <div className="text-xs text-slate-700 leading-relaxed border border-blue-100 p-4 rounded-xl bg-blue-50/20 whitespace-pre-wrap min-h-[100px]">
                                    {item.text ? highlightViolations(item.text, matchedTerms) : '생성된 카피가 없습니다.'}
                                  </div>
                                </div>
                              </div>
                              <div>
                                {item.compliance && item.compliance.violations.length === 0 ? (
                                  <p className="text-xs text-emerald-600 font-medium">✅ 위반 없음</p>
                                ) : (
                                  <ViolationCards violations={item.compliance?.violations ?? []} />
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
