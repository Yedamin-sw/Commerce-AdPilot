'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  CheckCircle2, 
  Upload, 
  History, 
  Zap, 
  RefreshCw, 
  Download, 
  Copy, 
  ChevronRight,
  Search,
  MoreHorizontal,
  Camera,
  Share2,
  Clock
} from 'lucide-react';

export default function ResultPage() {
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* --- [1] 왼쪽 사이드바 (공통) --- */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6">
        <div className="mb-10 px-2">
          <Link href="/" className="text-xl font-bold text-slate-800">Commerce AdPilot</Link>
        </div>

        <nav className="flex-1 space-y-8">
          <div>
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Workflow Status</h2>
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500 rounded-lg transition cursor-pointer hover:bg-slate-50">
                <Clock size={18} /> Ready
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-semibold">
                <Zap size={18} className="animate-pulse" /> Generating
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500 rounded-lg transition cursor-pointer hover:bg-slate-50">
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

      {/* --- [2] 메인 콘텐츠 구역 --- */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
        
        {/* 상단 헤더 (언어 설정 및 바로 시작) */}
        <div className="flex justify-end gap-4 mb-6">
          <span className="text-sm text-slate-400 font-medium py-2">KR | EN</span>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md">바로 시작</button>
        </div>

        {/* --- 생성 진행 상태 바 --- */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <RefreshCw size={24} className="animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">생성 진행 중... 78/200</h3>
                <p className="text-xs text-slate-400">Real-time AI Content Architecture</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">Background transition</button>
              <button className="px-4 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100">Stop</button>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '39%' }}></div>
          </div>
          <div className="flex gap-6 mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Blog <span className="text-blue-600 ml-1">62</span></span>
            <span>Instagram <span className="text-blue-600 ml-1">58</span></span>
            <span>Facebook <span className="text-blue-600 ml-1">54</span></span>
          </div>
        </div>

        {/* --- 결과 리스트 헤더 --- */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">생성 결과 (총 200건)</h2>
            <p className="text-sm text-slate-400 leading-tight">Review and edit your generated ad copies<br/>across multiple channels.</p>
          </div>
          <div className="flex gap-3 items-center">
             <div className="flex gap-2">
                <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none"><option>전체</option></select>
                <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none"><option>채널</option></select>
                <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none"><option>완료/실패</option></select>
             </div>
             <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input type="text" placeholder="Search product..." className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-xs w-64 outline-none focus:ring-2 ring-blue-500/20" />
             </div>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
           <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition"><Download size={14}/> 전체 내보내기</button>
           <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition"><Copy size={14}/> 전체 복사</button>
        </div>

        {/* --- 결과 카드 --- */}
        <div className="bg-white rounded-3xl border-2 border-blue-500 shadow-xl overflow-hidden mb-10">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-[10px] text-white font-bold italic">IMG</div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                   <h4 className="text-lg font-bold text-slate-800">Premium Wireless Vacuum A100</h4>
                   <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-bold rounded-md">DONE</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tight">ID: PROD-9921-A100 • Updated 2 mins ago</p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-blue-600 text-xs font-bold hover:underline">
               <RefreshCw size={14} /> Regenerate this product
            </button>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {/* BLOG */}
            <div className="p-6 space-y-6">
               <div className="flex justify-between items-center text-slate-800">
                  <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><FileText size={16} className="text-blue-500"/> Blog</h5>
                  <div className="flex gap-2 text-slate-300">
                     <Copy size={14} className="hover:text-blue-500 cursor-pointer"/> <Download size={14} className="hover:text-blue-500 cursor-pointer"/>
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase mb-2">Original Content</p>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl">강력한 흡입력과 가벼운 무게의 무선 청소기 A100입니다. 45분 연속 사용이 가능하며...</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-2 italic">Edited (AI Enhanced)</p>
                  <div className="text-xs text-slate-700 leading-relaxed border border-blue-100 p-4 rounded-xl shadow-sm bg-blue-50/10">
                     압도적인 흡입력, 그럼에도 믿기지 않는 가벼움. 무선 청소기의 새로운 기준 A100.<br/><br/>
                     한 번의 충전으로 집안 곳곳 45분간 빈틈없이...
                  </div>
               </div>
            </div>

            {/* INSTAGRAM */}
            <div className="p-6 space-y-6">
               <div className="flex justify-between items-center text-slate-800">
                  <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><Camera size={16} className="text-pink-500"/> Instagram</h5>
                  <div className="flex gap-2 text-slate-300">
                     <Copy size={14} className="hover:text-blue-500 cursor-pointer"/> <Download size={14} className="hover:text-blue-500 cursor-pointer"/>
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase mb-2">Original Content</p>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl">A100 무선 청소기 출시! 가볍고 강합니다. 화이트 컬러로 예뻐요.</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-2 italic">Edited (AI Enhanced)</p>
                  <div className="text-xs text-slate-700 leading-relaxed border border-blue-100 p-4 rounded-xl shadow-sm bg-blue-50/10">
                     청소기도 인테리어니까 ✨<br/>
                     어디에 두어도 빛나는 A100의 미니멀 디자인.<br/><br/>
                     손목 무리 없는 초경량 바디에 숨겨진 강력한 파워!
                  </div>
               </div>
            </div>

            {/* FACEBOOK */}
            <div className="p-6 space-y-6">
               <div className="flex justify-between items-center text-slate-800">
                  <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><Share2 size={16} className="text-blue-600"/> Facebook</h5>
                  <div className="flex gap-2 text-slate-300">
                     <Copy size={14} className="hover:text-blue-500 cursor-pointer"/> <Download size={14} className="hover:text-blue-500 cursor-pointer"/>
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase mb-2">Original Content</p>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl">[신제품] 프리미엄 무선 청소기 A100. 가볍고 강력한 흡입력을 경험하세요.</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-2 italic">Edited (AI Enhanced)</p>
                  <div className="text-xs text-slate-700 leading-relaxed border border-blue-100 p-4 rounded-xl shadow-sm bg-blue-50/10">
                     [EVENT] 청소가 즐거워지는 마법, A100 런칭 기념 공유 이벤트 🎁<br/><br/>
                     아직도 무거운 청소기로 고생하시나요? 1.2kg 초경량 무게로 가볍게!
                  </div>
               </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
             <div className="flex gap-4">
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 transition hover:bg-blue-700">Save changes</button>
                <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition">Regenerate selected channels</button>
             </div>
             <button className="flex items-center gap-2 text-slate-800 font-bold text-sm hover:text-blue-600 transition">
                Next Product <ChevronRight size={18}/>
             </button>
          </div>
        </div>

        {/* --- 하단 로딩 중인 카드 미리보기 --- */}
        <div className="opacity-40 pointer-events-none">
           <div className="flex justify-between items-center mb-4">
              <div className="h-6 w-48 bg-slate-200 rounded-md animate-pulse"></div>
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                 <RefreshCw size={16} className="animate-spin" /> Generating...
              </div>
           </div>
           <div className="grid grid-cols-3 gap-6">
              <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200"></div>
              <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200"></div>
              <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200"></div>
           </div>
        </div>

      </main>
    </div>
  );
}