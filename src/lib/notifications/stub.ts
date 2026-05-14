/**
 * 알림 발송 stub — NHN Toast 알림톡 통합 전 임시 구현.
 *
 * 모든 알림 호출이 이 모듈을 거치게 만들어, NHN Toast 통합 시
 * 함수 본문만 교체하면 되도록 설계.
 *
 * reference: docs/focusme-alimtalk-templates.md (템플릿 사전 등록 필요)
 */

export async function notifyAdminNewChangeRequest(args: {
  pageId: string;
  pageSlug: string;
  requestType: string;
  description: string;
}): Promise<void> {
  console.log(
    `[notify:stub] admin <- 새 변경 요청 / page=${args.pageSlug} / type=${args.requestType} / ${args.description.slice(0, 60)}...`,
  );
}

export async function notifyClientChangeRequestUpdate(args: {
  clientPhone: string | null;
  pageSlug: string;
  status: string;
  quotedCost?: number | null;
  note?: string | null;
}): Promise<void> {
  console.log(
    `[notify:stub] client <- 변경 요청 상태 업데이트 / phone=${args.clientPhone ?? "?"} / page=${args.pageSlug} / status=${args.status}` +
      (args.quotedCost != null ? ` / 견적=${args.quotedCost}원` : "") +
      (args.note ? ` / 메모="${args.note.slice(0, 60)}"` : ""),
  );
}
