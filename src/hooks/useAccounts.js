import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Each routed page reads fresh server data on entry, including after a transfer.
export function useAccounts() {
  const [state, setState] = useState({ accounts: [], loading: true, error: '' });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => {
    let active = true;
    setState({ accounts: [], loading: true, error: '' });
    api.getAccounts().then(accounts => {
      if (active) setState({ accounts, loading: false, error: '' });
    }).catch(error => {
      if (active) setState({ accounts: [], loading: false, error: error.message });
    });
    return () => { active = false; };
  }, [version]);
  return { ...state, reload };
}
