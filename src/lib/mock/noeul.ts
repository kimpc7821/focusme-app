import type { PageWithBlocks } from "@/lib/types";

/**
 * Mock 페이지 — 노을공방 (D2C 핸드메이드 캔들 브랜드).
 * 실제 API: GET /p/:slug 가 반환할 페이로드 형태와 동일.
 */
export const noeulPage: PageWithBlocks = {
  page: {
    id: "page_noeul_001",
    slug: "noeul",
    templateType: "d2c",
    brandColor: "#EF9F27",
    toneKey: "warm_minimal",
    businessName: "노을공방",
    publishedAt: "2026-04-15T10:00:00Z",
  },
  blocks: [
    {
      id: "blk_001",
      pageId: "page_noeul_001",
      blockType: "profile_header",
      sortOrder: 1,
      isEnabled: true,
      isSystem: true,
      config: {
        layout: "centered",
        showTagline: true,
        logoShape: "rounded",
      },
      content: {
        logoUrl:
          "https://images.unsplash.com/photo-1602874801006-8cf12c4afc5d?w=200&h=200&fit=crop",
        title: "노을공방",
        tagline: "하루의 끝, 향으로 안식을",
        badge: undefined,
      },
    },
    {
      id: "blk_002",
      pageId: "page_noeul_001",
      blockType: "hero_carousel",
      sortOrder: 2,
      isEnabled: true,
      isSystem: false,
      config: {
        layout: "aspect_4_5",
        autoPlay: false,
        duration: 4000,
        showIndicators: true,
        overlay: "gradient",
        textPosition: "bottom",
      },
      content: {
        slides: [
          {
            imageUrl:
              "https://images.unsplash.com/photo-1602874801006-8cf12c4afc5d?w=1200&h=1500&fit=crop",
            title: "노을의 향",
            subtitle: "당신의 하루 끝에 머무는",
          },
          {
            imageUrl:
              "https://images.unsplash.com/photo-1608181831718-c9ffd8728107?w=1200&h=1500&fit=crop",
            title: "손으로 빚은 안식",
          },
        ],
      },
    },
    {
      id: "blk_003",
      pageId: "page_noeul_001",
      blockType: "brand_story",
      sortOrder: 3,
      isEnabled: true,
      isSystem: false,
      config: {
        layout: "plain",
        textAlign: "left",
        maxWidth: "narrow",
      },
      content: {
        title: "우리의 시작",
        body: "도예 작가 부부가 작업실에서 시작한 작은 캔들 공방입니다.\n\n자연에서 길어낸 향과 흙으로 만든 그릇이 만나, 일상의 작은 안식을 담아냅니다.\n\n매일 새벽, 손으로 빚어낸 향초들이 당신의 하루 끝에 머물기를 바랍니다.",
      },
    },
    {
      id: "blk_004",
      pageId: "page_noeul_001",
      blockType: "product_cards",
      sortOrder: 4,
      isEnabled: true,
      isSystem: false,
      config: {
        layout: "grid_2col",
        showPrice: true,
        showDescription: false,
        ctaType: "external_link",
        ctaLabel: "스토어 보기",
      },
      content: {
        title: "노을공방의 향초",
        products: [
          {
            name: "노을캔들 250g",
            price: "38,000원",
            imageUrl:
              "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&h=600&fit=crop",
            url: "https://example.com/noeul-candle",
            badge: "베스트",
          },
          {
            name: "별빛 디퓨저 100ml",
            price: "45,000원",
            imageUrl:
              "https://images.unsplash.com/photo-1602874801006-8cf12c4afc5d?w=600&h=600&fit=crop",
            url: "https://example.com/star-diffuser",
          },
          {
            name: "안식 캔들 120g",
            price: "24,000원",
            imageUrl:
              "https://images.unsplash.com/photo-1608181831718-c9ffd8728107?w=600&h=600&fit=crop",
            url: "https://example.com/calm-candle",
          },
          {
            name: "여명 인센스 스틱",
            price: "18,000원",
            imageUrl:
              "https://images.unsplash.com/photo-1602874801006-8cf12c4afc5d?w=600&h=600&fit=crop",
            url: "https://example.com/dawn-incense",
            badge: "신규",
          },
        ],
      },
    },
    {
      id: "blk_005",
      pageId: "page_noeul_001",
      blockType: "business_info",
      sortOrder: 5,
      isEnabled: true,
      isSystem: true,
      config: {
        showMap: false,
        showHours: true,
        showAddress: true,
        showBusinessNumber: true,
      },
      content: {
        hours: {
          weekdays: "10:00 ~ 18:00",
          saturday: "10:00 ~ 16:00",
          sunday: "휴무",
          note: "공휴일 휴무",
        },
        address: {
          full: "서울시 마포구 연남동 123-45",
          detail: "2층",
        },
        phone: "02-1234-5678",
        email: "owner@noeul.example",
        businessNumber: "123-45-67890",
      },
    },
    {
      id: "blk_006",
      pageId: "page_noeul_001",
      blockType: "floating_cta",
      sortOrder: 6,
      isEnabled: true,
      isSystem: true,
      config: {
        position: "right_bottom",
        buttonSize: "medium",
        showOnScroll: false,
      },
      content: {
        buttons: [
          {
            type: "kakao",
            label: "카톡 문의",
            value: "https://pf.kakao.com/_example",
          },
          {
            type: "phone",
            label: "전화",
            value: "02-1234-5678",
          },
        ],
      },
    },
  ],
};

export const mockPagesBySlug: Record<string, PageWithBlocks> = {
  noeul: noeulPage,
};
