import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHomeData } from './hooks/useHomeData.js';
import { won } from './utils/format.js';
import AccountCard from './components/AccountCard.jsx';
import RecentItem from './components/RecentItem.jsx';
import StateMessage from './components/StateMessage.jsx';

/* =========================================================================
   홈 화면
   =========================================================================
   바닐라판 home.html + home.js가 이 한 파일로 합쳐졌습니다.
   구조(HTML)와 동작(JS)이 같은 자리에 있으므로
   id를 붙여 서로를 찾아갈 필요가 없어졌습니다.
   ========================================================================= */

export default function Home() {
  const {
    accounts, recentTx,
    accountsState, recentState,
    accountsError, recentError,
    reload,
  } = useHomeData();

  const [masked, setMasked] = useState(false);
  const [toast, setToast] = useState('');

  // 총 자산은 별도 상태가 아니라 accounts에서 매번 계산합니다.
  // 상태를 두 벌 두면 둘이 어긋날 수 있기 때문입니다.
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);
  const hasAccounts = accountsState === 'ok';

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 1800);
  }

  const accountName = (id) =>
    accounts.find((a) => a.id === id)?.nickname ?? id;

  return <div className="home-page">
    {(accountsState === 'error' || recentState === 'error') && <div className="page-feedback"><button type="button" onClick={reload}>다시 시도</button></div>}
          <section aria-labelledby="greeting-heading" className="greeting">
            <p className="hi">
              안녕하세요 <span aria-hidden="true">👋</span>
            </p>
            <h1 id="greeting-heading" className="name">김민준님</h1>
          </section>

          <section aria-labelledby="total-heading" className="total-card">
            <div className="label-row">
              <h2 id="total-heading" className="label">총 자산</h2>
              <button
                type="button"
                className="eye-btn"
                aria-pressed={masked}
                onClick={() => setMasked(!masked)}
              >
                {/* 상태를 바꾸기만 하면 버튼 글자, 총 자산, 계좌 3장이 모두 따라 바뀝니다.
                    바닐라판처럼 renderTotal() / renderAccounts()를 호출할 필요가 없습니다 */}
                {masked ? '보이기' : '숨기기'}
              </button>
            </div>
            <p className="amount">
              <span className="sr-only">총 자산 금액</span>
              {!hasAccounts ? '-' : masked ? '••••••••' : won(total)}
            </p>
            <p className="sub">
              {accountsState === 'ok'
                ? `계좌 ${accounts.length}개 합산 금액입니다`
                : accountsState === 'error'
                ? '계좌 정보를 불러오지 못했습니다'
                : '계좌 정보를 불러오는 중입니다'}
            </p>
          </section>

          <nav aria-label="빠른 메뉴" className="quick-menu">
            <Link to="/transfer">
              <span className="icon" aria-hidden="true">💳</span>
              <span className="lbl">이체</span>
            </Link>
            <Link to="/history">
              <span className="icon" aria-hidden="true">📋</span>
              <span className="lbl">거래내역</span>
            </Link>
            <button type="button" onClick={() => showToast('상품 화면은 이번 실습 범위 밖입니다')}>
              <span className="icon" aria-hidden="true">📦</span>
              <span className="lbl">상품</span>
            </button>
            <button type="button" onClick={() => showToast('자산관리 화면은 이번 실습 범위 밖입니다')}>
              <span className="icon" aria-hidden="true">📊</span>
              <span className="lbl">자산관리</span>
            </button>
            <button type="button" onClick={() => showToast('전체 메뉴는 이번 실습 범위 밖입니다')}>
              <span className="icon" aria-hidden="true">⋯</span>
              <span className="lbl">전체</span>
            </button>
          </nav>

          <section aria-labelledby="accounts-heading">
            <div className="section-head">
              <h2 id="accounts-heading">내 계좌</h2>
              <Link to="/history" className="more">전체보기</Link>
            </div>
            <ul
              className="account-list"
              aria-live="polite"
              aria-busy={accountsState === 'loading'}
            >
              {/* 화면에 나올 수 있는 모든 상태가 여기 한눈에 나열됩니다.
                  바닐라판에서 갱신을 빠뜨려 스피너가 영원히 도는 실수가 구조적으로 불가능합니다 */}
              {accountsState === 'loading' && (
                <li><StateMessage variant="loading">계좌 정보를 불러오는 중</StateMessage></li>
              )}
              {accountsState === 'error' && (
                <li><StateMessage variant="error">{accountsError}</StateMessage></li>
              )}
              {accountsState === 'ok' &&
                accounts.map((a) => (
                  // key는 React가 "이전 목록의 이 항목과 새 목록의 이 항목이 같은 것인가"를
                  // 판단하는 기준입니다. 배열 인덱스를 쓰면 순서가 바뀔 때 버그가 납니다.
                  <AccountCard key={a.id} account={a} masked={masked} />
                ))}
            </ul>
          </section>

          <section aria-labelledby="transactions-heading">
            <div className="section-head">
              <h2 id="transactions-heading">최근 거래</h2>
              <Link to="/history" className="more">전체보기</Link>
            </div>
            <ul
              className="recent-list"
              aria-live="polite"
              aria-busy={recentState === 'loading'}
            >
              {recentState === 'loading' && (
                <li><StateMessage variant="loading">최근 거래를 불러오는 중</StateMessage></li>
              )}
              {recentState === 'error' && (
                <li><StateMessage variant="error">{recentError}</StateMessage></li>
              )}
              {recentState === 'empty' && (
                <li><StateMessage variant="empty">아직 거래내역이 없습니다</StateMessage></li>
              )}
              {recentState === 'ok' &&
                recentTx.map((tx) => (
                  <RecentItem key={tx.id} tx={tx} accountName={accountName(tx.accountId)} />
                ))}
            </ul>
          </section>

<div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
</div>;
}
