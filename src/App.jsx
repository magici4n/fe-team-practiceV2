import { Route, Routes } from 'react-router-dom';
import BankingLayout from './layouts/BankingLayout.jsx';
import Home from './pages/home/Home.jsx';
import TransferPage from './pages/transfer/TransferPage.jsx';
import Transactions from './pages/transactions/Transactions.jsx';
import './pages/home/home.css';
import './pages/transfer/transfer.css';
import './pages/transactions/transactions.css';

export default function App() {
  return <Routes>
    <Route element={<BankingLayout />}>
      <Route index element={<Home />} />
      <Route path="transfer" element={<TransferPage />} />
      <Route path="history" element={<Transactions />} />
      <Route path="*" element={<p className="empty-state">페이지를 찾을 수 없습니다. 하단 메뉴를 이용해주세요.</p>} />
    </Route>
  </Routes>;
}
