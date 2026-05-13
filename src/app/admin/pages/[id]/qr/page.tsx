import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createQrAction, deleteQrAction } from "@/app/admin/_actions/qr";

interface Props {
  params: Promise<{ id: string }>;
}

const CHANNEL_PRESETS = [
  { name: "명함용", source: "business_card" },
  { name: "매장용", source: "store" },
  { name: "광고용", source: "ad" },
  { name: "전단지용", source: "flyer" },
];

export default async function QrPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, client_id")
    .eq("id", id)
    .maybeSingle();
  if (!page) notFound();

  const { data: client } = await supabase
    .from("clients")
    .select("business_name")
    .eq("id", page.client_id)
    .maybeSingle();

  const { data: codes } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("page_id", id)
    .order("created_at", { ascending: false });

  const { data: task } = await supabase
    .from("work_tasks")
    .select("id")
    .eq("page_id", id)
    .maybeSingle();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <nav className="mb-4 text-[12px] text-fg-tertiary">
        <Link href="/admin/tasks" className="hover:text-fg">
          작업 큐
        </Link>
        {task && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/admin/tasks/${task.id}`} className="hover:text-fg">
              {client?.business_name ?? page.slug}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span>QR 코드</span>
      </nav>

      <div className="mb-5">
        <h1 className="text-[22px] font-medium text-fg leading-tight">
          QR 코드
        </h1>
        <p className="mt-1 text-[12px] text-fg-tertiary">
          채널별로 발급 — 명함 · 매장 · 광고 · 전단지. 각 QR 은 UTM 으로
          유입 채널을 분석에서 구분할 수 있게 합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
        {/* 발급 폼 */}
        <div className="bg-bg rounded-lg border border-border-default p-5 h-fit">
          <h2 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-3">
            새 QR 발급
          </h2>

          <div className="mb-3">
            <p className="text-[11px] text-fg-secondary mb-1.5">빠른 시작</p>
            <div className="grid grid-cols-2 gap-1.5">
              {CHANNEL_PRESETS.map((p) => (
                <form key={p.name} action={createQrAction}>
                  <input type="hidden" name="pageId" value={id} />
                  <input type="hidden" name="channelName" value={p.name} />
                  <input type="hidden" name="utmSource" value={p.source} />
                  <input type="hidden" name="utmMedium" value="qr" />
                  <button
                    type="submit"
                    className="w-full px-2 py-1.5 rounded text-[11px] border border-border-default text-fg hover:bg-bg-soft"
                  >
                    + {p.name}
                  </button>
                </form>
              ))}
            </div>
          </div>

          <hr className="my-4 border-border-default" />

          <p className="text-[11px] text-fg-secondary mb-2">사용자 정의</p>
          <form action={createQrAction} className="space-y-2">
            <input type="hidden" name="pageId" value={id} />
            <Field label="채널명">
              <input
                name="channelName"
                required
                placeholder="예: 박람회 부스용"
                className="input"
              />
            </Field>
            <Field label="utm_source">
              <input
                name="utmSource"
                placeholder="expo_2026"
                className="input"
              />
            </Field>
            <Field label="utm_medium (기본 qr)">
              <input name="utmMedium" placeholder="qr" className="input" />
            </Field>
            <Field label="utm_campaign (선택)">
              <input name="utmCampaign" className="input" />
            </Field>
            <button
              type="submit"
              className="w-full mt-2 px-4 py-2 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90"
            >
              QR 발급
            </button>
          </form>

          <style>{`
            .input {
              width: 100%;
              padding: 7px 10px;
              font-size: 12px;
              color: var(--color-text-primary);
              background: var(--color-bg-secondary);
              border: 0.5px solid var(--color-border-tertiary);
              border-radius: 6px;
              outline: none;
            }
            .input:focus { border-color: var(--color-info-text); background: var(--color-bg-primary); }
          `}</style>
        </div>

        {/* 리스트 */}
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-3">
            발급된 QR ({codes?.length ?? 0})
          </h2>

          {!codes || codes.length === 0 ? (
            <div className="bg-bg rounded-lg border border-border-default p-10 text-center text-[13px] text-fg-tertiary">
              아직 발급된 QR 코드가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {codes.map((q) => (
                <div
                  key={q.id}
                  className="bg-bg rounded-lg border border-border-default p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={q.image_url}
                      alt={q.channel_name}
                      className="w-24 h-24 rounded border border-border-default shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-fg">
                        {q.channel_name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-fg-tertiary font-mono break-all line-clamp-2">
                        {q.target_url}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {q.utm_source && (
                          <Tag>source: {q.utm_source}</Tag>
                        )}
                        {q.utm_medium && (
                          <Tag>medium: {q.utm_medium}</Tag>
                        )}
                        {q.utm_campaign && (
                          <Tag>campaign: {q.utm_campaign}</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border-default flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex gap-2">
                      <a
                        href={q.image_url}
                        download={`${q.channel_name}.png`}
                        className="text-info hover:underline"
                      >
                        PNG ↓
                      </a>
                      {q.svg_url && (
                        <a
                          href={q.svg_url}
                          download={`${q.channel_name}.svg`}
                          className="text-info hover:underline"
                        >
                          SVG ↓
                        </a>
                      )}
                    </div>
                    <form action={deleteQrAction}>
                      <input type="hidden" name="pageId" value={id} />
                      <input type="hidden" name="qrId" value={q.id} />
                      <button
                        type="submit"
                        className="text-fg-tertiary hover:text-danger"
                      >
                        삭제
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] text-fg-secondary mb-1">{label}</span>
      {children}
    </label>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-soft text-fg-secondary font-mono">
      {children}
    </span>
  );
}
