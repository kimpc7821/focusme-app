export type ToneKey =
  | "warm_minimal"
  | "cool_modern"
  | "premium_dark"
  | "soft_pastel"
  | "vivid_bold";

export type BusinessType =
  | "d2c"
  | "golf"
  | "interior"
  | "professional"
  | "clinic"
  | "cafe"
  | "sales";

export type BlockType =
  | "profile_header"
  | "location_info"
  | "legal_footer"
  | "floating_cta"
  | "phone_button"
  | "kakao_channel"
  | "sns_buttons"
  | "hero_carousel"
  | "gallery_grid"
  | "brand_story"
  | "reviews"
  | "instagram_embed"
  | "product_cards"
  | "contact_form"
  | "map"
  | "faq";

export type ProductKind = "candle" | "diffuser" | "plant" | "incense" | "default";

export interface Block<TConfig = unknown, TContent = unknown> {
  id: string;
  pageId: string;
  blockType: BlockType;
  sortOrder: number;
  isEnabled: boolean;
  isSystem: boolean;
  config: TConfig;
  content: TContent;
}

/**
 * v2: 페이지 레벨 source of truth.
 * 사장님 Step 1 에서 한 번 입력 → 시스템·숨김 블록이 단방향 자동 참조.
 * reference: docs/focusme-flow-simplification-guide-v2.md §4.2
 */
export interface EssentialInfo {
  businessName?: string;
  tagline?: string;
  phone?: string;
  kakaoUrl?: string;
  email?: string;
  hours?: BusinessHours;
  address?: {
    full: string;
    detail?: string;
    latitude?: number;
    longitude?: number;
    sido?: string;
    sigungu?: string;
  };
  businessNumber?: string;
  ecommerceLicense?: string;
  privacyOfficer?: string;
}

export interface Page {
  id: string;
  slug: string;
  templateType: BusinessType;
  brandColor: string | null;
  toneKey: ToneKey;
  businessName: string;
  publishedAt: string;
  /**
   * v2: DB 레벨은 NOT NULL DEFAULT '{}' 라 항상 존재.
   * 단 mock 페이지·v2 적용 이전 데이터 호환을 위해 optional.
   * 공개 렌더에서는 항상 `?? {}` 로 안전 처리.
   */
  essentialInfo?: EssentialInfo;
}

export interface PageWithBlocks {
  page: Page;
  blocks: Block[];
}

/* ============================================================
   Block-specific config/content schemas
   reference: /docs/focusme-block-catalog.md
   ============================================================ */

export interface ProfileHeaderConfig {
  layout: "centered" | "left_aligned";
  showTagline: boolean;
  logoShape: "circle" | "square" | "rounded";
}
export interface ProfileHeaderContent {
  logoUrl: string;
  title: string;
  tagline?: string;
  badge?: string;
}

export interface HeroCarouselConfig {
  layout: "fullscreen" | "aspect_16_9" | "aspect_4_5";
  autoPlay: boolean;
  duration: number;
  showIndicators: boolean;
  overlay: "none" | "dark" | "light" | "gradient";
  textPosition: "top" | "center" | "bottom";
}
export interface HeroCarouselContent {
  slides: Array<{
    imageUrl: string;
    title?: string;
    subtitle?: string;
    cta?: { label: string; url: string };
  }>;
}

export interface BrandStoryConfig {
  layout: "plain" | "with_image_left" | "with_image_right" | "with_quote";
  textAlign: "left" | "center";
  maxWidth: "narrow" | "wide";
}
export interface BrandStoryContent {
  title?: string;
  body: string;
  imageUrl?: string;
  quote?: { text: string; author?: string };
}

export interface ProductCardsConfig {
  layout: "grid_2col" | "grid_3col" | "horizontal_scroll";
  showPrice: boolean;
  showDescription: boolean;
  ctaType: "external_link" | "phone" | "kakao";
  ctaLabel?: string;
}
export interface ProductCardsContent {
  title?: string;
  products: Array<{
    name: string;
    description?: string;
    price?: string;
    imageUrl?: string;
    url?: string;
    badge?: string;
    badgeKind?: "best" | "new" | "limited" | "default";
    available?: boolean;
    /** 이미지가 없을 때 카드 fallback 비주얼 키 */
    fallbackKind?: ProductKind;
  }>;
}

export interface BusinessHours {
  weekdays?: string;
  saturday?: string;
  sunday?: string;
  holiday?: string;
  note?: string;
}

export interface LocationInfoConfig {
  layout: "map_top" | "info_top" | "no_map";
  showMap: boolean;
  showHours: boolean;
  showAddress: boolean;
  showActionButtons: boolean;
  mapHeight: "small" | "medium" | "large";
}
export interface LocationInfoContent {
  sectionTitle?: string;
  sectionSubtitle?: string;
  hours?: BusinessHours;
  address?: {
    full: string;
    detail?: string;
    latitude?: number;
    longitude?: number;
  };
  phone?: string;
  email?: string;
  kakao?: string;
  directionsUrl?: string;
}

export interface LegalFooterConfig {
  showBusinessNumber: boolean;
  showEcommerceLicense: boolean;
  showCopyright: boolean;
}
export interface LegalFooterContent {
  businessName?: string;
  businessNumber?: string;
  ecommerceLicense?: string;
  privacyOfficer?: string;
  copyrightYear?: number;
}

export interface FloatingCtaConfig {
  position:
    | "right_bottom"
    | "left_bottom"
    | "right_middle"
    | "left_middle";
  buttonSize: "small" | "medium" | "large";
  showOnScroll: boolean;
}
export interface FloatingCtaContent {
  buttons: Array<{
    type: "phone" | "kakao" | "message" | "external";
    label: string;
    value: string;
    icon?: string;
  }>;
}
