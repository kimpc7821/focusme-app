import type {
  Block,
  EssentialInfo,
  FloatingCtaContent,
  LegalFooterContent,
  LocationInfoContent,
  ProfileHeaderContent,
} from "@/lib/types";

/**
 * v2: essential_info 단방향 source-of-truth 주입.
 *
 * 페이지 레벨 essential_info 가 시스템·숨김 블록의 deprecated 필드를 항상 덮어씀.
 * admin override 없음. 사장님이 essential_info 한 번 바꾸면 6개 블록에 자동 반영.
 *
 * 적용 블록 (6개):
 *   - profile_header  → title · tagline
 *   - location_info   → phone · hours · address · email
 *   - legal_footer    → businessName · businessNumber · ecommerceLicense · privacyOfficer
 *   - floating_cta    → buttons[].value (type=phone → phone, type=kakao → kakaoUrl)
 *   - phone_button    → phone (숨김 블록)
 *   - kakao_channel   → url (숨김 블록)
 *
 * reference: docs/focusme-flow-simplification-guide-v2.md §4.4
 */
export function resolveBlockWithEssential(
  block: Block,
  essential: EssentialInfo,
): Block {
  switch (block.blockType) {
    case "profile_header": {
      const content = block.content as ProfileHeaderContent;
      return {
        ...block,
        content: {
          ...content,
          title: essential.businessName ?? content.title ?? "",
          tagline: essential.tagline ?? content.tagline,
        } satisfies ProfileHeaderContent,
      };
    }

    case "location_info": {
      const content = block.content as LocationInfoContent;
      return {
        ...block,
        content: {
          ...content,
          phone: essential.phone ?? content.phone,
          email: essential.email ?? content.email,
          hours: essential.hours ?? content.hours,
          address: essential.address ?? content.address,
          kakao: essential.kakaoUrl ?? content.kakao,
        } satisfies LocationInfoContent,
      };
    }

    case "legal_footer": {
      const content = block.content as LegalFooterContent;
      return {
        ...block,
        content: {
          ...content,
          businessName: essential.businessName ?? content.businessName,
          businessNumber:
            essential.businessNumber ?? content.businessNumber,
          ecommerceLicense:
            essential.ecommerceLicense ?? content.ecommerceLicense,
          privacyOfficer: essential.privacyOfficer ?? content.privacyOfficer,
        } satisfies LegalFooterContent,
      };
    }

    case "floating_cta": {
      const content = block.content as FloatingCtaContent;
      const configured = content.buttons ?? [];
      // 1) 설정된 버튼이 있으면 essential 값 주입
      let buttons = configured.map((btn) => {
        if (btn.type === "phone" && essential.phone) {
          return { ...btn, value: essential.phone };
        }
        if (btn.type === "kakao" && essential.kakaoUrl) {
          return { ...btn, value: essential.kakaoUrl };
        }
        return btn;
      });
      // 2) 설정된 버튼이 없거나 빈 배열이면 essential_info 만으로 기본 버튼 자동 생성
      if (buttons.length === 0) {
        if (essential.phone) {
          buttons.push({ type: "phone", value: essential.phone, label: "전화" });
        }
        if (essential.kakaoUrl) {
          buttons.push({ type: "kakao", value: essential.kakaoUrl, label: "카카오톡" });
        }
      }
      // 3) 주입 후에도 value 가 비었으면 해당 버튼 제거 (깨진 링크 방지)
      buttons = buttons.filter((btn) => Boolean(btn.value));
      return {
        ...block,
        content: { ...content, buttons } satisfies FloatingCtaContent,
      };
    }

    case "phone_button": {
      const content = block.content as { phone?: string; [k: string]: unknown };
      if (!essential.phone) return block;
      return {
        ...block,
        content: { ...content, phone: essential.phone },
      };
    }

    case "kakao_channel": {
      const content = block.content as { url?: string; [k: string]: unknown };
      if (!essential.kakaoUrl) return block;
      return {
        ...block,
        content: { ...content, url: essential.kakaoUrl },
      };
    }

    default:
      return block;
  }
}

/**
 * 페이지의 모든 블록에 essential_info 를 일괄 주입.
 * /p/[slug] 공개 렌더 + /me/pages/[id]/preview 양쪽에서 사용.
 */
export function resolveBlocksWithEssential(
  blocks: Block[],
  essential: EssentialInfo,
): Block[] {
  return blocks.map((b) => resolveBlockWithEssential(b, essential));
}

/**
 * admin Editor 의 read-only 처리에 사용 — essential_info 가 관리하는 deprecated 필드 path 목록.
 * 블록 타입별로 입력 비활성화 + "essential_info 에서 관리" 안내 표시.
 */
export const ESSENTIAL_MANAGED_FIELDS: Record<string, string[]> = {
  profile_header: ["title", "tagline"],
  location_info: ["phone", "email", "hours", "address", "kakao"],
  legal_footer: [
    "businessName",
    "businessNumber",
    "ecommerceLicense",
    "privacyOfficer",
  ],
  floating_cta: ["buttons.*.value"],
  phone_button: ["phone"],
  kakao_channel: ["url"],
};
