import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { validateSlug } from "@/lib/db/slugs";

interface Body {
  clientId?: string;
  newClient?: {
    phone: string;
    businessName: string;
    businessType: string;
    email?: string;
  };
  slug?: string;
  templateType?: string;
  toneKey?: string;
  brandColor?: string;
  paymentInfo?: {
    amount: number;
    paidAt?: string;
    invoiceNumber?: string;
  };
}

/**
 * POST /api/v1/admin/pages — 페이지 생성 (결제 확인 후 직원 호출).
 * 신규 클라이언트면 clients 자동 INSERT. 같은 phone 있으면 재사용.
 * pages.status = draft, work_tasks 한 row 동반 생성.
 * reference: docs/focusme-api-spec.md §4.1
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  if (!body.templateType) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "templateType이 필요합니다",
        },
      },
      { status: 400 },
    );
  }

  const slugCheck = validateSlug(body.slug ?? "");
  if (!slugCheck.ok) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: slugCheck.reason ?? "slug 형식 오류",
        },
      },
      { status: 400 },
    );
  }
  const slug = body.slug as string;

  const supabase = createServerSupabase();

  // slug 중복 체크
  const { data: existingPage } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existingPage) {
    return NextResponse.json(
      { error: { code: "CONFLICT", message: "이미 사용 중인 슬러그입니다" } },
      { status: 409 },
    );
  }

  // 클라이언트 확보 (기존 or 신규)
  let clientId = body.clientId;
  let clientRow: Record<string, unknown> | null = null;

  if (!clientId) {
    if (!body.newClient) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "clientId 또는 newClient 가 필요합니다",
          },
        },
        { status: 400 },
      );
    }
    const { phone, businessName, businessType, email } = body.newClient;
    if (!phone || !businessName || !businessType) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "phone · businessName · businessType 필수",
          },
        },
        { status: 400 },
      );
    }

    const { data: existingClient } = await supabase
      .from("clients")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
      clientRow = existingClient as Record<string, unknown>;
    } else {
      const { data: created, error: createErr } = await supabase
        .from("clients")
        .insert({
          phone,
          business_name: businessName,
          business_type: businessType,
          email: email ?? null,
        })
        .select()
        .single();
      if (createErr || !created) {
        return NextResponse.json(
          {
            error: {
              code: "INTERNAL_ERROR",
              message: createErr?.message ?? "클라이언트 생성 실패",
            },
          },
          { status: 500 },
        );
      }
      clientId = created.id;
      clientRow = created as Record<string, unknown>;
    }
  } else {
    const { data: existing } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "클라이언트가 없습니다" } },
        { status: 404 },
      );
    }
    clientRow = existing as Record<string, unknown>;
  }

  // 결제 정보 반영 (있는 경우)
  if (body.paymentInfo) {
    await supabase
      .from("clients")
      .update({
        payment_status: "paid",
        paid_at: body.paymentInfo.paidAt ?? new Date().toISOString(),
        payment_amount: body.paymentInfo.amount,
        invoice_number: body.paymentInfo.invoiceNumber ?? null,
      })
      .eq("id", clientId);
  }

  // pages INSERT
  const { data: page, error: pageErr } = await supabase
    .from("pages")
    .insert({
      client_id: clientId,
      slug,
      template_type: body.templateType,
      status: "draft",
      brand_color: body.brandColor ?? null,
      tone_key: body.toneKey ?? null,
    })
    .select()
    .single();
  if (pageErr || !page) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: pageErr?.message ?? "페이지 생성 실패",
        },
      },
      { status: 500 },
    );
  }

  // work_tasks INSERT
  const { data: task } = await supabase
    .from("work_tasks")
    .insert({ page_id: page.id, status: "new" })
    .select()
    .single();

  return NextResponse.json(
    {
      data: {
        page,
        client: clientRow,
        workTask: task,
      },
    },
    { status: 201 },
  );
}
