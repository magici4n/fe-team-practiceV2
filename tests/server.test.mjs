import { test } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server/server.js';

test('제공된 API 서버의 전체 계약과 이체 후 조회 일치', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (path, body) => {
    const response = await fetch(base + path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  };
  try {
    const accounts = await request('/accounts');
    assert.equal(accounts.status, 200);
    const account = accounts.data[0];
    assert.deepEqual((await request(`/accounts/${account.id}`)).data, account);
    assert.equal((await request('/accounts/missing')).status, 404);
    const lookup = await request('/transfer/lookup?bank=우리은행&accountNo=1002987654321');
    assert.deepEqual(lookup.data, { ownerName: '이서연' });
    assert.equal((await request('/transfer/lookup?bank=우리은행&accountNo=000')).status, 404);
    const body = { fromAccountId: account.id, toBank: '우리은행', toAccountNo: '1002987654321', toOwnerName: lookup.data.ownerName, amount: 30000 };
    assert.equal((await request('/transfers', { ...body, toOwnerName: undefined })).status, 400);
    assert.equal((await request('/transfers', { ...body, amount: 999 })).status, 400);
    assert.equal((await request('/transfers', { ...body, amount: account.balance + 1 })).data.message, '잔액이 부족합니다');
    assert.equal((await request('/transfers', { ...body, fromAccountId: 'missing' })).status, 404);
    assert.equal((await request(`/accounts/${account.id}`)).data.balance, account.balance);
    const result = await request('/transfers', body);
    assert.equal(result.status, 201);
    assert.equal(result.data.account.balance, account.balance - body.amount);
    assert.equal(result.data.transaction.balanceAfter, result.data.account.balance);
    assert.equal(result.data.transaction.desc, lookup.data.ownerName);
    assert.deepEqual((await request(`/transactions/${result.data.transaction.id}`)).data, result.data.transaction);
    assert.equal((await request(`/accounts/${account.id}`)).data.balance, result.data.account.balance);
    const list = await request(`/transactions?accountId=${account.id}&type=out&limit=1`);
    assert.deepEqual(list.data, [result.data.transaction]);
    assert.deepEqual((await request('/transactions?accountId=missing')).data, []);
    assert.equal((await request('/transactions/999999')).status, 404);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
