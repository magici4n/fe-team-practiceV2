/* =========================================================================
   WON 실습뱅킹 — 홈 화면 스크립트
   =========================================================================
   설계 원칙 3가지
   1) 서버 호출(load)과 화면 그리기(render)를 분리한다.
      → 마스킹 토글처럼 데이터가 그대로인 동작은 서버를 다시 부르지 않는다.
   2) 이벤트는 위임(delegation)으로 컨테이너에 한 번만 등록한다.
      → innerHTML 교체 후 리스너를 다시 붙일 필요가 없어진다.
   3) 서버에서 온 문자열은 화면에 넣기 전에 반드시 이스케이프한다.
      → innerHTML은 값을 HTML로 해석하므로 XSS 통로가 된다.
   ========================================================================= */

(() => {
  'use strict';

  const API_BASE = 'http://localhost:4000/api';

  /* =======================================================================
     1. API 계층
     ======================================================================= */

  /**
   * fetch는 404나 500을 받아도 예외를 던지지 않는다(요청 자체는 성공했으므로).
   * 그래서 실패를 두 단계로 나눠서 잡는다.
   *   1단계: fetch가 던지는 예외        → 네트워크 실패 (응답 자체가 없음)
   *   2단계: res.ok === false           → 서버 응답 실패 (상태 코드가 있음)
   */
  async function apiRequest(path, options = {}) {
    let res;
    try {
      res = await fetch(API_BASE + path, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
    } catch (networkErr) {
      const err = new Error('서버에 연결할 수 없습니다');
      err.isNetworkError = true;
      throw err;
    }

    let data = null;
    try {
      data = await res.json();
    } catch (parseErr) {
      /* 본문이 없는 응답(204 등)은 정상이므로 무시한다 */
    }

    if (!res.ok) {
      const err = new Error();
      err.status = res.status;

      if (res.status >= 500) {
        // 5xx의 서버 원본 메시지에는 스택 트레이스 등 내부 정보가 담길 수 있다.
        // 사용자에게는 노출하지 않고 개발자 콘솔로만 남긴다.
        err.isServerError = true;
        err.message = '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요';
        console.error('[server error]', res.status, path, data);
      } else {
        // 4xx는 사용자가 읽고 행동을 고칠 수 있는 정보이므로 서버 메시지를 그대로 쓴다.
        err.message = (data && data.message) || `요청이 실패했습니다 (${res.status})`;
      }
      throw err;
    }

    return data;
  }

  /** 일시적 실패(네트워크 / 5xx)에만 재시도한다. 4xx는 몇 번 보내도 결과가 같다. */
  async function apiRequestWithRetry(path, options = {}, retries = 1) {
    try {
      return await apiRequest(path, options);
    } catch (err) {
      const retryable = err.isNetworkError || err.status >= 500;
      if (retryable && retries > 0) {
        await new Promise((r) => setTimeout(r, 500));
        return apiRequestWithRetry(path, options, retries - 1);
      }
      throw err;
    }
  }

  const api = {
    // 명세에 /health 엔드포인트가 없으므로 별도 헬스체크는 두지 않는다.
    // 대신 GET /accounts의 성공 여부로 서버 상태를 함께 판단한다(요청 1회 절약).
    getAccounts: () => apiRequestWithRetry('/accounts'),
    getRecentTransactions: (limit = 4) =>
      apiRequestWithRetry(`/transactions?limit=${limit}`),
  };

  /* =======================================================================
     2. 상태 — 화면에 그려질 모든 정보를 여기 모아둔다
     ======================================================================= */

  const state = {
    accounts: [],
    recentTx: [],
    masked: false,
    conn: 'loading',      // loading | ok | error
    accountsView: 'loading', // loading | ok | error
    recentView: 'loading',   // loading | ok | empty | error
    accountsError: '',
    recentError: '',
  };

  /* =======================================================================
     3. 유틸
     ======================================================================= */

  const $ = (id) => document.getElementById(id);

  function won(n) {
    return Number(n).toLocaleString('ko-KR') + '원';
  }

  /**
   * innerHTML에 넣을 값에서 HTML 특수문자를 무력화한다.
   * 이걸 빼먹으면 계좌 별칭에 <img src=x onerror="..."> 같은 값이 들어왔을 때
   * 그대로 실행된다(XSS).
   */
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  let toastTimer = null;
  function showToast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  const spinner = (text) =>
    `<p class="empty-state"><span class="inline-spinner" aria-hidden="true"></span>${text}</p>`;
  const errorState = (text) =>
    `<p class="empty-state error">${escapeHtml(text)}</p>`;

  /* =======================================================================
     4. 렌더 — 상태만 읽어서 화면을 그린다. 여기서는 서버를 부르지 않는다.
     ======================================================================= */

  function renderConnection() {
    const el = $('connStatus');
    const map = {
      loading: ['loading', '<span class="dot loading"></span> API 서버 연결 확인 중'],
      ok: ['ok', '<span class="dot ok"></span> API 서버에 연결되었습니다 (localhost:4000)'],
      error: [
        'error',
        '<span class="dot error"></span> API 서버에 연결할 수 없습니다. ' +
          '터미널에서 <code>npm start</code>를 실행한 뒤 다시 시도해주세요 ' +
          '<button type="button" id="retryBtn">다시 시도</button>',
      ],
    };
    const [cls, html] = map[state.conn];
    el.className = `conn-status ${cls}`;
    el.innerHTML = html;
  }

  function renderTotal() {
    const total = state.accounts.reduce((sum, a) => sum + a.balance, 0);
    const hasData = state.accountsView === 'ok';

    $('totalAmount').textContent = !hasData
      ? '-'
      : state.masked
      ? '••••••••'
      : won(total);

    $('totalSub').textContent =
      state.accountsView === 'ok'
        ? `계좌 ${state.accounts.length}개 합산 금액입니다`
        : state.accountsView === 'error'
        ? '계좌 정보를 불러오지 못했습니다'
        : '계좌 정보를 불러오는 중입니다';

    const btn = $('toggleMaskBtn');
    btn.textContent = state.masked ? '보이기' : '숨기기';
    btn.setAttribute('aria-pressed', String(state.masked));
  }

  function accountCardHtml(a) {
    return `
      <li>
        <a href="history.html?accountId=${encodeURIComponent(a.id)}" class="account-card">
          <div class="left">
            <h3 class="nickname">${escapeHtml(a.nickname)}</h3>
            <p class="accno">${escapeHtml(a.accountNo)}</p>
          </div>
          <div class="right">
            <p class="balance">${state.masked ? '••••••' : won(a.balance)}</p>
            <p class="type">${escapeHtml(a.type)}</p>
          </div>
        </a>
      </li>`;
  }

  function renderAccounts() {
    const list = $('accountList');
    list.setAttribute('aria-busy', String(state.accountsView === 'loading'));

    if (state.accountsView === 'loading') {
      list.innerHTML = `<li>${spinner('계좌 정보를 불러오는 중')}</li>`;
      return;
    }
    if (state.accountsView === 'error') {
      list.innerHTML = `<li>${errorState(state.accountsError)}</li>`;
      return;
    }
    list.innerHTML = state.accounts.map(accountCardHtml).join('');
  }

  function recentItemHtml(tx) {
    const acc = state.accounts.find((a) => a.id === tx.accountId);
    const isIn = tx.type === 'in';
    return `
      <li class="recent-item" data-tx-id="${escapeHtml(tx.id)}">
        <div class="left">
          <p class="desc">${escapeHtml(tx.desc)}</p>
          <p class="meta">${escapeHtml(acc ? acc.nickname : tx.accountId)} · ${escapeHtml(
      tx.date.slice(5)
    )}</p>
        </div>
        <p class="amount-cell ${isIn ? 'plus' : 'minus'}">
          <span class="sr-only">${isIn ? '입금' : '출금'}</span>
          ${isIn ? '+' : '-'}${won(tx.amount)}
        </p>
      </li>`;
  }

  function renderRecent() {
    const list = $('recentList');
    list.setAttribute('aria-busy', String(state.recentView === 'loading'));

    if (state.recentView === 'loading') {
      list.innerHTML = `<li>${spinner('최근 거래를 불러오는 중')}</li>`;
      return;
    }
    if (state.recentView === 'error') {
      list.innerHTML = `<li>${errorState(state.recentError)}</li>`;
      return;
    }
    if (state.recentView === 'empty') {
      list.innerHTML = `<li><p class="empty-state">아직 거래내역이 없습니다</p></li>`;
      return;
    }
    list.innerHTML = state.recentTx.map(recentItemHtml).join('');
  }

  function render() {
    renderConnection();
    renderTotal();
    renderAccounts();
    renderRecent();
  }

  /* =======================================================================
     5. 이벤트 — 컨테이너에 한 번만 등록한다(위임).
        목록을 몇 번 다시 그려도 리스너를 재등록할 필요가 없다.
     ======================================================================= */

  function bindEvents() {
    $('toggleMaskBtn').addEventListener('click', () => {
      state.masked = !state.masked;
      // 서버를 다시 부르지 않는다. 이미 가진 데이터로 다시 그리기만 한다.
      renderTotal();
      renderAccounts();
    });

    // 최근 거래 클릭 → 거래내역 페이지로 이동
    // (상세 시트는 홈/거래내역 공용 컴포넌트라 담당자와 협의 후 결정. 아래 README 참고)
    $('recentList').addEventListener('click', (e) => {
      const item = e.target.closest('.recent-item');
      if (!item) return;
      location.href = `history.html?txId=${encodeURIComponent(item.dataset.txId)}`;
    });

    // 이번 실습 범위 밖 메뉴
    document.querySelectorAll('[data-toast]').forEach((btn) => {
      btn.addEventListener('click', () => showToast(btn.dataset.toast));
    });

    // 연결 실패 배너의 "다시 시도" 버튼은 매번 새로 그려지므로 위임으로 잡는다
    $('connStatus').addEventListener('click', (e) => {
      if (e.target.id === 'retryBtn') init();
    });
  }

  /* =======================================================================
     6. 로드 — 서버 호출은 여기서만 한다
     ======================================================================= */

  async function loadRecent() {
    state.recentView = 'loading';
    renderRecent();

    try {
      // 명세: GET /api/transactions?limit=4 — 최신순으로 최대 4건
      const list = await api.getRecentTransactions(4);
      state.recentTx = list;
      state.recentView = list.length ? 'ok' : 'empty';
    } catch (err) {
      state.recentView = 'error';
      state.recentError = `최근 거래를 불러오지 못했습니다 (${err.message})`;
    }
    renderRecent();
  }

  async function init() {
    state.conn = 'loading';
    state.accountsView = 'loading';
    state.recentView = 'loading';
    render();

    // GET /accounts 하나로 두 가지를 동시에 판단한다.
    //   네트워크 실패  → 서버 자체가 안 떠 있음        → 연결 배너를 error로
    //   4xx / 5xx      → 서버는 응답했으나 요청이 실패  → 연결은 ok, 목록만 error
    try {
      state.accounts = await api.getAccounts();
      state.accountsView = 'ok';
      state.conn = 'ok';
    } catch (err) {
      state.conn = err.isNetworkError ? 'error' : 'ok';
      state.accountsView = 'error';
      state.accountsError = `계좌 정보를 불러오지 못했습니다 (${err.message})`;
      state.recentView = 'error';
      state.recentError = err.message;
      render();
      return;
    }

    render();
    // 계좌를 먼저 받아야 거래 행에 계좌 별칭을 붙일 수 있다
    await loadRecent();
  }

  bindEvents();
  init();
})();
