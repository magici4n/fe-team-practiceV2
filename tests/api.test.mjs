import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/api/client.js';
import { submitTransfer } from '../src/api/transfer.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('잘못된 목록 응답은 화면 렌더 오류 대신 API 오류로 처리한다', async () => {
  globalThis.fetch = async () => Response.json({ accounts: [] });
  await assert.rejects(api.getAccounts(), /목록 응답 형식/);
});

test('JSON 대신 HTML 응답이 오면 성공으로 처리하지 않는다', async () => {
  globalThis.fetch = async () => new Response('<html>fallback</html>');
  await assert.rejects(api.getAccounts(), /서버 응답 형식/);
});

test('명세의 거래·계좌 응답이 없는 이체는 결과 확인이 필요하다', async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  await assert.rejects(api.postTransfer({ amount: 1000 }), { isOutcomeUnknown: true });
});

test('입력한 예금주를 필수 toOwnerName으로 보내고 서버 잔액을 반환한다', async () => {
  const receipt = { transaction: { id: 8, amount: 30000 }, account: { id: 'acc1', balance: 2354560 } };
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/transfers');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { fromAccountId: 'acc1', toBank: '우리은행', toAccountNo: '1002987654321', toOwnerName: '이서연', amount: 30000 });
    return Response.json(receipt, { status: 201 });
  };
  assert.deepEqual(await submitTransfer({ fromAccountId: 'acc1', toBank: '우리은행', toAccountNo: '1002987654321', ownerName: '이서연', amount: 30000 }), receipt);
});

test('거래 상세의 404 메시지를 유지하고 재시도하지 않는다', async () => {
  let calls = 0;
  globalThis.fetch = async url => {
    calls++;
    assert.equal(url, '/api/transactions/999');
    return Response.json({ message: '거래내역을 찾을 수 없습니다' }, { status: 404 });
  };
  await assert.rejects(api.getTransaction(999), /거래내역을 찾을 수 없습니다/);
  assert.equal(calls, 1);
});

test('계좌와 입출금 필터를 기존 API 쿼리 규격으로 전달한다', async () => {
  let requested;
  globalThis.fetch = async url => { requested = url; return Response.json([]); };
  await api.getTransactions({ accountId: 'acc1', type: 'out' });
  assert.equal(requested, '/api/transactions?accountId=acc1&type=out');
});

test('이체 실패를 성공으로 처리하거나 자동 재시도하지 않는다', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ message: '잔액 부족' }, { status: 400 }); };
  await assert.rejects(api.postTransfer({ amount: 1000 }), /잔액 부족/);
  assert.equal(calls, 1);
});

test('이체 응답 유실도 자동 재시도하지 않는다', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new TypeError('Network failed'); };
  await assert.rejects(api.postTransfer({ amount: 1000 }), { isNetworkError: true });
  assert.equal(calls, 1);
});

test('조회 요청의 일시적인 네트워크 실패는 한 번 재시도한다', async () => {
  let calls = 0;
  globalThis.fetch = async () => { if (++calls === 1) throw new TypeError('Network failed'); return Response.json([{ id: 'acc1' }]); };
  assert.deepEqual(await api.getAccounts(), [{ id: 'acc1' }]);
  assert.equal(calls, 2);
});

test('예금주 조회에 은행과 계좌번호를 인코딩한다', async () => {
  let requested;
  globalThis.fetch = async url => { requested = new URL(url, 'http://localhost'); return Response.json({ ownerName: '이서연' }); };
  assert.deepEqual(await api.lookupOwner('우리은행', '1002987654321'), { ownerName: '이서연' });
  assert.equal(requested.searchParams.get('bank'), '우리은행');
  assert.equal(requested.searchParams.get('accountNo'), '1002987654321');
});
