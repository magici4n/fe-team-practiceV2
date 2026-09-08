import React from 'react';

export default function FooterNav() {
  return (
    <footer className="app-footer">
      <nav className="button-nav">
        <ul>
          <li><a className="home" href="#home"><span className="nav-icon">🏠</span><span className="nav-label">홈</span></a></li>
          <li><a className="transfer" href="#transfer"><span className="nav-icon">💸</span><span className="nav-label">이체</span></a></li>
          <li><a className="tx-list active" href="#tx"><span className="nav-icon">🫱🏻‍🫲🏻</span><span className="nav-label">거래 내역</span></a></li>
          <li><a className="total" href="#total"><span className="nav-icon">⋯</span><span className="nav-label">전체</span></a></li>
        </ul>
      </nav>
    </footer>
  );
}