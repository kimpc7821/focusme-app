import { createServerSupabase } from "@/lib/supabase/server";
import { NewPageForm } from "./NewPageForm";

export default async function NewPagePage() {
  const supabase = createServerSupabase();
  const [{ data: templates }, { data: tones }] = await Promise.all([
    supabase
      .from("lookup_templates")
      .select("key, name, description, recommended_tone")
      .order("display_order"),
    supabase
      .from("lookup_tone_presets")
      .select("key, name, description, preview")
      .order("display_order"),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-[22px] font-medium text-fg leading-tight">
        새 페이지 만들기
      </h1>
      <p className="mt-1 text-[12px] text-fg-tertiary">
        결제 확인 후 클라이언트 + 페이지를 생성합니다. 빈 페이지(draft)로
        시작하고 편집기에서 블록을 추가합니다.
      </p>

      <div className="mt-6 bg-bg rounded-lg border border-border-default p-6">
        <NewPageForm templates={templates ?? []} tones={tones ?? []} />
      </div>
    </div>
  );
}
