import type { BusinessHours } from "@/lib/types";

export interface BusinessStatus {
  isOpen: boolean;
  statusText: string;
}

export interface ScheduleRow {
  label: string;
  value: string;
  isToday: boolean;
}

const KOREAN_DAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const CLOSED_TOKENS = new Set(["휴무", "휴일", "closed", "Closed", "CLOSED"]);

function parseRange(raw?: string): [number, number] | null {
  if (!raw) return null;
  const match = raw.match(/(\d{1,2}):(\d{2})\s*[~\-—–]\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [, oh, om, ch, cm] = match.map(Number);
  return [oh * 60 + om, ch * 60 + cm];
}

function formatTimeRange(raw?: string): string {
  if (!raw) return "-";
  if (CLOSED_TOKENS.has(raw.trim())) return "휴무";
  return raw.replace(/~/g, "—").trim();
}

function hourLabel(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const ampm = hour < 12 ? "오전" : "오후";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const mm = minutes % 60;
  return mm === 0
    ? `${ampm} ${display}시`
    : `${ampm} ${display}시 ${mm}분`;
}

function todayKey(day: number): "weekdays" | "saturday" | "sunday" {
  if (day === 0) return "sunday";
  if (day === 6) return "saturday";
  return "weekdays";
}

/**
 * 현재 시간 기준 영업 중인지 / 마감까지 남은 시간 텍스트.
 * timezone은 서버 환경 기준 (Vercel은 UTC, Asia/Seoul은 호스팅 시 환경변수로 조정).
 * MVP는 서버 로컬 시간 기준 — 추후 명시적 Asia/Seoul 처리로 교체.
 */
export function calculateBusinessStatus(
  hours: BusinessHours | undefined,
  now: Date = new Date(),
): BusinessStatus {
  if (!hours) return { isOpen: false, statusText: "영업 정보 없음" };
  const day = now.getDay();
  const key = todayKey(day);
  const todayRaw = hours[key];

  if (!todayRaw || CLOSED_TOKENS.has(todayRaw.trim())) {
    return { isOpen: false, statusText: "오늘 휴무" };
  }

  const range = parseRange(todayRaw);
  if (!range) return { isOpen: false, statusText: "영업 정보 확인 필요" };

  const [openMin, closeMin] = range;
  const currentMin = now.getHours() * 60 + now.getMinutes();

  if (currentMin < openMin) {
    return { isOpen: false, statusText: `${hourLabel(openMin)} 영업 시작` };
  }
  if (currentMin >= closeMin) {
    return { isOpen: false, statusText: "영업 종료" };
  }
  return { isOpen: true, statusText: `영업 중 · ${hourLabel(closeMin)}까지` };
}

/**
 * 와이어프레임 표시 — 평일 오늘이면 4행 (오늘 분리 + 월-금 통합), 토/일이면 3행.
 */
export function buildSchedule(
  hours: BusinessHours | undefined,
  now: Date = new Date(),
): ScheduleRow[] {
  if (!hours) return [];
  const day = now.getDay();
  const isWeekday = day >= 1 && day <= 5;
  const isSaturday = day === 6;

  const weekdayRow = (): ScheduleRow => ({
    label: "월-금",
    value: formatTimeRange(hours.weekdays),
    isToday: false,
  });
  const saturdayRow = (isToday: boolean): ScheduleRow => ({
    label: isToday ? "토요일 (오늘)" : "토요일",
    value: formatTimeRange(hours.saturday),
    isToday,
  });
  const sundayRow = (isToday: boolean): ScheduleRow => ({
    label: isToday ? "일요일·공휴일 (오늘)" : "일요일·공휴일",
    value: formatTimeRange(hours.sunday),
    isToday,
  });

  if (isWeekday) {
    return [
      {
        label: `${KOREAN_DAYS[day]}요일 (오늘)`,
        value: formatTimeRange(hours.weekdays),
        isToday: true,
      },
      weekdayRow(),
      saturdayRow(false),
      sundayRow(false),
    ];
  }
  if (isSaturday) {
    return [saturdayRow(true), weekdayRow(), sundayRow(false)];
  }
  return [sundayRow(true), weekdayRow(), saturdayRow(false)];
}
