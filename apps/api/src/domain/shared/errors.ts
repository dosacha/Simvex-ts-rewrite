/** 모델 미발견 비즈니스 에러 — ai, models 등 여러 도메인이 공유. controller 에서 404 로 변환할 자리. */
export class ModelNotFoundError extends Error {
  constructor(modelId: number) {
    super(`모델을 찾을 수 없습니다 (id: ${modelId})`);
    this.name = "ModelNotFoundError";
  }
}
