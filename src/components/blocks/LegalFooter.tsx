import type {
  Block,
  LegalFooterConfig,
  LegalFooterContent,
} from "@/lib/types";

type Props = Block<LegalFooterConfig, LegalFooterContent>;

export function LegalFooter({ config, content }: Props) {
  const lines: string[] = [];
  const year = content.copyrightYear ?? new Date().getFullYear();

  if (config.showCopyright && content.businessName) {
    lines.push(`© ${year} ${content.businessName}`);
  }
  if (config.showBusinessNumber && content.businessNumber) {
    lines.push(`사업자등록번호 ${content.businessNumber}`);
  }
  if (config.showEcommerceLicense && content.ecommerceLicense) {
    lines.push(`통신판매업 신고 ${content.ecommerceLicense}`);
  }
  if (content.privacyOfficer) {
    lines.push(`개인정보책임자 ${content.privacyOfficer}`);
  }

  if (lines.length === 0) return null;

  return (
    <footer
      className="px-5 pt-3 pb-6 text-center"
      style={{
        background:
          "color-mix(in srgb, var(--brand-light) 30%, var(--color-bg-primary))",
      }}
    >
      <div className="space-y-0.5">
        {lines.map((line, i) => (
          <p key={i} className="text-[9px] text-fg-tertiary leading-[1.7]">
            {line}
          </p>
        ))}
      </div>
    </footer>
  );
}
