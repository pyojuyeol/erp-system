# ERP System

React + NestJS 기반 사내 ERP(전사적 자원관리) 시스템입니다. 인사, 부서, 급여, 재고, 회계, 근태 관리를 하나의 웹 애플리케이션에서 통합적으로 처리합니다.

## 목차

- [기술 스택](#기술-스택)
- [주요 기능](#주요-기능)
- [시스템 아키텍처](#시스템-아키텍처)
- [폴더 구조](#폴더-구조)
- [시작하기](#시작하기)
- [API 문서](#api-문서)
- [배포](#배포)

## 기술 스택

### Frontend
- React 19, TypeScript, Vite
- Ant Design 6 (UI 컴포넌트)
- TanStack Query (서버 상태 관리)
- Zustand (클라이언트 상태 관리)
- React Router, Axios, Day.js

### Backend
- NestJS (TypeScript)
- Prisma ORM 7 (PostgreSQL, Driver Adapter 방식)
- Passport.js (JWT 인증 전략)
- class-validator / class-transformer
- bcrypt (비밀번호 해싱)

### Database & Cache
- PostgreSQL
- Redis

### 인증 / 보안
- JWT Access Token(15분) + Refresh Token(7일) 로테이션
- Refresh Token은 httpOnly 쿠키로 저장, DB에는 해시값만 저장
- Role 기반 접근 제어 (ADMIN / MANAGER / EMPLOYEE)

### API 문서화
- Swagger (OpenAPI) — `/api/docs`

### 인프라 / 배포
- Nginx (정적 파일 서빙 + API 리버스 프록시)
- PM2 (systemd 연동 자동 기동)

## 주요 기능

| 도메인 | 기능 |
|---|---|
| **인사관리** | 직원 등록(계정+인사정보 동시 생성), 조회/수정/삭제 |
| **부서관리** | 부서 CRUD, 소속 직원 수 집계, 참조 무결성 보호(소속 직원 있으면 삭제 불가) |
| **급여관리** | 월별 급여 등록, 기본급/수당/공제 기반 순지급액 자동 계산, 월별 중복 등록 방지 |
| **재고관리** | 품목 마스터 관리, 입출고 트랜잭션, 재고 수량 자동 증감, 재고 부족 검증 |
| **회계관리** | 수입/지출 전표 등록, 월별 수입·지출·수지잔액 집계 |
| **근태관리** | 출근/퇴근 체크(1일 1회), 휴가 신청 및 관리자 승인/반려 워크플로우 |
| **대시보드** | 전 도메인 실시간 통계 요약 (직원 수, 이번 달 손익, 재고 부족 품목, 대기 휴가 등) |

## 시스템 아키텍처

브라우저 요청은 Nginx가 단일 진입점(포트 80)에서 받습니다.

- `/` 경로: React 정적 빌드 파일을 직접 서빙
- `/api/*` 경로: NestJS 백엔드(포트 4000)로 리버스 프록시

백엔드는 PostgreSQL과 Redis에 연결됩니다. 프론트엔드와 백엔드가 Nginx를 통해 동일 오리진으로 노출되어, 별도의 CORS 예외 처리 없이 쿠키 기반 인증이 안전하게 동작합니다.

### 인증 흐름

1. 로그인 성공 시 Access Token(응답 본문) + Refresh Token(httpOnly 쿠키) 발급
2. 모든 API 요청에 Access Token을 `Authorization: Bearer` 헤더로 전달
3. Access Token 만료(401) 감지 시, Axios 인터셉터가 자동으로 `/api/auth/refresh` 호출
4. Refresh Token은 사용할 때마다 폐기 후 재발급(로테이션)되어 재사용 공격 방지
5. 사용자는 세션 만료를 인지하지 못한 채 서비스를 계속 이용

## 폴더 구조

- `frontend/` — React + Vite 앱
  - `src/api/` — axios 클라이언트 (인증 인터셉터 포함)
  - `src/app/` — React Query 클라이언트 설정
  - `src/components/layout/` — 공통 레이아웃, 라우트 가드
  - `src/features/` — 도메인별 모듈 (auth, employees, departments, salaries, inventory, accounting, attendance, dashboard)
  - `src/store/` — zustand 스토어 (인증 상태)
- `backend/` — NestJS 앱
  - `prisma/schema.prisma` — DB 스키마
  - `prisma/seed.ts` — 더미데이터 시드 스크립트
  - `src/common/` — guards, decorators, filters
  - `src/modules/` — 도메인별 모듈 (auth, employees, departments, salaries, items, inventory, accounting, attendance, leaves, dashboard)
- `ecosystem.config.js` — PM2 배포 설정
- `README.md`

## 시작하기

### 사전 요구사항

- Node.js 20 이상
- PostgreSQL 15 이상
- Redis 7 이상

### 1. 저장소 클론

    git clone https://github.com/pyojuyeol/erp-system.git
    cd erp-system

### 2. 백엔드 설정

    cd backend
    npm install
    cp .env.example .env

`.env` 파일을 열어 `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` 등을 채웁니다.

    npx prisma generate
    npx prisma migrate dev
    npm run start:dev

기본적으로 `http://localhost:4000/api` 에서 실행됩니다.

### (선택) 더미데이터 시딩

    export $(cat .env | grep -v '^#' | xargs) && npx tsx prisma/seed.ts

관리자 계정(`admin@erp.com` / `password123`)과 직원 12명, 부서 5개, 급여/재고/회계/근태 더미데이터가 생성됩니다.

### 3. 프론트엔드 설정

    cd frontend
    npm install
    cp .env.example .env
    npm run dev

`http://localhost:5173` 에서 접속 가능합니다.

## API 문서

백엔드 실행 후 아래 주소에서 Swagger UI로 전체 API 스펙을 확인할 수 있습니다.

    http://localhost:4000/api/docs

`/api/auth/login`으로 로그인 후 발급받은 Access Token을 우측 상단 **Authorize** 버튼에 입력하면, 인증이 필요한 API도 바로 테스트할 수 있습니다.

## 배포

Docker 없이 Nginx + PM2 조합으로 배포합니다.

    # 프론트엔드 빌드
    cd frontend
    npm run build

    # 백엔드 빌드
    cd ../backend
    npm run build

    # PM2로 백엔드 실행
    cd ..
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup

Nginx는 `/`를 `frontend/dist`로, `/api/`를 백엔드(`localhost:4000`)로 리버스 프록시하도록 설정합니다.

