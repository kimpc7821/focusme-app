interface Props {
  title: string;
  subtitle?: string;
  className?: string;
}

/**
 * 섹션 제목 + 좌측 브랜드 색 세로 라인 (3px).
 * 우측에 보조 텍스트 옵션 (subtitle).
 */
export function SectionTitle({ title, subtitle, className = "" }: Props) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${className}`}>
      <h2 className="relative pl-3 text-[16px] font-medium leading-tight text-fg before:absolute before:left-0 before:top-[3px] before:bottom-[3px] before:w-[3px] before:rounded-full before:bg-[var(--brand-primary)] before:content-['']">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[12px] text-fg-tertiary shrink-0">{subtitle}</p>
      )}
    </div>
  );
}
