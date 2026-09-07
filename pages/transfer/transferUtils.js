// ============================================================
// transferUtils.js
// 여러 곳에서 반복해서 사용할 수 있는 "작은 기능"을 모아둔 파일입니다.
// 특정 화면에 강하게 묶이지 않는 함수들을 여기에 둡니다.
// ============================================================

// 숫자를 "원" 단위 문자열로 바꿔주는 함수입니다.
// 예: 250000 -> "250,000원"
export function won(value) {
  return Number(value).toLocaleString("ko-KR") + "원";
}

// accounts 배열에서 id가 같은 계좌 하나를 찾아주는 함수입니다.
// 예: findAccount(accounts, "account-1")
export function findAccount(accounts, id) {
  return accounts.find((account) => account.id === id);
}

// 사용자가 입력한 값에서 숫자만 남기는 함수입니다.
// 예: "1002-1234abc" -> "10021234"
export function onlyNumbers(value) {
  return value.replace(/[^0-9]/g, "");
}
