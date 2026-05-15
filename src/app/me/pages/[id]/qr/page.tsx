import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getClientSession } from "@/lib/auth/client-session";
import { QrManager } from "./QrManager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MeQrPage({ params }: Props) {
  const session = await getClientSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const supabase = createServerSupabase();
  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, status, client_id")
    .eq("id", id)
    .maybeSingle();
  if (!page) notFound();
  if (page.client_id !== session.sub) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center text-[13px] text-danger">
        본인 페이지가 아닙니다.
      </div>
    );
  }
  if (page.status !== "published") {
    redirect(`/me/pages/${id}`);
  }

  const { data: codes } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("page_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <nav className="mb-4 text-[12px] text-fg-tertiary">
        <Link href="/me" className="hover:text-fg">
          내 페이지
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/me/pages/${id}`} className="hover:text-fg">
          /{page.slug}
        </Link>
        <span className="mx-2">/</span>
        <span>QR 코드</span>
      </nav>

      <div className="mb-5">
        <h1 className="text-[20px] font-medium text-fg leading-tight">
          QR 코드
        </h1>
        <p className="mt-1 text-[12px] text-fg-tertiary">
          채널별로 발급하면 어디서 들어왔는지(명함·매장·광고 등) 추적할 수
          있습니다.
        </p>
      </div>

      <QrManager pageId={id} initialCodes={codes ?? []} />
    </div>
  );
}
