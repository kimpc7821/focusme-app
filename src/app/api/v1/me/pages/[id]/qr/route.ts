import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  ensureClientOwnsPage,
  requireClientAuth,
} from "@/lib/auth/guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { uploadToR2 } from "@/lib/storage/r2";
import {
  buildTargetUrl,
  generateQrPng,
  generateQrSvg,
} from "@/lib/qr/generate";

interface Params {
  params: Promise<{ id: string }>;
}

interface CreateBody {
  channelName?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * GET /api/v1/me/pages/:id/qr — 발급된 QR 리스트 (사장님).
 * reference: docs/focusme-api-spec.md §3.8
 */
export async function GET(request: Request, { params }: Params) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const owns = await ensureClientOwnsPage(auth.sub, pageId);
  if (owns instanceof NextResponse) return owns;

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("page_id", pageId)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }
  return NextResponse.json({ data: data ?? [] });
}

/**
 * POST /api/v1/me/pages/:id/qr — 사장님이 직접 QR 발급.
 * reference: docs/focusme-api-spec.md §3.7
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireClientAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const owns = await ensureClientOwnsPage(auth.sub, pageId);
  if (owns instanceof NextResponse) return owns;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 요청입니다" } },
      { status: 400 },
    );
  }

  const channelName = body.channelName?.trim();
  if (!channelName) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "channelName 필수" } },
      { status: 400 },
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const targetUrl = buildTargetUrl({
    baseUrl,
    slug: owns.slug,
    utmSource: body.utmSource,
    utmMedium: body.utmMedium ?? "qr",
    utmCampaign: body.utmCampaign,
  });

  const uuid = randomUUID();
  let imageUrl: string;
  let svgUrl: string | null = null;
  try {
    const png = await generateQrPng(targetUrl);
    const pngResult = await uploadToR2({
      key: `qr/${pageId}/${uuid}.png`,
      body: new Uint8Array(png),
      contentType: "image/png",
    });
    imageUrl = pngResult.publicUrl;

    const svg = await generateQrSvg(targetUrl);
    const svgResult = await uploadToR2({
      key: `qr/${pageId}/${uuid}.svg`,
      body: new TextEncoder().encode(svg),
      contentType: "image/svg+xml",
    });
    svgUrl = svgResult.publicUrl;
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            "QR 생성/업로드 실패: " +
            (err instanceof Error ? err.message : String(err)),
        },
      },
      { status: 500 },
    );
  }

  const supabase = createServerSupabase();
  const { data: qr, error } = await supabase
    .from("qr_codes")
    .insert({
      page_id: pageId,
      channel_name: channelName,
      utm_source: body.utmSource ?? null,
      utm_medium: body.utmMedium ?? "qr",
      utm_campaign: body.utmCampaign ?? null,
      target_url: targetUrl,
      image_url: imageUrl,
      svg_url: svgUrl,
    })
    .select()
    .single();
  if (error || !qr) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message ?? "DB 기록 실패",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { qr } }, { status: 201 });
}
