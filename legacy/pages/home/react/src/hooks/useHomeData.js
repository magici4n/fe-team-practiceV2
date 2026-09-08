import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';

/* =========================================================================
   홈 화면이 필요한 데이터를 불러오고, 그 상태를 돌려주는 훅
   =========================================================================
   바닐라판의 state 객체 + loadAccounts() + loadRecent() + init()이
   여기 하나로 들어왔습니다.

   차이는 "화면을 다시 그리라"는 명령이 사라졌다는 점입니다.
   바닐라에서는 상태를 바꾼 뒤 renderAccounts()를 직접 불러야 했지만,
   여기서는 setAccounts만 호출하면 이 훅을 쓰는 컴포넌트가 알아서 다시 그려집니다.
   ========================================================================= */

export function useHomeData() {
  const [conn, setConn] = useState('loading'); // loading | ok | error
  const [accounts, setAccounts] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [accountsState, setAccountsState] = useState('loading'); // loading | ok | error
  const [recentState, setRecentState] = useState('loading'); // loading | ok | empty | error
  const [accountsError, setAccountsError] = useState('');
  const [recentError, setRecentError] = useState('');

  const load = useCallback(async () => {
    setConn('loading');
    setAccountsState('loading');
    setRecentState('loading');

    // GET /accounts 하나로 두 가지를 동시에 판단합니다.
    //   네트워크 실패  → 서버 자체가 안 떠 있음       → 연결 배너를 error로
    //   4xx / 5xx      → 서버는 응답했으나 요청이 실패 → 연결은 ok, 목록만 error
    try {
      const loaded = await api.getAccounts();
      setAccounts(loaded);
      setAccountsState('ok');
      setConn('ok');
    } catch (err) {
      setConn(err.isNetworkError ? 'error' : 'ok');
      setAccountsState('error');
      setAccountsError(`계좌 정보를 불러오지 못했습니다 (${err.message})`);
      setRecentState('error');
      setRecentError(err.message);
      return;
    }

    // 명세: GET /api/transactions?limit=4 — 최신순으로 최대 4건
    try {
      const list = await api.getRecentTransactions(4);
      setRecentTx(list);
      setRecentState(list.length ? 'ok' : 'empty');
    } catch (err) {
      setRecentState('error');
      setRecentError(`최근 거래를 불러오지 못했습니다 (${err.message})`);
    }
  }, []);

  // 컴포넌트가 화면에 처음 올라올 때 한 번 실행됩니다.
  // 바닐라판의 마지막 줄 init() 호출에 해당합니다.
  useEffect(() => {
    load();
  }, [load]);

  return {
    conn,
    accounts,
    recentTx,
    accountsState,
    recentState,
    accountsError,
    recentError,
    reload: load,
  };
}
