# ✨ 별자리 운세 — AI 점성술사 플랫폼

Gemini AI 기반의 30대 여성 맞춤형 별자리 운세 모바일 웹 플랫폼

## 🚀 빠른 시작

### 1. Gemini API 키 발급
1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. API 키 발급
3. `.env.local` 파일을 열어 키 입력:

```
GEMINI_API_KEY=여기에_API_키_입력
```

### 2. 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:3000 접속

## 🌍 Vercel 배포

### 1. Vercel 프로젝트 연결
```bash
npm install -g vercel
vercel login
vercel
```

### 2. 환경 변수 설정 (중요!)
Vercel 대시보드 → Settings → Environment Variables에 아래 추가:
- **이름**: `GEMINI_API_KEY`
- **값**: 발급받은 Gemini API 키
- **환경**: Production, Preview, Development 모두 선택

> ⚠️ `.env.local` 파일은 절대 깃허브에 올리면 안 됩니다 (`.gitignore`에 포함됨)

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   └── fortune/
│   │       └── route.ts     # Gemini API 라우트
│   ├── globals.css          # 전역 디자인 시스템
│   ├── layout.tsx           # 루트 레이아웃 + SEO
│   ├── page.tsx             # 메인 페이지 (입력 + 결과 대시보드)
│   └── page.module.css      # 페이지 스타일
└── lib/
    ├── gemini.ts            # AI 점성술사 로직
    ├── kst.ts               # 한국 표준시 유틸리티
    └── schemas.ts           # Zod 검증 스키마
```

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🔮 AI 점성술사 | Gemini 3.6 Flash 기반 초개인화 운세 |
| 📊 점수 게이지 | SVG 애니메이션 0→100점 게이지 |
| 🎨 2026 트렌드 컬러 | 아이시 블루, 틸, 클라우드 댄서 등 추천 |
| 💼 커리어/연애/재물/건강 | 탭 기반 카테고리별 상세 분석 |
| 👗 OOTD 추천 | 병오년 트렌드 기반 코디 제안 |
| ⏰ KST 시간대 | Vercel UTC 서버 → 한국 시간 자동 보정 |
| 📱 Web Share API | 카카오톡 등 모바일 공유 |

## 🔒 보안

- API 키는 서버 사이드(route.ts)에서만 접근
- 클라이언트 코드에 절대 노출 안 됨
- 사용자 생년월일은 운세 생성 후 즉시 폐기
- Zod로 모든 입력값 서버 검증


## 📈 방문자 분석

사이트는 개인정보를 최소화한 1st-party 이벤트 분석을 지원합니다.

- 최초 방문 및 페이지 종료 이벤트
- 익명 visitor/session ID
- UTM / referrer
- Vercel GeoIP 헤더 기반 국가·지역·도시·시간대
- IP는 원문을 저장하지 않고 IPv4 /24, IPv6 /64 단위로 마스킹
- 브라우저/OS/기기 유형, 화면 크기
- 운세 생성 시작/성공/오류, 결과 탭, 공유 이벤트
- 이름·생년월일·고민 내용은 Analytics 이벤트에 포함하지 않음
- 브라우저의 Do Not Track 또는 Global Privacy Control이 활성화되어 있으면 클라이언트 이벤트를 전송하지 않음

기본 저장 대상은 Vercel Runtime Logs의 `[analytics]` 구조화 로그입니다.
외부 분석 저장소로 전달하려면 Vercel 환경 변수에 아래를 설정합니다.

```
ANALYTICS_WEBHOOK_URL=https://example.com/analytics
ANALYTICS_WEBHOOK_TOKEN=optional-bearer-token
```

`ANALYTICS_WEBHOOK_URL`이 설정되면 동일한 구조화 이벤트를 해당 HTTPS 엔드포인트로 전달합니다.
