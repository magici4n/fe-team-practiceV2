/* =========================================================================
   로딩 / 비어있음 / 오류 상태를 표시하는 공용 컴포넌트
   =========================================================================
   바닐라판에서는 이 세 가지를 innerHTML 문자열로 매번 갈아끼웠습니다.
   여기서는 한 번 만들어 두고 어느 목록에서든 재사용합니다.
   ========================================================================= */

export default function StateMessage({ variant = 'loading', children }) {
  if (variant === 'loading') {
    return (
      <p className="empty-state">
        <span className="inline-spinner" aria-hidden="true" />
        {children}
      </p>
    );
  }
  return (
    <p className={variant === 'error' ? 'empty-state error' : 'empty-state'}>
      {children}
    </p>
  );
}
