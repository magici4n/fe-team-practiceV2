import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAccounts } from '../../hooks/useAccounts.js';
import AccountFilter from './components/AccountFilter.jsx';
import TypeFilter from './components/TypeFilter.jsx';
import TransactionItem from './components/TransactionItems.jsx';
import TransactionDetail from './components/TransactionDetail.jsx';

export default function Transactions() {
  const [params, setParams] = useSearchParams();
  const selectedAccount = params.get('accountId') || 'all';
  const selectedType = ['in', 'out'].includes(params.get('type')) ? params.get('type') : 'all';
  const { accounts, loading: accountsLoading, error: accountsError, reload } = useAccounts();
  const [state, setState] = useState({ loading: true, error: '', transactions: [] });
  const [retry, setRetry] = useState(0);
  const selectedTransaction = params.get('txId');
  useEffect(() => {
    if (!state.loading && selectedTransaction) document.getElementById(`transaction-${selectedTransaction}`)?.scrollIntoView({ block: 'center' });
  }, [state.loading, selectedTransaction]);
  useEffect(() => {
    let active = true;
    setState({ loading: true, error: '', transactions: [] });
    api.getTransactions({ accountId: selectedAccount === 'all' ? undefined : selectedAccount, type: selectedType === 'all' ? undefined : selectedType }).then(transactions => {
      if (active) setState({ loading: false, error: '', transactions });
    }).catch(err => { if (active) setState({ loading: false, error: err.message, transactions: [] }); });
    return () => { active = false; };
  }, [selectedAccount, selectedType, retry]);
  function filter(key, value) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (value === 'all') next.delete(key); else next.set(key, value);
      next.delete('txId');
      return next;
    });
  }
  function selectTransaction(id) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (id == null) next.delete('txId'); else next.set('txId', String(id));
      return next;
    });
  }
  return <div className="transactions-page">
    <AccountFilter accounts={accounts} selectedAccount={selectedAccount} onSelectAccount={value => filter('accountId', value)} />
    <TypeFilter selectedType={selectedType} onSelectType={value => filter('type', value)} />
    {(accountsError || state.error) ? <div className="page-feedback" role="alert">{accountsError || state.error} <button onClick={() => { reload(); setRetry(v => v + 1); }}>다시 시도</button></div>
      : (accountsLoading || state.loading) ? <p className="empty-state" role="status">거래내역을 불러오는 중입니다</p>
      : <section className="tx-list" aria-label="거래내역">
        {!state.transactions.length ? <p className="empty-state">조건에 맞는 거래 내역이 없습니다.</p>
          : <div className="tx-group">{state.transactions.map(tx => <div key={tx.id} id={`transaction-${tx.id}`} role="button" tabIndex={0} aria-label={`${tx.desc} 거래 상세`} onClick={() => selectTransaction(tx.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectTransaction(tx.id); } }} className={String(tx.id) === selectedTransaction ? 'selected-transaction' : ''}><TransactionItem tx={tx} accountName={accounts.find(account => account.id === tx.accountId)?.nickname || tx.accountId} /></div>)}</div>}
      </section>}
    {selectedTransaction && <TransactionDetail key={selectedTransaction} id={selectedTransaction} onClose={() => selectTransaction(null)} />}
  </div>;
}
