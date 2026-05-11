const SESSION_KEY = "focusme_session_id";

/**
 * 익명 세션 ID. 브라우저 localStorage 에 영구 저장.
 * UTM·디바이스 등 다른 차원과 결합해 분석에 사용.
 * 실제 사용자 식별 정보는 아님.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function detectDevice(): "mobile" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  return /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
    ? "mobile"
    : "desktop";
}
