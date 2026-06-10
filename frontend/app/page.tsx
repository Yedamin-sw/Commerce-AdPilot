'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Clock, Share2, MousePointerClick } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [errorText, setErrorText] = useState('');

  const samplePayload = {
    brand_guide: {
      default_tone: '신뢰도 높고 과학적 근거 기반의 전문적 톤',
      core_messages: ['임상 근거 기반 정보 전달'],
      required_phrases: ['의료진과 상담이 필요합니다'],
      banned_phrases: ['완치 보장', '부작용 없음'],
      mandatory_disclaimer:
        '본 정보는 일반적인 의약 정보이며, 개인별 적용은 의료진의 판단이 필요합니다.',
    },
    compliance_guide: {
      must_include: ['부작용 또는 주의사항 고지'],
      must_avoid: ['과장/단정 표현'],
      regulatory_notes: '의약품 광고 및 표시 관련 법규를 준수',
    },
    channel_selection: ['blog', 'instagram', 'facebook'],
    tone_mode: 'medical_professional',
    channel_limits: {
      blog_max_chars: 500,
      instagram_max_chars: 220,
      facebook_max_chars: 320,
    },
    products: [
      {
        product_id: 'DRUG001',
        name: '예시 의약품명',
        indication: '허가된 적응증',
        clinical_data_summary: '입력된 임상 근거 요약',
        adverse_reactions: ['주요 이상반응 또는 주의사항'],
        contraindications: ['금기사항'],
        target_audience: '환자',
        extra_context: '강조할 포인트',
        mandatory_safety_statement: '반드시 포함해야 하는 안전성 문구',
      },
    ],
  };

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

  async function handleRunPrompt() {
    console.log('버튼 클릭됨!');
    setIsLoading(true);
    setErrorText('');
    setResponseText('');

    try {
      console.log("API 호출 시작");
      const response = await fetch(`${backendUrl}/api/generate/multichannel-copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(samplePayload),
      });
      console.log("상태 코드: ",response.status);

      const data = await response.json();

      console.log("응답 데이터:", data);

      if (!response.ok) {
        console.error("에러 상세:", data);

        throw new Error(
          JSON.stringify(data, null, 2)
        );
      }

      setResponseText(JSON.stringify(data, null, 2));
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900">
      
      {/* --- [1] 네비게이션 바 --- */}
      <nav className="flex justify-between items-center px-10 py-6 border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="text-xl font-bold text-slate-900 tracking-tight">
          <span className="text-blue-600">Bioverse</span>
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
          <Zap size={14} fill="currentColor" /> AI Pharmaceutical Advertising Platform
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.2]">
          의약품 정보 한 번 입력으로<br />
          <span className="text-blue-600 font-black">
            광고 문구를 자동 생성
          </span>
        </h1>
        
        <p className="max-w-xl text-lg text-slate-400 font-medium mb-10 leading-relaxed">
          Bioverse는 의약품 정보를 기반으로<br />
          광고 규정을 고려한 문구를 생성합니다.
        </p>

        <Link
          href="/workspace/input"
          className="px-10 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition shadow-xl shadow-blue-200 hover:-translate-y-1 transform"
        >
          지금 생성 시작하기
        </Link>
        
      </section>

      {/* --- [3] 왜 Bioverse인가요? (Feature Section) --- */}
      <section className="py-32 bg-slate-50/50 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-4">Core Benefits</p>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-16">왜 Bioverse인가요?</h2>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            {/* 카드 1 */}
            <div className="p-10 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                <Clock size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4">의약품 광고 문안 작성 시간 단축</h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                의약품 정보 입력만으로 AI가 광고 초안을 생성하여 업무 시간을 크게 절감합니다.
              </p>
            </div>

            {/* 카드 2 */}
            <div className="p-10 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                <Share2 size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4">채널별 맞춤 광고 문구 생성</h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                블로그, SNS, 상세페이지 등 채널 특성에 맞는 광고 문안을 자동 생성합니다.
              </p>
            </div>

            {/* 카드 3 (긴 가로형) */}
            <div className="md:col-span-2 p-10 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-12 group">
              <div className="flex-1">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                  <MousePointerClick size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">광고 규정 검토 지원</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  생성된 카피는 대시보드 내에서 즉시 편집하고 클릭만으로 복사하거나 CSV 형식으로 내보낼 수 있습니다. 복잡한 툴 간 전환 없이 빠르게 마무리하세요.
                </p>
              </div>
              <div className="w-full md:w-80 aspect-square bg-slate-900 rounded-[28px] overflow-hidden flex items-center justify-center">
                 <div className="text-blue-500 font-black text-4xl animate-pulse">Bioverse</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- [4] 하단 CTA 섹션 --- */}
      <section className="py-32 text-center px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">마케팅의 새로운 스탠다드, Bioverse</h2>
        <p className="text-slate-400 font-medium mb-12">AI 기반 의약품 광고 생성 플랫폼을 경험해보세요.</p>
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
            <div className="text-lg font-bold text-slate-800 italic">Bioverse</div>
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
                <li>support@Bioverse.com</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
           <span>© 2026 Bioverse. All rights reserved.</span>
           <div className="flex gap-4">
              <span>Privacy</span>
              <span>Terms</span>
           </div>
        </div>
      </footer>
    </div>
  );
}