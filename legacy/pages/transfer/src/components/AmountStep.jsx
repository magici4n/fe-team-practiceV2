import { accounts } from "../data/transferData.js";

import {
  won,
  findAccount,
  onlyNumbers,
} from "../utils/transferUtils.js";


function AmountStep({
  transferState,
  setTransferState,
  onNext,
  onBack,
  accountList
}) {

  // Step1에서 선택했던 출금 계좌 찾기
  const account = findAccount(
    accounts,
    transferState.fromAccountId
  );


  // 현재 입력된 금액
  const amount = transferState.amount;


  // -----------------------------
  // 금액 직접 입력
  // -----------------------------
  function handleAmountChange(event) {

    // 문자나 쉼표 등을 제거하고 숫자만 남김
    const value = onlyNumbers(
      event.target.value
    );

    // 빈 문자열이면 0,
    // 값이 있으면 Number로 변환
    const numberValue =
      value === "" ? 0 : Number(value);

    setTransferState({
      ...transferState,
      amount: numberValue,
    });
  }


  // -----------------------------
  // +1만 / +5만 / +10만
  // -----------------------------
  function addAmount(value) {

    setTransferState({
      ...transferState,
      amount:
        transferState.amount + value,
    });
  }


  // -----------------------------
  // 직접입력 버튼
  // -----------------------------
  function clearAmount() {

    setTransferState({
      ...transferState,
      amount: 0,
    });
  }


  // -----------------------------
  // 금액 검증
  // -----------------------------

  let message = "";
  let status = "";

  if (amount > 0 && amount < 1000) {

    message =
      "최소 이체 금액은 1,000원입니다";

    status = "err";

  } else if (
    amount > account.balance
  ) {

    message =
      `잔액(${won(account.balance)})을 초과했습니다`;

    status = "err";

  } else if (amount >= 1000) {

    message =
      `${won(amount)} 이체 가능합니다`;

    status = "ok";
  }


  // 다음 버튼을 활성화할 수 있는 조건
  const isValid =
    amount >= 1000 &&
    amount <= account.balance;


  return (
    <div className="transfer-wrap">

      <div className="step-title">
        얼마를 보낼까요?
      </div>

      <div className="step-sub">
        {account.nickname} 잔액{" "}
        {won(account.balance)} 중에서 보냅니다
      </div>


      <div className="field-group">

        <input
          type="text"
          inputMode="numeric"
          className={`tinput ${status}`}
          value={amount || ""}
          onChange={handleAmountChange}
          placeholder="0"
        />


        <div
          className={`helper-text ${status}`}
        >
          {message}
        </div>


        <div className="amount-quick">

          <button
            type="button"
            onClick={() => addAmount(10000)}
          >
            +1만
          </button>

          <button
            type="button"
            onClick={() => addAmount(50000)}
          >
            +5만
          </button>

          <button
            type="button"
            onClick={() => addAmount(100000)}
          >
            +10만
          </button>

          <button
            type="button"
            onClick={clearAmount}
          >
            직접입력
          </button>

        </div>

      </div>


      <button
        className="primary-btn"
        disabled={!isValid}
        onClick={onNext}
      >
        다음
      </button>


      <button
        className="secondary-btn"
        onClick={onBack}
      >
        이전으로
      </button>

    </div>
  );
}


export default AmountStep;