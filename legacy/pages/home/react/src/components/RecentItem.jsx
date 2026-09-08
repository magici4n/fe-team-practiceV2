import { useNavigate } from 'react-router-dom';
import { won } from '../utils/format.js';

/* =========================================================================
   최근 거래 한 줄
   =========================================================================
   onClick은 addEventListener처럼 핸들러를 직접 쓰지만,
   "언제 붙이고 언제 뗄지"는 React가 관리합니다.
   목록이 다시 그려져도 재등록할 일이 없습니다.
   ========================================================================= */

export default function RecentItem({ tx, accountName }) {
  const navigate = useNavigate();
  const isIn = tx.type === 'in';

  return (
    <li
      className="recent-item"
      onClick={() => navigate(`/history?txId=${encodeURIComponent(tx.id)}`)}
    >
      <div className="left">
        <p className="desc">{tx.desc}</p>
        <p className="meta">
          {accountName} · {tx.date.slice(5)}
        </p>
      </div>
      <p className={`amount-cell ${isIn ? 'plus' : 'minus'}`}>
        {/* 색만으로 입출금을 구분하지 않도록 부호와 함께 안내 텍스트를 넣습니다 */}
        <span className="sr-only">{isIn ? '입금' : '출금'}</span>
        {isIn ? '+' : '-'}
        {won(tx.amount)}
      </p>
    </li>
  );
}
