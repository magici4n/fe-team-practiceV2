import { useEffect, useState } from 'react';
import { api } from '../../../api/client.js';
import { onlyNumbers, won } from '../utils/transferUtils.js';

export default function RecipientStep({ transferState, setTransferState, accountList, onNext }) {
  const { toBank, toAccountNo, ownerName, fromAccountId } = transferState;
  const [lookup, setLookup] = useState({ loading: false, error: '' });
  useEffect(() => {
    if (!toAccountNo) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLookup({ loading: true, error: '' });
      try {
        const result = await api.lookupOwner(toBank, toAccountNo);
        if (active) {
          if (!result?.ownerName) throw new Error('예금주를 확인할 수 없습니다');
          setTransferState(prev => ({ ...prev, ownerName: result.ownerName }));
          setLookup({ loading: false, error: '' });
        }
      } catch (err) {
        if (active) setLookup({ loading: false, error: err.message });
      }
    }, 400);
    return () => { active = false; clearTimeout(timer); };
  }, [toBank, toAccountNo, setTransferState]);
  function update(field, value) {
    setLookup({ loading: false, error: '' });
    setTransferState(prev => ({ ...prev, [field]: value, ownerName: '' }));
  }
  return <div className="transfer-wrap">
    <div className="step-title">누구에게 보낼까요?</div>
    <div className="step-sub">출금 계좌와 받는 분의 계좌 정보를 입력해주세요</div>
    <div className="field-group"><label className="field-label" htmlFor="from-account">출금 계좌</label>
      <select id="from-account" className="tinput" value={fromAccountId} onChange={e => setTransferState(prev => ({ ...prev, fromAccountId: e.target.value }))}>
        {accountList.map(account => <option key={account.id} value={account.id}>{account.nickname} ({won(account.balance)})</option>)}
      </select>
    </div>
    <div className="field-group"><label className="field-label" htmlFor="to-bank">받는 은행</label>
      <select id="to-bank" className="tinput" value={toBank} onChange={e => update('toBank', e.target.value)}>{['우리은행', '국민은행', '신한은행', '하나은행', '카카오뱅크'].map(bank => <option key={bank}>{bank}</option>)}</select>
    </div>
    <div className="field-group"><label className="field-label" htmlFor="to-account">계좌번호</label>
      <input id="to-account" className="tinput" inputMode="numeric" aria-describedby="account-example-hint" value={toAccountNo} onChange={e => update('toAccountNo', onlyNumbers(e.target.value))} placeholder="- 없이 숫자만 입력 (예: 1002123456789)" />
      <div aria-live="polite">
        {lookup.loading && <p className="helper-text">예금주 확인 중…</p>}
        {lookup.error && <p className="helper-text err">{lookup.error}</p>}
        {ownerName && !lookup.loading && <div className="owner-chip show">✓ 예금주 {ownerName}님 확인됨</div>}
      </div>
      <p className="field-hint" id="account-example-hint">
        테스트용 등록 계좌: <code>1002123456789</code> (김민준),{' '}
        <code>1002987654321</code> (이서연),{' '}
        <code>1102555666777</code> (박지훈)
      </p>
    </div>
    <button className="primary-btn" disabled={!ownerName || lookup.loading || !!lookup.error} onClick={onNext}>다음</button>
  </div>;
}
