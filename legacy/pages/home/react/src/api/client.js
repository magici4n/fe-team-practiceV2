/* =========================================================================
   API 계층
   =========================================================================
   이 파일은 바닐라판 home.js의 API 부분과 사실상 동일합니다.
   서버 통신에는 React가 개입할 여지가 없기 때문입니다.
   실패를 두 단계로 나눠 잡는 구조도 그대로 유지합니다.
   ========================================================================= */

const API_BASE = 'http://localhost:4000/api';

async function apiRequest(path, options = {}) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (networkErr) {
    // 1단계: 요청이 서버에 도달하지 못했거나 응답을 받지 못함. 상태 코드가 없다.
    const err = new Error('서버에 연결할 수 없습니다');
    err.isNetworkError = true;
    throw err;
  }

  let data = null;
  try {
    data = await res.json();
  } catch (parseErr) {
    /* 본문 없는 응답은 정상 */
  }

  // 2단계: 서버가 응답했지만 그 응답이 실패. fetch는 여기서 예외를 던지지 않는다.
  if (!res.ok) {
    const err = new Error();
    err.status = res.status;

    if (res.status >= 500) {
      err.isServerError = true;
      err.message = '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요';
      console.error('[server error]', res.status, path, data);
    } else {
      err.message = (data && data.message) || `요청이 실패했습니다 (${res.status})`;
    }
    throw err;
  }

  return data;
}

/** 일시적 실패(네트워크 / 5xx)에만 재시도. 4xx와 POST에는 쓰지 않는다. */
async function withRetry(path, options = {}, retries = 1) {
  try {
    return await apiRequest(path, options);
  } catch (err) {
    const retryable = err.isNetworkError || err.status >= 500;
    if (retryable && retries > 0) {
      await new Promise((r) => setTimeout(r, 500));
      return withRetry(path, options, retries - 1);
    }
    throw err;
  }
}

/* 명세에 있는 엔드포인트만 노출합니다.
   /health는 명세에 없으므로 두지 않고, GET /accounts의 성공 여부로
   서버 상태를 함께 판단합니다. */
export const api = {
  // 홈 화면이 쓰는 것
  getAccounts: () => withRetry('/accounts'),
  getRecentTransactions: (limit = 4) => withRetry(`/transactions?limit=${limit}`),

  // 팀원 화면이 쓸 것 (미리 정의해 둡니다)
  getAccount: (accountId) => withRetry(`/accounts/${encodeURIComponent(accountId)}`),
  getTransactions: ({ accountId, type, limit } = {}) => {
    const qs = new URLSearchParams();
    if (accountId) qs.set('accountId', accountId);
    if (type) qs.set('type', type);
    if (limit) qs.set('limit', String(limit));
    const q = qs.toString();
    return withRetry('/transactions' + (q ? `?${q}` : ''));
  },
  getTransaction: (id) => withRetry(`/transactions/${id}`),
  lookupOwner: (bank, accountNo) =>
    withRetry(
      `/transfer/lookup?bank=${encodeURIComponent(bank)}&accountNo=${encodeURIComponent(accountNo)}`
    ),
  // POST는 재시도하지 않습니다. 서버가 처리했는데 응답만 유실된 경우
  // 이체가 두 번 실행될 수 있기 때문입니다.
  postTransfer: (payload) =>
    apiRequest('/transfers', { method: 'POST', body: JSON.stringify(payload) }),
};
