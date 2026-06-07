import { NextRequest, NextResponse } from "next/server";

interface YahooMeta {
  regularMarketPrice: number;
  previousClose?: number;
  chartPreviousClose?: number;
}

interface YahooQuote {
  close: (number | null)[];
  high: (number | null)[];
}

interface YahooResult {
  meta: YahooMeta;
  timestamp: number[];
  indicators: { quote: YahooQuote[] };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y&includePrePost=false`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // cache 5 min server-side
    });

    if (!resp.ok) {
      return NextResponse.json({ error: "upstream error" }, { status: resp.status });
    }

    const json = (await resp.json()) as {
      chart: { result: YahooResult[] | null; error: unknown };
    };

    const result = json.chart.result?.[0];
    if (!result) {
      return NextResponse.json({ error: "no data" }, { status: 404 });
    }

    const meta = result.meta;
    const quote = result.indicators.quote[0];

    const closes = (quote.close ?? []).filter((c): c is number => c !== null);
    const highs = (quote.high ?? []).filter((h): h is number => h !== null);

    return NextResponse.json({
      ticker,
      price: meta.regularMarketPrice,
      prevClose: meta.previousClose ?? (closes.length > 0 ? closes[closes.length - 1] : meta.regularMarketPrice),
      closes,
      highs,
      updatedAt: Date.now(),
      stale: false,
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
