# transfer JS 파일 분리 구조

이번 구조는 STEP 02에서 JavaScript를 이해하기 쉽게 나눈 버전입니다.

## 파일 역할

### transferData.js
데이터만 저장합니다.
- 출금 계좌
- 테스트용 예금주
- 페이지 경로

### transferUtils.js
작고 반복 가능한 기능을 저장합니다.
- won()
- findAccount()
- onlyNumbers()

### transferUI.js
화면을 직접 변경하는 함수를 저장합니다.
- Step 화면 전환
- Toast
- 예금주 성공/실패 표시
- 금액 검증 메시지 표시

### transfer.js
전체 흐름을 담당합니다.
- 상태 관리
- 이벤트 리스너
- 예금주 조회
- 금액 검증
- 단계 이동
- 이체 실행
