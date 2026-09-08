import {
  won,
  findAccount,
} from "../utils/transferUtils.js";


function SuccessStep({
  transferState,
  accountList,
  onHome,
}) {

  // 어떤 계좌에서 이체했는지 찾습니다.
  const account = findAccount(
    accountList,
    transferState.fromAccountId
  );


  return (
    <div className="transfer-wrap">

      <div className="success-wrap">

        <div className="success-icon">
          ✓
        </div>

        <h2>
          이체가 완료되었습니다
        </h2>

        <p>
          {account.nickname}에서{" "}
          {transferState.ownerName}님께{" "}
          {won(transferState.amount)}을 보냈습니다
        </p>

      </div>


      <button
        className="primary-btn"
        onClick={onHome}
      >
        홈으로
      </button>

    </div>
  );
}


export default SuccessStep;