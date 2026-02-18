export function getUserId() {
  let userId = localStorage.getItem("simvex_user_id");
  if (!userId) {
    // UUID 생성 (브라우저 내장 crypto API 사용)
    userId = crypto.randomUUID(); 
    localStorage.setItem("simvex_user_id", userId);
  }
  return userId;
}