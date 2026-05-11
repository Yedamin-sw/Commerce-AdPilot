# Generate API 사용 가이드

> 베이스 URL: `http://localhost:8000`  
> 모든 요청의 Content-Type: `application/json`  
> 인증이 필요한 경우 헤더에 `Authorization: Bearer <토큰>` 추가

---

## 목차

1. [단일 상품 광고 문구 생성 (수기 입력)](#1-단일-상품-광고-문구-생성-수기-입력)
2. [플랫폼별 광고 문구 생성 (추천)](#2-플랫폼별-광고-문구-생성-추천)
3. [CSV/엑셀 일괄 생성](#3-csvexcel-일괄-생성)
4. [일괄 생성 진행 상태 조회](#4-일괄-생성-진행-상태-조회)
5. [완료된 항목 미리보기](#5-완료된-항목-미리보기)
6. [실패 항목 재시도](#6-실패-항목-재시도)

---

## 공통 필드 설명

### 팀 가이드 (team guide)
| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `tone` | string | 브랜드 톤 | `"신뢰감 있는, 따뜻한"` |
| `core_message` | string | 핵심 메시지 | `"삶의 질을 높이는 휴식"` |
| `forbidden_words` | string | 금지 표현 | `"무조건, 최고, 당장"` |

### 옵션
| 필드 | 타입 | 설명 | 가능한 값 |
|------|------|------|----------|
| `channel` | string[] | 생성할 플랫폼 목록 | `"instagram"`, `"youtube"`, `"facebook"`, `"tiktok"`, `"naver"`, `"default"` |
| `tnm` | string | 톤앤매너 추가 지시 | `"친근하게"`, `""` (비워도 됨) |
| `length` | string | 길이 지시 | `"짧게"`, `"길게"`, `""` |
| `purpose` | string | 광고 목적 | `"전환"`, `"인지도"`, `""` |

### 상품 정보
| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `name` | string | 상품명 | `"프리미엄 무선 청소기 A100"` |
| `category` | string | 카테고리 | `"가전/생활"` |
| `features` | string | 주요 특징 | `"초경량 1.2kg, 45분 연속 사용"` |
| `target_audience` | string | 타겟 고객 | `"3040 직장인, 주부"` |

---

## 1. 단일 상품 광고 문구 생성 (수기 입력)

> ⚠️ 현재 버그 있음 — body가 2개라 동작 안 함. **2번 `/platform`을 사용 권장**

```
POST /api/generate/normal
```

---

## 2. 플랫폼별 광고 문구 생성 (추천)

채널 목록을 받아서 각 플랫폼에 맞는 광고 문구를 **동시에** 생성합니다.  
가장 많이 쓸 엔드포인트입니다.

```
POST /api/generate/platform
```

### 요청 body

```json
{
  "tone": "신뢰감 있는, 따뜻한",
  "core_message": "삶의 질을 높이는 휴식",
  "forbidden_words": "무조건, 최고",
  "channel": ["instagram", "facebook", "naver"],
  "tnm": "",
  "length": "",
  "purpose": "전환",
  "name": "프리미엄 무선 청소기 A100",
  "category": "가전",
  "features": "초경량 1.2kg, 45분 연속 사용",
  "target_audience": "3040 직장인"
}
```

> `channel` 배열에 원하는 플랫폼을 넣으면 됩니다. 여러 개 가능.

### 응답

```json
{
  "results": [
    {
      "channel": "instagram",
      "ok": true,
      "text": "청소기도 인테리어니까 ✨ 손목 무리 없는 초경량 바디에 숨겨진 강력한 파워! #무선청소기 #A100"
    },
    {
      "channel": "facebook",
      "ok": true,
      "text": "아직도 무거운 청소기로 고생하시나요? 1.2kg 초경량 무게로 가볍게, 45분 연속으로 깔끔하게."
    },
    {
      "channel": "naver",
      "ok": true,
      "text": "프리미엄 무선청소기 A100은 초경량 설계와 강력한 흡입력을 동시에 갖춘 제품입니다..."
    }
  ]
}
```

| 필드 | 설명 |
|------|------|
| `channel` | 요청한 플랫폼 이름 |
| `ok` | 생성 성공 여부 (`true` / `false`) |
| `text` | 생성된 광고 문구 |

### 프론트엔드 예시 코드

```javascript
const res = await fetch("http://localhost:8000/api/generate/platform", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  },
  body: JSON.stringify({
    tone: "신뢰감 있는",
    core_message: "최고의 휴식",
    forbidden_words: "최고, 무조건",
    channel: ["instagram", "facebook"],
    tnm: "",
    length: "",
    purpose: "전환",
    name: productName,
    category: category,
    features: features,
    target_audience: target
  })
});
const data = await res.json();
// data.results 배열을 순회하면서 채널별로 표시
data.results.forEach(item => {
  console.log(item.channel, item.text);
});
```

---

## 3. CSV/엑셀 일괄 생성

CSV 또는 엑셀 파일을 업로드하면 각 행마다 광고 문구를 생성합니다.  
50개 이하는 즉시 결과 반환, 50개 초과(또는 `async_mode=true`)는 백그라운드로 처리하고 `job_id`를 반환합니다.

```
POST /api/generate/csv
Content-Type: multipart/form-data
```

### CSV 파일 컬럼 형식

```
name,category,features,target_audience,channel,tone,core_message,forbidden_words,tnm,length,purpose
무선청소기 A100,가전,초경량 1.2kg,3040 직장인,instagram,신뢰감 있는,삶의 질,최고,,,전환
오가닉 베개,침구,100% 천연 라텍스,불면증 환자,naver,따뜻한,편안한 수면,,,길게,인지도
```

> `channel`, `tone` 등이 CSV에 없으면 아래 폼 파라미터의 기본값이 적용됩니다.

### 요청 파라미터 (form-data)

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `file` | file | ✅ | — | `.csv` 또는 `.xlsx` 파일 |
| `language` | string | ❌ | `"ko"` | 생성 언어 |
| `channel` | string | ❌ | `null` | CSV에 channel 컬럼 없을 때 쓸 기본 채널 |
| `async_mode` | boolean | ❌ | `false` | `true`이면 무조건 백그라운드 처리 |
| `async_threshold` | integer | ❌ | `50` | 이 개수 초과 시 자동으로 백그라운드 처리 |

### 응답 — 즉시 처리 (50개 이하)

```json
{
  "results": [
    {
      "index": 0,
      "input": { "name": "무선청소기 A100", "category": "가전", "..." : "..." },
      "ok": true,
      "result": "청소기도 인테리어니까 ✨ ..."
    }
  ],
  "total": 1
}
```

### 응답 — 백그라운드 처리 (50개 초과)

```json
{
  "job_id": "a1b2c3d4-...",
  "status": "queued",
  "total": 120,
  "poll": "/api/generate/csv/status/a1b2c3d4-..."
}
```

> `job_id`를 저장해두고 `/status` 엔드포인트로 진행 상황을 주기적으로 확인하세요.

### 프론트엔드 예시 코드

```javascript
const formData = new FormData();
formData.append("file", csvFile);        // <input type="file"> 에서 가져온 파일
formData.append("channel", "instagram"); // 기본 채널
formData.append("async_mode", "false");

const res = await fetch("http://localhost:8000/api/generate/csv", {
  method: "POST",
  headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
  body: formData  // Content-Type은 자동 설정 — 직접 쓰지 마세요
});
const data = await res.json();

if (data.job_id) {
  // 백그라운드 처리 → polling 시작
  startPolling(data.job_id);
} else {
  // 즉시 처리 완료
  console.log(data.results);
}
```

---

## 4. 일괄 생성 진행 상태 조회

백그라운드 작업의 진행 상황을 확인합니다.  
작업이 끝날 때까지 **2~3초 간격으로 반복 호출**하면 됩니다.

```
GET /api/generate/csv/status/{job_id}
```

### 응답

```json
{
  "status": "running",
  "total": 120,
  "done": 45,
  "success": 43,
  "failed": 2,
  "progress": 0.375,
  "elapsed_sec": 12.4,
  "eta_sec": 20.6,
  "error": null
}
```

| 필드 | 설명 |
|------|------|
| `status` | `queued` → `running` → `completed` / `failed` |
| `progress` | 0.0 ~ 1.0 (진행률, 프로그레스 바에 바로 사용 가능) |
| `eta_sec` | 남은 예상 시간(초) |
| `failed` | 실패한 항목 수 → 0보다 크면 재시도 가능 |

### 프론트엔드 polling 예시

```javascript
function startPolling(jobId) {
  const interval = setInterval(async () => {
    const res = await fetch(`http://localhost:8000/api/generate/csv/status/${jobId}`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    const data = await res.json();

    setProgress(data.progress * 100); // 프로그레스 바 업데이트

    if (data.status === "completed" || data.status === "failed") {
      clearInterval(interval);
      fetchPreview(jobId); // 결과 불러오기
    }
  }, 2000); // 2초마다 확인
}
```

---

## 5. 완료된 항목 미리보기

작업이 진행 중이더라도 지금까지 완료된 결과를 먼저 볼 수 있습니다.  
페이지네이션 지원 (무한 스크롤 구현 가능).

```
GET /api/generate/csv/preview/{job_id}?limit=20&offset=0&only_success=false
```

### 쿼리 파라미터

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `limit` | integer | `20` | 한 번에 가져올 개수 |
| `offset` | integer | `0` | 건너뛸 개수 (페이지네이션) |
| `only_success` | boolean | `false` | `true`이면 성공한 것만 반환 |

### 응답

```json
{
  "status": "running",
  "done": 45,
  "total": 120,
  "showing": { "offset": 0, "limit": 20, "count": 20 },
  "items": [
    {
      "index": 0,
      "input": { "name": "무선청소기 A100", "..." : "..." },
      "ok": true,
      "result": "청소기도 인테리어니까 ✨ ..."
    }
  ]
}
```

---

## 6. 실패 항목 재시도

`ok: false`인 항목들만 골라서 다시 생성합니다.  
성공한 항목은 건드리지 않습니다.

```
POST /api/generate/csv/retry/{job_id}?retry=2
```

### 쿼리 파라미터

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `retry` | integer | `2` | 각 항목당 최대 재시도 횟수 |

### 응답

```json
{
  "message": "재시도 시작",
  "failed": 7,
  "poll": "/api/generate/csv/status/a1b2c3d4-..."
}
```

> 재시도도 백그라운드로 처리됩니다. 응답의 `poll` 주소로 동일하게 상태를 확인하면 됩니다.

---

## 지원 채널 목록

| 채널 key | 설명 |
|---------|------|
| `instagram` | 짧고 감각적, 이모지 + 해시태그 |
| `youtube` | 강한 후킹 + CTA 포함 |
| `facebook` | 3040 타겟, 차분하고 신뢰감 있는 톤 |
| `tiktok` | Z세대, 매우 짧고 트렌디 |
| `naver` | 블로그/쇼핑 SEO 최적화 |
| `default` | 채널 미지정 시 일반 광고 문구 |
