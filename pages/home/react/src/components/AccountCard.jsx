import { Link } from 'react-router-dom';
import { won } from '../utils/format.js';

/* =========================================================================
   계좌 카드 한 장
   =========================================================================
   바닐라판의 accountCardHtml() 템플릿 문자열이 이 컴포넌트가 됐습니다.
   달라진 점 세 가지:
   1) escapeHtml이 없다      → {account.nickname}은 항상 텍스트로 삽입된다
   2) 이벤트 재등록이 없다   → Link가 라우팅을 처리한다
   3) 문자열이 아니라 객체다 → 오타가 나면 컴파일 단계에서 잡힌다
   ========================================================================= */

export default function AccountCard({ account, masked }) {
  return (
    <li>
      <Link to={`/history?accountId=${encodeURIComponent(account.id)}`} className="account-card">
        <div className="left">
          <h3 className="nickname">{account.nickname}</h3>
          <p className="accno">{account.accountNo}</p>
        </div>
        <div className="right">
          <p className="balance">{masked ? '••••••' : won(account.balance)}</p>
          <p className="type">{account.type}</p>
        </div>
      </Link>
    </li>
  );
}
