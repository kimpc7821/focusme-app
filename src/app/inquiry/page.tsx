import { InquiryForm } from "./InquiryForm";

export const metadata = {
  title: "개설 문의 | FocusMe",
};

export default function InquiryPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-soft px-4 py-10">
      <div className="w-full max-w-sm bg-bg rounded-xl shadow-sm border border-border-default p-7">
        <div className="text-center mb-6">
          <h1 className="text-[20px] font-medium text-fg">FocusMe 개설 문의</h1>
          <p className="mt-1 text-[12px] text-fg-tertiary leading-relaxed">
            상호명·연락처·문의 내용을 남겨주시면
            <br />
            영업일 기준 빠르게 연락드립니다.
          </p>
        </div>
        <InquiryForm />
      </div>
    </div>
  );
}
