// ============================================================
// transferUI.js
// 이 파일은 "화면에 보여주는 일"을 담당합니다.
// DOM을 직접 바꾸는 코드를 최대한 여기로 모았습니다.
// ============================================================

// 이체 단계(Step 1~4) 중 하나만 보이게 합니다.
export function showTransferStep(stepNumber) {
  [1, 2, 3, 4].forEach((number) => {
    const step = document.getElementById(`transferStep${number}`);

    step.style.display =
      number === stepNumber ? "block" : "none";
  });

  // 단계가 바뀔 때 스크롤을 맨 위로 올립니다.
  const screen = document.getElementById("screen-transfer");
  screen.scrollTop = 0;
}

// 화면 아래쪽에 잠깐 나타나는 안내 메시지입니다.
export function showToast(message) {
  const toast = document.getElementById("toast");

  // toast 요소가 없다면 아무것도 하지 않습니다.
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

// 예금주 확인 성공 화면을 보여줍니다.
export function showOwnerSuccess(owner) {
  const ownerName = document.getElementById("ownerName");
  const ownerChip = document.getElementById("ownerChip");
  const lookupHint = document.getElementById("lookupHint");
  const toAccountInput = document.getElementById("toAccountInput");
  const toStep2Btn = document.getElementById("toStep2Btn");

  ownerName.textContent = owner;
  ownerChip.classList.add("show");

  lookupHint.textContent = "";

  toAccountInput.classList.remove("err");
  toAccountInput.classList.add("ok");

  toStep2Btn.disabled = false;
}

// 예금주 확인 상태를 초기화합니다.
// 계좌번호를 다시 입력하거나 은행을 바꿀 때 사용합니다.
export function resetOwnerResult() {
  const ownerName = document.getElementById("ownerName");
  const ownerChip = document.getElementById("ownerChip");
  const toAccountInput = document.getElementById("toAccountInput");
  const toStep2Btn = document.getElementById("toStep2Btn");

  ownerName.textContent = "";
  ownerChip.classList.remove("show");

  toAccountInput.classList.remove("err", "ok");

  toStep2Btn.disabled = true;
}

// 등록되지 않은 계좌번호일 때 오류 화면을 보여줍니다.
export function showOwnerError(message) {
  const lookupHint = document.getElementById("lookupHint");
  const toAccountInput = document.getElementById("toAccountInput");

  lookupHint.textContent = message;
  lookupHint.style.color = "var(--coral)";

  toAccountInput.classList.add("err");
}

// 예금주 조회 중 표시입니다.
export function showOwnerLoading() {
  const lookupHint = document.getElementById("lookupHint");

  lookupHint.innerHTML =
    '<span class="inline-spinner"></span>예금주 조회 중...';

  lookupHint.style.color = "";
}

// 계좌번호 입력이 짧을 때 원래 테스트 안내 문구를 보여줍니다.
export function showDefaultLookupHint() {
  const lookupHint = document.getElementById("lookupHint");

  lookupHint.innerHTML =
    '테스트용 등록 계좌: <code>1002123456789</code>(김민준), ' +
    '<code>1002987654321</code>(이서연), ' +
    '<code>1102555666777</code>(박지훈)';

  lookupHint.style.color = "";
}

// 금액 검증 결과를 화면에 표시합니다.
// type은 "", "err", "ok" 중 하나를 사용합니다.
export function showAmountMessage(message, type = "") {
  const amountHelper = document.getElementById("amountHelper");
  const amountInput = document.getElementById("amountInput");

  amountInput.classList.remove("err", "ok");

  amountHelper.textContent = message;
  amountHelper.className = "helper-text";

  if (type) {
    amountHelper.classList.add(type);
    amountInput.classList.add(type);
  }
}
