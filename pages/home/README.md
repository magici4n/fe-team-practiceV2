# 홈 화면

WON 실습뱅킹의 홈 화면
같은 화면을 **바닐라 JS**와 **React** 두 가지로 구현

- `vanilla/` 별도 설치 없이 바로 실행됨
- `react/`   같은 화면을 React로 옮긴 버전

---

## 폴더 구성

```
pages/home/
├── README.md
├── vanilla/
│   ├── home.html
│   ├── home.css
│   └── home.js
└── react/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx              라우팅
        ├── index.css            vanilla/home.css와 동일
        ├── api/client.js        API 계층
        ├── hooks/useHomeData.js 데이터 로딩 + 상태
        ├── utils/format.js      금액 포맷
        ├── components/
        │   ├── AccountCard.jsx
        │   ├── RecentItem.jsx
        │   └── StateMessage.jsx  로딩 / 비어있음 / 오류
        └── pages/Home.jsx
```

---

## 실행 방법

### 1. API 서버 (터미널 1)

```bash
cd won-banking-api
npm start        # http://localhost:4000
```

### 2. 화면 (터미널 2)

`file://`로 직접 열면 CORS에 막히므로 정적 서버로 띄웁니다.
다른 페이지로 가는 링크가 `../../`로 상위 폴더를 참조하기 때문에
**반드시 저장소 루트에서** 실행해야 합니다.

```bash
# 저장소 루트에서
npx serve .
```

접속 주소: `http://localhost:3000/pages/home/vanilla/home.html`

VS Code의 Live Server 확장을 써도 됨

### React 버전

```bash
cd pages/home/react
npm install
npm run dev      # http://localhost:5173
```

---

## 사용하는 API

명세: `won-banking-api-specification.html` 참고

| 메서드 | 경로 | 용도 |
|---|---|---|
| GET | `/api/accounts` | 계좌 목록 → 총자산 계산 + 계좌 카드 |
| GET | `/api/transactions?limit=4` | 최근 거래 4건 |

### 총자산 계산

서버가 합계를 주지 않으므로 클라이언트에서 계산합니다. (원래는 서버에서 계산하는 것이 옳은편)

```js
const total = accounts.reduce((sum, a) => sum + a.balance, 0);
```

계좌가 3개뿐이라 이렇게 했지만, 실제 서비스라면 페이지네이션·대출 계좌·외화 등
때문에 서버가 계산한 값을 받아야 함

### 서버 상태 확인

명세에 `/health` 엔드포인트가 없어서 별도 헬스체크를 두지 않고,
`GET /accounts`의 성공 여부로 서버 상태를 함께 판단합니다. 따라서 요청 한번 줄어듦

---

## 오류 처리

`fetch`는 404나 500을 받아도 예외를 던지지 않기 때문에, 실패를 두 단계로 나눠 잡음

| 구분 | 판단 기준 | 화면 표시 |
|---|---|---|
| 네트워크 실패 | `fetch`가 예외를 던짐 (상태 코드 없음) | 연결 배너 `error` + "서버에 연결할 수 없습니다" |
| 4xx | `res.ok === false`, `status < 500` | 서버가 준 `message` 그대로 |
| 5xx | `res.ok === false`, `status >= 500` | 일반화된 문구. 원본은 `console.error`로만 |

5xx의 서버 원본 메시지에는 스택 트레이스 등 내부 정보가 담길 수 있어 화면에 노출하지 않는다.

네트워크 실패와 5xx는 일시적일 수 있어 500ms 후 1회 재시도
4xx는 재시도하지 않는다. `POST /transfers` 같은 쓰기 요청도 재시도하면
이체가 두 번 실행될 수 있어 제외

---

## 화면 상태

계좌 목록과 최근 거래는 각각 아래 상태를 가짐

```
로딩      스피너 + "불러오는 중"
성공      목록 렌더
비어있음  "아직 거래내역이 없습니다"   (거래만 해당)
오류      .empty-state.error 로 사유 표시
```

---

## 구현하면서 신경 쓴 것

### 1. 이벤트 위임

`innerHTML`로 목록을 갈아끼우면 기존 DOM 노드가 폐기되면서 이벤트 리스너도 함께
사라짐. 매번 재등록하는 대신, 교체되지 않는 컨테이너에 한 번만 등록함.

```js
$('recentList').addEventListener('click', (e) => {
  const item = e.target.closest('.recent-item');
  if (!item) return;
  location.href = `${PAGES.transactions}?txId=...`;
});
```

### 2. 서버 호출과 렌더 분리

데이터는 `state`에 캐시하고, 렌더 함수는 그 상태만 읽음.
그래서 잔액 숨기기 토글은 서버를 다시 부르지 않음.

### 3. XSS 방어

`innerHTML`은 값을 HTML로 해석하므로, 서버에서 온 문자열은 반드시
`escapeHtml()`을 통과시킴. 계좌 별칭에 `<img src=x onerror="...">` 같은 값이
들어와도 글자 그대로 표시됨.

### 4. 접근성

- 라이브 리전(`aria-live`)을 안쪽 문구가 아니라 컨테이너에 걸었음
  페이지 로드 시점부터 DOM에 있어야 내부 변경이 스크린리더에 읽힌다
- 입출금을 색으로만 구분하지 않도록 `+/-` 부호와 `sr-only` 텍스트를 함께 넣음
- `prefers-reduced-motion`을 켠 사용자에게는 회전 스피너 대신 투명도 변화를 씀
- 총자산 금액은 별도 `<span id="totalAmount">`로 감쌈
  `.amount` 전체를 덮어쓰면 안의 `sr-only` 안내가 사라지기 때문

---

## 다른 페이지로 가는 경로

`home.html`의 위치가 `pages/home/vanilla/`이므로 형제 폴더로 가려면
두 단계 올라가야 함

| 대상 | 경로 |
|---|---|
| 거래내역 | `../../transactions/index.html` |
| 이체 | `../../transfer/transfer.html` |

`home.js` 상단의 `PAGES` 상수에 모아둠
-> 폴더명이나 파일명이 바뀌면 그 두 줄만 고치면 됨

```js
const PAGES = {
  transactions: '../../transactions/index.html',
  transfer: '../../transfer/transfer.html',
};
```

계좌 카드는 `?accountId=`, 최근 거래는 `?txId=`를 쿼리로 넘김
거래내역 페이지에서 이 값을 받아 처리해주세요.

---

## 바닐라 → React 대응표

| 바닐라 | React |
|---|---|
| `home.html`의 마크업 | `Home.jsx`의 JSX |
| `document.getElementById('totalAmount')` | 없음 (구조와 동작이 같은 파일에 있음) |
| `state.masked` + `renderTotal()` 호출 | `const [masked, setMasked] = useState(false)` |
| `innerHTML = accounts.map(...).join('')` | `{accounts.map(a => <AccountCard ... />)}` |
| `addEventListener` + 재등록 | `onClick={...}` |
| `escapeHtml(a.nickname)` | `{a.nickname}` (자동 이스케이프) |
| `init()` 호출 | `useEffect(() => { load() }, [])` |
| `state` 객체 + `loadRecent()` | `hooks/useHomeData.js` |
| `home.js`의 `apiRequest` | `api/client.js` (거의 그대로) |
| `home.css` | `index.css` (`class` → `className`만 다름) |
| `history.html` 링크 (MPA) | `<Link to="/transactions">` (SPA 라우팅) |

---

## 남은 것

- [ ] **거래 상세 시트** — 홈과 거래내역 양쪽에서 쓰는 공용 컴포넌트라
      어디서 만들지 협의 필요. 현재는 홈에서 시트를 열지 않고
      `../../transactions/index.html?txId=...`로 넘기고 있음
- [ ] 거래 데이터의 `status` 필드(`done` / `pending`)는 아직 화면에 표시하지 않음
- [ ] React `api/client.js`에 팀원 화면용 엔드포인트
      (`/accounts/:id`, `/transactions/:id`, `/transfer/lookup`, `POST /transfers`)를
      미리 정의해 둠. 홈에서는 사용하지 않음
