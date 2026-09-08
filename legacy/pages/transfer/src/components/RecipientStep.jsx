import {
  accounts,
  registeredOwners,
} from "../data/transferData.js";

import {
  won,
  onlyNumbers,
} from "../utils/transferUtils.js";


function RecipientStep({
  transferState,
  setTransferState,
  onNext,
  accountList
}) {

  // 출금 계좌 변경
  function handleFromAccountChange(event) {

    setTransferState({
      ...transferState,
      fromAccountId: event.target.value,
    });

  }


  // 받는 은행 변경
  function handleBankChange(event) {

    setTransferState({
      ...transferState,
      toBank: event.target.value,

      // 은행이 바뀌면 기존 예금주 확인은 초기화
      ownerName: "",
    });

  }


  // 계좌번호 입력
  function handleAccountNumberChange(event) {

    // 숫자만 남김
    const accountNo =
      onlyNumbers(event.target.value);


    // 입력한 계좌번호로 예금주 검색
    const foundOwner =
      registeredOwners[accountNo] || "";


    // React State 변경
    setTransferState({
      ...transferState,
      toAccountNo: accountNo,
      ownerName: foundOwner,
    });

  }


  return (
    <div className="transfer-wrap">

      <div className="step-title">
        누구에게 보낼까요?
      </div>

      <div className="step-sub">
        출금 계좌와 받는 분의 계좌 정보를 입력해주세요
      </div>


      {/* 출금 계좌 */}
      <div className="field-group">

        <label className="field-label">
          출금 계좌
        </label>

        <select
          className="tinput"
          value={transferState.fromAccountId}
          onChange={handleFromAccountChange}
        >

          {accounts.map((account) => (

            <option
              key={account.id}
              value={account.id}
            >
              {account.nickname} ({won(account.balance)})
            </option>

          ))}

        </select>

      </div>


      {/* 받는 은행 */}
      <div className="field-group">

        <label className="field-label">
          받는 은행
        </label>

        <select
          className="tinput"
          value={transferState.toBank}
          onChange={handleBankChange}
        >

          <option>우리은행</option>
          <option>국민은행</option>
          <option>신한은행</option>
          <option>하나은행</option>
          <option>카카오뱅크</option>

        </select>

      </div>


      {/* 계좌번호 */}
      <div className="field-group">

        <label className="field-label">
          계좌번호
        </label>

        <input
          type="text"
          className="tinput"
          value={transferState.toAccountNo}
          onChange={handleAccountNumberChange}
          placeholder="- 없이 숫자만 입력"
        />


        {/* 예금주가 확인되었을 때만 표시 */}
        {transferState.ownerName && (

          <div className="owner-chip show">

            ✓ 예금주
            {" "}
            {transferState.ownerName}
            님 확인됨

          </div>

        )}


        <div className="field-hint">

          테스트용 등록 계좌:
          {" "}

          <code>
            1002123456789
          </code>
          (김민준)

          ,{" "}

          <code>
            1002987654321
          </code>
          (이서연)

          ,{" "}

          <code>
            1102555666777
          </code>
          (박지훈)

        </div>

      </div>


      <button
        className="primary-btn"
        disabled={!transferState.ownerName}
        onClick={onNext}
      >
        다음
      </button>

    </div>
  );
}


export default RecipientStep;