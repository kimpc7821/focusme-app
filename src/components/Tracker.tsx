"use client";

import { useEffect } from "react";
import { detectDevice, getOrCreateSessionId } from "@/lib/tracking/session";

interface Props {
  pageId: string;
}

/**
 * 공개 페이지 mount 시 view 이벤트 1회 발사. fire-and-forget.
 * UTM·referrer·device·session 자동 수집.
 */
export function Tracker({ pageId }: Props) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const body = {
      pageId,
      eventType: "view" as const,
      sessionId: getOrCreateSessionId(),
      device: detectDevice(),
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
      utmContent: params.get("utm_content") ?? undefined,
      utmTerm: params.get("utm_term") ?? undefined,
      referrer: document.referrer || undefined,
    };

    fetch("/api/v1/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      // fire-and-forget
    });
  }, [pageId]);

  return null;
}
