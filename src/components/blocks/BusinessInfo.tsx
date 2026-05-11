import type {
  Block,
  BusinessInfoConfig,
  BusinessInfoContent,
} from "@/lib/types";

type Props = Block<BusinessInfoConfig, BusinessInfoContent>;

export function BusinessInfo({ config, content }: Props) {
  return (
    <footer className="px-5 py-6 bg-bg-soft text-[11px] text-fg-secondary leading-relaxed">
      {config.showHours && content.hours && (
        <div className="mb-3">
          <h3 className="text-[10px] uppercase tracking-wider text-fg-tertiary mb-1.5 font-medium">
            영업시간
          </h3>
          <dl className="grid grid-cols-[60px_1fr] gap-y-0.5">
            {content.hours.weekdays && (
              <>
                <dt>평일</dt>
                <dd className="text-fg">{content.hours.weekdays}</dd>
              </>
            )}
            {content.hours.saturday && (
              <>
                <dt>토요일</dt>
                <dd className="text-fg">{content.hours.saturday}</dd>
              </>
            )}
            {content.hours.sunday && (
              <>
                <dt>일요일</dt>
                <dd className="text-fg">{content.hours.sunday}</dd>
              </>
            )}
            {content.hours.note && (
              <>
                <dt className="col-span-2 mt-1 text-fg-tertiary">
                  {content.hours.note}
                </dt>
              </>
            )}
          </dl>
        </div>
      )}

      {config.showAddress && content.address && (
        <div className="mb-3">
          <h3 className="text-[10px] uppercase tracking-wider text-fg-tertiary mb-1.5 font-medium">
            주소
          </h3>
          <p className="text-fg">
            {content.address.full}
            {content.address.detail ? ` ${content.address.detail}` : ""}
          </p>
        </div>
      )}

      {(content.phone || content.email) && (
        <div className="mb-3">
          <h3 className="text-[10px] uppercase tracking-wider text-fg-tertiary mb-1.5 font-medium">
            연락처
          </h3>
          {content.phone && (
            <p>
              <a
                href={`tel:${content.phone}`}
                className="text-fg hover:underline"
              >
                {content.phone}
              </a>
            </p>
          )}
          {content.email && (
            <p>
              <a
                href={`mailto:${content.email}`}
                className="text-fg hover:underline"
              >
                {content.email}
              </a>
            </p>
          )}
        </div>
      )}

      {config.showBusinessNumber && content.businessNumber && (
        <p className="text-[10px] text-fg-tertiary">
          사업자등록번호 {content.businessNumber}
        </p>
      )}
    </footer>
  );
}
