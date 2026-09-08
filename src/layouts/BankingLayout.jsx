import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

export default function BankingLayout() {
  const { pathname } = useLocation();
  const screen = useRef(null);
  const [toast, setToast] = useState('');
  useEffect(() => { screen.current?.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(timer);
  }, [toast]);
  const notify = name => setToast(`${name} 화면은 이번 실습 범위 밖입니다`);
  return <div className="phone">
    <div className="statusbar" aria-hidden="true"><span>9:41</span><span className="icons">●●● 5G 🔋</span></div>
    <header className="app-header">
      <Link to="/" className="brand" aria-label="홈으로 이동"><span className="brand-mark">W</span><span className="brand-name">WON 실습뱅킹</span></Link>
      <div className="header-icons">
        <button type="button" aria-label="알림" onClick={() => notify('알림')}>🔔<span className="badge-dot" /></button>
        <button type="button" aria-label="전체 메뉴" onClick={() => notify('전체 메뉴')}>☰</button>
      </div>
    </header>
    <main className="screen" ref={screen}><Outlet /></main>
    <footer><nav className="bottom-nav" aria-label="주요 메뉴">
      {[['/', '🏠', '홈'], ['/transfer', '💸', '이체'], ['/history', '📋', '거래내역']].map(([to, icon, label]) =>
        <NavLink key={to} to={to} end className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}><span className="nav-icon" aria-hidden="true">{icon}</span><span className="nav-lbl">{label}</span></NavLink>)}
      <button className="nav-btn" type="button" onClick={() => notify('전체 메뉴')}><span className="nav-icon">⋯</span><span className="nav-lbl">전체</span></button>
    </nav></footer>
    <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
  </div>;
}
