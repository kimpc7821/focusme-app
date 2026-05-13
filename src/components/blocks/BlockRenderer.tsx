import type { Block, BlockType } from "@/lib/types";
import { ProfileHeader } from "./ProfileHeader";
import { HeroCarousel } from "./HeroCarousel";
import { BrandStory } from "./BrandStory";
import { ProductCards } from "./ProductCards";
import { LocationInfo } from "./LocationInfo";
import { LegalFooter } from "./LegalFooter";
import { FloatingCta } from "./FloatingCta";
import { PhoneButton } from "./PhoneButton";
import { KakaoChannel } from "./KakaoChannel";
import { SnsButtons } from "./SnsButtons";
import { GalleryGrid } from "./GalleryGrid";
import { Reviews } from "./Reviews";
import { Faq } from "./Faq";

type AnyBlockComponent = React.ComponentType<Block<never, never>>;

const cast = <C, T>(c: React.ComponentType<Block<C, T>>) =>
  c as unknown as AnyBlockComponent;

const registry: Partial<Record<BlockType, AnyBlockComponent>> = {
  profile_header: cast(ProfileHeader),
  hero_carousel: cast(HeroCarousel),
  brand_story: cast(BrandStory),
  product_cards: cast(ProductCards),
  location_info: cast(LocationInfo),
  legal_footer: cast(LegalFooter),
  floating_cta: cast(FloatingCta),
  phone_button: cast(PhoneButton),
  kakao_channel: cast(KakaoChannel),
  sns_buttons: cast(SnsButtons),
  gallery_grid: cast(GalleryGrid),
  reviews: cast(Reviews),
  faq: cast(Faq),
};

export function BlockRenderer({ block }: { block: Block }) {
  if (!block.isEnabled) return null;
  const Component = registry[block.blockType];
  if (!Component) {
    return (
      <div className="px-5 py-4 text-[11px] text-fg-tertiary border-t border-border-default">
        [{block.blockType}] 블록은 아직 구현되지 않았어요
      </div>
    );
  }
  return <Component {...(block as Block<never, never>)} />;
}
