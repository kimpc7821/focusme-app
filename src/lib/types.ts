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
  | "business_info"
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

export interface Page {
  id: string;
  slug: string;
  templateType: BusinessType;
  brandColor: string | null;
  toneKey: ToneKey;
  businessName: string;
  publishedAt: string;
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
    available?: boolean;
  }>;
}

export interface BusinessInfoConfig {
  showMap: boolean;
  showHours: boolean;
  showAddress: boolean;
  showBusinessNumber: boolean;
}
export interface BusinessInfoContent {
  hours?: {
    weekdays?: string;
    saturday?: string;
    sunday?: string;
    holiday?: string;
    note?: string;
  };
  address?: {
    full: string;
    detail?: string;
    latitude?: number;
    longitude?: number;
  };
  phone?: string;
  email?: string;
  businessNumber?: string;
}

export interface FloatingCtaConfig {
  position: "right_bottom" | "left_bottom";
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
