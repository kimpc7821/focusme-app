import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getClientSession } from "@/lib/auth/client-session";
import { clientLogoutAction } from "./_actions/auth";

export default async function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getClientSession();
  let businessName: string | null = session?.name ?? null;
  // 임시 pw 강제 변경 가드 — must_change_password 면 /me 어디든 진입 차단.
  // (/change-password 는 /me 밖이라 루프 없음)
  if (session) {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("clients")
      .select("business_name, must_change_password")
      .eq("id", session.sub)
      .maybeSingle();
    if (data?.must_change_password) {
      redirect("/change-password");
    }
    if (!businessName) businessName = data?.business_name ?? null;
  }

  return (
    <div className="min-h-screen bg-bg-soft">
      {session && (
        <header className="bg-bg border-b border-border-default">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/me" className="text-[14px] font-medium text-fg">
              FocusMe
            </Link>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="text-fg-tertiary">
                {businessName ?? "사장님"}
              </span>
              <form action={clientLogoutAction}>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md border border-border-default text-fg hover:bg-bg-soft transition-colors"
                >
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        </header>
      )}
      <main>{children}</main>
    </div>
  );
}
