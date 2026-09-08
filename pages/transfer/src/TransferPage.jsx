import { useState } from "react";

import { accounts } from "./data/transferData.js";

import Header from "./components/Header.jsx";
import BottomNav from "./components/BottomNav.jsx";

import RecipientStep from "./components/RecipientStep.jsx";
import AmountStep from "./components/AmountStep.jsx";
import ConfirmStep from "./components/ConfirmStep.jsx";
import SuccessStep from "./components/SuccessStep.jsx";

import "./transfer.css";


function TransferPage() {

  // 현재 이체 단계
  const [step, setStep] =
    useState(1);


  // 실제 계좌 목록
  const [accountList, setAccountList] =
    useState(accounts);


  // 현재 이체 정보
  const [
    transferState,
    setTransferState
  ] = useState({

    fromAccountId:
      accounts[0].id,

    toBank:
      "우리은행",

    toAccountNo:
      "",

    ownerName:
      "",

    amount:
      0,
  });


  // 이체 실행
  function handleTransfer() {

    setAccountList(
      (prevAccounts) =>
        prevAccounts.map(
          (account) => {

            if (
              account.id !==
              transferState.fromAccountId
            ) {
              return account;
            }

            return {
              ...account,

              balance:
                account.balance -
                transferState.amount,
            };
          }
        )
    );

    setStep(4);
  }


  // 현재는 홈 페이지 대신
  // 이체 화면 처음으로 돌아갑니다.
  function handleHome() {

    setStep(1);

    setTransferState({
      fromAccountId:
        accountList[0].id,

      toBank:
        "우리은행",

      toAccountNo:
        "",

      ownerName:
        "",

      amount:
        0,
    });
  }


  return (
    <div className="phone">

      <Header />


      <section
        className="screen active"
        id="screen-transfer"
      >

        {step === 1 && (
          <RecipientStep
            transferState={transferState}
            setTransferState={setTransferState}
            accountList={accountList}
            onNext={() => setStep(2)}
          />
        )}


        {step === 2 && (
          <AmountStep
            transferState={transferState}
            setTransferState={setTransferState}
            accountList={accountList}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}


        {step === 3 && (
          <ConfirmStep
            transferState={transferState}
            accountList={accountList}
            onTransfer={handleTransfer}
            onBack={() => setStep(2)}
          />
        )}


        {step === 4 && (
          <SuccessStep
            transferState={transferState}
            accountList={accountList}
            onHome={handleHome}
          />
        )}

      </section>


      <BottomNav />

    </div>
  );
}


export default TransferPage;