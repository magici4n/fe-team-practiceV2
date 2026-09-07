# WON뱅킹 실습 · Team 01

우리WON뱅킹의 홈 / 이체 / 거래내역 화면을 7단계로 구현한 팀 실습 결과물입니다.

## 팀원 및 역할
| 이름 | GitHub | 담당 |
|---|---|---|
| 홍길동 | @gildong | 홈 화면, 계좌 목록 API 연동 |
| 김철수 | @chulsoo | 이체 플로우, 폼 검증 |
| 이영희 | @younghee | 거래내역, 필터링, 테스트 |

## 실행 방법
```bash
# 1. 서버
cd server && npm install && npm start     # http://localhost:4000

# 2. 클라이언트 (새 터미널)
cd client && npm install
cp ../.env.example .env                   # 필요 시 값 수정
npm run dev                               # http://localhost:5173
```

## 구현 범위
- [ ] STEP 01 화면 분석 & 정적 마크업
- [ ] STEP 02 바닐라 JS 인터랙션
- [ ] STEP 03 컴포넌트 설계 & React 전환
- [ ] STEP 04 외부 API 연동
- [ ] STEP 05 AI 활용 구현 실습
- [ ] STEP 06 코드리뷰 & 리팩토링
- [ ] STEP 07 테스트 — 컴포넌트 테스트 5개 완료, API 테스트 미완

## 협업 방식
- 브랜치: `feat/*`, `fix/*`, `refactor/*`, `test/*`
- main 직접 push 금지, PR + 1인 승인 후 Squash merge
- 총 PR 12개 / 리뷰 코멘트 34건

## 우리가 겪은 문제와 해결
1. **이체 후 잔액이 갱신되지 않던 문제**
   - 원인: state를 직접 수정해 React가 변경을 감지하지 못함
   - 해결: 스프레드로 새 객체를 만들어 setState (PR #7)
2. **거래내역 필터가 두 번 눌러야 반영되던 문제**
   - 원인: useEffect 의존성 배열에 filter가 빠져 있었음 (PR #9)

## AI 활용 기록
- 사용 도구: (예) Claude, ChatGPT
- 주로 쓴 방식: 설계 검토 요청, 에러 원인 분석, 테스트 케이스 제안
- 검증 방법: 생성된 코드는 항상 직접 실행 후, PR에 동작 확인 절차를 기재

## 알려진 한계
- API 테스트 미작성
- 반응형은 모바일 폭(390px) 기준으로만 검증
