import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';

/* =========================================================================
   라우팅
   =========================================================================
   바닐라판은 home.html / transfer.html / history.html 세 개의 실제 문서를
   오가는 MPA였습니다. 여기서는 주소만 바뀌고 문서는 다시 받지 않습니다(SPA).

   이체 / 거래내역은 팀원 담당이라 자리만 잡아 두었습니다.
   각자 만든 컴포넌트로 아래 element를 교체하면 됩니다.
   ========================================================================= */

function Placeholder({ name }) {
  return (
    <div className="phone">
      <main className="screen">
        <p className="empty-state">{name} 화면은 팀원이 작업 중입니다</p>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/transfer" element={<Placeholder name="이체" />} />
      <Route path="/history" element={<Placeholder name="거래내역" />} />
    </Routes>
  );
}
