"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface QrCode {
  id: string;
  channel_name: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  target_url: string;
  image_url: string;
  svg_url: string | null;
  created_at: string;
}

const PRESETS = [
  { name: "명함용", source: "business_card" },
  { name: "매장용", source: "store" },
  { name: "광고용", source: "ad" },
  { name: "전단지용", source: "flyer" },
];

export function QrManager({
  pageId,
  initialCodes,
}: {
  pageId: string;
  initialCodes: QrCode[];
}) {
  const [codes, setCodes] = useState<QrCode[]>(initialCodes);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const issue = (body: {
    channelName: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }) => {
    setErr(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/me/pages/${pageId}/qr`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) {
          setErr(json?.error?.message ?? `발급 실패 (HTTP ${res.status})`);
          return;
        }
        setCodes((prev) => [json.data.qr, ...prev]);
        router.refresh();
      } catch (e) {
        setErr("발급 실패: " + (e instanceof Error ? e.message : String(e)));
      }
    });
  };

  return (
    <div className="space-y-5">
      <section className="bg-bg rounded-lg border border-border-default p-5">
        <h2 className="text-[12px] font-medium text-fg mb-2">빠른 발급</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              disabled={pending}
              onClick={() =>
                issue({
                  channelName: p.name,
                  utmSource: p.source,
                  utmMedium: "qr",
                })
              }
              className="px-3 py-2 rounded-md border border-border-default text-[12px] text-fg hover:bg-bg-soft disabled:opacity-50"
            >
              + {p.name}
            </button>
          ))}
        </div>

        <CustomForm onSubmit={issue} pending={pending} />

        {err && (
          <p className="mt-3 text-[11px] text-danger bg-danger-soft px-3 py-2 rounded">
            ⚠ {err}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-wider text-fg-tertiary font-medium mb-3">
          발급된 QR ({codes.length})
        </h2>
        {codes.length === 0 ? (
          <div className="bg-bg rounded-lg border border-border-default p-8 text-center text-[12px] text-fg-tertiary">
            아직 발급된 QR 코드가 없습니다.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {codes.map((q) => (
              <li
                key={q.id}
                className="bg-bg rounded-lg border border-border-default p-4"
              >
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={q.image_url}
                    alt={q.channel_name}
                    className="w-20 h-20 rounded border border-border-default shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-fg">
                      {q.channel_name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-fg-tertiary font-mono break-all line-clamp-2">
                      {q.target_url}
                    </p>
                    <div className="mt-2 flex gap-2 text-[11px]">
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
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CustomForm({
  onSubmit,
  pending,
}: {
  onSubmit: (b: {
    channelName: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-[11px] text-fg-tertiary hover:text-fg"
      >
        + 사용자 정의 QR 만들기
      </button>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-border-default space-y-2">
      <Input label="채널명" value={channelName} onChange={setChannelName} placeholder="예: 박람회 부스용" />
      <Input label="utm_source" value={utmSource} onChange={setUtmSource} placeholder="expo_2026" />
      <Input label="utm_campaign (선택)" value={utmCampaign} onChange={setUtmCampaign} />
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={pending || !channelName.trim()}
          onClick={() => {
            onSubmit({
              channelName: channelName.trim(),
              utmSource: utmSource.trim() || undefined,
              utmMedium: "qr",
              utmCampaign: utmCampaign.trim() || undefined,
            });
            setChannelName("");
            setUtmSource("");
            setUtmCampaign("");
            setOpen(false);
          }}
          className="px-3 py-1.5 rounded-md bg-info text-fg-inverse text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
        >
          발급
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 rounded-md border border-border-default text-fg-secondary text-[12px] hover:bg-bg-soft"
        >
          취소
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] text-fg-secondary mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-[12px] rounded-md border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info focus:bg-bg"
      />
    </label>
  );
}
