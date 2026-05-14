/**
 * 자료 수정 폼에서 필드 path 를 사장님 친화적인 한글로 변환.
 *
 * - 블록 타입별 컨테이너 사전 (BLOCK_FIELD_LABELS): 우선 적용
 * - 글로벌 필드 사전 (GLOBAL_FIELD_LABELS): fallback
 * - 배열 인덱스는 "1번", "2번" 처럼 1-base 로 표시
 * - 매핑이 없으면 원문 path 그대로 (디버그 가능성 유지)
 */

const GLOBAL_FIELD_LABELS: Record<string, string> = {
  // 공통 텍스트
  title: "제목",
  subtitle: "부제",
  tagline: "한 줄 소개",
  description: "설명",
  body: "본문",
  text: "텍스트",
  label: "라벨",
  name: "이름",
  caption: "캡션",
  alt: "대체 텍스트",
  placeholder: "기본 안내문구",

  // 이미지·미디어
  image: "이미지",
  imageUrl: "이미지",
  image_url: "이미지",
  logo: "로고",
  logoUrl: "로고",
  logo_url: "로고",
  thumbnail: "썸네일",
  videoUrl: "동영상",
  video_url: "동영상",

  // 연락처·링크
  url: "링크",
  link: "링크",
  href: "링크",
  phone: "전화번호",
  email: "이메일",
  address: "주소",
  kakao: "카카오",
  kakaoUrl: "카카오 채널",
  kakao_url: "카카오 채널",

  // 상품
  price: "가격",
  originalPrice: "원래 가격",
  original_price: "원래 가격",
  badge: "뱃지",

  // 영업
  weekdays: "평일",
  saturday: "토요일",
  sunday: "일요일",
  holiday: "공휴일",
  note: "비고",

  // 회사 정보
  businessName: "상호명",
  business_name: "상호명",
  businessNumber: "사업자등록번호",
  business_number: "사업자등록번호",
  ecommerceLicense: "통신판매업 신고번호",
  ecommerce_license: "통신판매업 신고번호",
  copyright: "저작권 표시",
  privacyOfficer: "개인정보책임자",
  privacy_officer: "개인정보책임자",

  // 후기·FAQ
  rating: "별점",
  author: "작성자",
  question: "질문",
  answer: "답변",

  // 위치
  sectionTitle: "섹션 제목",
  section_title: "섹션 제목",
  sectionSubtitle: "섹션 부제",
  section_subtitle: "섹션 부제",
  full: "전체 주소",
  detail: "상세 주소",
  latitude: "위도",
  longitude: "경도",
};

const BLOCK_FIELD_LABELS: Record<string, Record<string, string>> = {
  profile_header: {
    title: "상호명",
    tagline: "한 줄 소개",
    logoUrl: "로고 이미지",
  },
  hero_carousel: {
    slides: "메인 이미지",
    title: "제목",
    subtitle: "부제",
  },
  brand_story: {
    title: "스토리 제목",
    body: "스토리 본문",
    image: "스토리 이미지",
  },
  product_cards: {
    products: "상품",
    sectionTitle: "섹션 제목",
  },
  gallery_grid: {
    images: "갤러리 이미지",
    sectionTitle: "섹션 제목",
  },
  reviews: {
    items: "후기",
    sectionTitle: "섹션 제목",
  },
  faq: {
    items: "질문 항목",
    sectionTitle: "섹션 제목",
  },
  sns_buttons: {
    items: "SNS 링크",
  },
  phone_button: {
    label: "버튼 텍스트",
    phone: "전화번호",
  },
  kakao_channel: {
    label: "버튼 텍스트",
    kakaoUrl: "카카오 채널 URL",
  },
  contact_form: {
    title: "폼 제목",
    submitLabel: "제출 버튼 텍스트",
  },
  location_info: {
    sectionTitle: "섹션 제목",
    sectionSubtitle: "섹션 부제",
    hours: "영업시간",
    address: "주소",
    phone: "전화번호",
    email: "이메일",
    kakao: "카카오",
  },
  legal_footer: {
    businessName: "상호명",
    businessNumber: "사업자등록번호",
    ecommerceLicense: "통신판매업 신고번호",
    privacyOfficer: "개인정보책임자",
  },
  floating_cta: {
    phone: "전화번호",
    kakao: "카카오 채널",
  },
  instagram_embed: {
    postUrl: "인스타그램 게시물 URL",
    post_url: "인스타그램 게시물 URL",
  },
  map: {
    address: "주소",
    latitude: "위도",
    longitude: "경도",
  },
};

export function humanizePath(
  blockType: string,
  path: (string | number)[],
): string {
  const blockMap = BLOCK_FIELD_LABELS[blockType] ?? {};
  const segs = path.map((seg) => {
    if (typeof seg === "number") return `${seg + 1}번`;
    return blockMap[seg] ?? GLOBAL_FIELD_LABELS[seg] ?? seg;
  });
  return segs.join(" › ");
}
