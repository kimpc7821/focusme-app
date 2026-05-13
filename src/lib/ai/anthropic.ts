import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

function getClient(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY 환경변수가 없습니다");
  cached = new Anthropic({ apiKey });
  return cached;
}

const SONNET_MODEL =
  process.env.CLAUDE_REGENERATE_MODEL ?? "claude-sonnet-4-6";
const HAIKU_MODEL = process.env.CLAUDE_INSIGHT_MODEL ?? "claude-haiku-4-5";

// 단가 (1M tokens). 향후 변동 시 갱신.
const SONNET_INPUT_PER_M = 3;
const SONNET_OUTPUT_PER_M = 15;
const HAIKU_INPUT_PER_M = 1;
const HAIKU_OUTPUT_PER_M = 5;
const USD_TO_KRW = 1400;

const TONE_GUIDE: Record<string, string> = {
  warm_minimal: "따뜻하고 간결, 감성적 어휘",
  cool_modern: "명확하고 전문적, 사실 위주",
  premium_dark: "격조 있고 절제, 짧고 강한 문장",
  soft_pastel: "친근하고 부드러움, 가벼운 이모지 OK",
  vivid_bold: "강렬하고 임팩트, 임팩트 카피",
};

export interface RegenerateInput {
  blockId: string;
  blockType: string;
  currentConfig: Record<string, unknown>;
  currentContent: Record<string, unknown>;
  instruction?: string;
  keepFacts: boolean;
  businessName: string;
  businessType: string;
  toneKey: string | null;
}

export interface RegenerateResult {
  blockId: string;
  before: { content: Record<string, unknown> };
  after: { content: Record<string, unknown> };
  tokensUsed: { input: number; output: number };
  costKrw: number;
}

export async function regenerateBlockContent(
  input: RegenerateInput,
): Promise<RegenerateResult> {
  const tone = input.toneKey
    ? `${input.toneKey} (${TONE_GUIDE[input.toneKey] ?? "기본"})`
    : "warm_minimal (따뜻하고 간결)";

  const systemPrompt = [
    {
      type: "text" as const,
      text: `당신은 한국 SMB 사장님 모바일 마이크로사이트의 카피라이터입니다.

원칙:
- 자연스러운 한국어, 외국어 직역체 X.
- 모바일 가독성 — 한 단락 100~200자.
- 응답은 JSON 객체 한 개만. 다른 설명·텍스트·마크다운 코드블록 절대 포함 X.
- 블록의 content 필드 전체를 반환 (config 는 변경 X).
- content 의 키 구조와 타입은 그대로 유지. 값만 변경.

톤 가이드: ${tone}

keepFacts 가 true 면 다음 사실 절대 변경 X:
- 상품명 · 가격 · 연락처 (전화·이메일·SNS URL)
- 주소 · 영업시간 · 날짜 · 사업자등록번호
- 실제 인물명 · 사업자명`,
      cache_control: { type: "ephemeral" as const },
    },
  ];

  const userMessage = `[페이지 컨텍스트]
사업자명: ${input.businessName}
업종: ${input.businessType}

[블록]
type: ${input.blockType}
keepFacts: ${input.keepFacts}

[현재 content]
${JSON.stringify(input.currentContent, null, 2)}

[지시사항]
${input.instruction?.trim() || "톤 가이드에 맞게 자연스럽게 다듬어주세요."}

위 content 와 같은 구조의 JSON 객체 한 개만 반환하세요.`;

  const response = await getClient().messages.create({
    model: SONNET_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const parsed = extractJson(text);
  if (!parsed) {
    throw new Error(
      `AI 응답을 JSON 으로 파싱할 수 없습니다. 응답 일부: ${text.slice(0, 200)}`,
    );
  }

  const usage = response.usage;
  const costUsd =
    (usage.input_tokens * SONNET_INPUT_PER_M +
      usage.output_tokens * SONNET_OUTPUT_PER_M) /
    1_000_000;

  return {
    blockId: input.blockId,
    before: { content: input.currentContent },
    after: { content: parsed },
    tokensUsed: {
      input: usage.input_tokens,
      output: usage.output_tokens,
    },
    costKrw: Math.round(costUsd * USD_TO_KRW * 10) / 10,
  };
}

export interface InsightInput {
  businessName: string;
  businessType: string;
  periodStart: string;
  periodEnd: string;
  summary: {
    totalViews: number;
    uniqueSessions: number;
    kakaoClicks: number;
    phoneClicks: number;
    externalClicks: number;
    formSubmits: number;
    comparison?: { totalViews: number; changePercent: number };
  };
  topSources: Array<{ name: string; percent: number }>;
  topTargets: Array<{ target: string; clicks: number }>;
  byDevice: { mobile: number; desktop: number };
}

export interface InsightResult {
  text: string;
  tokensUsed: { input: number; output: number };
  costKrw: number;
}

export async function generateInsight(
  input: InsightInput,
): Promise<InsightResult> {
  const compRow = input.summary.comparison
    ? `- 이전 동일 기간 대비 ${input.summary.comparison.changePercent >= 0 ? "+" : ""}${input.summary.comparison.changePercent}% (${input.summary.comparison.totalViews}회 → ${input.summary.totalViews}회)`
    : "";

  const userMessage = `한국 SMB 사장님의 모바일 마이크로사이트 분기 분석 결과입니다.

[업체]
- ${input.businessName} (${input.businessType})
- 기간: ${input.periodStart} ~ ${input.periodEnd}

[핵심 지표]
- 총 방문: ${input.summary.totalViews}회 / 유니크 세션: ${input.summary.uniqueSessions}
- 카톡 클릭: ${input.summary.kakaoClicks} / 전화: ${input.summary.phoneClicks} / 외부 링크: ${input.summary.externalClicks} / 폼 제출: ${input.summary.formSubmits}
${compRow}

[유입 경로 TOP]
${input.topSources.map((s) => `- ${s.name}: ${s.percent}%`).join("\n") || "- 없음"}

[인기 클릭 대상]
${input.topTargets.map((t) => `- ${t.target}: ${t.clicks}회`).join("\n") || "- 없음"}

[디바이스]
- 모바일 ${Math.round(input.byDevice.mobile * 100)}% / 데스크탑 ${Math.round(input.byDevice.desktop * 100)}%

위 데이터를 사장님 입장에서 한 문단(2~3문장, 한국어, 친근하고 사실 기반)으로 해석해주세요.
- 가장 두드러진 패턴 1~2가지 짚기
- 다음 분기 추천 액션 한 줄
- 숫자는 절대 지어내지 말 것 (위 데이터에만 근거)
- 응답은 한 문단 평문만. 따옴표·마크다운·JSON 모두 X.`;

  const response = await getClient().messages.create({
    model: HAIKU_MODEL,
    max_tokens: 512,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((b): b is import("@anthropic-ai/sdk").Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const usage = response.usage;
  const costUsd =
    (usage.input_tokens * HAIKU_INPUT_PER_M +
      usage.output_tokens * HAIKU_OUTPUT_PER_M) /
    1_000_000;

  return {
    text,
    tokensUsed: { input: usage.input_tokens, output: usage.output_tokens },
    costKrw: Math.round(costUsd * USD_TO_KRW * 10) / 10,
  };
}

function extractJson(text: string): Record<string, unknown> | null {
  // 1) ```json ... ``` 코드 블록 우선
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;

  // 2) 첫 { ~ 마지막 } 추출
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first < 0 || last < 0 || last <= first) return null;
  const sliced = candidate.slice(first, last + 1);

  try {
    const obj = JSON.parse(sliced);
    if (typeof obj !== "object" || obj === null || Array.isArray(obj))
      return null;
    return obj as Record<string, unknown>;
  } catch {
    return null;
  }
}
