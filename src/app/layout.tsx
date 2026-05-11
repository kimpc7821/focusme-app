import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FocusMe — 사장님 사업에 포커스",
  description: "모바일 마이크로사이트 — 한 페이지로 시작하는 내 사업",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg text-fg">{children}</body>
    </html>
  );
}
