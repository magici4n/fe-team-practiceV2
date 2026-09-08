const express = require('express');
const cors = require('cors');
const { accounts, transactions, ownerLookup, getNextTxId } = require('./data');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());          // 실습 목적: 모든 origin 허용
app.use(express.json());  // JSON 요청 바디 파싱

// ---------------------------------------------------------------------
// 계좌 (Accounts)
// ---------------------------------------------------------------------

// GET /api/accounts — 전체 계좌 목록 조회
app.get('/api/accounts', (req, res) => {
  console.log(`[계좌 목록] 전체 계좌 조회 → 총 ${accounts.length}개 반환`);
  res.status(200).json(accounts);
});

// GET /api/accounts/:accountId — 단일 계좌 상세 조회
app.get('/api/accounts/:accountId', (req, res) => {
  const account = accounts.find(a => a.id === req.params.accountId);
  if (!account) {
    console.log(`[계좌 상세] accountId="${req.params.accountId}" → 404 계좌 없음`);
    return res.status(404).json({ message: '계좌를 찾을 수 없습니다' });
  }
  console.log(`[계좌 상세] accountId="${account.id}" (${account.nickname}) 조회 성공 → 잔액 ${account.balance.toLocaleString()}원`);
  res.status(200).json(account);
});

// ---------------------------------------------------------------------
// 거래내역 (Transactions)
// ---------------------------------------------------------------------

// GET /api/transactions?accountId=&type=&limit= — 거래내역 목록 조회
app.get('/api/transactions', (req, res) => {
  const { accountId, type, limit } = req.query;

  let result = [...transactions];

  if (accountId) {
    result = result.filter(tx => tx.accountId === accountId);
  }
  if (type === 'in' || type === 'out') {
    result = result.filter(tx => tx.type === type);
  }

  // 최신순 정렬 (date + time 기준)
  result.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  if (limit) {
    const n = Number(limit);
    if (!Number.isNaN(n) && n > 0) {
      result = result.slice(0, n);
    }
  }

  const filterDesc = [
    accountId ? `accountId=${accountId}` : null,
    type      ? `type=${type}`           : null,
    limit     ? `limit=${limit}`         : null,
  ].filter(Boolean).join(', ') || '필터 없음';
  console.log(`[거래내역 목록] 조회 조건: ${filterDesc} → ${result.length}건 반환`);

  res.status(200).json(result);
});

// GET /api/transactions/:id — 거래 상세 조회
app.get('/api/transactions/:id', (req, res) => {
  const id = Number(req.params.id);
  const tx = transactions.find(t => t.id === id);
  if (!tx) {
    console.log(`[거래 상세] id=${id} → 404 거래내역 없음`);
    return res.status(404).json({ message: '거래내역을 찾을 수 없습니다' });
  }
  console.log(`[거래 상세] id=${tx.id} (${tx.date} ${tx.time} / ${tx.desc}) → ${tx.type === 'in' ? '입금' : '출금'} ${tx.amount.toLocaleString()}원`);
  res.status(200).json(tx);
});

// ---------------------------------------------------------------------
// 이체 (Transfer)
// ---------------------------------------------------------------------

// GET /api/transfer/lookup?bank=&accountNo= — 예금주 조회
app.get('/api/transfer/lookup', (req, res) => {
  const { bank, accountNo } = req.query;

  if (!bank || !accountNo) {
    console.log(`[예금주 조회] 필수 파라미터 누락 → bank="${bank}", accountNo="${accountNo}"`);
    return res.status(400).json({ message: 'bank와 accountNo는 필수 값입니다' });
  }

  const ownerName = ownerLookup[accountNo];
  if (!ownerName) {
    console.log(`[예금주 조회] bank="${bank}", accountNo="${accountNo}" → 404 계좌 정보 없음`);
    return res.status(404).json({ message: '계좌 정보를 확인할 수 없습니다' });
  }

  console.log(`[예금주 조회] bank="${bank}", accountNo="${accountNo}" → 예금주: ${ownerName}`);
  res.status(200).json({ ownerName });
});

// POST /api/transfers — 이체 실행
app.post('/api/transfers', (req, res) => {
  const { fromAccountId, toBank, toAccountNo, toOwnerName, amount } = req.body;

  // 1. 필드 누락 검증
  if (!fromAccountId || !toBank || !toAccountNo || !toOwnerName || amount == null) {
    console.log(`[이체] 필수 항목 누락 → body: ${JSON.stringify(req.body)}`);
    return res.status(400).json({ message: '필수 항목이 누락되었습니다' });
  }

  // 2. 출금 계좌 존재 여부 검증
  const account = accounts.find(a => a.id === fromAccountId);
  if (!account) {
    console.log(`[이체] 출금 계좌 없음 → fromAccountId="${fromAccountId}"`);
    return res.status(404).json({ message: '출금 계좌를 찾을 수 없습니다' });
  }

  const numericAmount = Number(amount);

  // 3. 서버 측 금액 재검증 — 클라이언트가 보낸 값을 그대로 신뢰하지 않습니다
  if (!Number.isFinite(numericAmount) || numericAmount < 1000) {
    console.log(`[이체] 유효하지 않은 금액 → amount=${amount}`);
    return res.status(400).json({ message: '이체 금액은 1,000원 이상이어야 합니다' });
  }
  if (numericAmount > account.balance) {
    console.log(`[이체] 잔액 부족 → 요청금액 ${numericAmount.toLocaleString()}원 / 잔액 ${account.balance.toLocaleString()}원`);
    return res.status(400).json({ message: '잔액이 부족합니다' });
  }

  // 4. 이체 실행: 잔액 차감 + 거래내역 생성
  account.balance -= numericAmount;

  const now = new Date();
  const newTx = {
    id: getNextTxId(),
    accountId: account.id,
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    desc: toOwnerName,
    type: 'out',
    amount: numericAmount,
    balanceAfter: account.balance,
    status: 'done'
  };
  transactions.unshift(newTx);

  console.log(`[이체] 성공 → ${account.nickname}(${fromAccountId}) → ${toBank} ${toAccountNo} (${toOwnerName}) | 금액: ${numericAmount.toLocaleString()}원 | 이체 후 잔액: ${account.balance.toLocaleString()}원 | txId=${newTx.id}`);

  res.status(201).json({
    transaction: newTx,
    account: { id: account.id, balance: account.balance }
  });
});

// ---------------------------------------------------------------------
// 헬스체크 & 에러 핸들링
// ---------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  console.log('[헬스체크] 서버 정상 동작 중');
  res.status(200).json({ status: 'ok' });
});

app.use((req, res) => {
  console.log(`[404] 존재하지 않는 경로 요청 → ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: '요청하신 API 경로를 찾을 수 없습니다' });
});

if (require.main === module) app.listen(PORT, () => {
  console.log(`WON 실습뱅킹 API 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log(`예: http://localhost:${PORT}/api/accounts`);
});

module.exports = app;
