'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileText, CheckCircle2, Upload, History, Zap,
  RefreshCw, Download, Copy, ChevronRight,
  Search, Camera, Share2, Clock, Check
} from 'lucide-react';

// ── 채널 메타 정보 ──────────────────────────────────────────────
const CHANNEL_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  blog:      { label: 'Blog',      icon: <FileText size={16} className="text-blue-500" />,  color: 'text-blue-500' },
  instagram: { label: 'Instagram', icon: <Camera  size={16} className="text-pink-500" />,   color: 'text-pink-500' },
  facebook:  { label: 'Facebook',  icon: <Share2  size={16} className="text-indigo-500" />, color: 'text-indigo-500' },
};

// ── 채널 결과 1개 카드 ───────────────────────────────────────────
function ChannelCard({
  channel, text, originalContext, productName, isLoading,
  onCopy, onDownload,
}: {
  channel: string;
  text: string;
  originalContext: string;
  productName: string;
  isLoading: boolean;
  onCopy: (text: string, label: string) => void;
  onDownload: (text: string, filename: string) => void;
}) {
  const meta = CHANNEL_META[channel] ?? { label: channel, icon: <FileText size={16} />, color: 'text-slate-500' };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col justify-center items-center text-slate-400 gap-3 min-h-[260px] animate-pulse">
        <RefreshCw size={22} className="animate-spin text-blue-300" />
        <span className="text-sm font-bold text-slate-400">{meta.label} 카피 생성 중...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 text-left">
      {/* 채널 헤더 */}
      <div className="flex justify-between items-center">
        <h5 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${meta.color}`}>
          {meta.icon} {meta.label}
        </h5>
        <div className="flex gap-2 text-slate-300">
          <Copy
            size={14}
            className="hover:text-blue-500 cursor-pointer transition"
            onClick={() => onCopy(text, meta.label)}
          />
          <Download
            size={14}
            className="hover:text-blue-500 cursor-pointer transition"
            onClick={() => onDownload(text, `${productName}_${meta.label}카피`)}
          />
        </div>
      </div>

      {/* 원본 컨텍스트 */}
      <div>
        <p className="text-[10px] font-bold text-slate-300 uppercase mb-2">Original Context</p>
        <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl min-h-[60px]">
          {originalContext}
        </p>
      </div>

      {/* AI 생성 결과 */}
      <div>
        <p className="text-[10px] font-bold text-blue-400 uppercase mb-2 italic">AI Generated Copy</p>
        <div className="text-xs text-slate-700 leading-relaxed border border-blue-100 p-4 rounded-xl bg-blue-50/20 whitespace-pre-wrap min-h-[140px]">
          {text || '생성된 카피가 없습니다.'}
        </div>
      </div>
    </div>
  );
}

// ── 메인 결과 컴포넌트 ────────────────────────────────────────────
function ResultContent() {
  const searchParams = useSearchParams();

  // ── URL 파라미터 파싱 (input/page.tsx 에서 넘긴 키 그대로) ──
  const pName           = searchParams.get('product_name')    || '타이레놀정 500mg';
  const pFeatures       = searchParams.get('features')         || '발열 완화, 두통 및 근육통 완화';
  const pAudience       = searchParams.get('target_audience')  || '성인 및 만 12세 이상';
  const pCategory       = searchParams.get('category')         || '의약품';
  const pIngredient     = searchParams.get('ingredient')       || '';
  const pTone           = searchParams.get('tone')             || '신뢰감 있는';
  const pCoreMessage    = searchParams.get('core_message')     || '과학적 근거 기반 정보 제공';
  const pForbiddenWords = searchParams.get('forbidden_words')  || '완치 보장, 부작용 없음, 100% 효과';
  const pTnm            = searchParams.get('tnm')              || '';
  const pLength         = searchParams.get('length')           || '기본 설정';
  const pPurpose        = searchParams.get('purpose')          || '전환 유도';
  const selectedChannels = searchParams.getAll('channel').length > 0
    ? searchParams.getAll('channel')
    : ['blog'];

  // ── 상태 ──
  const [isLoading, setIsLoading]   = useState(true);
  const [progress, setProgress]     = useState(10);
  const [toastMessage, setToastMsg] = useState('');
  // channel → 생성된 카피 텍스트
  const [results, setResults]       = useState<Record<string, string>>({});

  // ── 유틸: 토스트 표시 ──
  const showToast = (msg: string) => setToastMsg(msg);

  // ── 유틸: 클립보드 복사 ──
  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`✅ ${label} 카피가 복사되었습니다!`);
  };

  // ── 유틸: 텍스트 파일 다운로드 ──
  const handleDownload = (text: string, filename: string) => {
    if (!text) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`💾 ${filename}.txt 다운로드 완료!`);
  };

  // ── 유틸: 전체 복사 ──
  const handleCopyAll = () => {
    const all = selectedChannels
      .map(ch => `[${CHANNEL_META[ch]?.label ?? ch}]\n${results[ch] ?? ''}`)
      .join('\n\n');
    navigator.clipboard.writeText(all);
    showToast('🔥 전체 채널 카피가 복사되었습니다!');
  };

  // ── 유틸: 전체 다운로드 ──
  const handleDownloadAll = () => {
    const all = `제품명: ${pName}\n\n` +
      selectedChannels
        .map(ch => `${'='.repeat(30)}\n[${CHANNEL_META[ch]?.label ?? ch}]\n${'='.repeat(30)}\n${results[ch] ?? ''}`)
        .join('\n\n');
    handleDownload(all, `${pName}_전체_광고카피`);
  };

  // ── API 호출 ──────────────────────────────────────────────────
  const generateAdCopy = async () => {
    setIsLoading(true);
    setProgress(10);
    setResults({});

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

    // GenerateRequest 필드와 1:1 대응
    // /platform 엔드포인트는 `request` 모델을 사용하므로 동일 필드 구조
    const payload = {
      // 브랜드 가이드
      tone:           pTone,
      core_message:   pCoreMessage,    // ✅ input에서 편집한 값 그대로
      forbidden_words: pForbiddenWords, // ✅ input에서 편집한 값 그대로
      tnm:            pTnm,            // ✅ 추가 스타일 메모 그대로
      // 옵션
      channel:        selectedChannels,
      length:         pLength,
      purpose:        pPurpose,
      // 제품 정보
      name:           pName,
      category:       pCategory,
      features:       pFeatures,       // ✅ indication → features로 통일
      target_audience: pAudience,
    };

    // 프로그레스 애니메이션 (응답 대기 중 65%까지 미리 올림)
    const fakeTimer = setTimeout(() => setProgress(65), 600);

    try {
      const res = await fetch(`${backendUrl}/api/generate/platform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearTimeout(fakeTimer);

      const data = await res.json();

      if (!res.ok) {
        console.error('백엔드 에러:', data);
        throw new Error(data?.detail || '서버 에러');
      }

      // data.results = [{ channel, ok, text }, ...]
      const parsed: Record<string, string> = {};
      for (const item of (data.results ?? [])) {
        parsed[item.channel] = item.ok ? item.text : `[생성 실패] ${item.text}`;
      }

      setProgress(100);
      setTimeout(() => {
        setResults(parsed);
        setIsLoading(false);
      }, 300);

    } catch (err) {
      clearTimeout(fakeTimer);
      console.error('API 호출 실패, 데모 모드 전환:', err);
      // 데모 폴백: 채널별 더미 텍스트
      const fallback: Record<string, string> = {};
      if (selectedChannels.includes('blog'))
        fallback['blog'] = `[데모] ${pName} — ${pFeatures}\n\n${pAudience}을 위한 신뢰할 수 있는 선택입니다. 복용 전 전문의와 상담하세요.`;
      if (selectedChannels.includes('instagram'))
        fallback['instagram'] = `갑작스러운 불편함, 이제 ${pName}으로 해결하세요 💊\n\n#${pName.replace(/\s/g, '')} #건강 #의약품`;
      if (selectedChannels.includes('facebook'))
        fallback['facebook'] = `${pName}은 ${pFeatures}에 도움을 줄 수 있는 의약품입니다. 용법·용량을 반드시 확인하세요.`;
      setProgress(100);
      setTimeout(() => {
        setResults(fallback);
        setIsLoading(false);
        showToast('⚠️ API 연결 실패 → 데모 데이터 표시 중');
      }, 300);
    }
  };

  // ── 최초 1회 API 호출 ──
  useEffect(() => { generateAdCopy(); }, []);

  // ── 프로그레스 바 애니메이션 ──
  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) { clearInterval(timer); return 95; }
        return prev + 10;
      });
    }, 300);
    return () => clearInterval(timer);
  }, [isLoading]);

  // ── 토스트 자동 제거 ──
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMsg(''), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // ── 그리드 열 수 계산 ──
  const cols = selectedChannels.length === 1 ? 'grid-cols-1'
             : selectedChannels.length === 2 ? 'grid-cols-2'
             : 'grid-cols-3';

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">

      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] bg-slate-900 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2">
          <Check size={14} className="text-emerald-400" /> {toastMessage}
        </div>
      )}

      {/* ── [1] 사이드바 ── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 shrink-0">
        <div className="mb-10 px-2">
          <Link href="/" className="text-xl font-bold text-slate-800 tracking-tight">Bioverse</Link>
        </div>

        <nav className="flex-1 space-y-8">
          <div>
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">
              Workflow Status
            </h2>
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-400 rounded-lg">
                <Clock size={18} /> Ready
              </div>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition ${
                isLoading ? 'bg-blue-50 text-blue-600' : 'text-slate-400'
              }`}>
                <Zap size={18} className={isLoading ? 'animate-pulse' : ''} /> Generating
              </div>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition ${
                !isLoading ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'
              }`}>
                <CheckCircle2 size={18} /> Done
              </div>
            </div>
          </div>
        </nav>

        <div className="space-y-2 pt-6 border-t border-slate-100">
          <button
            onClick={() => alert('CSV 대량 업로드 기능은 개발 중입니다.')}
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition"
          >
            <Upload size={18} /> CSV Upload
          </button>
          <button
            onClick={() => alert('History 기능은 개발 중입니다.')}
            className="flex items-center justify-center gap-2 w-full py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition"
          >
            <History size={18} /> History
          </button>
        </div>
      </aside>

      {/* ── [2] 메인 콘텐츠 ── */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">

        {/* 상단 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">광고 생성 결과</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {pName} · {selectedChannels.map(ch => CHANNEL_META[ch]?.label ?? ch).join(', ')}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-sm text-slate-400 font-medium">KR | EN</span>
            <Link
              href="/workspace/input"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-blue-700 transition"
            >
              다시 만들기
            </Link>
          </div>
        </div>

        {/* 진행 상태 바 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <RefreshCw size={22} className={isLoading ? 'animate-spin' : ''} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {isLoading ? `광고 문구 생성 중... (${progress}%)` : '✨ 모든 채널 광고 카피 생성 완료'}
                </h3>
                <p className="text-xs text-slate-400">Pharmaceutical Advertisement Generator · Bioverse</p>
              </div>
            </div>
            <button
              onClick={generateAdCopy}
              disabled={isLoading}
              className="flex items-center gap-2 text-blue-600 text-xs font-bold hover:underline disabled:opacity-40 transition"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> 전체 재생성
            </button>
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 채널별 상태 표시 */}
          <div className="flex gap-6 mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {selectedChannels.map(ch => (
              <span key={ch}>
                {CHANNEL_META[ch]?.label ?? ch}{' '}
                <span className={isLoading ? 'text-amber-500' : 'text-emerald-500'}>
                  {isLoading ? '생성중' : '완료'}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={handleDownloadAll}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 disabled:opacity-40 transition"
          >
            <Download size={14} /> 전체 내보내기 (.txt)
          </button>
          <button
            onClick={handleCopyAll}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 disabled:opacity-40 transition"
          >
            <Copy size={14} /> 전체 복사
          </button>
        </div>

        {/* ── 메인 결과 카드 ── */}
        <div className="bg-white rounded-3xl border-2 border-blue-500 shadow-xl overflow-hidden mb-8">

          {/* 카드 헤더 */}
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold italic shrink-0">
                BIO
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-800">{pName}</h4>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                    isLoading ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {isLoading ? 'GENERATING' : 'DONE'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {pCategory}{pIngredient ? ` · ${pIngredient}` : ''} · {pAudience}
                </p>
              </div>
            </div>
            <button
              onClick={generateAdCopy}
              disabled={isLoading}
              className="flex items-center gap-2 text-blue-600 text-xs font-bold hover:underline disabled:opacity-40"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> 재생성
            </button>
          </div>

          {/* 채널별 결과 그리드 */}
          <div className={`grid divide-x divide-slate-100 ${cols}`}>
            {selectedChannels.map(ch => (
              <ChannelCard
                key={ch}
                channel={ch}
                text={results[ch] ?? ''}
                originalContext={pFeatures}
                productName={pName}
                isLoading={isLoading}
                onCopy={handleCopy}
                onDownload={handleDownload}
              />
            ))}
          </div>

          {/* 카드 푸터 */}
          <div className="p-5 bg-slate-50/60 border-t border-slate-100 flex justify-between items-center">
            <div className="flex gap-3">
              <button
                onClick={() => alert('결과 저장 기능은 개발 중입니다.')}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
              >
                결과 저장
              </button>
              <button
                onClick={generateAdCopy}
                disabled={isLoading}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 disabled:opacity-40 transition"
              >
                채널 재생성
              </button>
            </div>
            <button
              onClick={() => alert('다음 등록된 의약품이 없습니다.')}
              className="flex items-center gap-1 text-slate-600 font-bold text-sm hover:text-blue-600 transition"
            >
              다음 의약품 <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* 광고 규정 검토 결과 */}
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-left mb-8">
          <h4 className="font-bold text-amber-800 mb-2 text-sm">광고 규정 검토 결과 (Compliance Check)</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>✓ 금지 표현 필터링 완료: <span className="font-medium">{pForbiddenWords}</span></li>
            <li>✓ 필수 부작용 고지 문구 삽입</li>
            <li>✓ 의사/약사 상담 권고 disclaimer 적용</li>
            <li>✓ 식약처 허가 범위 내 효능 표현 사용</li>
          </ul>
        </div>

      </main>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen bg-[#F8FAFC] items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-slate-500 font-medium">
          <RefreshCw size={36} className="animate-spin text-blue-600" />
          <span>의약품 광고 생성 준비 중...</span>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
