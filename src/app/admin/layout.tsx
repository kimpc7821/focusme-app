import Link from "next/link";
import { getAdminSession } from "@/lib/auth/server-session";
import { createServerSupabase } from "@/lib/supabase/server";
import { logoutAction } from "./_actions/auth";

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-danger text-fg-inverse text-[10px] font-medium leading-none align-middle">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  let taskCount = 0;
  let changeCount = 0;
  let inquiryCount = 0;
  if (session) {
    const supabase = createServerSupabase();
    const [tasks, changes, inquiries] = await Promise.all([
      supabase
        .from("work_tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "in_review"),
      supabase
        .from("change_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
    ]);
    taskCount = tasks.count ?? 0;
    changeCount = changes.count ?? 0;
    inquiryCount = inquiries.count ?? 0;
  }

  return (
    <div className="min-h-screen bg-bg-soft">
      {session && (
        <header className="bg-bg border-b border-border-default">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className="text-[14px] font-medium text-fg"
              >
                FocusMe Admin
              </Link>
              <nav className="flex items-center gap-4 text-[13px]">
                <Link
                  href="/admin/clients"
                  className="text-fg-secondary hover:text-fg"
                >
                  클라이언트
                </Link>
                <Link
                  href="/admin/tasks?status=in_review"
                  className="text-fg-secondary hover:text-fg"
                >
                  작업 큐
                  <NavBadge count={taskCount} />
                </Link>
                <Link
                  href="/admin/change-requests"
                  className="text-fg-secondary hover:text-fg"
                >
                  변경 요청
                  <NavBadge count={changeCount} />
                </Link>
                <Link
                  href="/admin/reports"
                  className="text-fg-secondary hover:text-fg"
                >
                  리포트
                </Link>
                <Link
                  href="/admin/inquiries"
                  className="text-fg-secondary hover:text-fg"
                >
                  개설 문의
                  <NavBadge count={inquiryCount} />
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="text-fg-tertiary">
                {session.name} · {session.email}
              </span>
              <Link
                href="/admin/settings"
                className="text-fg-secondary hover:text-fg"
              >
                설정
              </Link>
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
