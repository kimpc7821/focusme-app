"use client";

import type { BlockFormProps } from "./types";
import {
  AssetUrlPicker,
  Field,
  Section,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from "./inputs";
import { NumberInput } from "@/components/inputs/NumberInput";

type Layout = "grid_2col" | "grid_3col" | "horizontal_scroll";
type CtaType = "external_link" | "phone" | "kakao";
type BadgeKind = "best" | "new" | "limited" | "default";
type FallbackKind = "candle" | "diffuser" | "plant" | "incense" | "default";

interface Product {
  name?: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  url?: string;
  badge?: string;
  badgeKind?: BadgeKind;
  available?: boolean;
  fallbackKind?: FallbackKind;
}

export function ProductCardsForm({
  config,
  content,
  onConfig,
  onContent,
  assets,
}: BlockFormProps) {
  const layout = (config.layout as Layout) ?? "grid_2col";
  const showPrice = (config.showPrice as boolean) ?? true;
  const showDescription = (config.showDescription as boolean) ?? false;
  const ctaType = (config.ctaType as CtaType) ?? "external_link";
  const ctaLabel = (config.ctaLabel as string) ?? "";

  const title = (content.title as string) ?? "";
  const products = (content.products as Product[]) ?? [];
  const setProducts = (next: Product[]) =>
    onContent({ ...content, products: next });
  const update = (i: number, patch: Partial<Product>) =>
    setProducts(products.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const remove = (i: number) =>
    setProducts(products.filter((_, idx) => idx !== i));
  const add = () =>
    setProducts([...products, { fallbackKind: "default" }]);

  return (
    <div className="space-y-6">
      <Section title="섹션">
        <Field label="제목 (선택)">
          <TextInput
            value={title}
            onChange={(v) => onContent({ ...content, title: v })}
            placeholder="우리 상품"
          />
        </Field>
      </Section>

      <Section title="상품">
        {products.length === 0 && (
          <p className="text-[12px] text-fg-tertiary">상품을 추가하세요.</p>
        )}
        {products.map((p, i) => (
          <div
            key={i}
            className="border border-border-default rounded-md p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-fg-tertiary">상품 #{i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-[12px] text-danger hover:underline"
              >
                삭제
              </button>
            </div>
            <Field label="이름">
              <TextInput
                value={p.name ?? ""}
                onChange={(v) => update(i, { name: v })}
                placeholder="노을캔들 250g"
              />
            </Field>
            <Field label="설명 (선택)">
              <TextArea
                value={p.description ?? ""}
                onChange={(v) => update(i, { description: v })}
                rows={2}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="가격 (원)" hint="천 단위 콤마 자동 적용">
                <NumberInput
                  value={p.price ?? ""}
                  onChange={(raw) => update(i, { price: raw })}
                  placeholder="38,000"
                  className="w-full px-3 py-1.5 text-[12px] rounded border border-border-default bg-bg-soft text-fg focus:outline-none focus:border-info"
                />
              </Field>
              <Field label="URL (스토어)">
                <TextInput
                  value={p.url ?? ""}
                  onChange={(v) => update(i, { url: v })}
                  placeholder="https://smartstore.naver.com/..."
                />
              </Field>
            </div>
            <Field
              label="이미지 URL"
              hint="비우면 카테고리별 fallback 아이콘 + 그라디언트"
            >
              <AssetUrlPicker
                value={p.imageUrl ?? ""}
                onChange={(v) => update(i, { imageUrl: v })}
                assets={assets}
                category="product_image"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Fallback 색상/아이콘">
                <Select<FallbackKind>
                  value={p.fallbackKind ?? "default"}
                  onChange={(v) => update(i, { fallbackKind: v })}
                  options={[
                    { value: "default", label: "기본 (브랜드)" },
                    { value: "candle", label: "캔들 (앰버)" },
                    { value: "diffuser", label: "디퓨저 (라벤더)" },
                    { value: "plant", label: "식물 (그린)" },
                    { value: "incense", label: "인센스 (코랄)" },
                  ]}
                />
              </Field>
              <Field label="배지 종류">
                <Select<BadgeKind>
                  value={p.badgeKind ?? "default"}
                  onChange={(v) => update(i, { badgeKind: v })}
                  options={[
                    { value: "default", label: "기본 (브랜드)" },
                    { value: "best", label: "베스트" },
                    { value: "new", label: "신규 (그린)" },
                    { value: "limited", label: "한정 (빨강)" },
                  ]}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="배지 텍스트">
                <TextInput
                  value={p.badge ?? ""}
                  onChange={(v) => update(i, { badge: v })}
                  placeholder="베스트"
                />
              </Field>
              <Toggle
                checked={p.available !== false}
                onChange={(v) => update(i, { available: v })}
                label="재고 있음"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="w-full px-3 py-2 rounded-md border border-dashed border-border-default text-[12px] text-fg-secondary hover:bg-bg-soft"
        >
          + 상품 추가
        </button>
      </Section>

      <Section title="레이아웃">
        <Field label="배치">
          <Select<Layout>
            value={layout}
            onChange={(v) => onConfig({ ...config, layout: v })}
            options={[
              { value: "grid_2col", label: "2열 그리드" },
              { value: "grid_3col", label: "3열 그리드" },
              { value: "horizontal_scroll", label: "가로 슬라이드" },
            ]}
          />
        </Field>
        <Field label="CTA 종류">
          <Select<CtaType>
            value={ctaType}
            onChange={(v) => onConfig({ ...config, ctaType: v })}
            options={[
              { value: "external_link", label: "외부 링크" },
              { value: "kakao", label: "카카오톡 문의" },
              { value: "phone", label: "전화" },
            ]}
          />
        </Field>
        <Field label="CTA 라벨 (선택)">
          <TextInput
            value={ctaLabel}
            onChange={(v) => onConfig({ ...config, ctaLabel: v })}
            placeholder="스토어 보기"
          />
        </Field>
        <Toggle
          checked={showPrice}
          onChange={(v) => onConfig({ ...config, showPrice: v })}
          label="가격 표시"
        />
        <Toggle
          checked={showDescription}
          onChange={(v) => onConfig({ ...config, showDescription: v })}
          label="설명 표시"
        />
      </Section>
    </div>
  );
}
