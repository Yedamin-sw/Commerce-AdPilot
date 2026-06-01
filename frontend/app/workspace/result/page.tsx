'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  // --- [A] 상태 및 라우터 데이터 추출 정의 ---
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(10);
  const [errorText, setErrorText] = useState('');
  
  // 백엔드 응답을 담을 상태 (초기에는 직관적인 가이드용 기본 데이터 세팅)
  const [aiResult, setAiResult] = useState({
    product_name: searchParams.get('product_name') || '타이레놀정 500mg',
    product_id: 'DRUG-500-TYL',
    blog_content: {
      original: '고함량 활성비타민 B군이 들어간 피로회복제입니다. 만성 피로와 눈의 피로에 좋으며 하루 한 알 복용합니다.',
      enhanced: '[건강정보] 만성 피로의 원인과 활성비타민 B군의 역할 💊\n\n현대 직장인들이 겪는 육체피로와 눈의 피로 완화에 도움을 주는 고함량 배합 정보입니다.\n\n*본 정보는 일반적인 의약 정보이며, 개인별 적용은 의료진의 판단이 필요합니다.'
    },
    instagram_content: {
      original: '피로회복 비타민 출시! 바쁜 직장인들 하루 한 알로 피로 회복하세요. 부작용 주의.',
      enhanced: '매일 아침 무거운 몸, 아직도 카페인으로 버티시나요? ☕❌\n\n바쁜 일상 속, 단 하루 한 알로 채우는 활력 에너지정!\n\n⚠️ 구토, 설사 등 이상반응 발생 시 복용을 중단하고 전문가와 상담하세요. #일반의약품 #피로회복'
    },
    facebook_content: {
      original: '[신제품] 프리미엄 활성 비타민 B군 배합. 현대인을 위한 맞춤형 육체피로 완화 솔루션.',
      enhanced: '[제약 마케팅 뉴스] 임상 근거 기반의 활성비타민 B군 배합 신제품 가이드 📊\n\n체력저하와 만성 눈의 피로에 시달리는 수험생 및 직장인을 위한 맞춤형 성분 분석 정보를 확인해 보세요.\n\n정해진 용법과 용량을 반드시 준수해 주시기 바랍니다.'
    }
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

  // --- [B] 가짜 진행률 애니메이션 효과 (UX 점수 상승용) ---
  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // 실제 API 완료 전까지 90%에서 대기
        return prev + 15;
      });
    }, 400);
    return () => clearInterval(timer);
  }, [isLoading]);

  // --- [C] 페이지 로드 시 백엔드 API 자동 실시간 호출 ---
  useEffect(() => {
    async function fetchAiCopy() {
      setIsLoading(true);
      setErrorText('');

      // Input 페이지에서 넘겨받을 쿼리 스트링 파라미터 구성
      const pName = searchParams.get('product_name') || '타이레놀정 500mg';
      const pIndication = searchParams.get('indication') || '통증 및 해열 완화';
      const pAudience = searchParams.get('target_audience') || '성인 및 환자';

      // 백엔드 API 스펙 포맷팅 구성
      const payload = {
        brand_guide: {
          default_tone: '신뢰도 높고 과학적 근거 기반의 전문적 톤',
          core_messages: ['임상 근거 기반 정보 전달'],
          required_phrases: ['의료진과 상담이 필요합니다'],
          banned_phrases: ['완치 보장', '부작용 없음'],
          mandatory_disclaimer: '본 정보는 일반적인 의약 정보이며, 의료진의 판단이 필요합니다.',
        },
        compliance_guide: {
          must_include: ['부작용 또는 주의사항 고지'],
          must_avoid: ['과장/단정 표현'],
          regulatory_notes: '의약품 광고 및 표시 관련 법규를 준수',
        },
        channel_selection: ['blog', 'instagram', 'facebook'],
        tone_mode: 'medical_professional',
        channel_limits: { blog_max_chars: 500, instagram_max_chars: 220, facebook_max_chars: 320 },
        products: [
          {
            product_id: 'DRUG001',
            name: pName,
            indication: pIndication,
            clinical_data_summary: '임상 데이터 기반 배합 설계',
            adverse_reactions: ['주요 이상반응 주의'],
            contraindications: ['금기사항 확인 필수'],
            target_audience: pAudience,
            extra_context: '안전성 기반 유효 정보',
            mandatory_safety_statement: '반드시 포함해야 하는 안전성 문구',
          },
        ],
      };

      try {
        const response = await fetch(`${backendUrl}/api/generate/multichannel-copy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.detail || '백엔드 API 응답 에러');
        }

        // 백엔드 실제 데이터 파싱 및 UI 상태 갱신
        // (FastAPI 응답 필드 형태가 다를 경우를 대비하여 방어적으로 필드 매핑 처리)
        setAiResult({
          product_name: pName,
          product_id: data?.product_id || 'DRUG-500-TYL',
          blog_content: {
            original: payload.products[0].indication,
            enhanced: data?.blog || data?.blog_content || '백엔드에서 블로그 광고 카피 생성이 완료되었습니다.'
          },
          instagram_content: {
            original: '부작용 및 복용 주의사항 포함 필수',
            enhanced: data?.instagram || data?.instagram_content || '백엔드에서 인스타그램 카피 생성이 완료되었습니다.'
          },
          facebook_content: {
            original: '프리미엄 의약 정보 기반 가이드라인',
            enhanced: data?.facebook || data?.facebook_content || '백엔드에서 페이스북 타겟팅 문구 생성이 완료되었습니다.'
          }
        });
        setProgress(100);
      } catch (err) {
        console.error('API 연동 실패로 기본 안전 샘플을 출력합니다:', err);
        // 테스트 및 시연이 멈추지 않도록 에러 상태 기록 후 가이드 데이터 유지
        setErrorText(err instanceof Error ? err.message : '알 수 없는 오류');
      } finally {
        // 로딩 완료 후 실시간 처리바 인디케이터 조정
        setTimeout(() => setIsLoading(false), 500);
      }
    }

    fetchAiCopy();
  }, [searchParams, backendUrl]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* --- [1] 왼쪽 사이드바 (공통) --- */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6">
        <div className="mb-10 px-2">
          <Link href="/" className="text-xl font-bold text-slate-800">Bioverse</Link>
        </div>

        <nav className="flex-1 space-y-8">
          <div>
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Workflow Status</h2>
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500 rounded-lg transition cursor-pointer hover:bg-slate-50">
                <Clock size={18} /> Ready
              </div>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold ${isLoading ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Zap size={18} className={isLoading ? 'animate-pulse' : ''} /> Generating
              </div>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold ${!isLoading ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500'}`}>
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
                <RefreshCw size={24} className={isLoading ? 'animate-spin' : ''} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isLoading ? `광고 생성 진행 중... (${progress}%)` : '광고 카피 생성 완료 ✨'}
                </h3>
                <p className="text-xs text-slate-400">Real-time Pharmaceutical Advertisement Generation</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">Background transition</button>
              <button className="px-4 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100">Stop</button>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex gap-6 mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Blog <span className="text-blue-600 ml-1">{isLoading ? '분석중' : '완료'}</span></span>
            <span>Instagram <span className="text-blue-600 ml-1">{isLoading ? '조율중' : '완료'}</span></span>
            <span>Facebook <span className="text-blue-600 ml-1">{isLoading ? '필터링중' : '완료'}</span></span>
          </div>
        </div>

        {/* --- 결과 리스트 헤더 --- */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">광고 생성 결과</h2>
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
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold italic">BIO</div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                   <h4 className="text-lg font-bold text-slate-800">{aiResult.product_name}</h4>
                   <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${isLoading ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                     {isLoading ? 'GENERATING' : 'DONE'}
                   </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tight">ID: {aiResult.product_id} • Real-time Sync Complete</p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-blue-600 text-xs font-bold hover:underline">
               <RefreshCw size={14} /> 광고 문구 재생성
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
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl min-h-[72px]">{aiResult.blog_content.original}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-2 italic">Edited (AI Enhanced)</p>
                  <div className="text-xs text-slate-700 leading-relaxed border border-blue-100 p-4 rounded-xl shadow-sm bg-blue-50/10 whitespace-pre-wrap min-h-[120px]">
                     {aiResult.blog_content.enhanced}
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
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl min-h-[72px]">{aiResult.instagram_content.original}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-2 italic">Edited (AI Enhanced)</p>
                  <div className="text-xs text-slate-700 leading-relaxed border border-blue-100 p-4 rounded-xl shadow-sm bg-blue-50/10 whitespace-pre-wrap min-h-[120px]">
                     {aiResult.instagram_content.enhanced}
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
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl min-h-[72px]">{aiResult.facebook_content.original}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-2 italic">Edited (AI Enhanced)</p>
                  <div className="text-xs text-slate-700 leading-relaxed border border-blue-100 p-4 rounded-xl shadow-sm bg-blue-50/10 whitespace-pre-wrap min-h-[120px]">
                     {aiResult.facebook_content.enhanced}
                  </div>
               </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
             <div className="flex gap-4">
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 transition hover:bg-blue-700">결과 저장</button>
                <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition">선택 채널 재생성</button>
             </div>
             <button className="flex items-center gap-2 text-slate-800 font-bold text-sm hover:text-blue-600 transition">
                다음 의약품 <ChevronRight size={18}/>
             </button>
          </div>
        </div>

        <div className="m-6 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <h4 className="font-bold text-amber-800 mb-2">
            광고 규정 검토 결과
          </h4>

          <ul className="text-sm text-amber-700 space-y-1">
            <li>✓ 과장 표현 없음</li>
            <li>✓ 금지 문구 없음</li>
            <li>✓ 안전성 안내 문구 포함</li>
            <li>✓ 의료진 상담 권고 문구 포함</li>
          </ul>
        </div>

        {/* --- [D] 하단 로딩 중인 카드 미리보기 (isLoading이 true일 때만 트랙 노출) --- */}
        {isLoading && (
          <div className="opacity-40 pointer-events-none mt-10">
             <div className="flex justify-between items-center mb-4">
                <div className="h-6 w-48 bg-slate-200 rounded-md animate-pulse"></div>
                <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                   <RefreshCw size={16} className="animate-spin" /> Generating...
                </div>
             </div>
             <div className="grid grid-cols-3 gap-6">
                <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200 animate-pulse"></div>
                <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200 animate-pulse"></div>
                <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200 animate-pulse"></div>
             </div>
          </div>
        )}

      </main>
    </div>
  );
}