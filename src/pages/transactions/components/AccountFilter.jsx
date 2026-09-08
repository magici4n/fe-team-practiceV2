// 상단 계좌 필터 영역 (계좌 목록을 받아오고)

import React from 'react';

export default function AccountFilter({ accounts, selectedAccount, onSelectAccount }) {
  return (
    <section className="account-list">
      <button
        type="button"
        className={`account ${selectedAccount === 'all' ? 'active' : ''}`}
        onClick={() => onSelectAccount('all')}
      >
        전체 계좌
      </button>

      {accounts.map((acc) => (
        <button
          key={acc.id}
          type="button"
          className={`account ${selectedAccount === acc.id ? 'active' : ''}`}
          onClick={() => onSelectAccount(acc.id)}
        >
          {acc.nickname}
        </button>
      ))}
    </section>
  );
}