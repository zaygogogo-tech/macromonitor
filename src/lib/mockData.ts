import type { TickerData, TreemapItem, MacroIndicator, PolymarketEvent, NarrativeChartData, NewsItem } from './types';

// Mock Ticker Data - Major ETFs and Indices
export function generateMockTickers(): TickerData[] {
  const baseData: Omit<TickerData, 'price' | 'change' | 'timestamp'>[] = [
    { symbol: 'SPY', name: 'S&P 500 ETF' },
    { symbol: 'QQQ', name: 'Nasdaq 100 ETF' },
    { symbol: 'VIX', name: 'Volatility Index' },
    { symbol: 'DXY', name: 'US Dollar Index' },
    { symbol: 'USO', name: 'WTI Crude Oil' },
    { symbol: 'GLD', name: 'Gold ETF' },
    { symbol: 'TLT', name: '20+ Year Treasury' },
    { symbol: 'IWM', name: 'Russell 2000 ETF' },
  ];

  return baseData.map(item => ({
    ...item,
    price: Math.random() * 200 + 50 + (item.symbol === 'VIX' ? 10 : 0),
    change: (Math.random() - 0.5) * 4,
    timestamp: Date.now(),
  }));
}

// S&P 500 GICS Sectors Treemap Data
export function generateTreemapData(): TreemapItem[] {
  return [
    {
      name: 'Information Technology',
      value: 8500, // market cap in billions
      change: 1.25,
      children: [
        { name: 'AAPL', value: 2800, change: 1.5 },
        { name: 'MSFT', value: 2600, change: 0.8 },
        { name: 'NVDA', value: 1800, change: 3.2 },
        { name: 'AVGO', value: 800, change: -0.5 },
        { name: 'Others', value: 500, change: 0.3 },
      ],
    },
    {
      name: 'Financials',
      value: 4200,
      change: -0.45,
      children: [
        { name: 'BRK.B', value: 800, change: 0.2 },
        { name: 'JPM', value: 600, change: -0.8 },
        { name: 'V', value: 500, change: 0.5 },
        { name: 'MA', value: 400, change: 0.3 },
        { name: 'Others', value: 1900, change: -0.9 },
      ],
    },
    {
      name: 'Health Care',
      value: 3800,
      change: 0.65,
      children: [
        { name: 'LLY', value: 700, change: 1.2 },
        { name: 'UNH', value: 450, change: -0.3 },
        { name: 'JNJ', value: 380, change: 0.4 },
        { name: 'ABBV', value: 350, change: 0.8 },
        { name: 'Others', value: 1920, change: 0.5 },
      ],
    },
    {
      name: 'Consumer Discretionary',
      value: 3200,
      change: -1.2,
      children: [
        { name: 'AMZN', value: 1200, change: -0.8 },
        { name: 'TSLA', value: 800, change: -2.5 },
        { name: 'HD', value: 350, change: 0.2 },
        { name: 'MCD', value: 200, change: 0.5 },
        { name: 'Others', value: 650, change: -1.0 },
      ],
    },
    {
      name: 'Communication Services',
      value: 2800,
      change: 0.85,
      children: [
        { name: 'GOOGL', value: 1200, change: 1.1 },
        { name: 'META', value: 900, change: 1.5 },
        { name: 'NFLX', value: 350, change: -0.5 },
        { name: 'VZ', value: 200, change: 0.2 },
        { name: 'Others', value: 150, change: 0.3 },
      ],
    },
    {
      name: 'Industrials',
      value: 2400,
      change: 0.35,
      children: [
        { name: 'GE', value: 350, change: 0.8 },
        { name: 'CAT', value: 280, change: 1.2 },
        { name: 'BA', value: 200, change: -0.5 },
        { name: 'RTX', value: 180, change: 0.6 },
        { name: 'Others', value: 1390, change: 0.2 },
      ],
    },
    {
      name: 'Consumer Staples',
      value: 1800,
      change: -0.25,
      children: [
        { name: 'WMT', value: 550, change: 0.3 },
        { name: 'COST', value: 350, change: 0.5 },
        { name: 'PG', value: 380, change: -0.2 },
        { name: 'KO', value: 270, change: -0.4 },
        { name: 'Others', value: 250, change: -0.6 },
      ],
    },
    {
      name: 'Energy',
      value: 1400,
      change: 1.85,
      children: [
        { name: 'XOM', value: 450, change: 2.1 },
        { name: 'CVX', value: 380, change: 1.8 },
        { name: 'COP', value: 150, change: 2.5 },
        { name: 'SLB', value: 120, change: 1.2 },
        { name: 'Others', value: 300, change: 1.0 },
      ],
    },
    {
      name: 'Utilities',
      value: 900,
      change: -0.65,
      children: [
        { name: 'NEE', value: 200, change: -0.5 },
        { name: 'SO', value: 120, change: -0.8 },
        { name: 'DUK', value: 100, change: -0.3 },
        { name: 'Others', value: 480, change: -0.7 },
      ],
    },
    {
      name: 'Real Estate',
      value: 700,
      change: -1.1,
      children: [
        { name: 'AMT', value: 150, change: -1.2 },
        { name: 'PLD', value: 120, change: -0.9 },
        { name: 'CCI', value: 80, change: -1.5 },
        { name: 'Others', value: 350, change: -1.0 },
      ],
    },
    {
      name: 'Materials',
      value: 600,
      change: 0.45,
      children: [
        { name: 'LIN', value: 180, change: 0.6 },
        { name: 'APD', value: 100, change: 0.3 },
        { name: 'SHW', value: 90, change: 0.5 },
        { name: 'Others', value: 230, change: 0.2 },
      ],
    },
  ];
}

// Macro Indicators Data
export function generateMacroData(): MacroIndicator[] {
  return [
    {
      id: 'nfp',
      name: 'Non-Farm Payrolls',
      previous: 256.0,
      consensus: 175.0,
      actual: 143.0,
      unit: 'K',
      releaseDate: '2026-03-06',
    },
    {
      id: 'cpi',
      name: 'CPI YoY',
      previous: 3.4,
      consensus: 3.1,
      actual: 3.2,
      unit: '%',
      releaseDate: '2026-03-12',
    },
    {
      id: 'pce',
      name: 'Core PCE YoY',
      previous: 2.9,
      consensus: 2.6,
      actual: null,
      unit: '%',
      releaseDate: '2026-03-28',
    },
  ];
}

// Polymarket-style Events
export function generatePolymarketData(): PolymarketEvent[] {
  return [
    {
      id: 'recession-2026',
      title: 'US Recession in 2026',
      probability: 42.5,
      volume: 12500000,
      endDate: '2026-12-31',
      trend: [35, 36, 38, 40, 41, 42, 42.5], // Rising trend
    },
    {
      id: 'fed-cuts-2026',
      title: 'Fed Rate Cuts > 3x in 2026',
      probability: 38.2,
      volume: 8900000,
      endDate: '2026-12-31',
      trend: [45, 44, 42, 40, 39, 38.5, 38.2], // Declining trend
    },
    {
      id: 'tariff-china',
      title: 'New China Tariffs > 25%',
      probability: 67.8,
      volume: 5600000,
      endDate: '2026-06-30',
      trend: [55, 58, 62, 65, 66, 67, 67.8], // Strong rising trend
    },
  ];
}

// Geopolitics Narrative Data
export function generateNarrativeData(): Record<string, NarrativeChartData> {
  const timestamps = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  return {
    geoSqueeze: {
      name: 'Geopolitical Squeeze',
      newsHeat: [45, 52, 38, 41, 55, 48, 62, 58, 44, 39, 42, 51, 47, 53, 49, 46, 54, 50, 43, 56, 48, 52, 45, 41, 47, 55, 50, 44, 48, 51],
      assetPrice: [78.5, 79.2, 77.8, 78.1, 80.5, 79.8, 82.3, 81.5, 79.2, 78.5, 78.9, 80.2, 79.5, 80.8, 79.9, 79.4, 80.6, 80.0, 78.8, 81.2, 79.8, 80.5, 79.2, 78.5, 79.3, 80.8, 80.1, 79.2, 79.8, 80.2],
      timestamps,
    },
    fiscalSpillover: {
      name: 'Fiscal Spillover',
      newsHeat: [35, 38, 42, 45, 48, 52, 55, 58, 54, 50, 47, 43, 40, 38, 42, 45, 48, 52, 55, 58, 54, 50, 47, 43, 40, 38, 42, 45, 48, 52],
      assetPrice: [85.2, 85.8, 86.5, 87.2, 87.8, 88.5, 89.2, 90.0, 89.2, 88.5, 87.8, 87.2, 86.5, 86.0, 86.8, 87.5, 88.2, 89.0, 89.8, 90.5, 89.8, 89.0, 88.2, 87.5, 86.8, 86.2, 87.0, 87.8, 88.5, 89.2],
      timestamps,
    },
    liquidityShift: {
      name: 'Liquidity Shift',
      // STRESS TEST: Last 3 days heat < 20 (15, 12, 8) + asset declining = CIRCUIT BREAKER TRIGGERED
      newsHeat: [25, 28, 32, 35, 30, 28, 25, 22, 20, 18, 22, 25, 28, 32, 35, 38, 35, 32, 28, 25, 22, 20, 18, 22, 25, 28, 15, 12, 8, 5],
      assetPrice: [195.5, 196.2, 197.8, 198.5, 197.8, 197.2, 196.5, 195.8, 195.2, 194.8, 195.5, 196.2, 197.0, 198.2, 199.0, 199.8, 199.2, 198.5, 197.5, 196.8, 196.0, 195.5, 195.0, 194.5, 194.0, 193.5, 192.0, 190.5, 188.0, 185.5],
      timestamps,
    },
    deglobalization: {
      name: 'De-globalization',
      newsHeat: [40, 42, 38, 35, 32, 30, 28, 32, 35, 38, 42, 45, 48, 45, 42, 38, 35, 32, 28, 25, 28, 32, 35, 38, 42, 45, 48, 50, 47, 44],
      assetPrice: [420.5, 419.8, 418.2, 417.5, 416.8, 416.2, 415.5, 416.8, 418.2, 419.5, 421.0, 422.5, 424.0, 423.2, 422.0, 420.5, 419.0, 417.8, 416.5, 415.0, 416.0, 417.5, 419.2, 420.8, 422.5, 424.0, 425.5, 426.8, 425.5, 424.2],
      timestamps,
    },
  };
}

// News Feed Data
export function generateNewsData(): NewsItem[] {
  return [
    { id: '1', title: '美军宣布增加中东地区军费开支', timestamp: Date.now() - 1000 * 60 * 5, source: '路透社', tags: ['军费', '中东'] },
    { id: '2', title: '美联储暗示可能在Q3开始降息', timestamp: Date.now() - 1000 * 60 * 15, source: '彭博社', tags: ['降息'] },
    { id: '3', title: '新关税政策将针对半导体行业', timestamp: Date.now() - 1000 * 60 * 30, source: '华尔街日报', tags: ['关税'] },
    { id: '4', title: '以色列与黎巴嫩边境冲突升级', timestamp: Date.now() - 1000 * 60 * 45, source: '半岛电视台', tags: ['冲突', '中东'] },
    { id: '5', title: '美国对华科技制裁名单扩大', timestamp: Date.now() - 1000 * 60 * 60, source: '金融时报', tags: ['制裁'] },
    { id: '6', title: '通胀数据超预期，市场波动加剧', timestamp: Date.now() - 1000 * 60 * 90, source: 'CNBC', tags: ['通胀'] },
    { id: '7', title: '经济学家警告2026年衰退风险上升', timestamp: Date.now() - 1000 * 60 * 120, source: '经济学人', tags: ['衰退'] },
    { id: '8', title: '五角大楼提交新年度国防预算', timestamp: Date.now() - 1000 * 60 * 150, source: '防务新闻', tags: ['军费'] },
  ];
}
