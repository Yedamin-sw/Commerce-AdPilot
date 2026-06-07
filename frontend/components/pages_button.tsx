'use client';
import { useState, useEffect } from 'react';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

type ResultItem = {
  index: number;
  input: Record<string, string>;
  ok: boolean;
  result: string;
  id?: string;
};

type JobStatus = {
  status: string;
  total: number;
  done: number;
  success: number;
  failed: number;
  progress: number;
  elapsed_sec: number | null;
  eta_sec: number | null;
  error?: string;
};

// ────────────────────────────────────────────────────────
// mockMode=true 이면 실제 API 대신 가짜 응답 반환 (OpenAI 미연동 시 사용)
// ────────────────────────────────────────────────────────
const MOCK_RESPONSES = {
  normal: { ok: true, result: '[Mock] 테스트 광고 문구입니다. 상품의 매력을 잘 살린 카피!' },
  csv: {
    results: [
      { index: 0, input: { name: '테스트 상품A' }, ok: true, result: '[Mock] 상품A 광고 문구입니다.', id: 'mock-id-1' },
      { index: 1, input: { name: '테스트 상품B' }, ok: false, result: '[ERROR] mock 실패 항목', id: 'mock-id-2' },
      { index: 2, input: { name: '테스트 상품C' }, ok: true, result: '[Mock] 상품C 광고 문구입니다.', id: 'mock-id-3' },
    ],
    total: 3,
    warnings: [],
  },
  retry: { message: '재시도 시작', failed: 1, poll: '/api/generate/csv/status/mock-job' },
  status: { status: 'completed', total: 3, done: 3, success: 2, failed: 1, progress: 1, elapsed_sec: 5.2, eta_sec: 0 },
  regenerate: (index: number) => ({
    message: '재생성 시작',
    count: 1,
    results: [{ index, input: {}, ok: true, result: `[Mock] ${index}번 항목 재생성 결과입니다.` }],
  }),
  export: (format: string) => ({
    job_id: 'mock-job',
    format,
    content: format === 'json' 
      ? JSON.stringify([{ id: 'mock-id-1', generated_text: '[Mock] 상품A 광고 문구입니다.' }], null, 2)
      : 'Mock export content',
    filename: `mock-job_export.${format}`,
  }),
};

export default function PagesButton({ mockMode = false }: { mockMode?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState('');

  // 결과 항목 목록 + 개별 재생성 중인 index 추적
  const [resultItems, setResultItems] = useState<ResultItem[]>([]);
  const [regeneratingIndices, setRegeneratingIndices] = useState<Set<number>>(new Set());

  // 편집 모달 상태
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingId, setEditingId] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // 내보내기 상태
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'txt'>('json');
  const [isExporting, setIsExporting] = useState(false);

  // 작업 진행률 상태
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [previewItems, setPreviewItems] = useState<ResultItem[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // 폼 생성용 상태 (/api/generate/normal 에 맞는 필드)
  const [formReq, setFormReq] = useState({
    tone: '',
    core_message: '',
    forbidden_words: '',
    channel: ['instagram'],
    tnm: '',
    length: '',
    purpose: '',
  });
  const [formProduct, setFormProduct] = useState({
    name: '',
    category: '',
    features: '',
    target_audience: '',
  });

  // 파일 생성용 상태
  const [file, setFile] = useState<File | null>(null);
  const [fileChannel, setFileChannel] = useState('instagram');

  // ────────────────────────────────────────────────────────
  // 결과물 생성 버튼(폼을 통한 생성) → POST /api/generate/normal
  // ────────────────────────────────────────────────────────
  async function handleNormalGenerate() {
    setIsLoading(true); setError(''); setResult('');
    try {
      let data;
      if (mockMode) {
        await new Promise(r => setTimeout(r, 800)); // 실제 API처럼 딜레이
        data = MOCK_RESPONSES.normal;
      } else {
        const res = await fetch(`${backendUrl}/api/generate/normal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ req: formReq, req1: formProduct }),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data?.detail || '요청 실패');
      }
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  }

  // ────────────────────────────────────────────────────────
  // 결과물 생성 버튼(파일을 통한 생성) → POST /api/generate/csv
  // 파일이 크면 job_id를 반환하므로 jobId state에 저장해둠
  // ────────────────────────────────────────────────────────
  async function handleCsvGenerate() {
    if (!mockMode && !file) { setError('파일을 선택해주세요.'); return; }
    setIsLoading(true); setError(''); setResult('');
    try {
      let data;
      if (mockMode) {
        await new Promise(r => setTimeout(r, 800));
        data = { ...MOCK_RESPONSES.csv, job_id: 'mock-job-id' };
        setJobId('mock-job-id');
      } else {
        const formData = new FormData();
        formData.append('file', file!);
        formData.append('language', 'ko');
        formData.append('channel', fileChannel);
        formData.append('async_mode', 'false');
        const res = await fetch(`${backendUrl}/api/generate/csv`, {
          method: 'POST',
          body: formData,
        });
        data = await res.json();
        if (!res.ok) throw new Error(data?.detail || '요청 실패');
        if (data.job_id) setJobId(data.job_id);
      }
      if (data.results) setResultItems(data.results);
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  }

  // ────────────────────────────────────────────────────────
  // (실패한 것) 다시 생성하기 버튼 → POST /api/generate/csv/retry/{job_id}
  // ────────────────────────────────────────────────────────
  async function handleRetry() {
    if (!jobId) { setError('job_id가 없습니다.'); return; }
    setIsLoading(true); setError(''); setResult('');
    try {
      let data;
      if (mockMode) {
        await new Promise(r => setTimeout(r, 800));
        data = MOCK_RESPONSES.retry;
      } else {
        const res = await fetch(`${backendUrl}/api/generate/csv/retry/${jobId}`, {
          method: 'POST',
        });
        data = await res.json();
        if (!res.ok) throw new Error(data?.detail || '요청 실패');
      }
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  }

  // ────────────────────────────────────────────────────────
  // 마음에 안 든 것 재생성 버튼 → POST /api/generate/csv/regenerate/{job_id}
  // 항목별로 독립 실행 (한 항목이 재생성 중이어도 다른 항목 버튼은 동작)
  // ────────────────────────────────────────────────────────
  async function handleRegenerate(index: number) {
    if (!jobId) { setError('job_id가 없습니다. 먼저 파일로 생성해주세요.'); return; }
    setRegeneratingIndices(prev => new Set(prev).add(index));
    setError('');
    try {
      let data;
      if (mockMode) {
        await new Promise(r => setTimeout(r, 800));
        data = MOCK_RESPONSES.regenerate(index);
      } else {
        const res = await fetch(`${backendUrl}/api/generate/csv/regenerate/${jobId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ indices: [index] }),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data?.detail || '요청 실패');
      }
      if (data.results) {
        setResultItems(prev =>
          prev.map(item => {
            const updated = (data.results as ResultItem[]).find(r => r.index === item.index);
            return updated ?? item;
          })
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setRegeneratingIndices(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }

  // ────────────────────────────────────────────────────────
  // 클립보드 복사 (로컬)
  // ────────────────────────────────────────────────────────
  function handleCopyToClipboard(text: string) {
    try {
      navigator.clipboard.writeText(text);
      alert('클립보드에 복사되었습니다!');
    } catch (e) {
      setError('클립보드 복사 실패');
    }
  }

  // ────────────────────────────────────────────────────────
  // 콘텐츠 편집 시작 (모달 오픈)
  // ────────────────────────────────────────────────────────
  function handleEditStart(index: number, text: string, id?: string) {
    setEditingIndex(index);
    setEditingText(text);
    setEditingId(id || '');
  }

  // ────────────────────────────────────────────────────────
  // 콘텐츠 편집 저장 → PUT /api/history/{content_id}
  // ────────────────────────────────────────────────────────
  async function handleSaveEdit() {
    if (!editingId && !mockMode) {
      setError('content_id가 없습니다.');
      return;
    }
    setIsSavingEdit(true);
    setError('');
    try {
      if (mockMode) {
        await new Promise(r => setTimeout(r, 500));
        setResultItems(prev =>
          prev.map(item =>
            item.index === editingIndex ? { ...item, result: editingText } : item
          )
        );
      } else {
        const res = await fetch(`${backendUrl}/api/history/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generated_text: editingText, is_saved: true }),
        });
        if (!res.ok) throw new Error('편집 저장 실패');
        setResultItems(prev =>
          prev.map(item =>
            item.index === editingIndex ? { ...item, result: editingText } : item
          )
        );
      }
      setEditingIndex(null);
      setEditingText('');
      setEditingId('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setIsSavingEdit(false);
    }
  }

  // ────────────────────────────────────────────────────────
  // 콘텐츠 삭제 → DELETE /api/history/{content_id}
  // ────────────────────────────────────────────────────────
  async function handleDeleteContent(index: number, id?: string) {
    if (!id && !mockMode) {
      setError('content_id가 없습니다.');
      return;
    }
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    setError('');
    try {
      if (mockMode) {
        setResultItems(prev => prev.filter(item => item.index !== index));
      } else {
        const res = await fetch(`${backendUrl}/api/history/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('삭제 실패');
        setResultItems(prev => prev.filter(item => item.index !== index));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    }
  }

  // ────────────────────────────────────────────────────────
  // 파일 내보내기 → GET /api/history/{job_id}/export?format=json|csv|txt
  // ────────────────────────────────────────────────────────
  async function handleExport() {
    if (!jobId && !mockMode) {
      setError('job_id가 없습니다.');
      return;
    }
    setIsExporting(true);
    setError('');
    try {
      let data;
      if (mockMode) {
        await new Promise(r => setTimeout(r, 500));
        data = MOCK_RESPONSES.export(exportFormat);
      } else {
        const res = await fetch(
          `${backendUrl}/api/history/${jobId}/export?format=${exportFormat}`
        );
        data = await res.json();
        if (!res.ok) throw new Error(data?.detail || '내보내기 실패');
      }

      // 파일 다운로드
      const element = document.createElement('a');
      const file = new Blob([data.content || JSON.stringify(data, null, 2)], {
        type: 'text/plain',
      });
      element.href = URL.createObjectURL(file);
      element.download = data.filename || `export.${exportFormat}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setIsExporting(false);
    }
  }

  // ────────────────────────────────────────────────────────
  // 작업 진행률 조회 (폴링) → GET /api/history/csv/status/{job_id}
  // ────────────────────────────────────────────────────────
  async function handleCheckJobStatus() {
    if (!jobId && !mockMode) {
      setError('job_id가 없습니다.');
      return;
    }
    setIsPolling(true);
    setError('');
    try {
      let data;
      if (mockMode) {
        await new Promise(r => setTimeout(r, 300));
        data = MOCK_RESPONSES.status;
      } else {
        const res = await fetch(`${backendUrl}/api/history/csv/status/${jobId}`);
        data = await res.json();
        if (!res.ok) throw new Error(data?.detail || '상태 조회 실패');
      }
      setJobStatus(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setIsPolling(false);
    }
  }

  // ────────────────────────────────────────────────────────
  // 미리보기 로드 (페이지네이션) → GET /api/history/csv/preview/{job_id}
  // ────────────────────────────────────────────────────────
  async function handleLoadPreview(page: number) {
    if (!jobId && !mockMode) {
      setError('job_id가 없습니다.');
      return;
    }
    setIsLoadingPreview(true);
    setError('');
    try {
      let data;
      if (mockMode) {
        await new Promise(r => setTimeout(r, 300));
        data = {
          items: resultItems.slice(page * pageSize, (page + 1) * pageSize),
          done: resultItems.length,
          total: resultItems.length,
        };
      } else {
        const res = await fetch(
          `${backendUrl}/api/history/csv/preview/${jobId}?limit=${pageSize}&offset=${
            page * pageSize
          }`
        );
        data = await res.json();
        if (!res.ok) throw new Error(data?.detail || '미리보기 로드 실패');
      }
      setPreviewItems(data.items || []);
      setCurrentPage(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setIsLoadingPreview(false);
    }
  }

  return (
    <div>

      {/* 결과물 생성 버튼(폼을 통한 생성) */}
      <section>
        <h3>폼으로 생성</h3>
        <input placeholder="톤" value={formReq.tone} onChange={e => setFormReq({ ...formReq, tone: e.target.value })} />
        <input placeholder="핵심 메시지" value={formReq.core_message} onChange={e => setFormReq({ ...formReq, core_message: e.target.value })} />
        <input placeholder="금지어" value={formReq.forbidden_words} onChange={e => setFormReq({ ...formReq, forbidden_words: e.target.value })} />
        <input placeholder="채널 (예: instagram, facebook)" value={formReq.channel.join(',')} onChange={e => setFormReq({ ...formReq, channel: e.target.value.split(',').map(c => c.trim()) })} />
        <input placeholder="톤앤매너" value={formReq.tnm} onChange={e => setFormReq({ ...formReq, tnm: e.target.value })} />
        <input placeholder="길이" value={formReq.length} onChange={e => setFormReq({ ...formReq, length: e.target.value })} />
        <input placeholder="목적" value={formReq.purpose} onChange={e => setFormReq({ ...formReq, purpose: e.target.value })} />
        <input placeholder="상품명" value={formProduct.name} onChange={e => setFormProduct({ ...formProduct, name: e.target.value })} />
        <input placeholder="카테고리" value={formProduct.category} onChange={e => setFormProduct({ ...formProduct, category: e.target.value })} />
        <input placeholder="특징" value={formProduct.features} onChange={e => setFormProduct({ ...formProduct, features: e.target.value })} />
        <input placeholder="타겟 고객" value={formProduct.target_audience} onChange={e => setFormProduct({ ...formProduct, target_audience: e.target.value })} />
        <button onClick={handleNormalGenerate} disabled={isLoading}>
          {isLoading ? '생성 중...' : '폼으로 생성하기'}
        </button>
      </section>

      {/* 결과물 생성 버튼(파일을 통한 생성) */}
      <section>
        <h3>CSV / Excel로 생성</h3>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <input placeholder="기본 채널 (예: instagram)" value={fileChannel} onChange={e => setFileChannel(e.target.value)} />
        <button onClick={handleCsvGenerate} disabled={isLoading}>
          {isLoading ? '생성 중...' : '파일로 생성하기'}
        </button>
      </section>

      {/* (실패한 것) 다시 생성하기 버튼 */}
      <section>
        <h3>실패 항목 재시도</h3>
        <input placeholder="job_id" value={jobId} onChange={e => setJobId(e.target.value)} />
        <button onClick={handleRetry} disabled={isLoading || !jobId}>
          {isLoading ? '재시도 중...' : '실패 항목 다시 생성하기'}
        </button>
      </section>

      {error && <p>{error}</p>}

      {/* 결과 항목 목록 */}
      {resultItems.length > 0 && (
        <section className="results-section">
          <h3>생성 결과 ({resultItems.length}개)</h3>
          {resultItems.map(item => (
            <div key={item.index} className={`result-item ${item.ok ? 'success' : 'failed'}`}>
              <div className="result-header">
                <strong>[{item.index}] {item.ok ? '✓ 성공' : '✗ 실패'}</strong>
              </div>
              <pre className="result-text">{item.result}</pre>
              <div className="result-actions">
                <button onClick={() => handleCopyToClipboard(item.result)}>📋 복사</button>
                <button onClick={() => handleEditStart(item.index, item.result, item.id)}>✏️ 편집</button>
                <button onClick={() => handleDeleteContent(item.index, item.id)}>🗑️ 삭제</button>
                <button onClick={() => handleRegenerate(item.index)} disabled={regeneratingIndices.has(item.index)}>
                  {regeneratingIndices.has(item.index) ? '⏳ 재생성 중...' : '🔄 재생성'}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 편집 모달 */}
      {editingIndex !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>콘텐츠 편집</h3>
            <textarea
              value={editingText}
              onChange={e => setEditingText(e.target.value)}
              className="modal-textarea"
            />
            <div className="modal-actions">
              <button onClick={() => {
                setEditingIndex(null);
                setEditingText('');
              }}>
                취소
              </button>
              <button onClick={handleSaveEdit} disabled={isSavingEdit}>
                {isSavingEdit ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 내보내기 */}
      {resultItems.length > 0 && (
        <section className="export-section">
          <h3>📥 결과 내보내기</h3>
          <div className="export-controls">
            <select value={exportFormat} onChange={e => setExportFormat(e.target.value as 'json' | 'csv' | 'txt')}>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="txt">TXT</option>
            </select>
            <button onClick={handleExport} disabled={isExporting}>
              {isExporting ? '다운로드 중...' : '다운로드'}
            </button>
          </div>
        </section>
      )}

      {/* 작업 진행률 */}
      <section className="status-section">
        <h3>⏳ 작업 진행률</h3>
        <div className="status-controls">
          <input placeholder="job_id" value={jobId} onChange={e => setJobId(e.target.value)} />
          <button onClick={handleCheckJobStatus} disabled={isPolling || !jobId}>
            {isPolling ? '조회 중...' : '상태 조회'}
          </button>
        </div>
        {jobStatus && (
          <div className="status-info">
            <p><strong>상태:</strong> {jobStatus.status}</p>
            <p><strong>진행률:</strong> {(jobStatus.progress * 100).toFixed(1)}% ({jobStatus.done}/{jobStatus.total})</p>
            <p><strong>성공:</strong> {jobStatus.success} | <strong>실패:</strong> {jobStatus.failed}</p>
            {jobStatus.elapsed_sec !== null && <p><strong>경과 시간:</strong> {jobStatus.elapsed_sec}초</p>}
            {jobStatus.eta_sec !== null && jobStatus.eta_sec > 0 && <p><strong>남은 시간:</strong> {jobStatus.eta_sec}초</p>}
            {jobStatus.status === 'completed' && <p className="status-completed">✓ 작업 완료!</p>}
            {jobStatus.status === 'failed' && <p className="status-failed">✗ 작업 실패: {jobStatus.error}</p>}
          </div>
        )}
      </section>

      {/* 미리보기 */}
      {jobId && (
        <section className="preview-section">
          <h3>📄 미리보기 (페이지네이션)</h3>
          <div className="preview-controls">
            <button onClick={() => handleLoadPreview(currentPage - 1)} disabled={currentPage === 0 || isLoadingPreview}>
              ← 이전
            </button>
            <span>페이지 {currentPage + 1} | 페이지 크기: {pageSize}</span>
            <button onClick={() => handleLoadPreview(currentPage + 1)} disabled={isLoadingPreview || previewItems.length < pageSize}>
              다음 →
            </button>
            <button onClick={() => handleLoadPreview(0)} disabled={isLoadingPreview}>
              {isLoadingPreview ? '로드 중...' : '첫 페이지'}
            </button>
          </div>
          {previewItems.length > 0 && (
            <div className="preview-items">
              {previewItems.map(item => (
                <div key={item.index} className="preview-item">
                  <strong>[{item.index}]</strong>
                  <p>{item.result.substring(0, 100)}...</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 원본 JSON 출력 */}
      {resultItems.length === 0 && result && <pre>{result}</pre>}
    </div>
  );
}
