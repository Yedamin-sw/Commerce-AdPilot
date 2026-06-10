'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Play, FileText, CheckCircle2, Upload, History, 
  Plus, ChevronDown, Zap, Settings2, Camera, Share2, X, Type,
  Video, Music, ShoppingBag, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';

// ── CSV 업로드 모달 ────────────────────────────────────────────
function CsvUploadModal({ onClose }: { onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [uploadState, setUploadState]   = useState<
    'idle' | 'uploading' | 'polling' | 'done' | 'error'
  >('idle');
  const [statusMsg, setStatusMsg]       = useState('');
  const [jobResult, setJobResult]       = useState<{
    total: number; success?: number; failed?: number;
  } | null>(null);

  const backendUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BACKEND_URL) ||
    'http://127.0.0.1:8000';

  // ── 파일 선택 핸들러 ──
  const handleFileChange = (file: File | null) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext ?? '')) {
      setStatusMsg('⚠️ CSV 또는 엑셀(.xlsx) 파일만 업로드 가능합니다.');
      return;
    }
    setSelectedFile(file);
    setStatusMsg('');
  };

  // ── 드래그 앤 드롭 핸들러 ──
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files?.[0] ?? null);
  };

  // ── 실제 업로드 → 백엔드 /api/generate/csv ──
  const handleUpload = async () => {
    if (!selectedFile) {
      setStatusMsg('⚠️ 파일을 먼저 선택해주세요.');
      return;
    }

    setUploadState('uploading');
    setStatusMsg('파일 업로드 중...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('language', 'ko');
      // 50행 이하면 동기, 초과면 백그라운드 처리
      formData.append('async_mode', 'false');
      formData.append('async_threshold', '50');

      const res = await fetch(`${backendUrl}/api/generate/csv`, {
        method: 'POST',
        body: formData, // Content-Type은 브라우저가 자동으로 multipart/form-data로 설정
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || '서버 오류가 발생했습니다.');
      }

      // ── 동기 처리 완료 (50행 이하) ──
      if (data.results) {
        const success = data.results.filter((r: any) => r.ok).length;
        const failed  = data.results.filter((r: any) => !r.ok).length;
        setJobResult({ total: data.total, success, failed });
        setUploadState('done');
        setStatusMsg(`✅ 생성 완료! 총 ${data.total}개 중 성공 ${success}개`);
        return;
      }

      // ── 비동기 처리 (50행 초과 → job_id 반환) ──
      if (data.job_id) {
        setUploadState('polling');
        setStatusMsg(`대기열 등록 완료 (총 ${data.total}행). 처리 상태 확인 중...`);
        await pollJobStatus(data.job_id, data.total);
      }

    } catch (err: any) {
      setUploadState('error');
      setStatusMsg(`❌ 업로드 실패: ${err.message}`);
    }
  };

  // ── 비동기 job 상태 폴링 ──
  const pollJobStatus = async (jobId: string, total: number) => {
    const maxAttempts = 60; // 최대 60번 (약 60초)
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 1000));
      try {
        const res  = await fetch(`${backendUrl}/api/generate/csv/status/${jobId}`);
        const data = await res.json();
        setStatusMsg(`처리 중... ${data.done}/${total} (${Math.round(data.progress * 100)}%)`);
        if (data.status === 'completed') {
          setJobResult({ total: data.total, success: data.success, failed: data.failed });
          setUploadState('done');
          setStatusMsg(`✅ 완료! 총 ${data.total}개 중 성공 ${data.success}개, 실패 ${data.failed}개`);
          return;
        }
        if (data.status === 'failed') {
          throw new Error(data.error || '처리 중 오류 발생');
        }
      } catch (err: any) {
        setUploadState('error');
        setStatusMsg(`❌ 상태 확인 실패: ${err.message}`);
        return;
      }
    }
    setUploadState('error');
    setStatusMsg('❌ 처리 시간이 초과되었습니다. 나중에 다시 시도해주세요.');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-[480px] relative border border-slate-100">
        
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
        >
          <X size={20} />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Upload size={22} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">CSV 대량 업로드</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-5">
          제품 데이터가 담긴 CSV / 엑셀 파일을 업로드하면 행마다 자동으로 광고 문구를 생성합니다.
          <br />
          <span className="font-semibold text-slate-600">필수 컬럼:</span>{' '}
          <code className="bg-slate-100 px-1 rounded text-[11px]">name</code>,{' '}
          <code className="bg-slate-100 px-1 rounded text-[11px]">features</code>,{' '}
          <code className="bg-slate-100 px-1 rounded text-[11px]">target_audience</code>
          (선택: category, channel, tone, length, purpose)
        </p>

        {/* 드롭존 */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition mb-4 ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : selectedFile
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
          }`}
        >
          {/* 숨긴 파일 input — 실제 파일 선택 담당 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
          />
          <Upload size={28} className={selectedFile ? 'text-emerald-500' : 'text-slate-400'} />
          {selectedFile ? (
            <>
              <span className="text-sm font-bold text-emerald-700">{selectedFile.name}</span>
              <span className="text-[11px] text-emerald-500">
                {(selectedFile.size / 1024).toFixed(1)} KB · 클릭하여 파일 변경
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-bold text-slate-600">클릭하여 파일 선택 또는 드래그</span>
              <span className="text-[10px] text-slate-400">지원 형식: .csv, .xlsx (최대 10MB)</span>
            </>
          )}
        </div>

        {/* 상태 메시지 */}
        {statusMsg && (
          <div className={`flex items-center gap-2 text-xs font-medium mb-4 px-3 py-2 rounded-lg ${
            uploadState === 'error'
              ? 'bg-red-50 text-red-600'
              : uploadState === 'done'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-blue-50 text-blue-600'
          }`}>
            {uploadState === 'uploading' || uploadState === 'polling'
              ? <RefreshCw size={13} className="animate-spin shrink-0" />
              : uploadState === 'done'
              ? <CheckCircle size={13} className="shrink-0" />
              : <AlertCircle size={13} className="shrink-0" />
            }
            {statusMsg}
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex gap-2">
          {uploadState === 'done' ? (
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition"
            >
              완료 — 닫기
            </button>
          ) : (
            <button
              onClick={handleUpload}
              disabled={uploadState === 'uploading' || uploadState === 'polling'}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
            >
              {(uploadState === 'uploading' || uploadState === 'polling') && (
                <RefreshCw size={14} className="animate-spin" />
              )}
              {uploadState === 'uploading' ? '업로드 중...'
               : uploadState === 'polling'  ? '처리 중...'
               : '업로드 시작'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function WorkspacePage() {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── 제품 정보 ──
  const [productName,    setProductName]    = useState('');
  const [category,       setCategory]       = useState('');
  const [indication,     setIndication]     = useState('발열 완화, 두통 및 근육통 완화');
  const [targetAudience, setTargetAudience] = useState('');
  const [ingredient,     setIngredient]     = useState('');

  // ── 브랜드 가이드 ──
  const [coreMessage,    setCoreMessage]    = useState('과학적 근거 기반 정보 제공');
  const [forbiddenWords, setForbiddenWords] = useState('완치 보장, 부작용 없음, 100% 효과');

  // ── 광고 옵션 ──
  const [tone,     setTone]     = useState('신뢰감 있는');
  const [tnm,      setTnm]      = useState('');
  const [length,   setLength]   = useState('기본 설정');
  const [purpose,  setPurpose]  = useState('전환 유도');
  // 기본값: blog 1개만 선택 (UX상 자연스러운 시작)
  const [channels, setChannels] = useState<string[]>(['blog']);

  const toggleChannel = (ch: string) => {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const pName     = productName.trim()    || '타이레놀정 500mg';
    const pFeatures = `${category ? `[${category}] ` : ''}${indication.trim()}`.trim();
    const pAudience = targetAudience.trim() || '성인 및 만 12세 이상';
    const pChannels = channels.length > 0   ? channels : ['blog'];

    const params = new URLSearchParams({
      product_name:    pName,
      features:        pFeatures,
      target_audience: pAudience,
      category:        category.trim(),
      ingredient:      ingredient.trim(),
      tone,
      core_message:    coreMessage,
      forbidden_words: forbiddenWords,
      tnm,
      length,
      purpose,
    });
    pChannels.forEach(ch => params.append('channel', ch));

    router.push(`/workspace/result?${params.toString()}`);
  };

  const CHANNEL_LIST = [
    { id: 'blog',      label: 'Blog',       icon: <FileText    size={24} /> },
    { id: 'instagram', label: 'Instagram',  icon: <Camera      size={24} /> },
    { id: 'facebook',  label: 'Facebook',   icon: <Share2      size={24} /> },
    { id: 'youtube',   label: 'YouTube',    icon: <Video       size={24} /> },
    { id: 'tiktok',    label: 'TikTok',     icon: <Music       size={24} /> },
    { id: 'naver',     label: 'Naver Shop', icon: <ShoppingBag size={24} /> },
  ];

  return (
    <>
      {/* CSV 업로드 모달 — 모달 자체를 별도 컴포넌트로 분리해서 form 바깥에 렌더링 */}
      {isModalOpen && <CsvUploadModal onClose={() => setIsModalOpen(false)} />}

      <form
        onSubmit={handleGenerate}
        className="relative flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden"
      >
        {/* ── [1] 사이드바 ── */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6">
          <div className="mb-10 px-2">
            <Link href="/"><h1 className="text-xl font-bold text-slate-800">Bioverse</h1></Link>
          </div>

          <nav className="flex-1 space-y-8">
            <div>
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">
                Workflow Status
              </h2>
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-semibold">
                  <Zap size={18} className="animate-pulse" /> Generating
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500 rounded-lg">
                  <FileText size={18} /> Ready
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500 rounded-lg">
                  <CheckCircle2 size={18} /> Done
                </div>
              </div>
            </div>
          </nav>

          <div className="space-y-2 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition"
            >
              <Upload size={18} /> CSV Upload
            </button>
            <button
              type="button"
              onClick={() => alert('History 기능은 현재 개발 중입니다.')}
              className="flex items-center justify-center gap-2 w-full py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition"
            >
              <History size={18} /> History
            </button>
          </div>
        </aside>

        {/* ── [2] 중앙 섹션 ── */}
        <section className="flex-1 bg-white overflow-y-auto border-r border-slate-200 p-10">
          <div className="max-w-2xl mx-auto space-y-10">

            <div className="flex justify-between items-end">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 text-left">
                Pharmaceutical Advertisement Input
              </h2>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button type="button" className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-sm font-bold text-blue-600 transition">
                  수기 입력
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-1.5 text-slate-500 text-sm font-medium hover:text-slate-700 transition"
                >
                  CSV 입력
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-left">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">의약품명*</label>
                <input
                  type="text" placeholder="예: 타이레놀"
                  value={productName} onChange={e => setProductName(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">카테고리*</label>
                <input
                  type="text" placeholder="예: 해열·진통"
                  value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-700 ml-1">주요 효능 및 특징*</label>
                  <button type="button" className="text-blue-500 text-xs font-bold hover:underline flex items-center gap-1">
                    <Plus size={14} />추가
                  </button>
                </div>
                <input
                  type="text" value={indication} onChange={e => setIndication(e.target.value)}
                  placeholder="예: 발열 완화, 두통 및 근육통 완화"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">타겟 고객*</label>
                <input
                  type="text" placeholder="예: 성인 및 만 12세 이상"
                  value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">(선택) 주성분</label>
                <input
                  type="text" placeholder="예: 아세트아미노펜 500mg"
                  value={ingredient} onChange={e => setIngredient(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* 브랜드 가이드 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 text-left">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 tracking-tight">
                <Settings2 size={16} /> TEAM BRAND GUIDE
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">기본 톤</p>
                  <p className="font-medium text-slate-700">{tone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                    핵심 메시지 <span className="text-blue-400 normal-case">(편집 가능)</span>
                  </p>
                  <input
                    type="text" value={coreMessage} onChange={e => setCoreMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:border-blue-400 outline-none transition"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-[11px] font-bold text-red-400 uppercase mb-1">
                    금지 표현 <span className="text-blue-400 normal-case">(편집 가능, 쉼표로 구분)</span>
                  </p>
                  <input
                    type="text" value={forbiddenWords} onChange={e => setForbiddenWords(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-red-100 rounded-lg text-sm font-medium text-red-500 focus:border-red-300 outline-none transition"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">필수 표현</p>
                  <p className="font-medium text-slate-700">의료진과 상담이 필요합니다</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── [3] 오른쪽 옵션 섹션 ── */}
        <section className="w-[420px] bg-slate-50 p-10 flex flex-col">
          <div className="flex-1 space-y-8 text-left overflow-y-auto">

            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">Advertisement Settings</h2>
              <div className="flex gap-2">
                <button type="button" className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 shadow-sm">
                  KR | EN
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-[11px] font-bold hover:bg-slate-700 transition"
                >
                  바로 시작
                </button>
              </div>
            </div>

            {/* 채널 선택 — 6개 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">생성 채널*</label>
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setChannels(CHANNEL_LIST.map(c => c.id))}
                    className="text-blue-500 font-bold hover:underline"
                  >
                    전체 선택
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setChannels([])}
                    className="text-slate-400 font-bold hover:underline"
                  >
                    전체 해제
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {CHANNEL_LIST.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleChannel(id)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition h-24 ${
                      channels.includes(id)
                        ? 'bg-white border-2 border-blue-500 text-blue-600 shadow-md'
                        : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {icon}
                    <span className="text-xs font-bold uppercase whitespace-nowrap">{label}</span>
                  </button>
                ))}
              </div>
              {channels.length === 0 && (
                <p className="text-xs text-red-400 font-medium">채널을 1개 이상 선택해주세요.</p>
              )}
            </div>

            {/* 옵션 */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Type size={14} /> 톤앤매너
                </label>
                <div className="relative">
                  <select
                    value={tone} onChange={e => setTone(e.target.value)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-500 appearance-none transition cursor-pointer"
                  >
                    <option value="신뢰감 있는">🛡️ 신뢰감 있는 (의약품 권장)</option>
                    <option value="트렌디하고 감성적인">✨ 트렌디하고 감성적인 (SNS 홍보용)</option>
                    <option value="친근하고 따뜻한">🤝 친근하고 따뜻한 (이웃 커뮤니티용)</option>
                    <option value="전문적이고 학술적인">🔬 전문적이고 학술적인 (전문 지식용)</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">길이</label>
                  <div className="relative">
                    <select
                      value={length} onChange={e => setLength(e.target.value)}
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-500 appearance-none transition cursor-pointer"
                    >
                      <option value="한 줄 카피">⚡ 한 줄 카피</option>
                      <option value="기본 설정">📝 채널별 표준</option>
                      <option value="상세 설명형">📖 상세 설명형</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">목적</label>
                  <div className="relative">
                    <select
                      value={purpose} onChange={e => setPurpose(e.target.value)}
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-500 appearance-none transition cursor-pointer"
                    >
                      <option value="전환 유도">🎯 구매/전환 유도</option>
                      <option value="정보 전달">💡 정보 전달·신뢰</option>
                      <option value="바이럴 홍보">🔥 공감·바이럴 홍보</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  추가 스타일 메모 <span className="text-slate-400 font-normal">(선택)</span>
                </label>
                <input
                  type="text" value={tnm} onChange={e => setTnm(e.target.value)}
                  placeholder="예: MZ 감성, 구어체 위주, 의사가 추천하는 느낌"
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={channels.length === 0}
            className="mt-6 w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition transform active:scale-[0.98]"
          >
            <Play size={20} fill="white" /> 광고 문구 생성
          </button>
        </section>
      </form>
    </>
  );
}
