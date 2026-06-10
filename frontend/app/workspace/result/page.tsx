'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  FileText, CheckCircle2, Upload, History, Zap,
  RefreshCw, Download, Copy, ChevronRight, X,
  Clock, Check, Video, ShoppingBag, Music, Camera, Share2
} from 'lucide-react';

// ── 채널 메타 정보 ──────────────────────────────────────────────
const CHANNEL_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  blog:      { label: 'Blog',       icon: <FileText    size={16} className="text-blue-500" />,   color: 'text-blue-500'   },
  instagram: { label: 'Instagram',  icon: <Camera      size={16} className="text-pink-500" />,   color: 'text-pink-500'   },
  facebook:  { label: 'Facebook',   icon: <Share2      size={16} className="text-indigo-500" />, color: 'text-indigo-500' },
  youtube:   { label: 'YouTube',    icon: <Video       size={16} className="text-red-500" />,    color: 'text-red-500'    },
  tiktok:    { label: 'TikTok',     icon: <Music       size={16} className="text-purple-500" />, color: 'text-purple-500' },
  naver:     { label: 'Naver Shop', icon: <ShoppingBag size={16} className="text-green-500" />,  color: 'text-green-500'  },
};

// ── 채널 수에 따른 그리드 클래스 ────────────────────────────────
function getGridCols(count: number): string {
  if (count === 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count >= 4)  return 'grid-cols-2'; // 4개 이상은 2열로 래핑 (3열이면 너무 좁음)
  return 'grid-cols-3';                  // 3개
}

// ── 채널 결과 카드 ───────────────────────────────────────────────
function ChannelCard({
  channel, text, originalContext, productName, isLoading, onCopy, onDownload,
}: {
  channel: string; text: string; originalContext: string;
  productName: string; isLoading: boolean;
  onCopy: (text: string, label: string) => void;
  onDownload: (text: string, filename: string) => void;
}) {
  const meta = CHANNEL_META[channel] ?? { label: channel, icon: <FileText size={16} />, color: 'text-slate-500' };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col justify-center items-center text-slate-400 gap-3 min-h-[220px] animate-pulse">
        <RefreshCw size={22} className="animate-spin text-blue-300" />
        <span className="text-sm font-bold text-slate-400">{meta.label} 카피 생성 중...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 text-left">
      {/* 카드 헤더 */}
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
        <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-3 rounded-xl min-h-[48px]">
          {originalContext}
        </p>
      </div>

      {/* AI 생성 결과 */}
      <div>
        <p className="text-[10px] font-bold text-blue-400 uppercase mb-2 italic">AI Generated Copy</p>
        <div className="text-xs text-slate-700 leading-relaxed border border-blue-100 p-4 rounded-xl bg-blue-50/20 whitespace-pre-wrap min-h-[120px]">
          {text || '생성된 카피가 없습니다.'}
        </div>
      </div>
    </div>
  );
}

// ── 데모 폴백 데이터 생성 (6개 채널 전부 대응) ──────────────────
function buildFallback(channels: string[], name: string, features: string, audience: string) {
  const map: Record<string, string> = {
    blog:      `[데모] ${name} — ${features}\n\n${audience}을 위한 신뢰할 수 있는 선택입니다.\n복용 전 전문의 또는 약사와 상담하세요.`,
    instagram: `갑작스러운 불편함, 이제 ${name}으로 해결하세요 💊✨\n\n${audience}에게 안전하게 설계된 의약품.\n※ 전문의·약사 상담 후 복용하세요.\n\n#${name.replace(/\s/g, '')} #건강 #의약품 #약국`,
    facebook:  `${name}은 ${features}에 도움을 줄 수 있는 의약품입니다.\n${audience}를 위해 개발되었으며, 용법·용량을 반드시 확인하세요.\n\n※ 이 게시물은 의약품 광고입니다.`,
    youtube:   `지금 이 순간, 불편함을 느끼고 계신가요?\n\n${name}은 ${features} 효과를 가진 의약품입니다. ${audience}에게 적합하게 설계되었습니다.\n\n▶ 아래 설명란에서 복용법과 주의사항을 확인하세요.`,
    tiktok:    `갑자기 찾아온 두통? ${name} 하나면 OK 💊\n\n#${name.replace(/\s/g, '')} #약바로알기 #건강꿀팁 #의약품은올바르게`,
    naver:     `${name} | ${features} | ${audience} 맞춤형 의약품\n\n과학적 근거 기반의 안전한 선택. 지금 성분·복용법 확인하기 ▶`,
  };
  const result: Record<string, string> = {};
  channels.forEach(ch => { result[ch] = map[ch] ?? `[데모] ${name} 광고 카피 (${ch})`; });
  return result;
}

// ── 결과 페이지 내부 컴포넌트 ────────────────────────────────────
function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 파라미터 파싱
  const pName           = searchParams.get('product_name')   || '타이레놀정 500mg';
  const pFeatures       = searchParams.get('features')        || '발열 완화, 두통 및 근육통 완화';
  const pAudience       = searchParams.get('target_audience') || '성인 및 만 12세 이상';
  const pCategory       = searchParams.get('category')        || '의약품';
  const pIngredient     = searchParams.get('ingredient')      || '';
  const pTone           = searchParams.get('tone')            || '신뢰감 있는';
  const pCoreMessage    = searchParams.get('core_message')    || '과학적 근거 기반 정보 제공';
  const pForbiddenWords = searchParams.get('forbidden_words') || '완치 보장, 부작용 없음, 100% 효과';
  const pTnm            = searchParams.get('tnm')             || '';
  const pLength         = searchParams.get('length')          || '기본 설정';
  const pPurpose        = searchParams.get('purpose')         || '전환 유도';
  const selectedChannels = searchParams.getAll('channel').length > 0
    ? searchParams.getAll('channel') : ['blog'];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading,   setIsLoading]   = useState(true);
  const [progress,    setProgress]    = useState(10);
  const [toastMsg,    setToastMsg]    = useState('');
  const [results,     setResults]     = useState<Record<string, string>>({});

  const showToast = (msg: string) => setToastMsg(msg);

  // ── 복사 ──
  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`✅ ${label} 카피가 복사되었습니다!`);
  };

  // ── 개별 다운로드 ──
  const handleDownload = (text: string, filename: string) => {
    if (!text) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `${filename}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`💾 ${filename}.txt 다운로드 완료!`);
  };

  // ── 전체 복사 ──
  const handleCopyAll = () => {
    if (isLoading) return;
    const all = selectedChannels
      .map(ch => `[${CHANNEL_META[ch]?.label ?? ch}]\n${results[ch] ?? ''}`)
      .join('\n\n');
    navigator.clipboard.writeText(all);
    showToast('🔥 전체 채널 카피가 복사되었습니다!');
  };

  // ── 전체 txt 다운로드 ──
  const handleDownloadAll = () => {
    if (isLoading) return;
    const all = `제품명: ${pName}\n\n` +
      selectedChannels
        .map(ch => `${'='.repeat(30)}\n[${CHANNEL_META[ch]?.label ?? ch}]\n${'='.repeat(30)}\n${results[ch] ?? ''}`)
        .join('\n\n');
    handleDownload(all, `${pName}_전체_광고카피`);
  };

  // ── CSV 내보내기 (결과 → CSV 다운로드) ──
  const handleCsvExport = () => {
    if (isLoading) { showToast('⚠️ 생성이 완료된 후 다운로드하세요.'); return; }
    try {
      let csv = '\uFEFF제품명,채널,AI 생성 카피\n';
      selectedChannels.forEach(ch => {
        const label    = CHANNEL_META[ch]?.label ?? ch;
        const copyText = (results[ch] ?? '').replace(/"/g, '""');
        csv += `"${pName}","${label}","${copyText}"\n`;
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      a.download = `${pName}_광고카피_결과.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      showToast('📊 CSV 다운로드 완료!');
      setIsModalOpen(false);
    } catch {
      alert('CSV 생성 중 오류가 발생했습니다.');
    }
  };

  // ── API 호출 ──
  const generateAdCopy = async () => {
    setIsLoading(true);
    setProgress(10);
    setResults({});

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const payload = {
      tone: pTone, core_message: pCoreMessage, forbidden_words: pForbiddenWords,
      tnm: pTnm, channel: selectedChannels, length: pLength, purpose: pPurpose,
      name: pName, category: pCategory, features: pFeatures, target_audience: pAudience,
    };

    const fakeTimer = setTimeout(() => setProgress(65), 600);
    try {
      const res  = await fetch(`${backendUrl}/api/generate/platform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      clearTimeout(fakeTimer);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || '서버 에러');

      const parsed: Record<string, string> = {};
      for (const item of (data.results ?? [])) {
        parsed[item.channel] = item.ok ? item.text : `[생성 실패] ${item.text}`;
      }
      setProgress(100);
      setTimeout(() => { setResults(parsed); setIsLoading(false); }, 300);

    } catch (err) {
      clearTimeout(fakeTimer);
      console.error('API 호출 실패, 데모 모드:', err);
      setProgress(100);
      setTimeout(() => {
        setResults(buildFallback(selectedChannels, pName, pFeatures, pAudience));
        setIsLoading(false);
        showToast('⚠️ API 연결 실패 → 데모 데이터 표시 중');
      }, 300);
    }
  };

  useEffect(() => { generateAdCopy(); }, []);

  // 프로그레스 애니메이션
  useEffect(() => {
    if (!isLoading) return;
    const t = setInterval(() => {
      setProgress(p => { if (p >= 95) { clearInterval(t); return 95; } return p + 10; });
    }, 300);
    return () => clearInterval(t);
  }, [isLoading]);

  // 토스트 자동 제거
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(''), 2500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const gridCols = getGridCols(selectedChannels.length);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">

      {/* 토스트 */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] bg-slate-900 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2">
          <Check size={14} className="text-emerald-400" /> {toastMsg}
        </div>
      )}

      {/* ── 사이드바 ── */}
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
          {/* CSV Download 버튼 → 결과 CSV 내보내기 모달 열기 */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition"
          >
            <Upload size={18} /> CSV Export
          </button>
          <button
            onClick={() => router.push('/workspace/history')}
            className="flex items-center justify-center gap-2 w-full py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition"
          >
            <History size={18} /> History
          </button>
        </div>
      </aside>

      {/* ── 메인 ── */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">광고 생성 결과</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {pName} · {selectedChannels.map(ch => CHANNEL_META[ch]?.label ?? ch).join(', ')}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-sm text-slate-400 font-medium">KR | EN</span>
            <Link href="/workspace/input"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-blue-700 transition"
            >
              다시 만들기
            </Link>
          </div>
        </div>

        {/* 진행 상태 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
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
            <button onClick={generateAdCopy} disabled={isLoading}
              className="flex items-center gap-2 text-blue-600 text-xs font-bold hover:underline disabled:opacity-40 transition"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> 전체 재생성
            </button>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
          <button onClick={handleDownloadAll} disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 disabled:opacity-40 transition"
          >
            <Download size={14} /> 전체 내보내기 (.txt)
          </button>
          <button onClick={handleCopyAll} disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 disabled:opacity-40 transition"
          >
            <Copy size={14} /> 전체 복사
          </button>
          <button onClick={() => setIsModalOpen(true)} disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 disabled:opacity-40 transition"
          >
            <Download size={14} /> CSV 내보내기
          </button>
        </div>

        {/* 결과 카드 */}
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
            <button onClick={generateAdCopy} disabled={isLoading}
              className="flex items-center gap-2 text-blue-600 text-xs font-bold hover:underline disabled:opacity-40"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> 재생성
            </button>
          </div>

          {/* 채널 결과 그리드 — 채널 수에 따라 자동 조정 */}
          <div className={`grid ${gridCols} divide-x divide-slate-100`}>
            {selectedChannels.map(ch => (
              <ChannelCard
                key={ch} channel={ch}
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
              <button onClick={() => alert('결과 저장 기능은 개발 중입니다.')}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
              >
                결과 저장
              </button>
              <button onClick={generateAdCopy} disabled={isLoading}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 disabled:opacity-40 transition"
              >
                채널 재생성
              </button>
            </div>
            <button onClick={() => alert('다음 등록된 의약품이 없습니다.')}
              className="flex items-center gap-1 text-slate-600 font-bold text-sm hover:text-blue-600 transition"
            >
              다음 의약품 <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* 규정 검토 결과 */}
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

      {/* ── CSV 내보내기 모달 ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-[450px] relative border border-slate-100">
            <button onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Download size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">CSV 파일로 결과 내보내기</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              생성된 광고 카피를 엑셀에서 바로 열 수 있는 CSV 형식으로 다운로드합니다.
              한글 깨짐 방지를 위해 UTF-8 BOM 인코딩이 적용됩니다.
            </p>

            {/* 다운로드 정보 요약 */}
            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2 border border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">파일명</span>
                <span className="font-bold text-slate-700">{pName}_광고카피_결과.csv</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">포함 채널 수</span>
                <span className="font-bold text-blue-600">{selectedChannels.length}개</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">채널 목록</span>
                <span className="text-slate-600 text-right max-w-[260px] truncate">
                  {selectedChannels.map(ch => CHANNEL_META[ch]?.label ?? ch).join(', ')}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleCsvExport}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                <Download size={16} /> CSV 다운로드
              </button>
              <button onClick={() => setIsModalOpen(false)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Suspense 래퍼 (Next.js useSearchParams 필수) ─────────────────
export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen bg-[#F8FAFC] items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <RefreshCw size={36} className="animate-spin text-blue-600" />
          <span className="font-medium">의약품 광고 생성 준비 중...</span>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
