'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Play, FileText, CheckCircle2, Upload, History, 
  Plus, ChevronDown, Zap, Settings2, Camera, Share2, X, Copy, Download, Type
} from 'lucide-react';

export default function WorkspacePage() {
  const router = useRouter();

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── 제품 정보 ──
  const [productName, setProductName]     = useState('');
  const [category, setCategory]           = useState('');
  const [indication, setIndication]       = useState('발열 완화, 두통 및 근육통 완화');
  const [targetAudience, setTargetAudience] = useState('');
  const [ingredient, setIngredient]       = useState(''); // 주성분 (선택)

  // ── 브랜드 가이드 (백엔드 GenerateRequest: core_message, forbidden_words) ──
  const [coreMessage, setCoreMessage]       = useState('과학적 근거 기반 정보 제공');
  const [forbiddenWords, setForbiddenWords] = useState('완치 보장, 부작용 없음, 100% 효과');

  // ── 광고 옵션 ──
  // tone     → 백엔드 GenerateRequest.tone
  // tnm      → 백엔드 GenerateRequest.tnm  (추가 스타일 메모)
  // length   → 백엔드 GenerateRequest.length
  // purpose  → 백엔드 GenerateRequest.purpose
  // channels → 백엔드 GenerateRequest.channel (list)
  const [tone, setTone]       = useState('신뢰감 있는');
  const [tnm, setTnm]         = useState('');
  const [length, setLength]   = useState('기본 설정');
  const [purpose, setPurpose] = useState('전환 유도');
  const [channels, setChannels] = useState<string[]>(['blog', 'instagram', 'facebook']);

  // 채널 토글
  const toggleChannel = (ch: string) => {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  // ── 생성 버튼 핸들러 ──
  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 필수값 기본 처리
    const pName      = productName.trim()    || '타이레놀정 500mg';
    const pFeatures  = `${category ? `[${category}] ` : ''}${indication.trim()}`.trim();
    const pAudience  = targetAudience.trim() || '성인 및 만 12세 이상';
    const pChannels  = channels.length > 0 ? channels : ['blog'];

    // 백엔드 /api/generate/normal 의 GenerateRequest 필드와 1:1 대응
    const params = new URLSearchParams({
      product_name:    pName,
      features:        pFeatures,
      target_audience: pAudience,
      category:        category.trim(),
      ingredient:      ingredient.trim(),
      // 브랜드 가이드
      tone:            tone,
      core_message:    coreMessage,
      forbidden_words: forbiddenWords,
      tnm:             tnm,
      // 옵션
      length:          length,
      purpose:         purpose,
    });

    // channel은 여러 개이므로 반복 append
    pChannels.forEach(ch => params.append('channel', ch));

    router.push(`/workspace/result?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleGenerate}
      className="relative flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden"
    >
      
      {/* ── [1] 왼쪽 사이드바 ── */}
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
              <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-semibold cursor-default">
                <Zap size={18} className="animate-pulse" /> Generating
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 rounded-lg transition cursor-pointer">
                <FileText size={18} /> Ready
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 rounded-lg transition cursor-pointer">
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

      {/* ── [2] 중앙 섹션 (제품 정보 입력) ── */}
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
                onClick={() => alert('CSV 업로드 기능은 현재 개발 중입니다.')}
                className="px-4 py-1.5 text-slate-500 text-sm font-medium hover:text-slate-700 transition"
              >
                CSV 입력
              </button>
            </div>
          </div>

          {/* 제품 정보 그리드 */}
          <div className="grid grid-cols-2 gap-6 text-left">

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">의약품명*</label>
              <input
                type="text"
                placeholder="예: 타이레놀"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">카테고리*</label>
              <input
                type="text"
                placeholder="예: 해열·진통"
                value={category}
                onChange={e => setCategory(e.target.value)}
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
                type="text"
                value={indication}
                onChange={e => setIndication(e.target.value)}
                placeholder="예: 발열 완화, 두통 및 근육통 완화"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition text-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">타겟 고객*</label>
              <input
                type="text"
                placeholder="예: 성인 및 만 12세 이상"
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">(선택) 주성분</label>
              <input
                type="text"
                placeholder="예: 아세트아미노펜 500mg"
                value={ingredient}
                onChange={e => setIngredient(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* 브랜드 가이드 — 편집 가능 */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 text-left">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 tracking-tight">
              <Settings2 size={16} /> TEAM BRAND GUIDE
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">기본 톤</p>
                {/* 오른쪽 광고 옵션의 톤앤매너 선택값을 그대로 표시 (읽기 전용) */}
                <p className="font-medium text-slate-700">{tone}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">핵심 메시지 <span className="text-blue-400 normal-case">(편집 가능)</span></p>
                <input
                  type="text"
                  value={coreMessage}
                  onChange={e => setCoreMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:border-blue-400 outline-none transition"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <p className="text-[11px] font-bold text-red-400 uppercase mb-1">금지 표현 <span className="text-blue-400 normal-case">(편집 가능, 쉼표로 구분)</span></p>
                <input
                  type="text"
                  value={forbiddenWords}
                  onChange={e => setForbiddenWords(e.target.value)}
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

      {/* ── [3] 오른쪽 섹션 (광고 옵션) ── */}
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

          {/* 채널 선택 */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">생성 채널*</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'blog',      label: 'Blog',      icon: <FileText size={24} /> },
                { id: 'instagram', label: 'Instagram', icon: <Camera size={24} /> },
                { id: 'facebook',  label: 'Facebook',  icon: <Share2 size={24} /> },
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleChannel(id)}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition ${
                    channels.includes(id)
                      ? 'bg-white border-2 border-blue-500 text-blue-600 shadow-md'
                      : 'bg-white border border-slate-200 text-slate-400'
                  }`}
                >
                  {icon}
                  <span className="text-xs font-bold uppercase">{label}</span>
                </button>
              ))}
            </div>
            {channels.length === 0 && (
              <p className="text-xs text-red-400 font-medium">채널을 1개 이상 선택해주세요.</p>
            )}
          </div>

          {/* 옵션 선택 */}
          <div className="space-y-5">

            {/* 톤앤매너 — 백엔드 tone 필드 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Type size={14} /> 톤앤매너
              </label>
              <div className="relative">
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value)}
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

            {/* 길이 + 목적 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">길이</label>
                <div className="relative">
                  <select
                    value={length}
                    onChange={e => setLength(e.target.value)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-500 appearance-none transition cursor-pointer"
                  >
                    {/* value가 generate.py _build_length_instruction의 키워드와 매칭되어야 함 */}
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
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-500 appearance-none transition cursor-pointer"
                  >
                    {/* value가 generate.py _build_purpose_instruction의 키워드와 매칭되어야 함 */}
                    <option value="전환 유도">🎯 구매/전환 유도</option>
                    <option value="정보 전달">💡 정보 전달·신뢰</option>
                    <option value="바이럴 홍보">🔥 공감·바이럴 홍보</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 추가 스타일 메모 — 백엔드 tnm 필드 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">추가 스타일 메모 <span className="text-slate-400 font-normal">(선택)</span></label>
              <input
                type="text"
                value={tnm}
                onChange={e => setTnm(e.target.value)}
                placeholder="예: MZ 감성, 구어체 위주, 의사가 추천하는 느낌"
                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* 미리보기 영역 */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-200 flex items-center justify-center border border-slate-200 shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
            <div className="relative text-center text-white space-y-2">
              <div className="flex justify-center"><Zap size={24} className="text-blue-400 fill-blue-400" /></div>
              <p className="text-[11px] font-medium tracking-wide">
                Bioverse AI가 의약품 광고 문구 생성을 준비 중입니다.
              </p>
            </div>
          </div>
        </div>

        {/* 생성 버튼 */}
        <button
          type="submit"
          disabled={channels.length === 0}
          className="mt-6 w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition transform active:scale-[0.98]"
        >
          <Play size={20} fill="white" /> 광고 문구 생성
        </button>
      </section>

      {/* ── CSV 업로드 모달 ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-50">
              <h3 className="text-lg font-bold text-slate-800">내보내기 설정</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-8 text-left">
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">내보내기 범위</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">전체 상품</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer opacity-40">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                    <span className="text-sm font-bold text-slate-500">선택 상품</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">파일 형식</p>
                  <div className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-sm font-bold text-slate-700">
                    CSV <ChevronDown size={16} />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">인코딩</p>
                  <div className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-sm font-bold text-slate-700">
                    UTF-8 <ChevronDown size={16} />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">파일명 설정</p>
                <div className="relative">
                  <input
                    type="text"
                    defaultValue="pharma_ad_2026"
                    className="w-full p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm font-bold text-blue-900 outline-none"
                  />
                  <span className="absolute right-4 top-4 text-xs font-bold text-blue-300">.csv</span>
                </div>
              </div>
            </div>
            <div className="p-8 pt-0 space-y-3">
              <button
                type="button"
                onClick={() => alert('다운로드 기능은 현재 개발 중입니다.')}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
              >
                <Download size={18} /> 다운로드
              </button>
              <div className="flex gap-3">
                <button type="button" className="flex-1 py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100">
                  <Copy size={16} /> 복사
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-100 text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-50">
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
