'use client';

import React from 'react';
import Link from 'next/link'; // 나중에 페이지 이동을 위해 미리 추가!
import { 
  LayoutGrid, 
  Play, 
  FileText, 
  CheckCircle2, 
  Upload, 
  History, 
  Plus, 
  ChevronDown, 
  Zap, 
  Settings2,
  Camera,
  Type,
  Share2 // Facebook 대신 쓸 비슷한 아이콘이에요!
} from 'lucide-react';

export default function WorkspacePage() {
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* --- [1] 왼쪽 사이드바 --- */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-bold text-slate-800">Commerce AdPilot</h1>
        </div>

        <nav className="flex-1 space-y-8">
          <div>
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Workflow Status</h2>
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-semibold">
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
          <button className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition">
            <Upload size={18} /> CSV Upload
          </button>
          <button className="flex items-center justify-center gap-2 w-full py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition">
            <History size={18} /> History
          </button>
        </div>
      </aside>

      {/* --- [2] 중앙 섹션 (Campaign Input) --- */}
      <section className="flex-1 bg-white overflow-y-auto border-r border-slate-200 p-10">
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Campaign Input</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-sm font-bold text-blue-600 transition">수기 입력</button>
              <button className="px-4 py-1.5 text-slate-500 text-sm font-medium hover:text-slate-700 transition">CSV 입력</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">상품명*</label>
              <input type="text" placeholder="예: 프리미엄 오가닉 배게" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">카테고리*</label>
              <input type="text" placeholder="생활/가전" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition" />
            </div>
            <div className="col-span-2 space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-bold text-slate-700">주요 특징*</label>
                <button className="text-blue-500 text-xs font-bold hover:underline flex items-center gap-1"><Plus size={14}/>추가</button>
              </div>
              <div className="space-y-3">
                <input type="text" value="1. 100% 천연 라텍스 사용" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-600" readOnly />
                <input type="text" value="2. 경추 보호 C자형 곡선 설계" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-600" readOnly />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">타겟 고객*</label>
              <input type="text" placeholder="3040 직장인, 불면증 환자" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">(선택) 가격대</label>
              <input type="text" placeholder="89,000원" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition" />
            </div>
          </div>

          {/* 브랜드 가이드 섹션 */}
          <div className="mt-12 p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
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
                <p className="font-medium text-slate-700">삶의 질을 높이는 휴식</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-red-400 uppercase mb-1">금지 표현</p>
                <p className="font-medium text-red-500">무조건, 최고, 당장</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">필수 표현</p>
                <p className="font-medium text-slate-700">안전성 인증, 무료배송</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- [3] 오른쪽 섹션 (Options & Preview) --- */}
      <section className="w-[420px] bg-slate-50 p-10 flex flex-col">
        <div className="flex-1 space-y-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Generation Options</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 shadow-sm transition">KR | EN</button>
              <button className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-[11px] font-bold hover:bg-slate-700 transition">바로 시작</button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700">생성 채널*</label>
            <div className="grid grid-cols-3 gap-3">
              <button className="flex flex-col items-center justify-center gap-3 p-4 bg-white border-2 border-blue-500 rounded-xl text-blue-600 shadow-md transition">
                <FileText size={24} /> <span className="text-xs font-bold uppercase">Blog</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-3 p-4 bg-white border border-slate-200 rounded-xl text-slate-400 hover:border-slate-300 transition">
                <Camera size={24} /> <span className="text-xs font-bold uppercase text-slate-400">Instagram</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-3 p-4 bg-white border border-slate-200 rounded-xl text-slate-400 hover:border-slate-300 transition">
                <Share2 size={24} /> <span className="text-xs font-bold uppercase text-slate-400">Facebook</span>
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

          {/* AI 프리뷰 이미지 박스 */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-200 flex items-center justify-center group border border-slate-200 shadow-inner">
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
             <div className="relative text-center text-white space-y-2">
               <div className="flex justify-center"><Zap size={24} className="text-blue-400 fill-blue-400" /></div>
               <p className="text-[11px] font-medium tracking-wide">최적화된 AI 엔진이 대기 중입니다.</p>
             </div>
          </div>
        </div>

        <button className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition transform active:scale-[0.98]">
          <Play size={20} fill="white" /> 생성하기
        </button>
      </section>
    </div>
  );
}