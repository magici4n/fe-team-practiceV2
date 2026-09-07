// ============================================================
// transfer.js
// 이 파일은 이체 화면의 "전체 흐름"을 담당하는 메인 파일입니다.
//
// 역할:
// 1. 다른 파일의 데이터와 함수를 import
// 2. 현재 이체 상태 저장
// 3. 버튼/입력 이벤트 연결
// 4. 필요한 함수 호출
//
// 쉽게 말하면 "지휘자" 역할입니다.
// ============================================================

// 다른 파일에서 필요한 데이터와 함수를 가져옵니다.
import {
  accounts,
  registeredOwners,
  routes,
} from "./transferData.js";

import {
  won,
  findAccount,
  onlyNumbers,
} from "./transferUtils.js";

import {
  showTransferStep,
  showToast,
  showOwnerSuccess,
  resetOwnerResult,
  showOwnerError,
  showOwnerLoading,
  showDefaultLookupHint,
  showAmountMessage,
} from "./transferUI.js";


// ============================================================
// 1. 이체 상태
// ============================================================

// 사용자가 현재 입력한 이체 정보를 하나의 객체에 저장합니다.
// 화면이 Step 1 -> Step 2 -> Step 3으로 바뀌어도
// 이 객체 안에는 입력한 값이 계속 남아 있습니다.
let transferState = {
  fromAccountId: accounts[0].id,
  toBank: "우리은행",
  toAccountNo: "",
  ownerName: "",
  amount: 0,
};

// 계좌번호 입력 중 여러 번 조회되는 것을 막기 위한 변수입니다.
let lookupTimer = null;
let lookupSequence = 0;


// ============================================================
// 2. 자주 사용하는 DOM 요소
// ============================================================

// document.getElementById(...)를 계속 반복하지 않도록
// 필요한 HTML 요소를 미리 변수에 담아둡니다.
const fromAccountSelect =
  document.getElementById("fromAccountSelect");

const toBankSelect =
  document.getElementById("toBankSelect");

const toAccountInput =
  document.getElementById("toAccountInput");

const toStep2Btn =
  document.getElementById("toStep2Btn");

const amountInput =
  document.getElementById("amountInput");

const toStep3Btn =
  document.getElementById("toStep3Btn");

const step2Sub =
  document.getElementById("step2Sub");

const confirmBank =
  document.getElementById("confirmBank");

const confirmAccount =
  document.getElementById("confirmAccount");

const confirmOwner =
  document.getElementById("confirmOwner");

const confirmFrom =
  document.getElementById("confirmFrom");

const confirmAmount =
  document.getElementById("confirmAmount");

const submitTransferBtn =
  document.getElementById("submitTransferBtn");

const successDesc =
  document.getElementById("successDesc");

const doneTransferBtn =
  document.getElementById("doneTransferBtn");


// ============================================================
// 3. 이체 화면 초기화
// ============================================================

function resetTransferFlow() {
  // 상태를 처음 값으로 되돌립니다.
  transferState = {
    fromAccountId: accounts[0].id,
    toBank: "우리은행",
    toAccountNo: "",
    ownerName: "",
    amount: 0,
  };

  // 출금 계좌 select에 accounts 데이터를 넣습니다.
  fromAccountSelect.innerHTML = accounts
    .map(
      (account) =>
        `<option value="${account.id}">
          ${account.nickname} (${won(account.balance)})
        </option>`
    )
    .join("");

  // 첫 계좌와 우리은행을 기본값으로 선택합니다.
  fromAccountSelect.value =
    transferState.fromAccountId;

  toBankSelect.value =
    transferState.toBank;

  // 기존 입력값을 지웁니다.
  toAccountInput.value = "";
  amountInput.value = "";

  // 예금주 확인 화면 초기화
  resetOwnerResult();
  showDefaultLookupHint();

  // 금액 검증 화면 초기화
  showAmountMessage("");

  toStep2Btn.disabled = true;
  toStep3Btn.disabled = true;

  // 처음 화면은 Step 1입니다.
  showTransferStep(1);
}


// ============================================================
// 4. STEP 1 - 출금 계좌 / 받는 계좌
// ============================================================

// 사용자가 출금 계좌를 바꿨을 때
fromAccountSelect.addEventListener(
  "change",
  (event) => {
    transferState.fromAccountId =
      event.target.value;
  }
);


// 사용자가 받는 은행을 바꿨을 때
toBankSelect.addEventListener(
  "change",
  (event) => {
    transferState.toBank =
      event.target.value;

    // 은행이 바뀌면 기존 예금주 확인 결과는
    // 다시 확인해야 하므로 초기화합니다.
    transferState.ownerName = "";

    resetOwnerResult();

    // 이미 계좌번호를 입력했다면 다시 조회합니다.
    lookupOwner(toAccountInput.value);
  }
);


// 사용자가 계좌번호를 입력할 때
toAccountInput.addEventListener(
  "input",
  (event) => {
    // 계좌번호에서 숫자만 남깁니다.
    const value =
      onlyNumbers(event.target.value);

    // 화면에도 숫자만 다시 보여줍니다.
    event.target.value = value;

    // 상태 객체에도 저장합니다.
    transferState.toAccountNo = value;

    // 예금주 확인을 시작합니다.
    lookupOwner(value);
  }
);


// ============================================================
// 5. 예금주 확인
// ============================================================

function lookupOwner(accountNo) {
  // 이전 타이머가 있다면 취소합니다.
  clearTimeout(lookupTimer);

  // 새로운 조회 번호를 하나 증가시킵니다.
  const currentSequence =
    ++lookupSequence;

  // 새로 조회하기 전 이전 결과를 지웁니다.
  transferState.ownerName = "";
  resetOwnerResult();

  // 계좌번호가 너무 짧으면 아직 조회하지 않습니다.
  if (accountNo.length < 10) {
    showDefaultLookupHint();
    return;
  }

  // 조회 중 표시
  showOwnerLoading();

  // 지금은 API를 사용하지 않기 때문에
  // setTimeout으로 "서버 조회처럼 보이는 동작"만 흉내 냅니다.
  lookupTimer = setTimeout(() => {
    // 사용자가 그 사이 새로운 숫자를 입력했다면
    // 이전 조회 결과는 무시합니다.
    if (
      currentSequence !== lookupSequence
    ) {
      return;
    }

    // 객체에서 계좌번호에 해당하는 예금주를 찾습니다.
    const foundOwner =
      registeredOwners[accountNo];

    // 등록되지 않은 계좌번호
    if (!foundOwner) {
      showOwnerError(
        "등록된 테스트 계좌를 찾을 수 없습니다."
      );
      return;
    }

    // 정상 계좌번호라면 상태에 예금주 저장
    transferState.ownerName =
      foundOwner;

    // 화면에도 성공 결과 표시
    showOwnerSuccess(foundOwner);

  }, 400);
}


// "다음" 버튼 -> Step 2
toStep2Btn.addEventListener(
  "click",
  () => {
    const account =
      findAccount(
        accounts,
        transferState.fromAccountId
      );

    step2Sub.textContent =
      `${account.nickname} 잔액 ` +
      `${won(account.balance)} 중에서 보냅니다`;

    showTransferStep(2);
  }
);


// ============================================================
// 6. STEP 2 - 이체 금액 입력
// ============================================================

// 사용자가 직접 금액을 입력했을 때
amountInput.addEventListener(
  "input",
  (event) => {
    const value =
      onlyNumbers(event.target.value);

    event.target.value = value;

    validateAmount();
  }
);


// 금액이 정상인지 검사하는 함수
function validateAmount() {
  const account =
    findAccount(
      accounts,
      transferState.fromAccountId
    );

  const raw =
    onlyNumbers(amountInput.value);

  const amount =
    Number(raw);

  // 아무 값도 없거나 0원
  if (
    raw === "" ||
    amount === 0
  ) {
    showAmountMessage("");

    toStep3Btn.disabled = true;
    transferState.amount = 0;

    return;
  }

  // 현재 잔액보다 큰 금액
  if (
    amount > account.balance
  ) {
    showAmountMessage(
      `잔액(${won(account.balance)})을 초과했습니다`,
      "err"
    );

    toStep3Btn.disabled = true;
    transferState.amount = 0;

    return;
  }

  // 최소 이체 금액보다 작은 금액
  if (
    amount < 1000
  ) {
    showAmountMessage(
      "최소 이체 금액은 1,000원입니다",
      "err"
    );

    toStep3Btn.disabled = true;
    transferState.amount = 0;

    return;
  }

  // 위 조건에 걸리지 않으면 정상 금액입니다.
  showAmountMessage(
    `${won(amount)} 이체 가능합니다`,
    "ok"
  );

  transferState.amount =
    amount;

  toStep3Btn.disabled =
    false;
}


// +1만 / +5만 / +10만 / 직접입력 버튼
document
  .querySelectorAll(
    ".amount-quick button"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {

        // 직접입력 버튼
        if (
          button.dataset.amt ===
          "clear"
        ) {
          amountInput.value = "";
          amountInput.focus();

        } else {
          // 현재 금액
          const currentAmount =
            Number(
              onlyNumbers(
                amountInput.value
              )
            ) || 0;

          // 현재 금액 + 버튼의 금액
          amountInput.value =
            String(
              currentAmount +
              Number(
                button.dataset.amt
              )
            );
        }

        // 버튼으로 금액을 바꿨으니
        // 다시 검증합니다.
        validateAmount();
      }
    );
  });


// Step 2 -> Step 1
document
  .getElementById(
    "backToStep1Btn"
  )
  .addEventListener(
    "click",
    () => {
      showTransferStep(1);
    }
  );


// ============================================================
// 7. STEP 3 - 이체 내용 확인
// ============================================================

toStep3Btn.addEventListener(
  "click",
  () => {
    const account =
      findAccount(
        accounts,
        transferState.fromAccountId
      );

    // 지금까지 입력한 transferState 값을
    // 확인 화면에 보여줍니다.
    confirmBank.textContent =
      transferState.toBank;

    confirmAccount.textContent =
      transferState.toAccountNo;

    confirmOwner.textContent =
      transferState.ownerName;

    confirmFrom.textContent =
      `${account.nickname} ` +
      `(${account.accountNo})`;

    confirmAmount.textContent =
      won(transferState.amount);

    showTransferStep(3);
  }
);


// Step 3 -> Step 2
document
  .getElementById(
    "backToStep2Btn"
  )
  .addEventListener(
    "click",
    () => {
      showTransferStep(2);
    }
  );


// ============================================================
// 8. 이체 실행
// ============================================================

submitTransferBtn.addEventListener(
  "click",
  () => {
    const account =
      findAccount(
        accounts,
        transferState.fromAccountId
      );

    // 실제 이체 직전에도 한 번 더 금액을 검사합니다.
    if (
      transferState.amount < 1000 ||
      transferState.amount >
        account.balance
    ) {
      showToast(
        "이체 금액을 다시 확인해주세요."
      );

      showTransferStep(2);
      validateAmount();

      return;
    }

    const originalText =
      submitTransferBtn.textContent;

    // 처리 중에는 버튼을 다시 누르지 못하게 합니다.
    submitTransferBtn.disabled =
      true;

    submitTransferBtn.innerHTML =
      '<span class="inline-spinner"></span>' +
      "이체 처리 중...";

    // 지금은 API가 없으므로
    // 0.5초 후 이체가 완료되는 것처럼 동작시킵니다.
    setTimeout(() => {

      // 출금 계좌 잔액 차감
      account.balance -=
        transferState.amount;

      // 완료 메시지 작성
      successDesc.textContent =
        `${account.nickname}에서 ` +
        `${transferState.ownerName}님께 ` +
        `${won(transferState.amount)}을 보냈습니다`;

      // 버튼 원래 상태 복구
      submitTransferBtn.disabled =
        false;

      submitTransferBtn.textContent =
        originalText;

      // 완료 화면으로 이동
      showTransferStep(4);

    }, 500);
  }
);


// ============================================================
// 9. 홈으로 이동
// ============================================================

doneTransferBtn.addEventListener(
  "click",
  () => {
    window.location.href =
      routes.home;
  }
);


// ============================================================
// 10. 하단 네비게이션
// ============================================================

document
  .querySelectorAll("[data-nav]")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const target =
          button.dataset.nav;

        // 이미 이체 탭이라면
        // 이체 화면을 처음 상태로 되돌립니다.
        if (
          target === "transfer"
        ) {
          resetTransferFlow();
          return;
        }

        // 홈이나 거래내역 페이지로 이동합니다.
        if (routes[target]) {
          window.location.href =
            routes[target];
        }
      }
    );
  });


// 전체 메뉴 버튼
document
  .querySelectorAll(
    '[data-action="toast"]'
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {
        showToast(
          button.dataset.msg
        );
      }
    );
  });


// ============================================================
// 11. 최초 실행
// ============================================================

// 페이지가 처음 열리면
// 이체 화면을 초기 상태로 만들어줍니다.
resetTransferFlow();
