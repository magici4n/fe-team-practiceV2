import { useEffect, useRef, useState } from 'react';
import { api } from '../../../api/client.js';

const won = amount => Number(amount).toLocaleString('ko-KR') + '원';

export default function TransactionDetail({ id, onClose }) {
  const dialog = useRef(null);
  const [state, setState] = useState({ loading: true, error: '', transaction: null, account: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  useEffect(() => {
    let active = true;
    setState({ loading: true, error: '', transaction: null, account: null });
    async function load() {
      try {
        const transaction = await api.getTransaction(id);
        const account = await api.getAccount(transaction.accountId);
        if (active) setState({ loading: false, error: '', transaction, account });
      } catch (err) {
        if (active) setState({ loading: false, error: err.message, transaction: null, account: null });
      }
    }
    load();
    return () => { active = false; };
  }, [id, retry]);
  const tx = state.transaction;
  return <dialog className="transaction-detail" ref={dialog} aria-labelledby="transaction-detail-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="detail-heading"><h2 id="transaction-detail-title">거래 상세</h2><button type="button" onClick={onClose} autoFocus aria-label="거래 상세 닫기">닫기</button></div>
    {state.loading ? <p role="status">거래 정보를 불러오는 중입니다</p>
      : state.error ? <div role="alert"><p>{state.error}</p><button type="button" onClick={() => setRetry(v => v + 1)}>다시 시도</button></div>
      : <dl>
        <div><dt>거래 내용</dt><dd>{tx.desc}</dd></div>
        <div><dt>거래 일시</dt><dd>{tx.date} {tx.time}</dd></div>
        <div><dt>계좌</dt><dd>{state.account.nickname}<br />{state.account.accountNo}</dd></div>
        <div><dt>거래 유형</dt><dd>{tx.type === 'in' ? '입금' : '출금'}</dd></div>
        <div><dt>거래 금액</dt><dd>{won(tx.amount)}</dd></div>
        <div><dt>거래 후 잔액</dt><dd>{won(tx.balanceAfter)}</dd></div>
        <div><dt>상태</dt><dd>{tx.status === 'done' ? '완료' : '처리중'}</dd></div>
      </dl>}
  </dialog>;
}
