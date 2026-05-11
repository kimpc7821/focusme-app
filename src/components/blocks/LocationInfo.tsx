import type {
  Block,
  LocationInfoConfig,
  LocationInfoContent,
} from "@/lib/types";
import {
  buildSchedule,
  calculateBusinessStatus,
} from "@/lib/business-status";
import { SectionTitle } from "./SectionTitle";

type Props = Block<LocationInfoConfig, LocationInfoContent>;

const heightClass: Record<LocationInfoConfig["mapHeight"], string> = {
  small: "h-32",
  medium: "h-44",
  large: "h-56",
};

function PinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function CompassIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function MapPlaceholder({
  height,
  directionsUrl,
}: {
  height: LocationInfoConfig["mapHeight"];
  directionsUrl?: string;
}) {
  return (
    <div
      className={`relative ${heightClass[height]} w-full rounded-[10px] overflow-hidden`}
      style={{
        background: "linear-gradient(135deg, #D6F0EF 0%, #B8E5E0 100%)",
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--brand-primary)] text-[var(--brand-primary-text)] shadow-md">
          <PinIcon size={16} />
        </div>
      </div>
      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 px-2 py-1 rounded bg-bg/85 text-fg text-[11px] font-medium hover:bg-bg transition-colors"
        >
          길찾기 →
        </a>
      )}
    </div>
  );
}

function HoursCard({
  hours,
}: {
  hours: NonNullable<LocationInfoContent["hours"]>;
}) {
  const status = calculateBusinessStatus(hours);
  const schedule = buildSchedule(hours);

  return (
    <div
      className="bg-bg rounded-[10px] p-[14px]"
      style={{ border: "0.5px solid var(--brand-accent)" }}
    >
      <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-[var(--brand-light)]">
        <span
          className={`w-2 h-2 rounded-full ${
            status.isOpen
              ? "bg-[var(--color-success-strong)]"
              : "bg-fg-tertiary"
          }`}
          style={
            status.isOpen
              ? { boxShadow: "0 0 0 3px rgba(29,158,117,0.2)" }
              : undefined
          }
        />
        <p className="text-[13px] font-medium text-fg">{status.statusText}</p>
      </div>
      <dl className="space-y-1.5 text-[13px]">
        {schedule.map((row, i) => (
          <div key={i} className="flex justify-between gap-3">
            <dt
              className={
                row.isToday ? "text-fg font-medium" : "text-fg-tertiary"
              }
            >
              {row.label}
            </dt>
            <dd
              className={row.isToday ? "text-fg font-medium" : "text-fg"}
            >
              {row.value}
            </dd>
          </div>
        ))}
        {hours.note && (
          <p className="pt-1 text-[11px] text-fg-tertiary">{hours.note}</p>
        )}
      </dl>
    </div>
  );
}

function AddressCard({
  address,
}: {
  address: NonNullable<LocationInfoContent["address"]>;
}) {
  return (
    <div
      className="bg-bg rounded-[10px] p-[14px] flex items-start gap-3"
      style={{ border: "0.5px solid var(--brand-accent)" }}
    >
      <span className="text-[var(--brand-primary)] mt-0.5 shrink-0">
        <PinIcon size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-fg-tertiary mb-0.5">주소</p>
        <p className="text-[13px] text-fg leading-relaxed">
          {address.full}
          {address.detail ? ` ${address.detail}` : ""}
        </p>
      </div>
    </div>
  );
}

function ActionButton({
  href,
  icon,
  label,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="flex flex-col items-center gap-1 py-3 px-1 bg-bg rounded-[8px] text-[12px] text-fg hover:bg-[var(--brand-tint)] active:opacity-80 transition-colors"
      style={{ border: "0.5px solid var(--brand-accent)" }}
    >
      <span className="text-[var(--brand-primary)]">{icon}</span>
      <span>{label}</span>
    </a>
  );
}

export function LocationInfo({ config, content }: Props) {
  const showMap = config.showMap && config.layout !== "no_map";
  const hasActions =
    config.showActionButtons &&
    (content.phone || content.kakao || content.directionsUrl);

  return (
    <section
      className="px-5 py-7"
      style={{
        background:
          "color-mix(in srgb, var(--brand-light) 30%, var(--color-bg-primary))",
      }}
    >
      <SectionTitle
        title={content.sectionTitle ?? "오시는 길"}
        subtitle={content.sectionSubtitle}
        className="mb-4"
      />

      {showMap && (
        <div className="mb-3">
          <MapPlaceholder
            height={config.mapHeight}
            directionsUrl={content.directionsUrl}
          />
        </div>
      )}

      <div className="space-y-3">
        {config.showHours && content.hours && (
          <HoursCard hours={content.hours} />
        )}
        {config.showAddress && content.address && (
          <AddressCard address={content.address} />
        )}
      </div>

      {hasActions && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {content.phone && (
            <ActionButton
              href={`tel:${content.phone}`}
              icon={<PhoneIcon />}
              label="전화하기"
            />
          )}
          {content.kakao && (
            <ActionButton
              href={content.kakao}
              icon={<ChatIcon />}
              label="카톡"
              external
            />
          )}
          {content.directionsUrl && (
            <ActionButton
              href={content.directionsUrl}
              icon={<CompassIcon />}
              label="길찾기"
              external
            />
          )}
        </div>
      )}
    </section>
  );
}
