# WON 실습뱅킹

홈·이체·거래내역을 하나의 React 앱으로 통합했습니다. 앞으로 수정할 코드는 `src/`입니다.

## 실행

```bash
npm install
npm run api   # 터미널 1: http://localhost:4000
# 다른 터미널에서
npm run dev   # 터미널 2: http://localhost:5173
```

화면: http://localhost:5173. 제공된 `won-banking-api` 교육용 Express 서버를 `server/`에 포함했습니다. 루트에서 한 번 설치하면 서버와 화면을 각각 실행할 수 있습니다. 서버 데이터는 메모리에만 저장되므로 서버를 재시작하면 초기화됩니다. 서버가 꺼져 있으면 화면에 오류와 다시 시도 버튼을 표시합니다.

```bash
npm run build
npm test
```

개발 서버는 `/api` 요청을 `localhost:4000`으로 프록시합니다. 다른 API 주소를 사용하려면 `.env.example`을 `.env.local`로 복사하여 `VITE_API_BASE_URL`을 설정합니다. 배포 환경은 `/api` 역방향 프록시와 SPA 경로(`/transfer`, `/history`)의 `index.html` fallback을 설정하거나, 빌드 전에 API URL을 지정해야 합니다. 별도 도메인의 API는 서버 CORS 설정이 필요합니다.

## 구조와 팀 작업 영역

```text
src/
  App.jsx                    # 공통 라우팅
  layouts/BankingLayout.jsx   # 프레임·헤더·하단 탭
  api/client.js              # 공통 API 요청과 오류 처리
  api/transfer.js            # 화면 예금주 → toOwnerName 요청 변환
  hooks/useAccounts.js       # 화면 진입 시 계좌 조회
  styles/                    # 공통 색상·폰트·초기화·레이아웃
  pages/
    home/                    # 홈 담당
    transfer/                # 이체 담당
    transactions/            # 거래내역 담당
legacy/pages/                # 통합 전 개별 프로젝트, 참고용
legacy/data.cjs              # 기존 서버용 더미 데이터, 참고용
tests/                       # API 계약과 실패 처리 검사
server/                      # 제공된 교육용 Express API와 인메모리 데이터
docs/won-banking-api-specification.html  # 제공된 API 명세
```

페이지 담당자는 자기 `src/pages/` 폴더를 수정합니다. 공통 레이아웃·의존성·API 변경은 팀에서 함께 맞춥니다. 원본은 `legacy/`에 보존하고 현재 앱에서 import하지 않습니다.

## 통합 기준

- 이체·거래내역 두 프로젝트의 React 19 / Vite 8 설정을 기준으로 통일했습니다. 홈의 React Router 6 경로를 유지했습니다.
- 홈·이체에서 일치하던 390×844 프레임, 최대 높이, 헤더, 하단 탭 크기를 공통 규격으로 삼았습니다.
- 세 페이지의 색상·폰트 변수는 공통 파일로 옮겼습니다. 본문 카드·필터·이체 입력 화면의 기존 수치는 유지하고, 페이지 CSS를 `.home-page`, `.transfer-page`, `.transactions-page` 아래로 제한했습니다.
- 계좌 ID는 서버가 반환하는 값을 그대로 사용합니다. 서로 달랐던 로컬 ID를 새로 만들거나 변환하지 않습니다.
- `/history?accountId=...`는 해당 계좌를 선택하고, `type=in|out`은 입출금을 필터링합니다. `txId`는 해당 거래를 강조하고 거래·계좌 상세 API를 조회하여 상세창을 엽니다. 거래 항목 클릭과 키보드 Enter로 열 수 있고, 닫기 또는 Escape로 닫습니다.
- 이체 성공은 서버 응답으로 판단합니다. 완료 후 홈·거래내역에 진입하면 서버 데이터를 다시 조회합니다. 입력 단계는 이체 페이지 안에서만 관리합니다.

## API 연결 계약

`docs/won-banking-api-specification.html`과 함께 제공된 서버 코드에 맞춰 연결했습니다. 인증은 명세대로 생략합니다. 화면의 `ownerName`은 `src/api/transfer.js`에서 요청 필드 `toOwnerName`으로 변환합니다.

| 요청 | 기대 응답 / 용도 |
|---|---|
| `GET /api/accounts` | 계좌 배열: `id, nickname, accountNo, type, balance` |
| `GET /api/accounts/:accountId` | 단일 계좌: 거래 상세창의 계좌 정보 |
| `GET /api/transactions?accountId=...&type=...&limit=...` | 최신순 거래 배열: `id, accountId, date, time, desc, type, amount, balanceAfter, status` |
| `GET /api/transactions/:id` | 단일 거래: 거래 상세창 |
| `GET /api/transfer/lookup?bank=...&accountNo=...` | `{ "ownerName": "이서연" }` |
| `POST /api/transfers` | 본문 `{ fromAccountId, toBank, toAccountNo, toOwnerName, amount }`, 성공 시 201과 `{ transaction, account: { id, balance } }` |

거래 `type`은 `in/out`, `status`는 `done/pending`, `amount`는 양수 원 단위입니다. 실패 응답은 `{ message }`를 사용합니다. 제공된 서버는 필수 항목, 출금 계좌, 최소 1,000원, 잔액을 검증하고 잔액 차감과 거래내역 생성을 처리합니다. 완료 화면의 금액·예금주·이체 후 잔액은 서버 응답으로 표시합니다.

조회 네트워크 오류/5xx는 한 번 재시도합니다. 이체 POST는 자동 재시도하지 않고 진행 중 중복 클릭을 막습니다. 응답 유실 또는 잘못된 성공 응답은 거래내역을 확인하도록 안내합니다. 서버는 제공된 교육용 구현이며 DB 저장이나 실제 은행 연결은 포함하지 않습니다.

## 통합 흐름 검증

`npm test`는 API 클라이언트 검사와 임시 포트에서 제공된 Express 서버를 실행하는 HTTP 통합 검사를 수행합니다. 필수 예금주 전달, 최소 금액, 잔액 부족, 없는 계좌·거래, 이체 후 잔액·거래내역 일치를 검증합니다. 수동 검증을 별도 포트에서 하고 싶다면 같은 서버를 아래처럼 실행합니다.

```powershell
# 터미널 1: 메모리에서만 변경되는 테스트 데이터, 종료하면 초기화
node tests/fixtures/api-server.mjs

# 터미널 2: 테스트 API를 지정한 별도 개발 서버
$env:VITE_API_BASE_URL='http://127.0.0.1:4011/api'
npm run dev -- --port 5174
```

예금주 테스트 번호: `1002987654321` (이서연). 제공된 서버에 연결한 브라우저에서 거래 상세 조회와 30,000원 이체 성공, 서버 잔액 표시, 홈 잔액 감소와 최근 거래 추가를 확인했습니다. 원본 서버의 거래 ID 초기값은 마지막 거래 ID 기준으로 조정해 첫 신규 거래가 명세 예제처럼 8부터 생성됩니다.
