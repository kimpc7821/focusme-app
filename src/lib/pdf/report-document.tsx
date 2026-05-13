import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Pretendard 한국어 폰트 등록 (jsdelivr static TTF)
Font.register({
  family: "Pretendard",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/pretendard/dist/web/static/woff/Pretendard-Regular.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/pretendard/dist/web/static/woff/Pretendard-Medium.woff",
      fontWeight: 500,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/pretendard/dist/web/static/woff/Pretendard-SemiBold.woff",
      fontWeight: 600,
    },
  ],
});

const COLOR = {
  fg: "#2C2C2A",
  fgSecondary: "#73726C",
  fgTertiary: "#9C9A92",
  bg: "#FFFFFF",
  bgSoft: "#F5F4ED",
  border: "#DDDBCF",
  brand: "#EF9F27",
  brandLight: "#FAEEDA",
  aiBg: "#EEEDFE",
  aiBorder: "#AFA9EC",
  aiText: "#3C3489",
  success: "#1D9E75",
  danger: "#D44545",
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Pretendard",
    fontSize: 10,
    color: COLOR.fg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.border,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLOR.brand,
    marginRight: 6,
  },
  brandLabel: {
    fontSize: 9,
    fontWeight: 500,
    color: COLOR.fgTertiary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: COLOR.fg,
  },
  meta: {
    fontSize: 9,
    color: COLOR.fgTertiary,
    marginTop: 2,
  },
  reportNo: {
    fontSize: 9,
    color: COLOR.fgTertiary,
  },
  insightBox: {
    backgroundColor: COLOR.aiBg,
    borderWidth: 0.5,
    borderColor: COLOR.aiBorder,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  insightLabel: {
    fontSize: 8,
    fontWeight: 500,
    color: COLOR.aiText,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 10.5,
    lineHeight: 1.6,
    color: COLOR.fg,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 500,
    color: COLOR.fgTertiary,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  kpiCard: {
    width: "31.5%",
    backgroundColor: COLOR.bg,
    borderWidth: 0.5,
    borderColor: COLOR.border,
    borderRadius: 6,
    padding: 10,
  },
  kpiLabel: {
    fontSize: 7.5,
    color: COLOR.fgTertiary,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 600,
    color: COLOR.fg,
    marginTop: 3,
  },
  kpiDelta: {
    fontSize: 8,
    marginTop: 2,
  },
  twoCol: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  card: {
    flex: 1,
    backgroundColor: COLOR.bg,
    borderWidth: 0.5,
    borderColor: COLOR.border,
    borderRadius: 6,
    padding: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  rowLabel: {
    fontSize: 9.5,
    color: COLOR.fg,
  },
  rowValue: {
    fontSize: 9,
    color: COLOR.fgTertiary,
  },
  barTrack: {
    height: 3,
    backgroundColor: COLOR.bgSoft,
    borderRadius: 1.5,
    marginTop: 3,
    marginBottom: 6,
    overflow: "hidden",
  },
  barFill: {
    height: 3,
    backgroundColor: COLOR.brand,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLOR.fgTertiary,
  },
});

const TARGET_LABEL: Record<string, string> = {
  kakao: "카톡 채널",
  phone: "전화",
  external_link: "외부 링크",
  form_submit: "폼 제출",
};

export interface ReportPdfProps {
  businessName: string;
  businessType: string;
  periodStart: string;
  periodEnd: string;
  pageSlug: string;
  reportId: string;
  generatedAt: string;
  aiInsight: string | null;
  summary: {
    totalViews: number;
    uniqueSessions: number;
    kakaoClicks: number;
    phoneClicks: number;
    externalClicks: number;
    formSubmits: number;
    comparison?: { totalViews: number; changePercent: number };
  };
  sources: Array<{ name: string; count: number; percent: number }>;
  topTargets: Array<{ target: string; clicks: number }>;
  byDevice: { mobile: number; desktop: number; other: number };
}

function fmt(n: number): string {
  return n.toLocaleString();
}

export function ReportDocument(props: ReportPdfProps) {
  const sources = props.sources.slice(0, 5);
  const topTargets = props.topTargets.slice(0, 5);
  const delta = props.summary.comparison?.changePercent;

  return (
    <Document
      title={`${props.businessName} 분기 리포트`}
      author="FocusMe"
      subject="모바일 마이크로사이트 분석 리포트"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brandLabel}>FOCUSME · 분기 리포트</Text>
            </View>
            <Text style={styles.title}>
              {props.businessName} ({props.businessType})
            </Text>
            <Text style={styles.meta}>
              {props.periodStart} ~ {props.periodEnd} · /{props.pageSlug}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.reportNo}>
              REPORT-{props.reportId.slice(0, 8)}
            </Text>
            <Text style={styles.reportNo}>{props.generatedAt}</Text>
          </View>
        </View>

        {/* AI 인사이트 */}
        {props.aiInsight && (
          <View style={styles.insightBox}>
            <Text style={styles.insightLabel}>✦ AI INSIGHT</Text>
            <Text style={styles.insightText}>{props.aiInsight}</Text>
          </View>
        )}

        {/* KPI 6 */}
        <Text style={styles.sectionLabel}>핵심 지표</Text>
        <View style={styles.kpiGrid}>
          <KpiCard
            label="총 방문"
            value={fmt(props.summary.totalViews)}
            delta={delta}
          />
          <KpiCard
            label="유니크 세션"
            value={fmt(props.summary.uniqueSessions)}
          />
          <KpiCard label="카톡 클릭" value={fmt(props.summary.kakaoClicks)} />
          <KpiCard label="전화 클릭" value={fmt(props.summary.phoneClicks)} />
          <KpiCard label="외부 링크" value={fmt(props.summary.externalClicks)} />
          <KpiCard label="폼 제출" value={fmt(props.summary.formSubmits)} />
        </View>

        {/* 유입 + 디바이스 */}
        <View style={styles.twoCol}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>유입 경로 TOP 5</Text>
            {sources.length === 0 ? (
              <Text style={styles.rowValue}>데이터 없음</Text>
            ) : (
              sources.map((s) => (
                <View key={s.name}>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>{s.name}</Text>
                    <Text style={styles.rowValue}>
                      {fmt(s.count)} · {s.percent}%
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.max(2, s.percent)}%` },
                      ]}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>디바이스</Text>
            <DeviceRow
              label="모바일"
              pct={Math.round(props.byDevice.mobile * 100)}
              color={COLOR.brand}
            />
            <DeviceRow
              label="데스크탑"
              pct={Math.round(props.byDevice.desktop * 100)}
              color={COLOR.aiText}
            />
            {props.byDevice.other > 0 && (
              <DeviceRow
                label="기타"
                pct={Math.round(props.byDevice.other * 100)}
                color={COLOR.fgTertiary}
              />
            )}
          </View>
        </View>

        {/* 인기 클릭 */}
        <Text style={styles.sectionLabel}>인기 클릭 대상</Text>
        <View style={styles.card}>
          {topTargets.length === 0 ? (
            <Text style={styles.rowValue}>데이터 없음</Text>
          ) : (
            topTargets.map((t) => (
              <View
                key={t.target}
                style={[styles.row, { paddingVertical: 4 }]}
              >
                <Text style={styles.rowLabel}>
                  {TARGET_LABEL[t.target] ?? t.target}
                </Text>
                <Text style={styles.rowValue}>{fmt(t.clicks)} 회</Text>
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>focusme.kr · v-directors</Text>
          <Text>이 리포트는 모바일 마이크로사이트 트래픽 기반.</Text>
        </View>
      </Page>
    </Document>
  );
}

function KpiCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number;
}) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {delta !== undefined && (
        <Text
          style={[
            styles.kpiDelta,
            { color: delta >= 0 ? COLOR.success : COLOR.danger },
          ]}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
        </Text>
      )}
    </View>
  );
}

function DeviceRow({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <View style={{ marginBottom: 6 }}>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{pct}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[styles.barFill, { width: `${Math.max(2, pct)}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}
