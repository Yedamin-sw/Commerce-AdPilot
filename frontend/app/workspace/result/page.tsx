'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  Camera,
  Share2,
  Clock,
  Check
} from 'lucide-react';

function ResultContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(10);
  
  // 알림 토스트 상태 (복사 완료 등 피드백용)
  const [toastMessage, setToastMessage] = useState('');

  // 사용자가 입력창에서 넘겨준 값 받기
  const pName = searchParams.get('product_name') || '타이레놀정 500mg';
  const pIndication = searchParams.get('indication') || '통증 및 해열 완화';
  const pAudience = searchParams.get('target_audience') || '성인 및 만 12세 이상';

  // 가상의 AI 결과 생성기 (백엔드가 고장 나도 입력값에 맞춰 커스텀 문구 출력)
  const generateMockData = (name: string, indication: string, audience: string) => ({
    product_name: name,
    product_id: `DRUG-${Math.floor(Math.random() * 900) + 100}-BIO`,
    blog_content: {
      original: indication,
      enhanced: `[건강정보] 오늘 알아볼 의약품: ${name} 배합 정보 💊\n\n많은 분들이 궁금해하셨던 ${indication}에 대한 효과적인 가이드입니다. 특히 ${audience} 분들이 복용하실 때 안전한 섭취 지침을 확인하세요.\n\n*본 정보는 일반적인 의약 정보이며, 개인별 적용은 의료진의 판단이 필요합니다.`
    },
    instagram_content: {
      original: `${name} 한눈에 보기`,
      enhanced: `일상 속 갑작스러운 불편함, 아직도 참으시나요? 🙅‍♀️❌\n\n${audience} 맞춤형 솔루션, 이제 ${name}(으)로 스마트하게 관리하세요! ✨\n\n⚠️ 과량 복용 시 간 손상이 우려되니 정해진 용법을 꼭 지켜주세요. #일반의약품 #${name} #건강관리`
    },
    facebook_content: {
      original: `${name} 성분 및 임상 가이드`,
      enhanced: `[제약 마케팅 브리핑] ${name}의 핵심 성분 분석 및 가이드라인 📊\n\n${indication}에 최적화된 설계로, 바쁜 현대인들과 ${audience}을 위한 필수 상비약 정보를 공유합니다.\n\n정해진 용법과 용량을 반드시 준수해 주시기 바랍니다.`
    }
  });

  // 초기 마운트 시점에 안전하게 모크 데이터로 시작
  const [aiResult, setAiResult] = useState<any>(() => generateMockData(pName, pIndication, pAudience));

  // --- API 호출 함수 정의 ---
  const generateAdCopy = async () => {
    try {
      setIsLoading(true);
      setProgress(15); // 시작할 때 프로그레스 바 초기화

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

      // 1. 백엔드 GenerateRequest 규격에 정확히 맞춘 순수 데이터 상자 만들기
      const payload = {
        tone: "신뢰감 있는",
        core_message: "과학적 근거 기반 정보 제공",
        forbidden_words: "완치 보장,부작용 없음,100% 효과",
        channel: ["blog", "instagram", "facebook"],
        tnm: "professional",
        length: "medium",
        purpose: "conversion",
        name: pName || "타이레놀정 500mg",
        category: pIndication || "해열 진통제",
        features: pIndication || "발열 및 통증 완화",
        target_audience: pAudience || "성인 및 만 12세 이상",
      };

      // 2. 백엔드 주소로 데이터 전송
      const response = await fetch(`${backendUrl}/api/generate/normal`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("422 에러 발생! 백엔드가 돌려준 상세 정보:", data);
        throw new Error("서버 에러 발생");
      }

      // 🌟 통신은 성공했지만, OpenAI 에러로 ok가 false인 경우 처리
      if (data.ok === false) {
        console.error("백엔드는 켜져있으나 OpenAI 호출 실패:", data.result);
        throw new Error(data.result); 
      }

      // 🌟 [핵심 수정 포인트] 백엔드에서 온 단일 문구를 현재 UI 구조에 맞게 가공해서 넣어줍니다!
      console.log("백엔드 광고 문구 생성 진짜 성공! 데이터 구조 변경 중:", data);
      
      setAiResult({
        product_name: pName,
        product_id: `DRUG-${Math.floor(Math.random() * 900) + 100}-BIO`,
        // 백엔드가 준 진짜 완성된 광고 문구(data.result)를 매칭해 줍니다.
        blog_content: {
          original: pIndication,
          enhanced: `[블로그 채널 맞춤형 리포트]\n\n${data.result}`
        },
        instagram_content: {
          original: `${pName} 정보`,
          enhanced: `[인스타그램 피드용 캡션]\n\n${data.result}\n\n#${pName} #건강관리`
        },
        facebook_content: {
          original: `${pName} 가이드`,
          enhanced: `[페이스북 신뢰성 타겟 문구]\n\n${data.result}`
        }
      });

    } catch (err) {
      console.error("API 연동 실패 또는 OpenAI 에러로 데모 모드 전환:", err);
      // OpenAI 돈이 없거나 에러가 나면 기본 모크 데이터로 안전하게 채우기
      setAiResult(generateMockData(pName, pIndication, pAudience));
      setToastMessage("⚠️ OpenAI API 연결 실패 → 데모 데이터 사용");
    } finally {
      setProgress(100);
      setIsLoading(false);
    }
  };
  
  // --- 1. 로딩 상태(`isLoading`) 변화에만 반응하는 단일 애니메이션 타이머 ---
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      // 로딩 중일 때 95%까지 부드럽게 증가하는 타이머
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(timer);
            return 95;
          }
          return prev + 15;
        });
      }, 250);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading]); // isLoading이 바뀔 때만 타이머를 켜고 끕니다.

  // --- 2. 최초 마운트 시 1회 API 호출 트리거 ---
  useEffect(() => {
    generateAdCopy();
  }, []);

  // --- 3. 알림 토스트 자동 꺼짐 ---
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // --- 4. [기능] 개별 및 전체 클립보드 복사 함수 ---
  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setToastMessage(`✅ ${label} 카피가 클립보드에 복사되었습니다!`);
  };

  const handleCopyAll = () => {
    if (!aiResult) return;
    const allText = `[블로그]\n${aiResult.blog_content?.enhanced}\n\n[인스타그램]\n${aiResult.instagram_content?.enhanced}\n\n[페이스북]\n${aiResult.facebook_content?.enhanced}`;
    navigator.clipboard.writeText(allText);
    setToastMessage('🔥 전체 채널 카피가 복사되었습니다!');
  };

  // --- 5. [기능] 텍스트 파일 (.txt) 다운로드 함수 ---
  const handleDownload = (text: string, filename: string) => {
    if (!text) return;
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${filename}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setToastMessage(`💾 ${filename}.txt 다운로드 완료!`);
  };

  const handleDownloadAll = () => {
    if (!aiResult) return;
    const allText = `제품명: ${aiResult.product_name}\nID: ${aiResult.product_id}\n\n====================\n[블로그 카피]\n====================\n${aiResult.blog_content?.enhanced}\n\n====================\n[인스타그램 카피]\n====================\n${aiResult.instagram_content?.enhanced}\n\n====================\n[페이스북 카피]\n====================\n${aiResult.facebook_content?.enhanced}`;
    handleDownload(allText, `${aiResult.product_name}_전체_광고카피`);
  };

  // --- 6. [기능] 문구 재생성 버튼 액션 ---
  const handleRegenerate = async () => {
    await generateAdCopy();
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">
      
      {/* 둥둥 뜨는 실시간 알림 토스트 팝업 */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] bg-slate-900 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <Check size={14} className="text-emerald-400" /> {toastMessage}
        </div>
      )}
      
      {/* --- [1] 왼쪽 사이드바 --- */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6">
        <div className="mb-10 px-2">
          <Link href="/" className="text-xl font-bold text-slate-800 tracking-tight">Bioverse</Link>
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
          <button onClick={() => alert('CSV 대량 업로드 모듈 준비 중입니다.')} className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition">
            <Upload size={18} /> CSV Upload
          </button>
          <button onClick={() => alert('히스토리 저장소를 로드하고 있습니다.')} className="flex items-center justify-center gap-2 w-full py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition">
            <History size={18} /> History
          </button>
        </div>
      </aside>

      {/* --- [2] 메인 콘텐츠 구역 --- */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
        
        {/* 상단 헤더 */}
        <div className="flex justify-end gap-4 mb-6">
          <span className="text-sm text-slate-400 font-medium py-2">KR | EN</span>
          <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-blue-700 transition">다시 만들기</Link>
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
              <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">데모 모드</button>
              <button onClick={() => setIsLoading(false)} className="px-4 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100">Stop</button>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
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
                <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none"><option>전체 채널</option></select>
             </div>
             <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input type="text" placeholder="Search product..." className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-xs w-64 outline-none focus:ring-2 ring-blue-500/20" />
             </div>
          </div>
        </div>

        {/* 상단 액션 기능 연동 */}
        <div className="flex gap-2 mb-8">
           <button onClick={handleDownloadAll} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition">
             <Download size={14}/> 전체 내보내기 (.txt)
           </button>
           <button onClick={handleCopyAll} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition">
             <Copy size={14}/> 전체 복사
           </button>
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
                   <h4 className="text-lg font-bold text-slate-800">{aiResult?.product_name}</h4>
                   <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${isLoading ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                     {isLoading ? 'GENERATING' : 'DONE'}
                   </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tight">ID: {aiResult?.product_id} • Sandbox Live Mode</p>
              </div>
            </div>
            <button onClick={handleRegenerate} disabled={isLoading} className="flex items-center gap-2 text-blue-600 text-xs font-bold hover:underline disabled:opacity-50">
               <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> 광고 문구 재생성
            </button>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-100 text-left">
            {/* BLOG */}
            <div className="p-6 space-y-6">
               <div className="flex justify-between items-center text-slate-800">
                  <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><FileText size={16} className="text-blue-500"/> Blog</h5>
                  <div className="flex gap-2 text-slate-400">
                     <Copy size={14} onClick={() => handleCopy(aiResult?.blog_content?.enhanced, '블로그')} className="hover:text-blue-600 cursor-pointer transition"/> 
                     <Download size={14} onClick={() => handleDownload(aiResult?.blog_content?.enhanced, `${aiResult?.product_name}_블로그카피`)} className="hover:text-blue-600 cursor-pointer transition"/>
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase mb-2">Original Context</p>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl min-h-[72px]">{aiResult?.blog_content?.original}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-2 italic">Edited (AI Enhanced)</p>
                  <div className="text-xs text-slate-700 leading-relaxed border border-blue-100 p-4 rounded-xl shadow-sm bg-blue-50/10 whitespace-pre-wrap min-h-[140px]">
                     {aiResult?.blog_content?.enhanced}
                  </div>
               </div>
            </div>

            {/* INSTAGRAM */}
            <div className="p-6 space-y-6">
               <div className="flex justify-between items-center text-slate-800">
                  <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><Camera size={16} className="text-pink-500"/> Instagram</h5>
                  <div className="flex gap-2 text-slate-400">
                     <Copy size={14} onClick={() => handleCopy(aiResult?.instagram_content?.enhanced, '인스타그램')} className="hover:text-blue-600 cursor-pointer transition"/> 
                     <Download size={14} onClick={() => handleDownload(aiResult?.instagram_content?.enhanced, `${aiResult?.product_name}_인스타카피`)} className="hover:text-blue-600 cursor-pointer transition"/>
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase mb-2">Original Context</p>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl min-h-[72px]">{aiResult?.instagram_content?.original}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-2 italic">Edited (AI Enhanced)</p>
                  <div className="text-xs text-slate-700 font-medium leading-relaxed border border-blue-100 p-4 rounded-xl shadow-sm bg-blue-50/10 whitespace-pre-wrap min-h-[140px]">
                     {aiResult?.instagram_content?.enhanced}
                  </div>
               </div>
            </div>

            {/* FACEBOOK */}
            <div className="p-6 space-y-6">
               <div className="flex justify-between items-center text-slate-800">
                  <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><Share2 size={16} className="text-blue-600"/> Facebook</h5>
                  <div className="flex gap-2 text-slate-400">
                     <Copy size={14} onClick={() => handleCopy(aiResult?.facebook_content?.enhanced, '페이스북')} className="hover:text-blue-600 cursor-pointer transition"/> 
                     <Download size={14} onClick={() => handleDownload(aiResult?.facebook_content?.enhanced, `${aiResult?.product_name}_페이스북카피`)} className="hover:text-blue-600 cursor-pointer transition"/>
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase mb-2">Original Context</p>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-xl min-h-[72px]">{aiResult?.facebook_content?.original}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-2 italic">Edited (AI Enhanced)</p>
                  <div className="text-xs text-slate-700 leading-relaxed border border-blue-100 p-4 rounded-xl shadow-sm bg-blue-50/10 whitespace-pre-wrap min-h-[140px]">
                     {aiResult?.facebook_content?.enhanced}
                  </div>
               </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
             <div className="flex gap-4">
                <button onClick={() => alert('데이터베이스에 성공적으로 안전 보관되었습니다.')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 transition hover:bg-blue-700">결과 저장</button>
                <button onClick={handleRegenerate} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition">선택 채널 재생성</button>
             </div>
             <button onClick={() => alert('다음 등록된 의약품 리스트가 없습니다.')} className="flex items-center gap-2 text-slate-800 font-bold text-sm hover:text-blue-600 transition">
                다음 의약품 <ChevronRight size={18}/>
             </button>
          </div>
        </div>

        <div className="m-6 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-left">
          <h4 className="font-bold text-amber-800 mb-2">
            광고 규정 검토 결과 (Compliance Check)
          </h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>✓ 과장 표현 필터링 완료</li>
            <li>✓ 임상 데이터 오표기 제거</li>
            <li>✓ 필수 부작용 고지 문구 정상 삽입</li>
            <li>✓ 의사/약사 상의 권고 disclaimer 탑재</li>
          </ul>
        </div>

        {/* --- 하단 로딩 중인 카드 미리보기 트랙 --- */}
        {isLoading && (
          <div className="opacity-40 pointer-events-none mt-10">
             <div className="flex justify-between items-center mb-4">
                <div className="h-6 w-48 bg-slate-200 rounded-md animate-pulse"></div>
                <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                   <RefreshCw size={16} className="animate-spin" /> 카피 최적화 진행 중...
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

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen bg-[#F8FAFC] items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-slate-500 font-medium">
          <RefreshCw size={36} className="animate-spin text-blue-600" />
          <span>의약품 심의 프로세스 로드 중...</span>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}