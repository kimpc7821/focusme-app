interface Props {
  title: string;
  subtitle?: string;
  className?: string;
}

/**
 * 섹션 제목 + 좌측 브랜드 색 세로 라인 (3px).
 * subtitle 은 제목 바로 아래 부제로 좌측 정렬.
 */
export function SectionTitle({ title, subtitle, className = "" }: Props) {
  return (
    <div className={className}>
      <h2 className="relative pl-3 text-[16px] font-medium leading-tight text-fg before:absolute before:left-0 before:top-[3px] before:bottom-[3px] before:w-[3px] before:rounded-full before:bg-[var(--brand-primary)] before:content-['']">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1.5 pl-3 text-[12px] text-fg-tertiary leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
