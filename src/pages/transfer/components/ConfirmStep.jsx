import {
  won,
  findAccount,
} from "../utils/transferUtils.js";


function ConfirmStep({
  transferState,
  onTransfer,
  onBack,
  accountList,
  submitting,
  error,
}) {

  // Step1에서 선택했던 출금 계좌를 찾습니다.
  const account = findAccount(
    accountList,
    transferState.fromAccountId
  );


  return (
    <div className="transfer-wrap">

      <div className="step-title">
        이체 내용을 확인해주세요
      </div>


      <div className="confirm-card">

        {/* 받는 은행 */}
        <div className="confirm-row">
          <span className="k">
            받는 분
          </span>

          <span className="v">
            {transferState.toBank}
          </span>
        </div>


        {/* 계좌번호 */}
        <div className="confirm-row">
          <span className="k">
            계좌번호
          </span>

          <span className="v">
            {transferState.toAccountNo}
          </span>
        </div>


        {/* 예금주 */}
        <div className="confirm-row">
          <span className="k">
            예금주
          </span>

          <span className="v">
            {transferState.ownerName}
          </span>
        </div>


        {/* 출금 계좌 */}
        <div className="confirm-row">
          <span className="k">
            출금 계좌
          </span>

          <span className="v">
            {account.nickname}
            {" "}
            ({account.accountNo})
          </span>
        </div>


        {/* 이체 금액 */}
        <div className="confirm-row total">
          <span className="k">
            이체 금액
          </span>

          <span className="v">
            {won(transferState.amount)}
          </span>
        </div>

      </div>


      {error && <p className="helper-text err" role="alert">{error}</p>}
      <button
        className="primary-btn"
        disabled={submitting}
        onClick={onTransfer}
      >
        {submitting ? '이체 중…' : '이체하기'}
      </button>


      <button
        className="secondary-btn"
        disabled={submitting}
        onClick={onBack}
      >
        이전으로
      </button>

    </div>
  );
}


export default ConfirmStep;
