import { useEffect, useState } from 'react';
import { api } from '../../../api/client.js';
import { useAccounts } from '../../../hooks/useAccounts.js';

export function useHomeData() {
  const { accounts, loading, error, reload: reloadAccounts } = useAccounts();
  const [recent, setRecent] = useState({ list: [], status: 'loading', error: '' });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setRecent({ list: [], status: 'loading', error: '' });
    api.getRecentTransactions(4).then(list => {
      if (active) setRecent({ list, status: list.length ? 'ok' : 'empty', error: '' });
    }).catch(err => {
      if (active) setRecent({ list: [], status: 'error', error: err.message });
    });
    return () => { active = false; };
  }, [version]);
  return {
    accounts,
    accountsState: loading ? 'loading' : error ? 'error' : 'ok',
    accountsError: error,
    recentTx: recent.list,
    recentState: recent.status,
    recentError: recent.error,
    reload() { reloadAccounts(); setVersion(v => v + 1); },
  };
}
