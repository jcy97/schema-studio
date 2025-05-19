// 세션 만료 여부 확인
export const isSessionExpired = (session: any): boolean => {
  if (!session || !session.expiresAt) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= session.expiresAt;
};

// 세션 상태에 따른 메시지 반환
export const getSessionMessage = (
  status: string,
  isExpired: boolean
): string | null => {
  if (status === "unauthenticated" || isExpired) {
    return "세션이 만료되었습니다. 다시 로그인이 필요합니다.";
  }

  if (status === "authenticated") {
    return null;
  }

  return null;
};
