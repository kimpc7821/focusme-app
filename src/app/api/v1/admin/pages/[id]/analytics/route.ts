import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { getPageAnalytics } from "@/lib/db/analytics";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/admin/pages/:id/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
 * 기본 기간: 직전 30일.
 * reference: docs/focusme-api-spec.md §4.14
 */
export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuth(request, "admin");
  if (auth instanceof NextResponse) return auth;
  const { id: pageId } = await params;

  const url = new URL(request.url);
  const toStr = url.searchParams.get("to");
  const fromStr = url.searchParams.get("from");
  const now = new Date();
  const to = toStr ? new Date(toStr) : now;
  const from = fromStr
    ? new Date(fromStr)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from >= to) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "잘못된 날짜 범위" } },
      { status: 400 },
    );
  }

  const result = await getPageAnalytics({ pageId, from, to });
  return NextResponse.json({ data: result });
}
