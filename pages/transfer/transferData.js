// ============================================================
// transferData.js
// 이 파일은 "데이터"만 모아두는 파일입니다.
// 화면을 바꾸거나 버튼을 클릭하는 기능은 여기 넣지 않습니다.
// ============================================================

// 사용자가 가지고 있는 출금 계좌 더미 데이터입니다.
// STEP 04에서 API를 붙이게 되면, 이 데이터는 서버에서 받아오게 됩니다.
export const accounts = [
  {
    id: "account-1",
    nickname: "우리 첫급여통장",
    accountNo: "1002-***-123456",
    balance: 2384560,
  },
  {
    id: "account-2",
    nickname: "우리 SUPER주거래통장",
    accountNo: "1002-***-789012",
    balance: 15200000,
  },
  {
    id: "account-3",
    nickname: "우리 청년도약계좌",
    accountNo: "1002-***-456789",
    balance: 5000000,
  },
];

// 예금주 확인을 흉내 내기 위한 더미 데이터입니다.
// 계좌번호를 key로, 예금주 이름을 value로 저장했습니다.
export const registeredOwners = {
  "1002123456789": "김민준",
  "1002987654321": "이서연",
  "1102555666777": "박지훈",
};

// 하단 메뉴 이동 경로입니다.
// 실제 파일명이 다르면 이 부분만 수정하면 됩니다.
export const routes = {
  home: "../home/home.html",
  transfer: "transfer.html",
  history: "../transactions/index.html",
};
