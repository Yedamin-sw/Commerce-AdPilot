'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Camera, Share2, Video, Music, ShoppingBag, 
  History, Clock, Zap, CheckCircle2, ChevronRight, ChevronLeft, 
  RefreshCw, Layers, Calendar
} from 'lucide-react';

// ── [프론트] 채널 메타 정보 (디자인 통일) ──────────────────────────────
const CHANNEL_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  blog:      { label: 'Blog',      icon: <FileText size={14} />, color: 'text-blue-500',    bg: 'bg-blue-50' },
  instagram: { label: 'Instagram', icon: <Camera  size={14} />, color: 'text-pink-500',    bg: 'bg-pink-50' },
  facebook:  { label: 'Facebook',  icon: <Share2  size={14} />, color: 'text-indigo-500',  bg: 'bg-indigo-50' },
  youtube:   { label: 'YouTube',   icon: <Video size={14} />,   color: 'text-red-500',     bg: 'bg-red-50' },
  tiktok:    { label: 'TikTok',    icon: <Music size={14} />,   color: 'text-purple-500',  bg: 'bg-purple-50' },
  naver:     { label: 'Naver Shop',  icon: <ShoppingBag size={14} />, color: 'text-green-500',   bg: 'bg-green-50' },
};

// 백엔드 Products 테이블 데이터 타입 정의
interface ProductItem {
  id: number;
  name?: string;
  category?: string;
  features?: string;
  target_audience?: string;
  created_at?: string;
}

// 백엔드 Ad_Contents 테이블 데이터 타입 정의
interface AdContentItem {
  id: string;
  product_id: number;
  platform_type: string;
  generated_text: string;
  is_saved: boolean;
  created_at: string;
}

export default function HistoryPage() {
  // ── 상태 관리 ──
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductContents, setSelectedProductContents] = useState<AdContentItem[]>([]);
  
  const [page, setPage] = useState<number>(1);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  // ── 1. 제품 리스트 가져오기 (페이지네이션) ──
  const fetchProductList = async (targetPage: number) => {
    setIsLoadingList(true);
    try {
      const res = await fetch(`${backendUrl}/api/history/list/product?page=${targetPage}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.contents || []);
        setPage(targetPage);
        
        // 리스트를 새로 불러왔을 때, 첫 번째 제품이 있다면 자동으로 상세 내용 토글
        if (data.contents && data.contents.length > 0) {
          fetchContentDetails(data.contents[0].id);
        } else {
          setSelectedProductId(null);
          setSelectedProductContents([]);
        }
      }
    } catch (err) {
      console.error("제품 리스트 로드 실패:", err);
    } finally {
      setIsLoadingList(false);
    }
  };

  // ── 2. 선택한 제품의 세부 광고 문구(플랫폼별) 가져오기 ──
  const fetchContentDetails = async (productId: number) => {
    setIsLoadingDetail(true);
    setSelectedProductId(productId);
    try {
      const res = await fetch(`${backendUrl}/api/history/list/content/${productId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedProductContents(data.contents || []);
      }
    } catch (err) {
      console.error("상세 문구 로드 실패:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 최초 로드 시 1페이지 목록 가져오기
  useEffect(() => {
    fetchProductList(1);
  }, []);

  // 날짜 이쁘게 포맷팅하는 유틸 함수
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">
      
      {/* ── [1] 사이드바 (기존과 무조건 통일) ── */}
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
              <Link href="/workspace/input" className="flex items-center gap-3 px-3 py-2.5 text-slate-400 rounded-lg hover:bg-slate-50 transition">
                <Clock size={18} /> Generating
              </Link>
              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-400 rounded-lg">
                <Zap size={18} /> Ready
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-semibold">
                <History size={18} /> History Mode
              </div>
            </div>
          </div>
        </nav>
        
        <div className="pt-6 border-t border-slate-100">
          <Link
            href="/workspace/input"
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-md"
          >
            새 광고 만들러 가기
          </Link>
        </div>
      </aside>

      {/* ── [2] 메인 레이아웃 (왼쪽: 제품 리스트 / 오른쪽: 상세 카피 결과) ── */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* ⬅️ 왼쪽 영역: 제품 히스토리 리스트 */}
        <section className="w-1/2 border-r border-slate-200 flex flex-col bg-white">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]/50">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History size={20} className="text-blue-500" /> 생성 히스토리
              </h1>
              <p className="text-xs text-slate-400 mt-1">과거에 생성했던 의약품 리스트입니다.</p>
            </div>
            <button 
              onClick={() => fetchProductList(page)}
              className="p-2 text-slate-400 hover:text-blue-600 transition"
            >
              <RefreshCw size={16} className={isLoadingList ? "animate-spin" : ""} />
            </button>
          </div>

          {/* 리스트 본문 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoadingList ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                <RefreshCw size={20} className="animate-spin mr-2" /> 로딩 중...
              </div>
            ) : products.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Layers size={32} className="text-slate-200" />
                생성된 기록이 존재하지 않습니다.
              </div>
            ) : (
              products.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => fetchContentDetails(prod.id)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition ${
                    selectedProductId === prod.id
                      ? 'border-blue-500 bg-blue-50/30 shadow-sm'
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                      {prod.category || '의약품'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar size={10} /> {formatDate(prod.created_at)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mt-2 truncate">{prod.name || '이름 없음'}</h3>
                  <p className="text-xs text-slate-400 truncate mt-1">{prod.features || '특징 정보 없음'}</p>
                </div>
              ))
            )}
          </div>

          {/* 하단 하드코딩 페이지네이션 컨트롤러 */}
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <button
              onClick={() => page > 1 && fetchProductList(page - 1)}
              disabled={page <= 1 || isLoadingList}
              className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-600">현재 페이지: {page}</span>
            <button
              onClick={() => fetchProductList(page + 1)}
              disabled={products.length < 10 || isLoadingList} // 10개 미만이면 다음 페이지가 없다고 간주
              className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </section>

        {/* ➡️ 오른쪽 영역: 선택된 제품의 광고 카피 디테일 뷰 */}
        <section className="w-1/2 flex flex-col bg-[#F8FAFC]">
          <div className="p-6 border-b border-slate-200 bg-white">
            <h2 className="text-base font-bold text-slate-800">📋 채널별 결과 뷰어</h2>
            <p className="text-xs text-slate-400 mt-1">선택한 약품에 대해 생성 완료된 광고문구 모음집입니다.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoadingDetail ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                <RefreshCw size={20} className="animate-spin mr-2 text-blue-500" /> 데이터를 불러오는 중...
              </div>
            ) : !selectedProductId ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                왼쪽 목록에서 의약품을 선택하시면 카피 문구가 표기됩니다.
              </div>
            ) : selectedProductContents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
                ⚠️ 이 제품은 정보 기록은 있으나 매칭된 플랫폼별 광고 카피 텍스트가 없습니다.
              </div>
            ) : (
              selectedProductContents.map((item) => {
                const meta = CHANNEL_META[item.platform_type] ?? { 
                  label: item.platform_type.toUpperCase(), 
                  icon: <Layers size={14} />, 
                  color: 'text-slate-500', 
                  bg: 'bg-slate-100' 
                };

                return (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    {/* 상단 플랫폼 마크 태그 띄우기 구역 */}
                    <div className="flex justify-between items-center">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${meta.bg} ${meta.color}`}>
                        {meta.icon}
                        <span>{meta.label}</span>
                      </div>
                      
                      {/* 복사 단축버튼 */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.generated_text);
                          alert(`${meta.label} 카피 텍스트가 클립보드에 복사되었습니다.`);
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                      >
                        텍스트 복사
                      </button>
                    </div>

                    {/* 카피 내용 상자 */}
                    <div className="text-xs text-slate-700 bg-slate-50/50 border border-slate-100 rounded-xl p-4 leading-relaxed whitespace-pre-wrap min-h-[80px]">
                      {item.generated_text}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </main>
    </div>
  );
}