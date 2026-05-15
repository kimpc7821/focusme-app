import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { InquiryRow } from "./InquiryRow";

const VALID_STATUS = ["new", "contacted", "closed"] as const;
type Status = (typeof VALID_STATUS)[number];

const STATUS_TABS: { key: Status | "all"; label: string }[] = [
  { key: "new", label: "신규" },
  { key: "contacted", label: "연락함" },
  { key: "closed", label: "종료" },
  { key: "all", label: "전체" },
];

interface Props {
  searchParams: Promise<{ status?: string }>;
}

interface InquiryRowData {
  id: string;
  business_name: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
  handled_at: string | null;
}

export default async function AdminInquiriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const selected =
    params.status && VALID_STATUS.includes(params.status as Status)
      ? (params.status as Status)
      : ("new" as Status);

  const supabase = createServerSupabase();
  let q = supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (params.status !== "all") q = q.eq("status", selected);

  const { data: rows } = await q;
  const inquiries = (rows ?? []) as InquiryRowData[];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-5">
        <h1 className="text-[22px] font-medium text-fg leading-tight">
          개설 문의
        </h1>
        <p className="mt-1 text-[12px] text-fg-tertiary">
          초대 없이 들어온 잠재 고객의 개설 문의. 연락 후 상태 변경.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 mb-5 text-[12px]">
        {STATUS_TABS.map((t) => {
          const active = (params.status ?? "new") === t.key;
          return (
            <Link
              key={t.key}
              href={`/admin/inquiries?status=${t.key}`}
              className={`px-3 py-1.5 rounded-md border transition-colors ${
                active
                  ? "border-fg text-fg font-medium bg-bg"
                  : "border-border-default text-fg-secondary hover:bg-bg-soft"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {inquiries.length === 0 ? (
        <div className="bg-bg rounded-lg border border-border-default p-10 text-center text-[13px] text-fg-tertiary">
          해당 상태의 문의가 없습니다.
        </div>
      ) : (
        <ul className="space-y-3">
          {inquiries.map((iq) => (
            <InquiryRow key={iq.id} inquiry={iq} />
          ))}
        </ul>
      )}
    </div>
  );
}
