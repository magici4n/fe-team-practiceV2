import React from "react";

export default function TransactionItem({ tx, accountName }) {
  const isIncome = tx.type === "in";
  const formatWon = (amount) => Number(amount).toLocaleString("ko-KR") + "원";

  return (
    <div className="tx-card">
      <div className="tx-left">
        <div className={`tx-icon ${isIncome ? "in" : "out"}`}>
          {isIncome ? "⬇️" : "⬆️"}
        </div>
        <div className="tx-info">
          <div className="tx-title">{tx.desc}</div>
          <div className="tx-sub">
            {tx.date} {tx.time} · {accountName}{" "}
            <span className={`badge ${tx.status === "done" ? "done" : "pending"}`}>
              {tx.status === "done" ? "완료" : "처리중"}
            </span>
          </div>
        </div>
      </div>
      <div className="tx-right">
        <div className={`tx-amount ${isIncome ? "in" : "out"}`}>
          {isIncome ? "+" : "-"}{formatWon(tx.amount)}
        </div>
        <div className="tx-balance">잔액 {formatWon(tx.balanceAfter)}</div>
      </div>
    </div>
  );
}