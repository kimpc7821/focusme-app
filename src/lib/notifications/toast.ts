/**
 * NHN Cloud Toast 알림톡·SMS API 호출 모듈.
 *
 * 출시 1주일 전 등록·발급 항목:
 *   - NHN Cloud 계정
 *   - Toast Notification 서비스 활성화
 *   - 카카오 비즈니스 채널 등록 (발신 프로필)
 *   - 알림톡 템플릿 사전 심사 (docs/focusme-alimtalk-templates.md 참조, 영업일 2~3일 소요)
 *
 * 환경변수:
 *   - TOAST_APP_KEY        — Toast Notification AppKey
 *   - TOAST_SECRET_KEY     — Secret Key (Header X-Secret-Key)
 *   - TOAST_SENDER_KEY     — 알림톡 발신 프로필 SenderKey (카카오 채널 ID 와 1:1)
 *   - TOAST_SMS_SEND_NO    — SMS fallback 시 발신 번호 (예: 0212345678)
 *
 * reference: docs/focusme-alimtalk-templates.md §9
 */

const ALIMTALK_BASE =
  "https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys";
const SMS_BASE = "https://api-sms.cloud.toast.com/sms/v3.0/appKeys";

export interface AlimtalkButton {
  type: "WL" | "AL" | "DS" | "BK" | "MD"; // WL=웹링크, AL=앱링크, DS=배송조회, BK=봇키워드, MD=메시지전달
  name: string;
  linkMobile?: string;
  linkPc?: string;
}

export interface SendAlimtalkArgs {
  templateCode: string; // ex) TPL_003_PREVIEW_READY
  recipientPhone: string; // 010-XXXX-XXXX OR 01000000000
  variables: Record<string, string>; // ex) { businessName: "노을공방", previewUrl: "..." }
  buttons?: AlimtalkButton[];
  resendOnFailureAsSms?: boolean; // 기본 true — 카카오 미수신 시 SMS fallback
  smsFallbackText?: string; // SMS 변환 본문 (없으면 NHN 자동 변환)
}

export interface SendSmsArgs {
  recipientPhone: string;
  body: string; // 80자 이내 권장
}

interface ToastConfig {
  appKey: string;
  secretKey: string;
  senderKey: string;
  smsSendNo?: string;
}

function loadConfig(): ToastConfig {
  const appKey = process.env.TOAST_APP_KEY;
  const secretKey = process.env.TOAST_SECRET_KEY;
  const senderKey = process.env.TOAST_SENDER_KEY;
  if (!appKey || !secretKey || !senderKey) {
    throw new Error(
      "NHN Toast 환경변수 누락: TOAST_APP_KEY · TOAST_SECRET_KEY · TOAST_SENDER_KEY",
    );
  }
  return { appKey, secretKey, senderKey, smsSendNo: process.env.TOAST_SMS_SEND_NO };
}

function stripPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function sendAlimtalk(args: SendAlimtalkArgs): Promise<{
  ok: boolean;
  messageId?: string;
  error?: string;
}> {
  const cfg = loadConfig();
  const resendOnFailure = args.resendOnFailureAsSms ?? true;

  const body = {
    senderKey: cfg.senderKey,
    templateCode: args.templateCode,
    recipientList: [
      {
        recipientNo: stripPhone(args.recipientPhone),
        templateParameter: args.variables,
        ...(resendOnFailure
          ? {
              resendParameter: {
                isResend: "Y",
                resendType: "SMS",
                resendTitle: undefined,
                resendContent: args.smsFallbackText,
                resendSendNo: cfg.smsSendNo,
              },
            }
          : {}),
      },
    ],
    ...(args.buttons && args.buttons.length > 0
      ? {
          buttons: args.buttons.map((b) => ({
            ordering: 1,
            type: b.type,
            name: b.name,
            linkMo: b.linkMobile,
            linkPc: b.linkPc,
          })),
        }
      : {}),
  };

  try {
    const res = await fetch(`${ALIMTALK_BASE}/${cfg.appKey}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Secret-Key": cfg.secretKey,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      header?: { isSuccessful?: boolean; resultMessage?: string };
      message?: { requestId?: string };
    };
    if (!res.ok || !json.header?.isSuccessful) {
      return {
        ok: false,
        error: json.header?.resultMessage ?? `HTTP ${res.status}`,
      };
    }
    return { ok: true, messageId: json.message?.requestId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function sendSms(args: SendSmsArgs): Promise<{
  ok: boolean;
  messageId?: string;
  error?: string;
}> {
  const cfg = loadConfig();
  if (!cfg.smsSendNo) {
    return { ok: false, error: "TOAST_SMS_SEND_NO 환경변수가 없습니다" };
  }

  const body = {
    body: args.body,
    sendNo: cfg.smsSendNo,
    recipientList: [{ recipientNo: stripPhone(args.recipientPhone) }],
  };

  try {
    const res = await fetch(`${SMS_BASE}/${cfg.appKey}/sender/sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Secret-Key": cfg.secretKey,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      header?: { isSuccessful?: boolean; resultMessage?: string };
      body?: { data?: { requestId?: string } };
    };
    if (!res.ok || !json.header?.isSuccessful) {
      return {
        ok: false,
        error: json.header?.resultMessage ?? `HTTP ${res.status}`,
      };
    }
    return { ok: true, messageId: json.body?.data?.requestId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
