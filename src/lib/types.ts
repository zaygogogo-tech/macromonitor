// Data precision helper - STRICT RULE: Always use toFixed(2)
export function formatPrice(value: number): string {
  return Number(value).toFixed(2);
}

export function formatPercent(value: number): string {
  return Number(value).toFixed(2);
}

export function formatChange(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(2)}`;
}

// Market Data Types
export interface TickerData {
  symbol: string;
  name: string;
  price: number;
  change: number; // percentage change
  timestamp: number;
}

export interface TreemapItem {
  name: string;
  value: number; // market cap
  change: number; // daily change %
  children?: TreemapItem[];
}

// Macro Data Types
export interface MacroIndicator {
  id: string;
  name: string;
  previous: number;
  consensus: number;
  actual: number | null;
  unit: string;
  releaseDate: string;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  probability: number; // 0-100
  volume: number;
  endDate: string;
  trend?: number[]; // 7-day probability trend for sparkline
}

// Geopolitics Data Types
export interface NarrativeChartData {
  name: string;
  newsHeat: number[];
  assetPrice: number[];
  timestamps: string[];
  iv?: number; // Implied Volatility
  ivChange?: number;
  trendSummary?: string;
  circuitBroken?: boolean;
  assetSymbol?: string;
  isDynamic?: boolean; // Flag for sandbox-generated narratives
  prompt?: string; // Original user prompt for dynamic narratives
}

export interface AISummary {
  summary: string;
  dominantNarrative: string;
  confidence: number;
  generatedAt: number;
}

export interface NewsItem {
  id: string;
  title: string;
  timestamp: number;
  source: string;
  tags: string[];
}

// Phase 1: Dual-Track Sensitivity Types
export interface SensitivityItem {
  ticker: string;
  sensitivity: number; // -1.0 to +1.0
  type: 'bond' | 'equity' | 'commodity' | 'fx' | 'volatility' | 'crypto';
  iv: number; // Implied volatility
}

export interface MacroEvent {
  id: string;
  title: string;
  probability: number;
  volume: number;
  endDate: string;
  trend: number[];
  catalyst: string;
  daysToEvent: number;
  impacts: {
    tactical_1w: SensitivityItem[];
    strategic_3m: SensitivityItem[];
  };
  execution: {
    crowdedness: string;
    fundingRisk: string;
    rr: number; // Risk:Reward ratio
    resistance: number;
    support: number;
    invalidation: string;
    position: string;
  };
  circuitBroken?: boolean;
}

// Logic Map for News Tagging
export const logicMap: Record<string, { bullish: string[]; bearish: string[] }> = {
  "军费": { bullish: ["ITA", "RTX"], bearish: [] },
  "降息": { bullish: ["IWM"], bearish: ["DXY"] },
  "中东": { bullish: ["USO"], bearish: [] },
  "关税": { bullish: [], bearish: ["SOXX"] },
  "冲突": { bullish: ["USO", "ITA"], bearish: [] },
  "制裁": { bullish: [], bearish: ["SOXX"] },
  "通胀": { bullish: [], bearish: ["IWM"] },
  "衰退": { bullish: ["TLT"], bearish: ["SPY", "QQQ"] },
};
