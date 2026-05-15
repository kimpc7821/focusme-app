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
        클라이언트 등록
      </h1>
      <p className="mt-1 text-[12px] text-fg-tertiary">
        사장님 정보를 입력하면 클라이언트 + 페이지 + 작업이 한 번에 생성되고,
        로그인용 임시 비밀번호가 발급됩니다.
      </p>

      <div className="mt-6 bg-bg rounded-lg border border-border-default p-6">
        <NewPageForm templates={templates ?? []} tones={tones ?? []} />
      </div>
    </div>
  );
}
