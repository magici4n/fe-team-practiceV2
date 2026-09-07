export function won(value) {
  return Number(value).toLocaleString("ko-KR") + "원";
}

export function findAccount(accounts, id) {
  return accounts.find((account) => account.id === id);
}

export function onlyNumbers(value) {
  return value.replace(/[^0-9]/g, "");
}