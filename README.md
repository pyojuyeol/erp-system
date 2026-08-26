# ERP System

React + NestJS 기반 사내 ERP(전사적 자원관리) 시스템입니다. 인사, 부서, 급여, 재고, 회계, 근태 관리를 하나의 웹 애플리케이션에서 통합적으로 처리하며, Docker Compose 기반 컨테이너 오케스트레이션과 GitHub Actions CI/CD 파이프라인까지 갖춘 프로덕션 수준의 배포 환경을 구성했습니다.

## 목차

- [기술 스택](#기술-스택)
- [주요 기능](#주요-기능)
- [시스템 아키텍처](#시스템-아키텍처)
- [폴더 구조](#폴더-구조)
- [시작하기 (로컬 개발)](#시작하기-로컬-개발)
- [Docker Compose로 실행](#docker-compose로-실행)
- [CI/CD 파이프라인](#cicd-파이프라인)
- [부하 테스트](#부하-테스트)
- [API 문서](#api-문서)

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
- Docker & Docker Compose (PostgreSQL, Redis, Backend, Frontend 컨테이너 오케스트레이션)
- Nginx (정적 파일 서빙 + API 리버스 프록시, 컨테이너 및 호스트 양쪽 구성 지원)
- GitHub Actions (Self-hosted Runner 기반 CI/CD, 빌드 검증 → 배포 → 마이그레이션 → 헬스체크 → 실패 시 자동 롤백)
- k6 (부하 테스트)
- PM2 (Docker 미사용 시 대체 배포 방식, systemd 연동 자동 기동)

## 주요 기능

| 도메인 | 기능 |
|---|---|
| **인사관리** | 직원 등록(계정+인사정보 동시 생성), 조회/수정/삭제 |
| **부서관리** | 부서 CRUD, 소속 직원 수 집계, 참조 무결성 보호(소속 직원 있으면 삭제 불가) |
| **급여관리** | 월별 급여 등록, 기본급/수당/공제 기반 순지급액 자동 계산, 월별 중복 등록 방지 |
| **재고관리** | 품목 마스터 관리, 입출고 트랜잭션, 재고 수량 자동 증감, 재고 부족 검증 |
| **회계관리** | 수입/지출 전표 등록, 월별 수입·지출·수지잔액 집계 |
| **근태관리** | 출근/퇴근 체크(1일 1회), 휴가 신청 및 관리자 승인/반려 워크플로우 |
| **대시보드** | 전 도메인 실시간 통계 요약, 8개 집계 쿼리를 `Promise.all()`로 병렬 처리 |

## 시스템 아키텍처

```
브라우저
   │
   ▼
 Nginx (:80 또는 :8090)
   ├── /            → React 정적 빌드 파일 서빙
   └── /api/*        → NestJS 백엔드로 리버스 프록시
                            │
                            ▼
                      PostgreSQL / Redis
```

프론트엔드와 백엔드가 Nginx를 통해 동일 오리진으로 노출되어, 별도의 CORS 예외 처리 없이 쿠키 기반 인증이 안전하게 동작합니다. Docker Compose 환경에서는 각 서비스가 컨테이너 네트워크의 서비스명(`postgres`, `redis`, `backend`)으로 서로를 참조합니다.

### 인증 흐름

1. 로그인 성공 시 Access Token(응답 본문) + Refresh Token(httpOnly 쿠키) 발급
2. 모든 API 요청에 Access Token을 `Authorization: Bearer` 헤더로 전달
3. Access Token 만료(401) 감지 시, Axios 인터셉터가 자동으로 `/api/auth/refresh` 호출
4. Refresh Token은 사용할 때마다 폐기 후 재발급(로테이션)되어 재사용 공격 방지
5. 사용자는 세션 만료를 인지하지 못한 채 서비스를 계속 이용

## 폴더 구조

- `frontend/` — React + Vite 앱, `Dockerfile`, `nginx.conf` 포함
  - `src/api/` — axios 클라이언트 (인증 인터셉터 포함)
  - `src/app/` — React Query 클라이언트 설정
  - `src/components/layout/` — 공통 레이아웃, 라우트 가드
  - `src/features/` — 도메인별 모듈
  - `src/store/` — zustand 스토어 (인증 상태)
- `backend/` — NestJS 앱, `Dockerfile` 포함
  - `prisma/schema.prisma` — DB 스키마
  - `prisma/seed.ts` — 더미데이터 시드 스크립트
  - `src/common/` — guards, decorators, filters
  - `src/modules/` — 도메인별 모듈 (auth, employees, departments, salaries, items, inventory, accounting, attendance, leaves, dashboard, health)
- `loadtest/` — k6 부하 테스트 스크립트 (`healthcheck.js`, `scenario.js`)
- `.github/workflows/deploy.yml` — CI/CD 파이프라인 정의
- `docker-compose.yml` — 전체 서비스 오케스트레이션 정의
- `ecosystem.config.js` — PM2 배포 설정 (Docker 미사용 대체 경로)
- `LOAD_TEST_REPORT.md` — k6 부하 테스트 결과 리포트
- `PROJECT_DEEP_DIVE.md` — 설계 이유 및 트러블슈팅 상세 정리
- `README.md`

## 시작하기 (로컬 개발)

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

## Docker Compose로 실행

Docker와 Docker Compose가 설치되어 있다면, PostgreSQL과 Redis를 별도로 설치하지 않고 전체 스택을 한 번에 띄울 수 있습니다.

    # 백엔드 환경변수 파일 준비 (컨테이너 서비스명으로 DB/Redis 연결)
    cd backend
    cp .env.example .env.docker
    # .env.docker의 DATABASE_URL 호스트를 postgres, REDIS_HOST를 redis로 수정

    # 루트에서 전체 서비스 빌드 및 실행
    cd ..
    docker compose up -d --build

    # 마이그레이션 및 시딩
    docker compose exec backend npx prisma migrate deploy
    DATABASE_URL="postgresql://erp_user:erp_password@localhost:5432/erp_db?schema=public" npx tsx backend/prisma/seed.ts

접속: `http://localhost:8090`

### 서비스 구성

| 서비스 | 이미지 | 포트 |
|---|---|---|
| postgres | postgres:16-alpine | 5432 |
| redis | redis:7-alpine | 6379 |
| backend | 자체 빌드 (NestJS) | 4000 |
| frontend | 자체 빌드 (Nginx + React 정적 파일) | 8090 → 80 |

모든 서비스에 헬스체크가 구성되어 있어 `docker compose ps`로 상태를 확인할 수 있습니다.

## CI/CD 파이프라인

`.github/workflows/deploy.yml`에 정의된 GitHub Actions 워크플로우가 `main` 브랜치 push마다 자동 실행됩니다. **Self-hosted Runner**를 배포 대상 서버에 직접 설치하여, 외부에 포트를 열지 않고도(아웃바운드 연결만으로) 배포를 자동화했습니다.

파이프라인 단계:
1. **build-and-test** — 백엔드/프론트엔드 각각 의존성 설치 및 빌드 검증
2. **deploy** (main 브랜치 push 시에만 실행)
   - 롤백을 위해 현재 이미지를 `:previous` 태그로 백업
   - 새 이미지 빌드 및 배포 (`docker compose up -d`)
   - Prisma 마이그레이션 적용
   - `/api/health` 및 프론트엔드 응답을 최대 10회 재시도하며 헬스체크
   - **헬스체크 실패 시 자동으로 `:previous` 이미지로 롤백**

## 부하 테스트

k6를 사용해 최대 30명 동시 사용자 시나리오(로그인 → 대시보드 조회 → 직원 목록 조회)로 부하 테스트를 진행했습니다. 상세 결과는 [`LOAD_TEST_REPORT.md`](./LOAD_TEST_REPORT.md)를 참고하세요.

    cd loadtest
    k6 run scenario.js

**요약**: 30명 동시 사용자 기준 p95 응답시간 53.18ms, 요청 실패율 0%로 모든 임계값을 통과했습니다.

## API 문서

백엔드 실행 후 아래 주소에서 Swagger UI로 전체 API 스펙을 확인할 수 있습니다.

    http://localhost:4000/api/docs

`/api/auth/login`으로 로그인 후 발급받은 Access Token을 우측 상단 **Authorize** 버튼에 입력하면, 인증이 필요한 API도 바로 테스트할 수 있습니다.

## 라이선스

개인 학습 및 포트폴리오 목적으로 제작되었습니다.
