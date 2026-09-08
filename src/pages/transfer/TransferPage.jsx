import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '../../hooks/useAccounts.js';
import { submitTransfer } from '../../api/transfer.js';
import RecipientStep from './components/RecipientStep.jsx';
import AmountStep from './components/AmountStep.jsx';
import ConfirmStep from './components/ConfirmStep.jsx';
import SuccessStep from './components/SuccessStep.jsx';

export default function TransferPage() {
  const { accounts, loading, error, reload } = useAccounts();
  if (loading) return <p className="empty-state" role="status">계좌 정보를 불러오는 중입니다</p>;
  if (error) return <div className="page-feedback" role="alert">{error} <button onClick={reload}>다시 시도</button></div>;
  if (!accounts.length) return <p className="empty-state">이체할 수 있는 계좌가 없습니다.</p>;
  return <TransferForm accounts={accounts} />;
}

function TransferForm({ accounts }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [transferState, setTransferState] = useState({ fromAccountId: accounts[0].id, toBank: '우리은행', toAccountNo: '', ownerName: '', amount: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const inFlight = useRef(false);
  async function handleTransfer() {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError('');
    try {
      const receipt = await submitTransfer(transferState);
      setResult(receipt);
      // Only a successful server response can advance to completion.
      setStep(4);
    } catch (err) {
      setError(err.isNetworkError || err.isOutcomeUnknown ? '이체 결과를 확인할 수 없습니다. 거래내역을 확인한 후 다시 시도해주세요.' : err.message);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }
  const props = { transferState, setTransferState, accountList: accounts };
  return <div className="transfer-page" aria-busy={submitting}>
    {step === 1 && <RecipientStep {...props} onNext={() => setStep(2)} />}
    {step === 2 && <AmountStep {...props} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
    {step === 3 && <ConfirmStep {...props} submitting={submitting} error={error} onTransfer={handleTransfer} onBack={() => { setError(''); setStep(2); }} />}
    {step === 4 && <SuccessStep {...props} result={result} onHome={() => navigate('/')} />}
  </div>;
}
