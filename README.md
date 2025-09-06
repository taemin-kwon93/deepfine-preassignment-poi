# deepfine-preassignment-poi

------------------------------------------------------------------------------------------------------------------------
Express + PostgreSQL 기반의 POI(관심지점) 관리/표시 애플리케이션입니다.   
엑셀 업로드로 POI를 일괄 등록하고, 지도(Tmap) 위에 마커로 표시합니다.   
Docker Compose로 웹/DB를 함께 실행할 수 있습니다.  
사전과제 시연 영상 [링크](https://youtu.be/tiFwvtKM9cA)

## 주요 기능
- POI 목록 API: `GET /poi`
- `/getScript` 라우트로 Tmap SDK를 안전하게 불러옵니다.
- 엑셀 업로드를 통한 POI 일괄 등록: `POST /poi/import`
- Tmap SDK 프록시: `GET /getScript` (페이지에 API Key 노출 방지)
- 지도 페이지: `GET /index` (검색, 새로고침, 업로드 UI)

## 기술 스택
- Runtime: Node.js v22.16.0
- Web: Express, EJS, vanilla JS
- DB: PostgreSQL 16
- 컨테이너: Docker, Docker Compose
- 테스트: Jest, Supertest
- Lint: ESLint
------------------------------------------------------------------------------------------------------------------------

## 빠른 시작

### 1) Docker(권장)
사전 준비
- Docker Desktop 설치 및 실행
- `.env` 생성: `cp .env.example .env` 후 `TMAP_API_KEY`를 채움

실행
```
docker compose up -d --build
```

접속
- http://localhost:3535/index

데이터베이스
- 최초 기동 시 `schema.sql`이 자동 적용되어 `poi` 테이블이 생성됩니다.
- 테이블 확인: `docker exec -it poi-db psql -U ${PGUSER:-postgres} -d ${PGDATABASE:-codingtest} -c "\dt"`

자주 쓰는 명령
- 로그 보기: `docker compose logs -f web`
- 재빌드/재시작: `docker compose up -d --build`
- 전체 중지: `docker compose down`

### 2) 로컬(Node만)
사전 준비
- Node.js v22.16.0
- PostgreSQL (로컬 실행) 및 접속 정보 준비

설치/실행
```
npm ci
cp .env.example .env  # TMAP_API_KEY 등 채우기

# DB 스키마 적용(로컬 psql 사용 시)
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f schema.sql

npm start
```

열기: http://localhost:3535/index

------------------------------------------------------------------------------------------------------------------------
## 환경 변수
`.env.example` 참고
- 앱: `PORT`(기본 3535), `NODE_ENV`
- TMAP: `TMAP_API_KEY`(필수), `TMAP_VERSION`(기본 1)
- DB(PG): `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

연결 우선순위
- `app/modules/db.psql.js`는 PG 환경변수를 최우선으로 사용합니다.
- 환경변수가 없으면 `config.json`의 `db_server` 값을 사용합니다.
------------------------------------------------------------------------------------------------------------------------
## API
### GET /poi
- 응답: `{ statusCode, resultData: Array<{name, latitude, longitude,...}>, resultCnt }`

### POST /poi/import
- 폼 필드: `file`(.xlsx/.xls)
- 헤더 예시(대소문자 무관): `Title`, `Latitude`, `Longitude`
- 처리: 기존 데이터 `TRUNCATE` 후 벌크 인서트(트랜잭션)
- 응답: `{ statusCode, message: 'Imported', resultCnt }`

### GET /getScript
- 환경변수 `TMAP_API_KEY`로 Tmap SDK를 프록시
- 키 미설정 시 500 반환

### GET /index
- 지도 초기화, 위치 추적, POI 로드/검색 UI 제공

------------------------------------------------------------------------------------------------------------------------
## 프런트엔드 동작 요약
- 최초 로드 시 Tmap SDK가 준비되면 지도 생성 → 위치 추적 → `/poi` 로드 → 마커 표시
- refresh 버튼: `/poi` 재조회 후 마커 갱신
- import 버튼: 엑셀 파일 업로드 → 서버에서 등록 후 카운트 알림
- 검색: 입력 후 Enter 또는 돋보기 버튼 클릭 시 부분 일치로 첫 후보를 센터링

## 스크립트
- 테스트: `npm test`
- 린트: `npm run lint`, 자동수정: `npm run lint:fix`
- 시작: `npm start`

## 테스트
Jest + Supertest
- `tests/index.test.js`: `/index` 렌더링 및 `/getScript` 참조 확인
- `tests/getScript.test.js`: Tmap 프록시 성공/에러/상태코드 전파(https 모킹)
- `tests/poiList.test.js`: `GET /poi` 성공/에러 처리(DB 모킹)
- `tests/poiImport.test.js`: 엑셀 업로드, 트랜잭션 성공/롤백(DB/xlsx 모킹)
------------------------------------------------------------------------------------------------------------------------
## 트러블슈팅
- 위치 권한 프롬프트가 보이지 않음: 브라우저 사이트 설정에서 위치 권한을 허용했는지 확인
- `/getScript`가 500: `.env`에 `TMAP_API_KEY` 설정
- 스키마가 적용되지 않음: DB 볼륨을 이미 사용 중이면 init 스크립트가 재실행되지 않음 → `docker compose down -v`로 초기화하거나 수동 적용
- 포트 충돌: `.env`의 `PORT`/`PGPORT` 변경 후 재기동

------------------------------------------------------------------------------------------------------------------------
## 참고 · 프로젝트 관리

본 과제는 GitHub Projects의 **칸반 보드**로 전 과정과 산출물을 **관리**했습니다.

- **보드 링크**: [Project 칸반보드](https://github.com/users/taemin-kwon93/projects/3)
- **추적 원칙**
  - 모든 작업은 **Issue 1건**으로 시작 → 브랜치 생성(`feat/...-#이슈번호`) → **PR**로 연결
  - PR 본문에 `Closes #<이슈번호>`를 사용해 **자동 연결/자동 종료**
- **워크플로우**
  - Backlog → In Progress → Review → Done
  - 각 카드에는 **목표, 수용 기준(AC), 테스트 방법, 관련 링크**를 포함
- **완료 기준(DoD)**
  - 테스트 통과(Jest/Supertest), 린트 통과
