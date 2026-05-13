"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { validateSlug } from "@/lib/db/slugs";

export interface CreatePageState {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
}

export async function createPageAction(
  _prev: CreatePageState,
  formData: FormData,
): Promise<CreatePageState> {
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const templateType = String(formData.get("templateType") ?? "");
  const toneKey = String(formData.get("toneKey") ?? "") || null;
  const brandColor = String(formData.get("brandColor") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim();
  const businessName = String(formData.get("businessName") ?? "").trim();
  const businessType = templateType; // 같게 매핑 (직원이 다르게 둘 일 있을 때만 분리)
  const email = String(formData.get("email") ?? "").trim() || null;

  const fieldErrors: Record<string, string> = {};

  const slugCheck = validateSlug(slug);
  if (!slugCheck.ok) fieldErrors.slug = slugCheck.reason ?? "slug 형식 오류";
  if (!templateType) fieldErrors.templateType = "업종 템플릿을 선택해주세요";
  if (!phone) fieldErrors.phone = "휴대폰 번호가 필요합니다";
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
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  let clientId = existingClient?.id;
  if (!clientId) {
    const { data: created, error: createErr } = await supabase
      .from("clients")
      .insert({
        phone,
        business_name: businessName,
        business_type: businessType,
        email,
      })
      .select()
      .single();
    if (createErr || !created) {
      return { error: createErr?.message ?? "클라이언트 생성 실패" };
    }
    clientId = created.id;
  }

  const { data: page, error: pageErr } = await supabase
    .from("pages")
    .insert({
      client_id: clientId,
      slug,
      template_type: templateType,
      status: "draft",
      brand_color: brandColor,
      tone_key: toneKey,
    })
    .select()
    .single();
  if (pageErr || !page) {
    return { error: pageErr?.message ?? "페이지 생성 실패" };
  }

  const { data: task } = await supabase
    .from("work_tasks")
    .insert({ page_id: page.id, status: "new" })
    .select()
    .single();

  redirect(task ? `/admin/tasks/${task.id}` : "/admin/tasks");
}
