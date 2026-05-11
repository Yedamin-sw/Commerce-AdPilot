# Commerce-AdPilot Frontend

Next.js app router 기반 프런트엔드입니다.

## 로컬 실행

백엔드는 `http://localhost:8000`, 프런트엔드는 `http://localhost:3000` 기준으로 연결합니다.

```powershell
cd c:\graud-project\Commerce-AdPilot\frontend
$env:NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
npm run dev
```

## 프롬프트 테스트

홈 화면 상단의 `프롬프트 테스트 실행` 버튼을 누르면 FastAPI의 `/api/generate/multichannel-copy`를 호출합니다.
응답이 화면 오른쪽에 JSON으로 표시되면 연결이 정상입니다.