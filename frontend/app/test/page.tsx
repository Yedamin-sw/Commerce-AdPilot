'use client';
import { useState } from 'react';
import PagesButton from '@/components/pages_button';

export default function TestPage() {
  const [mockMode, setMockMode] = useState(true);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>버튼 테스트 페이지</h1>

      {/* Mock 모드 토글 */}
      <div style={{ marginBottom: '24px', padding: '12px', background: '#f0f4ff', borderRadius: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={mockMode}
            onChange={e => setMockMode(e.target.checked)}
          />
          <strong>Mock 모드</strong>
          <span style={{ color: '#666', fontSize: '14px' }}>
            {mockMode
              ? '✅ ON — API 없이 가짜 응답으로 동작 중'
              : '⚠️ OFF — 실제 백엔드에 요청합니다 (백엔드 실행 필요)'}
          </span>
        </label>
      </div>

      <PagesButton mockMode={mockMode} />
    </div>
  );
}
