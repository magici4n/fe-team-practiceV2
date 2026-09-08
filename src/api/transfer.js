import { api } from './client.js';

// The input screen uses ownerName; the API requires toOwnerName.
export function submitTransfer({ fromAccountId, toBank, toAccountNo, ownerName, amount }) {
  return api.postTransfer({ fromAccountId, toBank, toAccountNo, toOwnerName: ownerName, amount });
}
