/**
 * 알림 dispatch — provider 스위치 + 시나리오별 함수.
 *
 * NOTIFY_PROVIDER=mock|toast 로 전환.
 *   - mock  : console.log 만. 외부 API 호출 없음. 개발·CI·NHN Toast 가입 전.
 *   - toast : NHN Cloud Toast 알림톡 API 호출 (실패 시 SMS fallback).
 *
 * 시나리오·템플릿 매핑은 docs/focusme-alimtalk-templates.md 와 1:1.
 * 시그니처를 안정적으로 유지해서, NHN Toast 통합 후에도 호출 측 코드 변경 X.
 */

import { sendAlimtalk, type AlimtalkButton } from "./toast";

const PROVIDER = process.env.NOTIFY_PROVIDER ?? "mock";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const ADMIN_PHONE = process.env.ADMIN_NOTIFY_PHONE; // 직원 알림 수신 번호 (단일, MVP)

type SendResult = { ok: boolean; via: "mock" | "toast"; error?: string };

async function dispatch(args: {
  recipientPhone: string | null;
  templateCode: string;
  variables: Record<string, string>;
  buttons?: AlimtalkButton[];
  smsFallbackText?: string;
  scope: string; // 로그 용 ("client:preview_ready" 등)
}): Promise<SendResult> {
  // 수신 번호 없으면 발송 skip
  if (!args.recipientPhone) {
    console.log(
      `[notify:${PROVIDER}] skip ${args.scope} — recipient phone 없음`,
    );
    return { ok: false, via: PROVIDER as "mock" | "toast", error: "no_phone" };
  }

  if (PROVIDER === "mock") {
    const flat = Object.entries(args.variables)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    console.log(
      `[notify:mock] ${args.scope} → ${args.recipientPhone} / template=${args.templateCode} / ${flat}`,
    );
    return { ok: true, via: "mock" };
  }

  // toast
  const result = await sendAlimtalk({
    templateCode: args.templateCode,
    recipientPhone: args.recipientPhone,
    variables: args.variables,
    buttons: args.buttons,
    smsFallbackText: args.smsFallbackText,
  });
  if (!result.ok) {
    console.warn(
      `[notify:toast] ${args.scope} 실패: ${result.error}`,
    );
  }
  return { ok: result.ok, via: "toast", error: result.error };
}

// ─── 사장님(클라이언트) 발송 ────────────────────────────────────

/**
 * v2 TPL_001 — 페이지 생성 직후 사장님에게 폼 입력 안내.
 * 본문 버튼 "양식 작성하기" → /login?next=/me/pages/{id}/submit
 */
export async function notifyClientWelcome(args: {
  clientPhone: string | null;
  businessName: string;
  submitUrl: string;
}): Promise<SendResult> {
  return dispatch({
    recipientPhone: args.clientPhone,
    templateCode: "TPL_001_WELCOME",
    variables: {
      businessName: args.businessName,
      submitUrl: args.submitUrl,
    },
    buttons: [
      {
        type: "WL",
        name: "양식 작성하기",
        linkMobile: args.submitUrl,
        linkPc: args.submitUrl,
      },
    ],
    smsFallbackText: `[FocusMe] ${args.businessName} 사장님, 환영합니다. 양식 작성: ${args.submitUrl}`,
    scope: "client:welcome",
  });
}

export async function notifyClientPreviewReady(args: {
  clientPhone: string | null;
  businessName: string;
  previewUrl: string;
}): Promise<SendResult> {
  return dispatch({
    recipientPhone: args.clientPhone,
    templateCode: "TPL_003_PREVIEW_READY",
    variables: {
      businessName: args.businessName,
      previewUrl: args.previewUrl,
    },
    buttons: [
      {
        type: "WL",
        name: "미리보기 보기",
        linkMobile: args.previewUrl,
        linkPc: args.previewUrl,
      },
    ],
    smsFallbackText: `[FocusMe] ${args.businessName} 사장님, 미리보기가 준비됐어요. ${args.previewUrl}`,
    scope: "client:preview_ready",
  });
}

export async function notifyClientPublished(args: {
  clientPhone: string | null;
  businessName: string;
  pageUrl: string;
  /** v2: 발행 후 "관리하기" 버튼 — /me/pages/{id}/edit */
  editUrl?: string;
  /** @deprecated v2 이전 호환 — editUrl 우선 */
  loginUrl?: string;
}): Promise<SendResult> {
  const manageUrl = args.editUrl ?? args.loginUrl ?? `${BASE_URL}/login`;
  return dispatch({
    recipientPhone: args.clientPhone,
    templateCode: "TPL_004_PUBLISHED",
    variables: {
      businessName: args.businessName,
      pageUrl: args.pageUrl,
      editUrl: manageUrl,
    },
    buttons: [
      {
        type: "WL",
        name: "내 페이지 보기",
        linkMobile: args.pageUrl,
        linkPc: args.pageUrl,
      },
      {
        type: "WL",
        name: "관리하기",
        linkMobile: manageUrl,
        linkPc: manageUrl,
      },
    ],
    smsFallbackText: `[FocusMe] ${args.businessName} 페이지가 발행되었습니다. ${args.pageUrl}`,
    scope: "client:published",
  });
}

export async function notifyClientContentUpdated(args: {
  clientPhone: string | null;
  businessName: string;
  changeType: string; // ex) "한 줄 카피", "메인 이미지"
  pageUrl: string;
  /** v2: "수정 더 하기" 버튼 — /me/pages/{id}/edit */
  editUrl?: string;
}): Promise<SendResult> {
  const buttons = [
    {
      type: "WL" as const,
      name: "페이지 확인",
      linkMobile: args.pageUrl,
      linkPc: args.pageUrl,
    },
  ];
  if (args.editUrl) {
    buttons.push({
      type: "WL" as const,
      name: "수정 더 하기",
      linkMobile: args.editUrl,
      linkPc: args.editUrl,
    });
  }
  return dispatch({
    recipientPhone: args.clientPhone,
    templateCode: "TPL_005_CONTENT_UPDATED",
    variables: {
      businessName: args.businessName,
      changeType: args.changeType,
      pageUrl: args.pageUrl,
      editUrl: args.editUrl ?? "",
    },
    buttons,
    smsFallbackText: `[FocusMe] ${args.businessName} 사장님, ${args.changeType}이(가) 페이지에 반영되었습니다.`,
    scope: "client:content_updated",
  });
}

export async function notifyClientChangeQuote(args: {
  clientPhone: string | null;
  businessName: string;
  changeType: string;
  quotedCost: number;
}): Promise<SendResult> {
  return dispatch({
    recipientPhone: args.clientPhone,
    templateCode: "TPL_006_CHANGE_QUOTE",
    variables: {
      businessName: args.businessName,
      changeType: args.changeType,
      quotedCost: args.quotedCost.toLocaleString(),
    },
    smsFallbackText: `[FocusMe] ${args.businessName} 사장님, 요청하신 변경 견적 ${args.quotedCost.toLocaleString()}원. 카카오톡으로 답장 주세요.`,
    scope: "client:change_quote",
  });
}

export async function notifyClientChangeCompleted(args: {
  clientPhone: string | null;
  businessName: string;
  changeType: string;
  pageUrl: string;
}): Promise<SendResult> {
  return dispatch({
    recipientPhone: args.clientPhone,
    templateCode: "TPL_007_CHANGE_COMPLETED",
    variables: {
      businessName: args.businessName,
      changeType: args.changeType,
      pageUrl: args.pageUrl,
    },
    buttons: [
      {
        type: "WL",
        name: "페이지 확인",
        linkMobile: args.pageUrl,
        linkPc: args.pageUrl,
      },
    ],
    smsFallbackText: `[FocusMe] ${args.businessName} 사장님, 요청하신 변경이 완료되었습니다.`,
    scope: "client:change_completed",
  });
}

// ─── 직원(admin) 발송 ──────────────────────────────────────────

export async function notifyAdminNewTask(args: {
  businessName: string;
  businessType: string;
}): Promise<SendResult> {
  return dispatch({
    recipientPhone: ADMIN_PHONE ?? null,
    templateCode: "TPL_010_NEW_TASK",
    variables: {
      businessName: args.businessName,
      businessType: args.businessType,
    },
    buttons: [
      {
        type: "WL",
        name: "작업 큐 열기",
        linkMobile: `${BASE_URL}/admin/tasks`,
        linkPc: `${BASE_URL}/admin/tasks`,
      },
    ],
    smsFallbackText: `[FocusMe Admin] 신규 작업: ${args.businessName} (${args.businessType})`,
    scope: "admin:new_task",
  });
}

export async function notifyAdminClientSelfEdit(args: {
  businessName: string;
  changeType: string;
  pageUrl: string;
}): Promise<SendResult> {
  return dispatch({
    recipientPhone: ADMIN_PHONE ?? null,
    templateCode: "TPL_011_CLIENT_SELF_EDIT",
    variables: {
      businessName: args.businessName,
      changeType: args.changeType,
      pageUrl: args.pageUrl,
    },
    buttons: [
      {
        type: "WL",
        name: "페이지 보기",
        linkMobile: args.pageUrl,
        linkPc: args.pageUrl,
      },
    ],
    smsFallbackText: `[FocusMe Admin] ${args.businessName} 자가 수정: ${args.changeType}`,
    scope: "admin:client_self_edit",
  });
}

/**
 * v2: 사장님이 /preview 에서 "이대로 발행" 1탭 → 직원에게 알림.
 * NHN Toast 등록 시 TPL_013_CLIENT_APPROVED 신청 (focusme-alimtalk-templates §5 추가 등록 대상).
 */
export async function notifyAdminClientApproved(args: {
  businessName: string;
  pageSlug: string;
}): Promise<SendResult> {
  return dispatch({
    recipientPhone: ADMIN_PHONE ?? null,
    templateCode: "TPL_013_CLIENT_APPROVED",
    variables: {
      businessName: args.businessName,
      pageSlug: args.pageSlug,
    },
    buttons: [
      {
        type: "WL",
        name: "작업 큐 열기",
        linkMobile: `${BASE_URL}/admin/tasks`,
        linkPc: `${BASE_URL}/admin/tasks`,
      },
    ],
    smsFallbackText: `[FocusMe Admin] ${args.businessName} 사장님이 발행 OK. 발행 처리 부탁드립니다.`,
    scope: "admin:client_approved",
  });
}

export async function notifyAdminChangeRequest(args: {
  businessName: string;
  changeType: string;
}): Promise<SendResult> {
  return dispatch({
    recipientPhone: ADMIN_PHONE ?? null,
    templateCode: "TPL_012_CHANGE_REQUEST",
    variables: {
      businessName: args.businessName,
      changeType: args.changeType,
    },
    buttons: [
      {
        type: "WL",
        name: "변경 요청 보기",
        linkMobile: `${BASE_URL}/admin/change-requests`,
        linkPc: `${BASE_URL}/admin/change-requests`,
      },
    ],
    smsFallbackText: `[FocusMe Admin] 큰 변경 요청: ${args.businessName} - ${args.changeType}`,
    scope: "admin:change_request",
  });
}

// ─── 기존 stub.ts 호환 layer (하위 호환) ──────────────────────────
// 기존 호출 측 코드 변경 안 해도 되도록 alias.

export async function notifyAdminNewChangeRequest(args: {
  pageId: string;
  pageSlug: string;
  businessName?: string | null;
  requestType: string;
  description: string;
}): Promise<void> {
  // businessName 우선, 없으면 pageSlug fallback (TPL_012 표시명).
  await notifyAdminChangeRequest({
    businessName: args.businessName ?? args.pageSlug,
    changeType: `${args.requestType} — ${args.description.slice(0, 60)}`,
  });
}

export async function notifyClientChangeRequestUpdate(args: {
  clientPhone: string | null;
  pageSlug: string;
  businessName?: string | null;
  status: string;
  quotedCost?: number | null;
  note?: string | null;
}): Promise<void> {
  const displayName = args.businessName ?? args.pageSlug;
  // status 별로 다른 템플릿으로 라우팅
  if (args.status === "quoted" && args.quotedCost != null) {
    await notifyClientChangeQuote({
      clientPhone: args.clientPhone,
      businessName: displayName,
      changeType: args.note ?? "요청한 변경",
      quotedCost: args.quotedCost,
    });
    return;
  }
  if (args.status === "completed") {
    await notifyClientChangeCompleted({
      clientPhone: args.clientPhone,
      businessName: displayName,
      changeType: args.note ?? "요청한 변경",
      pageUrl: `${BASE_URL}/p/${args.pageSlug}`,
    });
    return;
  }
  // 기타 상태는 mock log 만
  console.log(
    `[notify:${PROVIDER}] client:change_status_other status=${args.status} note=${args.note ?? ""}`,
  );
}
