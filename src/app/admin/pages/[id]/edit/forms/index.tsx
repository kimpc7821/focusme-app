"use client";

import type { BlockFormProps } from "./types";
import { ProfileHeaderForm } from "./ProfileHeaderForm";
import { LocationInfoForm } from "./LocationInfoForm";
import { LegalFooterForm } from "./LegalFooterForm";
import { FloatingCtaForm } from "./FloatingCtaForm";

const REGISTRY: Record<string, React.ComponentType<BlockFormProps>> = {
  profile_header: ProfileHeaderForm,
  location_info: LocationInfoForm,
  legal_footer: LegalFooterForm,
  floating_cta: FloatingCtaForm,
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
