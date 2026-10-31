import Anthropic from "@anthropic-ai/sdk";

// ANTHROPIC_API_KEY는 서버 전용이므로 이 모듈은 서버 코드에서만 import한다.
export const anthropic = new Anthropic({ maxRetries: 2, timeout: 60_000 });
