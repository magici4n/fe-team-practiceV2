/** 숫자를 한국 원화 표기로 바꿉니다. 1234560 → "1,234,560원" */
export function won(n) {
  return Number(n).toLocaleString('ko-KR') + '원';
}

/*
  바닐라판에 있던 escapeHtml은 여기 없습니다.
  JSX의 {value}는 값을 항상 텍스트로만 삽입하므로 React가 자동으로 이스케이프합니다.
  <div>{a.nickname}</div> 에 <img onerror="..."> 같은 값이 들어와도 태그로 해석되지 않습니다.
  의도적으로 HTML을 넣어야 할 때만 dangerouslySetInnerHTML을 쓰는데,
  이름이 "dangerously"로 시작하는 것 자체가 경고입니다.
*/
