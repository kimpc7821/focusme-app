import type { Block, BlockType } from "@/lib/types";
import { ProfileHeader } from "./ProfileHeader";
import { HeroCarousel } from "./HeroCarousel";
import { BrandStory } from "./BrandStory";
import { ProductCards } from "./ProductCards";
import { BusinessInfo } from "./BusinessInfo";
import { FloatingCta } from "./FloatingCta";

const registry: Partial<Record<BlockType, React.ComponentType<Block<never, never>>>> = {
  profile_header: ProfileHeader as unknown as React.ComponentType<Block<never, never>>,
  hero_carousel: HeroCarousel as unknown as React.ComponentType<Block<never, never>>,
  brand_story: BrandStory as unknown as React.ComponentType<Block<never, never>>,
  product_cards: ProductCards as unknown as React.ComponentType<Block<never, never>>,
  business_info: BusinessInfo as unknown as React.ComponentType<Block<never, never>>,
  floating_cta: FloatingCta as unknown as React.ComponentType<Block<never, never>>,
};

export function BlockRenderer({ block }: { block: Block }) {
  if (!block.isEnabled) return null;
  const Component = registry[block.blockType];
  if (!Component) {
    // 미구현 블록 — placeholder
    return (
      <div className="px-5 py-4 text-[11px] text-fg-tertiary border-t border-border-default">
        [{block.blockType}] 블록은 아직 구현되지 않았어요
      </div>
    );
  }
  return <Component {...(block as Block<never, never>)} />;
}
