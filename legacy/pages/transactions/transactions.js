// 1. 백엔드 API 서버의 기본 주소 설정 (이 서버로 이동해서 데이터들을 받아오기 위해)
const API_BASE = 'http://localhost:4000/api';

/**
 * [API 통신 헬퍼 함수, 비동기 함수=async]
 * 백엔드 서버에서 데이터를 가져오는 역할을 합니다.
 * 2초 동안 응답이 없으면 에러를 발생시켜 자동으로 화면이 '더미 데이터'로 전환
 */
async function apiRequest(path, options = {}) {
  // AbortController는 진행 중인 네트워크 요청을 강제로 취소할 수 있는 브라우저 기능입니다.
  const controller = new AbortController(); 
  const id = setTimeout(() => controller.abort(), 2000); // 2초 후 실행 (setTimeout 함수)

  try {
    // fetch(): 서버에 HTTP 요청을 보내는 브라우저 표준 API
    const res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' }, 
      signal: controller.signal, // 취소 신호 전달
      ...options
    });
    
    clearTimeout(id); // 요청이 성공하면 타임아웃 타이머를 해제합니다.
    
    if (!res.ok) throw new Error(`요청 실패 (${res.status})`);
    
    return await res.json(); // 서버 응답(JSON)을 자바스크립트 객체/배열로 변환
  } catch (err) {
    clearTimeout(id);
    throw err; // 에러를 감지하여 호출한 곳(catch)으로 전달
  }
}

// 2. 상태 관리 (State)
// 화면의 조건(어떤 계좌가 선택되었는지, 어떤 거래유형이 선택되었는지)을 저장하는 변수들입니다.
let accounts = [];                // 전체 계좌 목록 데이터를 담을 배열
let currentAccountFilter = 'all'; // 현재 선택된 계좌 ID (초기값 all)
let currentTypeFilter = 'all';    // 현재 선택된 거래 유형 ('all', 'in', 'out')

// 3. 유틸리티 (도움) 함수
/**
 * 숫자를 한국 원화 형식(예: 30000 -> "30,000원")으로 변환하는 함수
 */
function formatWon(amount) {
  return Number(amount).toLocaleString('ko-KR') + '원';
}

/**
 * 계좌 ID를 받아서 전체 계좌 목록(accounts) 중 해당하는 계좌 객체를 찾아주는 함수
 */
// dummy data set에서 내가 입력하는 id와 같은 계좌만 반환함 (map 함수처럼 순환)
function findAccount(id) {
  return accounts.find(acc => acc.id === id);
}

// 4. 앱 초기 실행 이벤트
// HTML 문서의 모든 요소(DOM)가 준비되었을 때 순차적으로 실행됩니다.
// document.addEventListener (이벤트 이름, 실행할함수)
// await(), async가 비동기 함수니까, 순서대로 기다리며 실행, 즉 완료되면 하겠다!
document.addEventListener('DOMContentLoaded', async () => {
  initUIEvents();          // 1) 거래 유형(전체/입금/출금) 버튼 클릭 이벤트 등록
  await loadAccounts();    // 2) 계좌 목록 데이터 받아오기 및 상단 버튼 생성
  await loadTransactions(); // 3) 거래 내역 받아오기 및 화면에 출력
});

/**
 * [계좌 목록 로드 함수]
 * 서버에서 계좌 목록을 불러온 뒤 상단 스크롤 영역에 버튼으로 만들어 배치합니다.
 */

async function loadAccounts() {
  // HTML(<section class = "account-List")에서 계좌 버튼들이 들어갈 컨테이너 영역 선택
  const accountListContainer = document.querySelector('.account-list');

  // try { ... } catch (err) { ... } : API에게 계좌 목록을 요청하고, 실패할 경우 catch(err)
  try {
    // 서버에 GET /api/accounts 요청
    accounts = await apiRequest('/accounts');
  } catch (err) {
    console.warn('API 서버 연결 실패');
  }

  if (accountListContainer) {
    // 1) 기본으로 맨 앞에 들어갈 '전체 계좌' 버튼 HTML (초기 active 상태)
    let html = `<button type="button" class="account active" data-acc="all">전체 계좌</button>`;

    // 2) map(): 계좌 배열을 순회하면서 <button> HTML 문자열 배열로 바꾸고, join('')으로 하나로 합침
    html += accounts.map(acc => `
      <button type="button" class="account" data-acc="${acc.id}">${acc.nickname}</button>
    `).join('');

    // HTML 요소 안에 생성된 버튼들을 대입
    accountListContainer.innerHTML = html;

    // 동적으로 새로 생성된 계좌 버튼들에게 클릭 이벤트를 연결
    bindAccountFilterEvents();
  }
}

/**
 * [거래 내역 로드 및 필터링 함수]
 * 선택된 필터 조건(currentAccountFilter, currentTypeFilter)에 따라 데이터를 조회합니다.
 */
async function loadTransactions() {
  const txListContainer = document.getElementById('tx-list');
  if (!txListContainer) return;

  let transactions = [];

  try {
    // URLSearchParams: URL 뒤에 붙는 쿼리스트링(?accountId=acc-1&type=in)을 쉽게 만들어주는 객체
    const params = new URLSearchParams();
    if (currentAccountFilter !== 'all') params.append('accountId', currentAccountFilter);
    if (currentTypeFilter !== 'all') params.append('type', currentTypeFilter);

    // 서버에 GET /api/transactions?조건 요청
    transactions = await apiRequest(`/transactions?${params.toString()}`);
  } catch (err) {
    console.warn('API 서버 연결 실패: 로컬 더미 거래 내역을 사용합니다.');
    
    // 서버 연결 실패 시: 자바스크립트의 filter() 메서드로 더미 데이터를 직접 정제
    transactions = getMockTransactions().filter(tx => {
      const matchAccount = currentAccountFilter === 'all' || tx.accountId === currentAccountFilter;
      const matchType = currentTypeFilter === 'all' || tx.type === currentTypeFilter;
      return matchAccount && matchType; // 두 조건이 모두 true인 항목만 추출
    });
  }

  // 받아온 데이터를 화면에 렌더링하는 함수 호출
  renderTransactions(transactions);
}

/**
 * [거래 내역 화면 렌더링 함수]
 * 정제된 거래 내역 데이터를 날짜별로 그룹화하여 HTML 카드로 화면에 보여줍니다.
 */
function renderTransactions(transactions) {
  const txListContainer = document.getElementById('tx-list');
  if (!txListContainer) return;

  // 거래 내역이 없을 경우 예외 처리
  if (!transactions || transactions.length === 0) {
    txListContainer.innerHTML = `<div style="text-align:center; padding: 40px; font-size: 13px; color: var(--graphite);">조건에 맞는 거래 내역이 없습니다.</div>`;
    return;
  }

  // 1) 날짜별 그룹핑 객체 만들기 (예: { '2026-08-23': [거래1, 거래2], '2026-08-22': [거래3] })
  const groupedByDate = {};
  transactions.forEach(tx => {
    const date = tx.date;
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(tx);
  });

  // 2) 날짜들을 최신순(역순)으로 정렬
  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  // 3) HTML 생성 과정
  let html = '';
  sortedDates.forEach(date => {
    html += `<div class="tx-group">`;
    html += `<div class="tx-date">${date}</div>`; // 날짜 헤더

    // 해당 날짜 안의 거래 내역들을 하나씩 순회
    groupedByDate[date].forEach(tx => {
      const acc = findAccount(tx.accountId); // 계좌 정보 찾기
      const isIncome = tx.type === 'in';      // 입금 여부 확인 (true/false)
      const sign = isIncome ? '+' : '-';      // 기호 표시
      const amountClass = isIncome ? 'in' : 'out'; // CSS 클래스명 지정
      const icon = isIncome ? '⬇️' : '⬆️';   // 아이콘
      
      // 삼항 연산자를 이용해 처리 상태 배지 HTML 구별
      const badgeHtml = tx.status === 'done'
        ? `<span class="badge done">완료</span>`
        : `<span class="badge pending">처리중</span>`;

      // 템플릿 리터럴(` `)을 사용해 거래 내역 카드 HTML 생성
      html += `
        <div class="tx-card" data-id="${tx.id}">
          <div class="tx-left">
            <div class="tx-icon ${amountClass}">${icon}</div>
            <div class="tx-info">
              <div class="tx-title">${tx.desc}</div>
              <div class="tx-sub">${tx.time} · ${acc ? acc.nickname : '계좌'} ${badgeHtml}</div>
            </div>
          </div>
          <div class="tx-right">
            <div class="tx-amount ${amountClass}">${sign}${formatWon(tx.amount)}</div>
            <div class="tx-balance">잔액 ${formatWon(tx.balanceAfter)}</div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  });

  // 최종 생성된 전체 HTML을 화면 요소에 삽입
  txListContainer.innerHTML = html;
}

/**
 * [입출금 유형 필터 버튼 이벤트 설정]
 * '전체', '입금', '출금' 버튼 클릭 시 선택 상태를 변경합니다.
 */
function initUIEvents() {
  const filterBtns = document.querySelectorAll('.filter-group .filter-btn');
  
  filterBtns.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      // 1) 모든 필터 버튼에서 활성화(active) 클래스를 제거
      filterBtns.forEach(b => b.classList.remove('active'));
      
      // 2) 클릭된 현재 버튼에만 active 클래스 추가 (파란색으로 강조)
      e.currentTarget.classList.add('active');

      // 3) 클릭된 버튼 인덱스(0, 1, 2)에 따라 상태 변수 업데이트
      if (index === 0) currentTypeFilter = 'all';
      else if (index === 1) currentTypeFilter = 'in';
      else if (index === 2) currentTypeFilter = 'out';

      // 4) 변경된 조건으로 거래 내역 다시 불러오기
      loadTransactions();
    });
  });
}

/**
 * [상단 계좌 선택 버튼 이벤트 설정]
 * 동적으로 만들어진 계좌 버튼을 클릭했을 때 동작을 지정합니다.
 */
function bindAccountFilterEvents() {
  const accountBtns = document.querySelectorAll('.account-list .account');
  
  accountBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // 1) 모든 계좌 버튼에서 active 클래스 제거
      accountBtns.forEach(b => b.classList.remove('active'));
      
      // 2) 클릭한 계좌 버튼에 active 클래스 추가
      e.currentTarget.classList.add('active');

      // 3) HTML의 data-acc 속성값을 읽어서 계좌 필터 상태 변수 업데이트
      currentAccountFilter = e.currentTarget.dataset.acc || 'all';

      // 4) 변경된 계좌 조건으로 거래 내역 다시 불러오기
      loadTransactions();
    });
  });
}

/**
 * [더미 데이터 제공 함수]
 * 백엔드 API 서버가 켜져있지 않을 때 사용할 모의 거래내역 리스트입니다.
 */
function getMockTransactions() {
  return [
    { id: 1, accountId: 'acc-1', date: '2026-08-23', time: '09:12', desc: '스타벅스 강남점', type: 'out', amount: 5800, balanceAfter: 2384560, status: 'done' },
    { id: 2, accountId: 'acc-1', date: '2026-08-22', time: '18:40', desc: '월급입금 (주식회사 원)', type: 'in', amount: 3200000, balanceAfter: 2390360, status: 'done' },
    { id: 3, accountId: 'acc-1', date: '2026-08-22', time: '12:05', desc: '이서연', type: 'out', amount: 30000, balanceAfter: 809640, status: 'done' },
    { id: 4, accountId: 'acc-2', date: '2026-08-21', time: '10:00', desc: '자동이체 - 적금', type: 'out', amount: 500000, balanceAfter: 15200000, status: 'done' },
    { id: 5, accountId: 'acc-1', date: '2026-08-20', time: '20:15', desc: '배달의민족', type: 'out', amount: 18900, balanceAfter: 15839640, status: 'pending' },
    { id: 6, accountId: 'acc-3', date: '2026-08-19', time: '09:00', desc: '청년도약 납입', type: 'in', amount: 300000, balanceAfter: 5000000, status: 'done' },
    { id: 7, accountId: 'acc-1', date: '2026-08-18', time: '14:22', desc: '박지훈', type: 'in', amount: 50000, balanceAfter: 15858540, status: 'done' }
  ];
}