import Link from "next/link";
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
  // 세션에 name 이 없을 수도 있음(첫 가입 직후 등) — DB 에서 한 번 더 조회.
  if (session && !businessName) {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("clients")
      .select("business_name")
      .eq("id", session.sub)
      .maybeSingle();
    businessName = data?.business_name ?? null;
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
