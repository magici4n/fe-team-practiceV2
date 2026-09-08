function Header() {
  return (
    <>
      {/* 휴대폰 상단 상태 표시줄 */}
      <div className="statusbar">
        <span>9:41</span>

        <span className="icons">
          ●●● 5G 🔋
        </span>
      </div>

      {/* WON 실습뱅킹 헤더 */}
      <div className="app-header">

        <div className="brand">

          <div className="brand-mark">
            W
          </div>

          <div className="brand-name">
            WON 실습뱅킹
          </div>

        </div>


        <div className="header-icons">

          <span>
            🔔
            <span className="badge-dot"></span>
          </span>

          <span>
            ☰
          </span>

        </div>

      </div>
    </>
  );
}

export default Header;