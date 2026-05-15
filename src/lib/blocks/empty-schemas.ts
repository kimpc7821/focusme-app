/**
 * 사장님 Step 2 자료 입력 시, 빈 content 에 노출할 기본 input 칸 정의.
 *
 * BlockContentForm 이 content={} 인 블록을 만나면 → 이 schema 로 input 칸 생성.
 * 사장님 입력 항목은 최소화 (블록당 1~5개) — 발행 후 admin Editor 에서 보강 가능.
 *
 * 시스템·숨김 블록 6개 (profile_header·location_info·legal_footer·floating_cta·phone_button·kakao_channel)
 * 은 essential_info 가 모든 텍스트 필드를 단방향 주입하므로 schema 미정의 (Step 2 노출 X).
 *
 * reference: docs/focusme-flow-simplification-guide-v2.md §3.3
 */

export interface EmptyContentField {
  path: (string | number)[];
  initialValue: string | number;
  multiline?: boolean;
}

export interface EmptyContentSchema {
  /** 블록 진입 시 미리 채워둘 content 초기 구조 */
  initialContent: Record<string, unknown>;
  /** 추가/삭제 가능한 리스트 항목 path + 새 항목 템플릿 */
  listItems?: Array<{
    arrayPath: string[];
    itemTemplate: Record<string, unknown>;
    label: string;
    minItems?: number;
    maxItems?: number;
  }>;
  /** 이미지 업로드를 지원하는 path + 자료 카테고리 */
  imageFields?: Array<{
    path: (string | number)[];
    category: "logo" | "main_image" | "product_image" | "lifestyle";
    label: string;
  }>;
  /** AI 보강 버튼 — tagline·brand_story.body 만 v2 정책 */
  aiSuggestFields?: Array<{
    path: (string | number)[];
    field: "tagline" | "story";
    label: string;
  }>;
}

export const EMPTY_SCHEMAS: Record<string, EmptyContentSchema> = {
  hero_carousel: {
    initialContent: {
      slides: [
        { imageUrl: "", title: "", subtitle: "" },
      ],
    },
    listItems: [
      {
        arrayPath: ["slides"],
        itemTemplate: { imageUrl: "", title: "", subtitle: "" },
        label: "슬라이드",
        minItems: 1,
        maxItems: 5,
      },
    ],
    imageFields: [
      // path 의 인덱스는 동적 (slides[0,1,2...]) — UI 에서 listItems 와 결합해서 처리
      { path: ["slides", 0, "imageUrl"], category: "main_image", label: "메인 이미지" },
    ],
  },

  gallery_grid: {
    initialContent: {
      sectionTitle: "",
      images: [{ url: "", caption: "" }],
    },
    listItems: [
      {
        arrayPath: ["images"],
        itemTemplate: { url: "", caption: "" },
        label: "사진",
        minItems: 1,
        maxItems: 20,
      },
    ],
    imageFields: [
      { path: ["images", 0, "url"], category: "lifestyle", label: "사진" },
    ],
  },

  brand_story: {
    initialContent: {
      title: "",
      body: "",
    },
    aiSuggestFields: [
      { path: ["body"], field: "story", label: "AI 추천 받기" },
    ],
  },

  product_cards: {
    initialContent: {
      sectionTitle: "",
      products: [{ name: "", price: "", description: "", imageUrl: "", url: "" }],
    },
    listItems: [
      {
        arrayPath: ["products"],
        itemTemplate: { name: "", price: "", description: "", imageUrl: "", url: "" },
        label: "상품",
        minItems: 1,
        maxItems: 20,
      },
    ],
    imageFields: [
      { path: ["products", 0, "imageUrl"], category: "product_image", label: "상품 사진" },
    ],
  },

  reviews: {
    initialContent: {
      sectionTitle: "",
      items: [{ text: "", rating: 5, author: "" }],
    },
    listItems: [
      {
        arrayPath: ["items"],
        itemTemplate: { text: "", rating: 5, author: "" },
        label: "후기",
        minItems: 0,
        maxItems: 20,
      },
    ],
  },

  faq: {
    initialContent: {
      sectionTitle: "",
      items: [{ question: "", answer: "" }],
    },
    listItems: [
      {
        arrayPath: ["items"],
        itemTemplate: { question: "", answer: "" },
        label: "질문",
        minItems: 1,
        maxItems: 20,
      },
    ],
  },

  sns_buttons: {
    initialContent: {
      items: [{ type: "instagram", url: "" }],
    },
    listItems: [
      {
        arrayPath: ["items"],
        itemTemplate: { type: "instagram", url: "" },
        label: "SNS 링크",
        minItems: 1,
        maxItems: 8,
      },
    ],
  },

  instagram_embed: {
    initialContent: {
      postUrl: "",
    },
  },

  contact_form: {
    initialContent: {
      title: "문의하기",
      thanksMessage: "감사합니다. 빠르게 연락드릴게요.",
      notificationEmail: "",
      // 기본 폼 필드 3개 — 사장님은 admin Editor 의 ContactFormForm 으로 추가/삭제 가능
      fields: [
        { key: "name", label: "이름", type: "text", required: true, placeholder: "" },
        { key: "phone", label: "연락처", type: "tel", required: true, placeholder: "010-1234-5678" },
        { key: "message", label: "문의 내용", type: "textarea", required: true, placeholder: "" },
      ],
    },
  },

  map: {
    initialContent: {
      // essential_info.address 가 단방향 주입되므로 별도 입력 X.
      // 단 directionsUrl 만 사장님이 선택적으로 입력 가능.
      directionsUrl: "",
    },
  },
};

/**
 * 블록의 content 가 빈 객체일 때 schema 의 initialContent 를 반환.
 * 이미 채워진 content 가 있으면 그대로 사용.
 */
export function getStarterContent(
  blockType: string,
  existingContent: Record<string, unknown>,
): Record<string, unknown> {
  if (existingContent && Object.keys(existingContent).length > 0) {
    return existingContent;
  }
  const schema = EMPTY_SCHEMAS[blockType];
  return schema ? structuredClone(schema.initialContent) : {};
}
