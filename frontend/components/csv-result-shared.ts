// input 페이지(CSV 업로드 모달)와 csv-result 페이지가 공유하는 타입/상수.
// 결과는 history에 저장하지 않고 sessionStorage에만 잠깐 보관한다 — 탭을 닫거나
// 새 CSV를 올리면 사라지는 일회성 결과.

import type { ComplianceReport } from './compliance';

export const CSV_RESULT_STORAGE_KEY = 'csvUploadResult';

export interface CsvRow {
  index: number;
  name: string;
  channel: string;
  features: string;
  ok: boolean;
  text: string;
  compliance?: ComplianceReport;
}

export interface StoredCsvResult {
  fileName: string;
  items: CsvRow[];
  storedAt: number;
}
