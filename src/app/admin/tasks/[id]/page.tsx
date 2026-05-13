import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  TASK_STATUS_BADGE,
  TASK_STATUS_LABELS,
} from "@/lib/db/tasks";
import { StatusActions } from "./StatusActions";

interface Props {
  params: Promise<{ id: string }>;
}

const ASSET_CATEGORIES = [
  { key: "logo", label: "로고" },
  { key: "main_image", label: "메인 이미지" },
  { key: "product_image", label: "상품 사진" },
  { key: "lifestyle", label: "분위기 사진" },
  { key: "text", label: "텍스트" },
] as const;

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd} ${hh}:${mi}`;
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerSupabase();

  const { data: task } = await supabase
    .from("work_tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!task) notFound();

  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("id", task.page_id)
    .maybeSingle();

  const { data: client } = page
    ? await supabase
        .from("clients")
        .select("*")
        .eq("id", page.client_id)
        .maybeSingle()
    : { data: null };

  const { data: blocks } = await supabase
    .from("blocks")
    .select("*")
    .eq("page_id", task.page_id)
    .order("sort_order", { ascending: true });

  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("page_id", task.page_id);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <nav className="mb-4 text-[12px] text-fg-tertiary">
        <Link href="/admin/tasks" className="hover:text-fg">
          작업 큐
        </Link>
        <span className="mx-2">/</span>
        <span>{client?.business_name ?? task.page_id.slice(0, 8)}</span>
      </nav>

      {/* 상단 — 페이지 정보 + 액션 */}
      <div className="bg-bg rounded-lg border border-border-default p-6 mb-5">
        <div className="flex items-start justify-between gap-6 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-medium ${
                  TASK_STATUS_BADGE[task.status] ?? ""
                }`}
              >
                {TASK_STATUS_LABELS[task.status] ?? task.status}
              </span>
              {page?.status === "published" && (
                <span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-medium bg-success-soft text-success">
                  발행됨
                </span>
              )}
            </div>
            <h1 className="text-[22px] font-medium text-fg leading-tight">
              {client?.business_name ?? "-"}
            </h1>
            <p className="mt-1 text-[12px] text-fg-tertiary">
              <span className="font-mono">/{page?.slug}</span>
              <span className="mx-2">·</span>
              {page?.template_type}
              {page?.tone_key && (
                <>
                  <span className="mx-2">·</span>
                  {page.tone_key}
                </>
              )}
            </p>
          </div>
          {page && (
            <StatusActions
              taskId={task.id}
              pageId={page.id}
              taskStatus={task.status}
              pageStatus={page.status}
              pageSlug={page.slug}
            />
          )}
        </div>

        {/* 타임라인 */}
        <div className="grid grid-cols-5 gap-3 pt-5 border-t border-border-default">
          <Timeline label="신규" ts={task.created_at} active={true} />
          <Timeline label="AI 생성" ts={task.ai_generated_at} active={!!task.ai_generated_at} />
          <Timeline label="검수" ts={task.reviewed_at} active={!!task.reviewed_at} />
          <Timeline label="확인 발송" ts={task.preview_sent_at} active={!!task.preview_sent_at} />
          <Timeline label="완료" ts={task.completed_at} active={!!task.completed_at} />
        </div>
      </div>

      {/* 2-column */}
      <div className="grid grid-cols-3 gap-5">
        {/* 왼쪽 — 클라이언트 + 체크리스트 */}
        <div className="space-y-5">
          <div className="bg-bg rounded-lg border border-border-default p-5">
            <h2 className="text-[12px] uppercase tracking-wider text-fg-tertiary mb-3 font-medium">
              클라이언트
            </h2>
            {client ? (
              <dl className="text-[13px] space-y-1.5">
                <Row label="이름">{client.business_name}</Row>
                <Row label="업종">{client.business_type}</Row>
                <Row label="휴대폰">{client.phone}</Row>
                {client.email && <Row label="이메일">{client.email}</Row>}
                <Row label="결제">{client.payment_status}</Row>
                <Row label="가입">{fmtDate(client.signup_date)}</Row>
              </dl>
            ) : (
              <p className="text-[12px] text-fg-tertiary">정보 없음</p>
            )}
          </div>

          <div className="bg-bg rounded-lg border border-border-default p-5">
            <h2 className="text-[12px] uppercase tracking-wider text-fg-tertiary mb-3 font-medium">
              자료 체크리스트
            </h2>
            <ul className="space-y-2">
              {ASSET_CATEGORIES.map((cat) => {
                const count =
                  (assets ?? []).filter((a) => a.category === cat.key).length;
                const done = count > 0;
                return (
                  <li
                    key={cat.key}
                    className="flex items-center justify-between text-[13px]"
                  >
                    <span className="flex items-center gap-2 text-fg">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          done ? "bg-success-strong" : "bg-fg-tertiary"
                        }`}
                      />
                      {cat.label}
                    </span>
                    <span
                      className={`text-[11px] ${
                        done ? "text-fg" : "text-fg-tertiary"
                      }`}
                    >
                      {done ? `${count}개` : "없음"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* 오른쪽 — 블록 리스트 */}
        <div className="col-span-2 bg-bg rounded-lg border border-border-default p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[12px] uppercase tracking-wider text-fg-tertiary font-medium">
              블록 ({blocks?.length ?? 0})
            </h2>
            {page && (
              <Link
                href={`/admin/pages/${page.id}/edit`}
                className="text-[12px] text-info hover:underline"
              >
                편집기에서 수정 →
              </Link>
            )}
          </div>
          {!blocks || blocks.length === 0 ? (
            <p className="text-[12px] text-fg-tertiary py-8 text-center">
              블록이 없습니다. 편집기에서 추가하세요.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {blocks.map((b) => (
                <li
                  key={b.id}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-md border border-border-default text-[13px] ${
                    !b.is_enabled ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-fg-tertiary text-[11px] font-mono">
                      {b.sort_order}
                    </span>
                    <span className="text-fg font-medium">{b.block_type}</span>
                    {b.is_system && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-soft text-fg-tertiary">
                        system
                      </span>
                    )}
                    {!b.is_enabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-soft text-warning">
                        OFF
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex">
      <dt className="w-16 shrink-0 text-fg-tertiary">{label}</dt>
      <dd className="text-fg break-all">{children}</dd>
    </div>
  );
}

function Timeline({
  label,
  ts,
  active,
}: {
  label: string;
  ts: string | null;
  active: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-fg-tertiary">
        {label}
      </p>
      <p
        className={`mt-0.5 text-[12px] ${
          active ? "text-fg" : "text-fg-tertiary"
        }`}
      >
        {fmtDate(ts)}
      </p>
    </div>
  );
}
