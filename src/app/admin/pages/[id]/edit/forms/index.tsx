"use client";

import type { BlockFormProps } from "./types";
import { ProfileHeaderForm } from "./ProfileHeaderForm";
import { LocationInfoForm } from "./LocationInfoForm";
import { LegalFooterForm } from "./LegalFooterForm";
import { FloatingCtaForm } from "./FloatingCtaForm";
import { BrandStoryForm } from "./BrandStoryForm";
import { HeroCarouselForm } from "./HeroCarouselForm";
import { ProductCardsForm } from "./ProductCardsForm";
import { GalleryGridForm } from "./GalleryGridForm";
import { ReviewsForm } from "./ReviewsForm";
import { InstagramEmbedForm } from "./InstagramEmbedForm";
import { PhoneButtonForm } from "./PhoneButtonForm";
import { KakaoChannelForm } from "./KakaoChannelForm";
import { SnsButtonsForm } from "./SnsButtonsForm";
import { ContactFormForm } from "./ContactFormForm";
import { MapForm } from "./MapForm";
import { FaqForm } from "./FaqForm";

const REGISTRY: Record<string, React.ComponentType<BlockFormProps>> = {
  profile_header: ProfileHeaderForm,
  location_info: LocationInfoForm,
  legal_footer: LegalFooterForm,
  floating_cta: FloatingCtaForm,
  brand_story: BrandStoryForm,
  hero_carousel: HeroCarouselForm,
  product_cards: ProductCardsForm,
  gallery_grid: GalleryGridForm,
  reviews: ReviewsForm,
  instagram_embed: InstagramEmbedForm,
  phone_button: PhoneButtonForm,
  kakao_channel: KakaoChannelForm,
  sns_buttons: SnsButtonsForm,
  contact_form: ContactFormForm,
  map: MapForm,
  faq: FaqForm,
};

export function hasStructuredForm(blockType: string): boolean {
  return blockType in REGISTRY;
}

export function StructuredBlockForm({
  blockType,
  ...rest
}: BlockFormProps & { blockType: string }) {
  const Form = REGISTRY[blockType];
  if (!Form) return null;
  return <Form {...rest} />;
}
