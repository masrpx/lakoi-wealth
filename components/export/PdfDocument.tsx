import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts if available (gracefully skip in server environments)
try {
  Font.register({
    family: "Sarabun",
    src: "https://fonts.gstatic.com/s/sarabun/v13/DtVmJx26TKEr37c9WBJDnlQN9gk1.woff2",
  });
} catch {
  // Ignore font registration failures
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    padding: 36,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: "#c9a84c",
  },
  brandBlock: {
    flexDirection: "column",
  },
  brandName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#c9a84c",
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  pageTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right",
  },
  pageDate: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 3,
    textAlign: "right",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metricLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  metricValueGold: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#c9a84c",
  },
  metricValueTeal: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0d9488",
  },
  metricValueRose: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#e11d48",
  },
  chartImage: {
    borderRadius: 8,
    width: "100%",
    objectFit: "contain",
    maxHeight: 320,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#94a3b8",
  },
  disclaimer: {
    fontSize: 6.5,
    color: "#94a3b8",
    textAlign: "right",
    maxWidth: 280,
  },
});

export interface PdfMetric {
  label: string;
  value: string;
  variant?: "gold" | "teal" | "rose" | "default";
}

interface Props {
  title: string;
  chartImageDataUrl?: string;
  metrics?: PdfMetric[];
  generatedDate?: string;
}

function metricValueStyle(variant?: string) {
  switch (variant) {
    case "gold":  return styles.metricValueGold;
    case "teal":  return styles.metricValueTeal;
    case "rose":  return styles.metricValueRose;
    default:      return styles.metricValue;
  }
}

export function LakоiWealthPdf({ title, chartImageDataUrl, metrics, generatedDate }: Props) {
  const date = generatedDate ?? new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>LAKOI WEALTH</Text>
            <Text style={styles.brandTagline}>Insurance & Investment Planning</Text>
          </View>
          <View>
            <Text style={styles.pageTitle}>{title}</Text>
            <Text style={styles.pageDate}>สร้างเมื่อ {date}</Text>
          </View>
        </View>

        {/* Metrics row */}
        {metrics && metrics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ตัวชี้วัดสำคัญ</Text>
            <View style={styles.metricsRow}>
              {metrics.map((m, i) => (
                <View key={i} style={styles.metricCard}>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                  <Text style={metricValueStyle(m.variant)}>{m.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Chart image */}
        {chartImageDataUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>กราฟ</Text>
            <Image src={chartImageDataUrl} style={styles.chartImage} />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Lakoi Wealth — {date}</Text>
          <Text style={styles.disclaimer}>
            ข้อมูลนี้จัดทำเพื่อการวางแผนทางการเงินเท่านั้น ไม่ถือเป็นคำแนะนำการลงทุน ผลตอบแทนในอดีตไม่ได้รับประกันผลในอนาคต
          </Text>
        </View>
      </Page>
    </Document>
  );
}
