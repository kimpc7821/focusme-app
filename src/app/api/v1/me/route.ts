import { NextResponse } from "next/server";
import { requireClientAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/v1/me — 내 정보 + 내 페이지 카드 리스트.
 * reference: docs/focusme-api-spec.md §3.1
 */
export async function GET(request: Request) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;

  const supabase = createServerSupabase();
  const { data: client, error } = await supabase
    .from("clients")
    .select(
      "id, phone, kakao_id, email, business_name, business_type, signup_date, status",
    )
    .eq("id", auth.sub)
    .maybeSingle();
  if (error || !client) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "계정 정보를 찾을 수 없습니다" } },
      { status: 404 },
    );
  }

  const { data: pages } = await supabase
    .from("pages")
    .select("id, slug, status, published_at, updated_at")
    .eq("client_id", auth.sub)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    data: {
      id: client.id,
      phone: client.phone,
      kakaoId: client.kakao_id,
      email: client.email,
      businessName: client.business_name,
      businessType: client.business_type,
      signupDate: client.signup_date,
      status: client.status,
      pages: (pages ?? []).map((p) => ({
        id: p.id,
        slug: p.slug,
        status: p.status,
        publishedAt: p.published_at,
        updatedAt: p.updated_at,
      })),
    },
  });
}

interface PatchBody {
  email?: string | null;
  businessName?: string;
  businessType?: string;
}

/**
 * PATCH /api/v1/me — 내 정보 수정.
 * phone · kakaoId 는 변경 불가 (별도 경로).
 * reference: docs/focusme-api-spec.md §3.2
 */
export async function PATCH(request: Request) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  const updates: {
    email?: string | null;
    business_name?: string;
    business_type?: string | null;
  } = {};
  if (body.email !== undefined) {
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        {
          error: { code: "VALIDATION_ERROR", message: "이메일 형식이 올바르지 않습니다" },
        },
        { status: 400 },
      );
    }
    updates.email = body.email;
  }
  if (body.businessName !== undefined) {
    const v = body.businessName.trim();
    if (!v) {
      return NextResponse.json(
        {
          error: { code: "VALIDATION_ERROR", message: "businessName 은 빈 값일 수 없습니다" },
        },
        { status: 400 },
      );
    }
    updates.business_name = v;
  }
  if (body.businessType !== undefined) {
    updates.business_type = body.businessType.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "변경할 필드 없음" } },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", auth.sub)
    .select("id, phone, kakao_id, email, business_name, business_type, status")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message ?? "업데이트 실패",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: {
      id: data.id,
      phone: data.phone,
      kakaoId: data.kakao_id,
      email: data.email,
      businessName: data.business_name,
      businessType: data.business_type,
      status: data.status,
    },
  });
}
