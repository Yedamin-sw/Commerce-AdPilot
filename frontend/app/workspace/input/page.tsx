'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LayoutGrid, Play, FileText, CheckCircle2, Upload, History, 
  Plus, ChevronDown, Zap, Settings2, Camera, Type, Share2, X, Check, Copy, Download
} from 'lucide-react';

export default function WorkspacePage() {
  const router = useRouter();

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- [A] 유저 입력 데이터 상태 관리 정의 ---
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [indication, setIndication] = useState('발열 완화, 두통 및 근육통 완화'); // 기본값 유지
  const [targetAudience, setTargetAudience] = useState('');
  const [channel, setChannel] = useState('blog');

  // --- [B] 생성하기 버튼 클릭 시 데이터 토스 및 페이지 이동 핸들러 ---
  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // 폼 제출로 인한 새로고침 방지

    // 필수 입력값 검증 (방어 코드)
    const pName = productName.trim() || '타이레놀정 500mg';
    const pIndication = `${category ? `[${category}] ` : ''}${indication.trim()}`.trim();
    const pAudience = targetAudience.trim() || '성인 및 만 12세 이상';

    // 주소창 뒤에 데이터를 얹어서 result 페이지로 라우팅 이동
    const queryString = `?product_name=${encodeURIComponent(pName)}&indication=${encodeURIComponent(pIndication)}&target_audience=${encodeURIComponent(pAudience)}&channel=${encodeURIComponent(channel)}`;
    
    // 결과 페이지로 이동
    router.push(`/workspace/result${queryString}`);
  };

  return (
    // 폼 태그로 전체를 감싸서 어떤 생성 버튼을 누르든 이벤트가 발생하도록 설정
    <form onSubmit={handleGenerate} className="relative flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      
      {/* --- [1] 왼쪽 사이드바 --- */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6">
        <div className="mb-10 px-2">
          <Link href="/"><h1 className="text-xl font-bold text-slate-800">Bioverse</h1></Link>
        </div>

        <nav className="flex-1 space-y-8">
          <div>
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Workflow Status</h2>
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
            type="button" // 폼 내부 버튼이므로 type="button"을 명시해야 제출되지 않음
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

      {/* --- [2] 중앙 섹션 (Campaign Input) --- */}
      <section className="flex-1 bg-white overflow-y-auto border-r border-slate-200 p-10">
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 text-left">Pharmaceutical Advertisement Input</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button type="button" className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-sm font-bold text-blue-600 transition">수기 입력</button>
              <button 
                type="button"
                onClick={() => alert('CSV 업로드 기능은 현재 개발 중입니다.')}
                className="px-4 py-1.5 text-slate-500 text-sm font-medium hover:text-slate-700 transition"
              >
                CSV 입력
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-left">
            {/* 의약품명 입력 바인딩 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">의약품명*</label>
              <input 
                type="text" 
                placeholder="예: 타이레놀" 
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>
            
            {/* 카테고리 입력 바인딩 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">카테고리*</label>
              <input 
                type="text" 
                placeholder="예 : 해열·진통" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition" 
              />
            </div>

            {/* 주요 효능 및 특징 바인딩 */}
            <div className="col-span-2 space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-bold text-slate-700 ml-1">주요 효능 및 특징*</label>
                <button type="button" className="text-blue-500 text-xs font-bold hover:underline flex items-center gap-1"><Plus size={14}/>추가</button>
              </div>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={indication} 
                  onChange={(e) => setIndication(e.target.value)}
                  placeholder="예: 발열 완화, 두통 및 근육통 완화"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition text-slate-700" 
                />
              </div>
            </div>

            {/* 타겟 고객 입력 바인딩 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">타겟 고객*</label>
              <input 
                type="text" 
                placeholder="성인 및 만 12세 이상" 
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">(선택) 주성분</label>
              <input type="text" placeholder="아세트아미노펜 500mg" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition" />
            </div>
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 text-left">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 tracking-tight">
              <Settings2 size={16} /> TEAM BRAND GUIDE
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">기본 톤</p>
                <p className="font-medium text-slate-700">신뢰감 있는, 따뜻한</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">핵심 메시지</p>
                <p className="font-medium text-slate-700">과학적 근거 기반 정보 제공</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-red-400 uppercase mb-1">금지 표현</p>
                <p className="font-medium text-red-500">완치 보장, 부작용 없음, 100% 효과</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">필수 표현</p>
                <p className="font-medium text-slate-700">의료진과 상담이 필요합니다</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- [3] 오른쪽 섹션 (Options & Preview) --- */}
      <section className="w-[420px] bg-slate-50 p-10 flex flex-col">
        <div className="flex-1 space-y-10 text-left">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Advertisement Settings</h2>
            <div className="flex gap-2">
              <button type="button" className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 shadow-sm transition">KR | EN</button>
              <button
                type="submit" // 🛠️ 수정포인트: 주석을 풀고 서브밋 타입으로 교체
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-[11px] font-bold hover:bg-slate-700 transition"
              >
                바로 시작
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700">생성 채널*</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setChannel('blog')}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition ${
                  channel === 'blog' ? 'bg-white border-2 border-blue-500 text-blue-600 shadow-md' : 'bg-white border border-slate-200 text-slate-400'
                }`}
              >
                <FileText size={24} />
                <span className="text-xs font-bold uppercase">Blog</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('instagram')}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition ${
                  channel === 'instagram' ? 'bg-white border-2 border-blue-500 text-blue-600 shadow-md' : 'bg-white border border-slate-200 text-slate-400'
                }`}
              >
                <Camera size={24} />
                <span className="text-xs font-bold uppercase">Instagram</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('facebook')}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition ${
                  channel === 'facebook' ? 'bg-white border-2 border-blue-500 text-blue-600 shadow-md' : 'bg-white border border-slate-200 text-slate-400'
                }`}
              >
                <Share2 size={24} />
                <span className="text-xs font-bold uppercase">Facebook</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-sm font-bold text-slate-700 flex justify-between">톤앤매너 <ChevronDown size={14} className="text-slate-400"/></label>
              <div className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 flex justify-between items-center">
                <span className="flex items-center gap-2"><Type size={16}/> (Default)</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">길이</label>
                <div className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 flex justify-between items-center italic underline">(Default) <ChevronDown size={14}/></div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">목적</label>
                <div className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 flex justify-between items-center italic underline">(Conversion) <ChevronDown size={14}/></div>
              </div>
            </div>
          </div>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-200 flex items-center justify-center group border border-slate-200 shadow-inner">
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
             <div className="relative text-center text-white space-y-2">
               <div className="flex justify-center"><Zap size={24} className="text-blue-400 fill-blue-400" /></div>
               <p className="text-[11px] font-medium tracking-wide">Bioverse AI가 의약품 광고 문구 생성을 준비 중입니다.</p>
             </div>
          </div>
        </div>

        {/* 🛠️ 수정포인트: 주석을 해제하고 type="submit"을 명시해 폼 제출 이벤트를 실행시킵니다. */}
        <button 
          type="submit"
          className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition transform active:scale-[0.98]"
        >
          <Play size={20} fill="white" /> 광고 문구 생성
        </button>
      </section>

      {/* --- [내보내기 모달 레이어] --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-50">
              <h3 className="text-lg font-bold text-slate-800">내보내기 설정</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-8 text-left">
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">내보내기 범위</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center"><div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div></div>
                    <span className="text-sm font-bold text-slate-700">전체 상품</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer opacity-40">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                    <span className="text-sm font-bold text-slate-500">선택 상품</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">파일 형식</p>
                  <div className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-sm font-bold text-slate-700">CSV <ChevronDown size={16} /></div>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">인코딩</p>
                  <div className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-sm font-bold text-slate-700">UTF-8 <ChevronDown size={16} /></div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">파일명 설정</p>
                <div className="relative">
                  <input type="text" defaultValue="campaign_2026_spring_copy" className="w-full p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm font-bold text-blue-900 outline-none" />
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