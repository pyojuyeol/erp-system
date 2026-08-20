# ERP System Boilerplate

React + NestJS 기반 ERP 프로젝트 초기 스캐폴딩입니다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | React 19 + TypeScript + Vite, Ant Design, React Query, Zustand, React Router |
| 백엔드 | NestJS (TypeScript) |
| ORM | Prisma |
| DB | PostgreSQL |
| 캐시 | Redis |
| 인증 | JWT (+ Passport, OAuth2 확장 가능) |
| 인프라 | Docker 미사용 — PM2 + Nginx |

## 폴더 구조

```
erp-project/
├── frontend/                # React + Vite 앱
│   └── src/
│       ├── api/             # axios client
│       ├── app/             # queryClient 등 앱 레벨 설정
│       ├── components/      # 공통 레이아웃/가드
│       ├── features/        # 도메인별 (auth, employees, dashboard)
│       ├── store/           # zustand 스토어
├── backend/                 # NestJS 앱
│   ├── prisma/schema.prisma # DB 스키마
│   └── src/
│       ├── common/          # guards, decorators, filters
│       ├── config/
│       └── modules/         # prisma, auth, employees, ...
├── ecosystem.config.js      # PM2 배포 설정
```

## 로컬 개발 환경 준비

### 1. 사전 요구사항
- Node.js 20+
- PostgreSQL 15+ (로컬 설치 또는 클라우드 인스턴스)
- Redis 7+

### 2. 프론트엔드

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_BASE_URL 확인
npm run dev                # http://localhost:5173
```

### 3. 백엔드

```bash
cd backend
npm install
cp .env.example .env       # DATABASE_URL, JWT_SECRET 등 채우기

# Prisma Client 생성 및 마이그레이션
npx prisma generate
npx prisma migrate dev --name init

npm run start:dev          # http://localhost:4000/api
```

> ⚠️ 이 스캐폴딩은 네트워크 제약이 있는 샌드박스에서 생성되어 `npx prisma generate`가
> 실행되지 못했습니다. 로컬 환경에서 위 명령을 최초 1회 실행해야 타입 에러 없이 빌드됩니다.

### 4. 프로덕션 배포 (Docker 없이)

```bash
# 백엔드 빌드
cd backend && npm run build

# 루트에서 PM2로 실행
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
```

Nginx는 `/`를 frontend 빌드 결과(`frontend/dist`)로, `/api`를 백엔드(포트 4000)로
리버스 프록시하도록 설정하면 됩니다.

## 구현된 예시 기능
- 로그인 (JWT 발급 → 프론트에서 axios 인터셉터로 자동 첨부, 401 시 자동 로그아웃)
- Role 기반 접근 제어 (`@Roles('ADMIN', 'MANAGER')` 데코레이터 + RolesGuard)
- 직원(Employees) CRUD 예시 (Prisma 연동, React Query로 목록 조회)
- Ant Design 기반 사이드바 레이아웃, 대시보드 통계 카드

## 다음에 추가하면 좋은 것들
- Refresh Token 로테이션, Google OAuth2 Strategy 실제 연동
- 부서(Departments), 급여, 회계 등 추가 도메인 모듈
- Redis를 활용한 캐싱 (예: 대시보드 통계)
- 파일 업로드 (S3 or 로컬 스토리지)
- Swagger(OpenAPI) 문서 자동화 (`@nestjs/swagger`)
- GitHub Actions CI/CD 파이프라인
