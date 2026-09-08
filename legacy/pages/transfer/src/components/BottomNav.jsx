function BottomNav() {

  return (
    <div className="bottom-nav">

      <button className="nav-btn">

        <span className="nav-icon">
          🏠
        </span>

        <span className="nav-lbl">
          홈
        </span>

      </button>


      <button className="nav-btn active">

        <span className="nav-icon">
          💸
        </span>

        <span className="nav-lbl">
          이체
        </span>

      </button>


      <button className="nav-btn">

        <span className="nav-icon">
          📋
        </span>

        <span className="nav-lbl">
          거래내역
        </span>

      </button>


      <button className="nav-btn">

        <span className="nav-icon">
          ⋯
        </span>

        <span className="nav-lbl">
          전체
        </span>

      </button>

    </div>
  );
}

export default BottomNav;