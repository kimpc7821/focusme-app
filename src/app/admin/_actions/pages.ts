"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { validateSlug } from "@/lib/db/slugs";
import {
  notifyAdminNewTask,
  notifyClientWelcome,
} from "@/lib/notifications";
import { isValidKoreanPhone, normalizePhone } from "@/lib/auth/sms";
import { hashPassword, generateTempPassword } from "@/lib/auth/passwords";
import { createDefaultBlocksForPage } from "@/lib/db/templates";

export interface CreatePageState {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  /** 생성 성공 시 — 직원에게 전달용 자격정보 (임시 pw 는 1회만 표시) */
  created?: {
    phone: string;
    tempPassword: string | null; // 기존 사장님(이미 pw 보유)이면 null
    loginUrl: string; // 고정 로그인 주소 (페이지별 X)
    taskHref: string;
    isExistingClient: boolean;
  };
}

export async function createPageAction(
  _prev: CreatePageState,
  formData: FormData,
): Promise<CreatePageState> {
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const templateType = String(formData.get("templateType") ?? "");
  const toneKey = String(formData.get("toneKey") ?? "") || null;
  const brandColor = String(formData.get("brandColor") ?? "").trim() || null;
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  // 형식 차이로 새 client 가 잘못 만들어지는 사고 방지 — 010-XXXX-XXXX 표준으로 정규화.
  const phone = phoneRaw ? normalizePhone(phoneRaw) : "";
  const businessName = String(formData.get("businessName") ?? "").trim();
  const businessType = templateType; // 같게 매핑 (직원이 다르게 둘 일 있을 때만 분리)
  const email = String(formData.get("email") ?? "").trim() || null;

  const fieldErrors: Record<string, string> = {};

  const slugCheck = validateSlug(slug);
  if (!slugCheck.ok) fieldErrors.slug = slugCheck.reason ?? "slug 형식 오류";
  if (!templateType) fieldErrors.templateType = "업종 템플릿을 선택해주세요";
  if (!phone) fieldErrors.phone = "휴대폰 번호가 필요합니다";
  else if (!isValidKoreanPhone(phone))
    fieldErrors.phone = "010-XXXX-XXXX 형식으로 입력해주세요";
  if (!businessName) fieldErrors.businessName = "사업자명이 필요합니다";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "입력값을 확인해주세요", fieldErrors };
  }

  const supabase = createServerSupabase();

  const { data: existing } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    return {
      error: "이미 사용 중인 슬러그입니다",
      fieldErrors: { slug: "중복" },
    };
  }

  // 기존 클라이언트 재사용
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id, password_hash")
    .eq("phone", phone)
    .maybeSingle();
  let clientId = existingClient?.id;
  const isExistingClient = Boolean(existingClient?.id);
  // 임시 pw — 신규 클라이언트, 또는 기존이지만 pw 없는 레거시만 발급.
  // 기존 사장님이 이미 pw 보유 시 건드리지 않음 (본인 pw 유지).
  let tempPassword: string | null = null;
  if (!clientId) {
    tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const { data: created, error: createErr } = await supabase
      .from("clients")
      .insert({
        phone,
        business_name: businessName,
        business_type: businessType,
        email,
        password_hash: passwordHash,
        must_change_password: true,
      })
      .select()
      .single();
    if (createErr || !created) {
      return { error: createErr?.message ?? "클라이언트 생성 실패" };
    }
    clientId = created.id;
  } else if (!existingClient?.password_hash) {
    // 레거시(SMS 시절) 클라이언트 — pw 없으니 임시 발급.
    tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    await supabase
      .from("clients")
      .update({ password_hash: passwordHash, must_change_password: true })
      .eq("id", clientId);
  }

  // v2 §1 결정 14: 페이지 생성 시 clients 정보를 essential_info 에 자동 복사.
  // 사장님 Step 1 진입 시 상호명·전화·이메일이 이미 채워진 상태로 노출됨.
  // (clients.phone = 로그인용, essential_info.phone = 페이지 표시용 — 초기값만 같음.)
  const essentialInfo: Record<string, unknown> = {
    businessName,
    phone,
  };
  if (email) essentialInfo.email = email;

  const { data: page, error: pageErr } = await supabase
    .from("pages")
    .insert({
      client_id: clientId,
      slug,
      template_type: templateType,
      status: "draft",
      brand_color: brandColor,
      tone_key: toneKey,
      essential_info: essentialInfo,
    })
    .select()
    .single();
  if (pageErr || !page) {
    return { error: pageErr?.message ?? "페이지 생성 실패" };
  }

  // 업종 템플릿의 default_blocks 자동 적용 — 직원이 빈 페이지부터 만들지 않게.
  // 실패해도 페이지 생성 자체는 성공으로 진행 (직원이 admin Editor 에서 수동 추가 가능).
  await createDefaultBlocksForPage(supabase, page.id, templateType);

  const { data: task } = await supabase
    .from("work_tasks")
    .insert({ page_id: page.id, status: "new" })
    .select()
    .single();

  // 직원 알림 (TPL_010_NEW_TASK).
  try {
    await notifyAdminNewTask({
      businessName,
      businessType,
    });
  } catch (err) {
    console.warn("[notify] new_task 실패:", err);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const loginUrl = `${baseUrl}/login`;

  // v2: 사장님 가입 환영 알림 (TPL_001) — NHN 휴면 중이라 mock 로그만.
  // 실제 전달은 직원이 아래 created 자격정보를 수동으로 사장님께 전달.
  // 페이지별 deep link 불필요 — 로그인 후 /me 에서 본인 페이지 카드로 진입.
  try {
    await notifyClientWelcome({
      clientPhone: phone,
      businessName,
      submitUrl: loginUrl,
    });
  } catch (err) {
    console.warn("[notify] client_welcome 실패:", err);
  }

  return {
    created: {
      phone,
      tempPassword,
      loginUrl,
      taskHref: task ? `/admin/tasks/${task.id}` : "/admin/tasks",
      isExistingClient,
    },
  };
}
