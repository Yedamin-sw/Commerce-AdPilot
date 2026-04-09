'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, Clock, Share2, MousePointerClick, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900">
      
      {/* --- [1] 네비게이션 바 --- */}
      <nav className="flex justify-between items-center px-10 py-6 border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="text-xl font-bold text-slate-900 tracking-tight">
          Commerce <span className="text-blue-600">AdPilot</span>
        </div>
        <div className="flex gap-8 items-center text-sm font-semibold">
          <span className="text-slate-400">KR | EN</span>
          <Link 
            href="/workspace/input"
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-100"
          >
            시작하기
          </Link>
        </div>
      </nav>

      {/* --- [2] 히어로 섹션 (Main Hero) --- */}
      <section className="flex flex-col items-center pt-24 pb-16 px-6 text-center">
        <div className="flex items-center gap-2 px-4 py-1.5 mb-8 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
          <Zap size={14} fill="currentColor" /> Next-Gen Ad Copy Generator
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.2]">
          상품 정보 한 번 입력으로<br />
          <span className="text-blue-600 font-black">채널 카피를 동시에 생성</span>
        </h1>
        
        <p className="max-w-xl text-lg text-slate-400 font-medium mb-10 leading-relaxed">
          인공지능 AdPilot이 당신의 마케팅 생산성을<br />
          현재보다 10배 더 높여드립니다.
        </p>

        <Link
          href="/workspace/input"
          className="px-10 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition shadow-xl shadow-blue-200 hover:-translate-y-1 transform"
        >
          지금 생성 시작하기
        </Link>

        {/* 서비스 미리보기 이미지 영역 (피그마의 어두운 대시보드 부분) */}
        <div className="mt-20 w-full max-w-5xl px-4">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-slate-50 aspect-[16/10] bg-[#1E293B] flex flex-col p-8 text-left transition hover:scale-[1.01] duration-500">
             <div className="flex gap-2 mb-10">
               <div className="w-3 h-3 bg-red-400 rounded-full"></div>
               <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
               <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
             </div>
             <div className="space-y-6">
                <div className="h-12 w-1/3 bg-slate-700/50 rounded-lg animate-pulse"></div>
                <div className="h-4 w-1/2 bg-slate-700/30 rounded-lg"></div>
                <div className="grid grid-cols-3 gap-6 mt-10">
                   <div className="h-40 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>
                   <div className="h-40 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>
                   <div className="h-40 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>
                </div>
                <div className="h-16 w-full bg-emerald-500/20 rounded-xl border border-emerald-500/30"></div>
             </div>
             {/* 이미지 중앙에 'AdPilot' 텍스트 등을 배치하면 더 비슷해집니다. */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <span className="text-[120px] font-black text-white italic">AdPilot</span>
             </div>
          </div>
        </div>
      </section>

      {/* --- [3] 왜 AdPilot인가요? (Feature Section) --- */}
      <section className="py-32 bg-slate-50/50 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-4">Core Benefits</p>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-16">왜 AdPilot인가요?</h2>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            {/* 카드 1 */}
            <div className="p-10 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                <Clock size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4">평균 작업시간 1시간 → 10분 수준 단축</h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                반복적인 카피 작성과 문구 수정을 AI가 대신 처리하여 업무 효율을 극대화합니다. 더 중요한 전략에 집중하세요.
              </p>
            </div>

            {/* 카드 2 */}
            <div className="p-10 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                <Share2 size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4">블로그/인스타그램/페이스북 동시 생성</h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                각 채널의 특성에 맞는 톤앤매너를 AI가 자동으로 반영하여 단 한 번의 입력만으로 모든 플랫폼 맞춤형 카피를 완성합니다.
              </p>
            </div>

            {/* 카드 3 (긴 가로형) */}
            <div className="md:col-span-2 p-10 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-12 group">
              <div className="flex-1">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                  <MousePointerClick size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">편집/복사/내보내기 원스톱</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  생성된 카피는 대시보드 내에서 즉시 편집하고 클릭만으로 복사하거나 CSV 형식으로 내보낼 수 있습니다. 복잡한 툴 간 전환 없이 빠르게 마무리하세요.
                </p>
              </div>
              <div className="w-full md:w-80 aspect-square bg-slate-900 rounded-[28px] overflow-hidden flex items-center justify-center">
                 <div className="text-blue-500 font-black text-4xl animate-pulse">AdPilot</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- [4] 하단 CTA 섹션 --- */}
      <section className="py-32 text-center px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">마케팅의 새로운 스탠다드, AdPilot</h2>
        <p className="text-slate-400 font-medium mb-12">지금 무료로 시작하고 10배 더 빠른 성장을 경험하세요.</p>
        <Link
          href="/workspace/input"
          className="px-10 py-5 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:bg-blue-700 transition shadow-2xl shadow-blue-200"
        >
          지금 생성 시작하기
        </Link>
        <p className="mt-6 text-[11px] font-bold text-slate-300 uppercase tracking-widest italic">✨ 겨우 1분 만에 끝나는 가입 절차</p>
      </section>

      {/* --- [5] 푸터 --- */}
      <footer className="bg-white border-t border-slate-100 py-16 px-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div className="space-y-4">
            <div className="text-lg font-bold text-slate-800 italic">Commerce AdPilot</div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs font-medium">
              최신 인공지능 기술을 통해 커머스 마케터들의 생산성을 혁신합니다.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-sm font-semibold">
            <div className="space-y-4">
              <p className="text-slate-800">SERVICE</p>
              <ul className="text-slate-400 space-y-2 font-medium">
                <li>기능 소개</li>
                <li>요금 안내</li>
                <li>성공 사례</li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-slate-800">COMPANY</p>
              <ul className="text-slate-400 space-y-2 font-medium">
                <li>블로그</li>
                <li>개인정보처리방침</li>
                <li>이용약관</li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-slate-800">CONTACT</p>
              <ul className="text-slate-400 space-y-2 font-medium">
                <li>support@adpilot.com</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
           <span>© 2026 Commerce AdPilot. All rights reserved.</span>
           <div className="flex gap-4">
              <span>Privacy</span>
              <span>Terms</span>
           </div>
        </div>
      </footer>
    </div>
  );
}