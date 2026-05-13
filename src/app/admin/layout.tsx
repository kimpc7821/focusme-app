import Link from "next/link";
import { getAdminSession } from "@/lib/auth/server-session";
import { logoutAction } from "./_actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  return (
    <div className="min-h-screen bg-bg-soft">
      {session && (
        <header className="bg-bg border-b border-border-default">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/admin/tasks"
                className="text-[14px] font-medium text-fg"
              >
                FocusMe Admin
              </Link>
              <nav className="flex items-center gap-4 text-[13px]">
                <Link
                  href="/admin/tasks"
                  className="text-fg-secondary hover:text-fg"
                >
                  작업 큐
                </Link>
                <Link
                  href="/admin/pages/new"
                  className="text-fg-secondary hover:text-fg"
                >
                  새 페이지
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="text-fg-tertiary">
                {session.name} · {session.email}
              </span>
              <form action={logoutAction}>
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
