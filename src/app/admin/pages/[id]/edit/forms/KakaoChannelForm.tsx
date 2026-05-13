"use client";

import type { BlockFormProps } from "./types";
import { Field, Section, Select, TextInput } from "./inputs";

type Size = "medium" | "large";
type Layout = "fullwidth" | "inline";
type ChannelType = "plus_friend" | "open_chat";

export function KakaoChannelForm({
  config,
  content,
  onConfig,
  onContent,
}: BlockFormProps) {
  const size = (config.size as Size) ?? "medium";
  const layout = (config.layout as Layout) ?? "fullwidth";
  const channelType = (config.channelType as ChannelType) ?? "plus_friend";

  const url = (content.url as string) ?? "";
  const label = (content.label as string) ?? "";
  const channelId = (content.channelId as string) ?? "";

  return (
    <div className="space-y-6">
      <Section title="콘텐츠">
        <Field
          label="카카오 채널 URL"
          hint="채널: https://pf.kakao.com/_xxxx · 오픈채팅: https://open.kakao.com/o/xxx"
        >
          <TextInput
            value={url}
            onChange={(v) => onContent({ ...content, url: v })}
            placeholder="https://pf.kakao.com/_..."
          />
        </Field>
        <Field label="라벨 (선택)" hint="기본: 카톡 문의">
          <TextInput
            value={label}
            onChange={(v) => onContent({ ...content, label: v })}
            placeholder="카톡 문의"
          />
        </Field>
        <Field label="채널 ID (식별용, 선택)">
          <TextInput
            value={channelId}
            onChange={(v) => onContent({ ...content, channelId: v })}
          />
        </Field>
      </Section>

      <Section title="레이아웃">
        <Field label="채널 종류">
          <Select<ChannelType>
            value={channelType}
            onChange={(v) => onConfig({ ...config, channelType: v })}
            options={[
              { value: "plus_friend", label: "카카오톡 채널" },
              { value: "open_chat", label: "오픈채팅" },
            ]}
          />
        </Field>
        <Field label="너비">
          <Select<Layout>
            value={layout}
            onChange={(v) => onConfig({ ...config, layout: v })}
            options={[
              { value: "fullwidth", label: "전체 너비" },
              { value: "inline", label: "인라인" },
            ]}
          />
        </Field>
        <Field label="크기">
          <Select<Size>
            value={size}
            onChange={(v) => onConfig({ ...config, size: v })}
            options={[
              { value: "medium", label: "중간" },
              { value: "large", label: "크게" },
            ]}
          />
        </Field>
      </Section>
    </div>
  );
}
