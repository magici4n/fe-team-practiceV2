import React, { useState, useEffect } from "react";
import "./transactions.css";

import AccountFilter from "./components/AccountFilter.jsx";
import TypeFilter from "./components/TypeFilter.jsx";
import TransactionItem from "./components/TransactionItems.jsx";
import FooterNav from "./components/FooterNav.jsx";

const API_BASE = "http://localhost:4000/api";

const mockAccounts = [
  { id: "acc-1", nickname: "우리 첫급여통장", accountNo: "1002-123-456789" },
  { id: "acc-2", nickname: "우리 SUPER주거래통장", accountNo: "1002-987-654321" },
  { id: "acc-3", nickname: "우리 청년도약계좌", accountNo: "1102-555-666777" },
];

const mockTransactions = [
  { id: 1, accountId: "acc-1", date: "2026-08-23", time: "09:12", desc: "스타벅스 강남점", type: "out", amount: 5800, balanceAfter: 2384560, status: "done" },
  { id: 2, accountId: "acc-1", date: "2026-08-22", time: "18:40", desc: "월급입금 (주식회사 원)", type: "in", amount: 3200000, balanceAfter: 2390360, status: "done" },
  { id: 3, accountId: "acc-1", date: "2026-08-22", time: "12:05", desc: "이서연", type: "out", amount: 30000, balanceAfter: 809640, status: "done" },
  { id: 4, accountId: "acc-2", date: "2026-08-21", time: "10:00", desc: "자동이체 - 적금", type: "out", amount: 500000, balanceAfter: 15200000, status: "done" },
  { id: 5, accountId: "acc-1", date: "2026-08-20", time: "20:15", desc: "배달의민족", type: "out", amount: 18900, balanceAfter: 15839640, status: "pending" },
  { id: 6, accountId: "acc-3", date: "2026-08-19", time: "09:00", desc: "청년도약 납입", type: "in", amount: 300000, balanceAfter: 5000000, status: "done" },
  { id: 7, accountId: "acc-1", date: "2026-08-18", time: "14:22", desc: "박지훈", type: "in", amount: 50000, balanceAfter: 15858540, status: "done" },
];

export default function Transactions() {
  const [accounts, setAccounts] = useState(mockAccounts);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const accRes = await fetch(`${API_BASE}/accounts`);
        if (accRes.ok) setAccounts(await accRes.json());

        const txRes = await fetch(`${API_BASE}/transactions`);
        if (txRes.ok) setTransactions(await txRes.json());
      } catch (err) {
        console.warn("API 서버 미연결: 로컬 더미 데이터를 활성화합니다.");
      }
    }
    fetchData();
  }, []);

  const handleAccountChange = async (accId) => {
    setSelectedAccount(accId);
    try {
      const params = new URLSearchParams();
      if (accId !== "all") params.append("accountId", accId);
      if (selectedType !== "all") params.append("type", selectedType);

      const res = await fetch(`${API_BASE}/transactions?${params.toString()}`);
      if (res.ok) {
        setTransactions(await res.json());
        return;
      }
    } catch (err) {}

    // API 서버 연결 안된 경우 로컬 필터링
    let filtered = mockTransactions;
    if (accId !== "all") filtered = filtered.filter((t) => t.accountId === accId);
    if (selectedType !== "all") filtered = filtered.filter((t) => t.type === selectedType);
    setTransactions(filtered);
  };

  const handleTypeChange = async (type) => {
    setSelectedType(type);
    try {
      const params = new URLSearchParams();
      if (selectedAccount !== "all") params.append("accountId", selectedAccount);
      if (type !== "all") params.append("type", type);

      const res = await fetch(`${API_BASE}/transactions?${params.toString()}`);
      if (res.ok) {
        setTransactions(await res.json());
        return;
      }
    } catch (err) {}

    // API 서버 연결 안된 경우 로컬 필터링
    let filtered = mockTransactions;
    if (selectedAccount !== "all") filtered = filtered.filter((t) => t.accountId === selectedAccount);
    if (type !== "all") filtered = filtered.filter((t) => t.type === type);
    setTransactions(filtered);
  };

  const getAccountName = (accId) => {
    const found = accounts.find((acc) => acc.id === accId);
    return found ? found.nickname : "계좌";
  };

  return (
    <div className="phone-mockup">
      <div className="phone-screen">
        <header className="app-header">
          <div className="phone">
            <span>9:41</span>
            <span> ●●● 5G 🔋</span>
          </div>
          <div className="header-body">
            <div className="brand">
              <div className="brand-name">W</div>
              <div className="brand-logo">WON 실습뱅킹</div>
            </div>
            <div className="header-utils">
              <button type="button" className="icon-btn">🔔</button>
              <button type="button" className="icon-btn">☰</button>
            </div>
          </div>
        </header>

        <main className="app-main">
          <AccountFilter
            accounts={accounts}
            selectedAccount={selectedAccount}
            onSelectAccount={handleAccountChange}
          />

          <TypeFilter
            selectedType={selectedType}
            onSelectType={handleTypeChange}
          />

          <section id="tx-list" className="tx-list">
            {transactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--graphite)" }}>
                조건에 맞는 거래 내역이 없습니다.
              </div>
            ) : (
              <div className="tx-group">
                {transactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    tx={tx}
                    accountName={getAccountName(tx.accountId)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        <FooterNav />
      </div>
    </div>
  );
}