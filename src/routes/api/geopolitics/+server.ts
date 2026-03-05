import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Global cache storage
interface CacheEntry {
  data: any;
  timestamp: number;
  status: 'fresh' | 'cached';
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 30000; // 30 seconds

// IV calculation: volatility increases with news heat spikes, decreases when heat fades but price holds (IV Crush)
function calculateIV(newsHeat: number[], assetPrice: number[]): number {
  const recentHeat = newsHeat.slice(-3);
  const recentPrices = assetPrice.slice(-3);
  
  const heatAvg = recentHeat.reduce((a, b) => a + b, 0) / recentHeat.length;
  const priceVolatility = Math.abs(recentPrices[2] - recentPrices[0]) / recentPrices[0] * 100;
  
  // Base IV around 20-40%
  let iv = 25;
  
  // Heat spike increases IV
  if (heatAvg > 50) iv += 15;
  else if (heatAvg > 30) iv += 8;
  
  // Price volatility adds to IV
  iv += priceVolatility * 2;
  
  // IV Crush: if heat is fading but price stable, IV drops
  const heatTrend = recentHeat[2] - recentHeat[0];
  if (heatTrend < -10 && priceVolatility < 2) {
    iv -= 10; // IV Crush
  }
  
  return Number(Math.max(10, Math.min(80, iv)).toFixed(2));
}

// Generate trend summary based on heat and price patterns
function generateTrendSummary(name: string, newsHeat: number[], assetPrice: number[]): string {
  const recentHeat = newsHeat.slice(-5);
  const recentPrices = assetPrice.slice(-5);
  const heatTrend = recentHeat[4] - recentHeat[0];
  const priceTrend = recentPrices[4] - recentPrices[0];
  
  if (heatTrend > 10 && priceTrend > 0) return `${name}叙事强化，资金持续流入`;
  if (heatTrend > 10 && priceTrend < 0) return `${name}出现分歧，关注证伪风险`;
  if (heatTrend < -10 && priceTrend > 0) return `${name}热度退潮但价格坚挺，警惕IV回落`;
  if (heatTrend < -10 && priceTrend < 0) return `${name}叙事瓦解，资金撤离`;
  return `${name}维持震荡，等待方向选择`;
}

// Check circuit breaker condition
function checkCircuitBreaker(newsHeat: number[], assetPrice: number[]): boolean {
  const recentHeat = newsHeat.slice(-4);
  const recentPrices = assetPrice.slice(-4);
  
  let lowHeatCount = 0;
  for (let i = 1; i < recentHeat.length; i++) {
    if (recentHeat[i] < 20) lowHeatCount++;
    else lowHeatCount = 0;
    if (lowHeatCount >= 3) break;
  }
  
  const priceDeclining = recentPrices[recentPrices.length - 1] < recentPrices[0];
  return lowHeatCount >= 3 && priceDeclining;
}

// Webhook alert function
async function sendWebhookAlert(type: string, message: string, data: any) {
  const webhookUrl = process.env.WEBHOOK_URL || 'https://httpbin.org/post'; // Default test endpoint
  
  const payload = {
    alert_type: type,
    message: message,
    timestamp: new Date().toISOString(),
    data: data,
    source: 'macromonitor-v4',
  };
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error(`[WEBHOOK FAILED]: ${response.status} ${response.statusText}`);
    } else {
      console.log(`[WEBHOOK SENT]: ${type} alert delivered`);
    }
  } catch (error) {
    console.error(`[WEBHOOK ERROR]: ${error}`);
  }
}

// Generate enhanced narrative data with IV
function generateEnhancedNarrativeData() {
  const timestamps = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const narratives = {
    geoSqueeze: {
      name: 'Geopolitical Squeeze',
      newsHeat: [45, 52, 38, 41, 55, 48, 62, 58, 44, 39, 42, 51, 47, 53, 49, 46, 54, 50, 43, 56, 48, 52, 45, 41, 47, 55, 50, 44, 48, 51],
      assetPrice: [78.5, 79.2, 77.8, 78.1, 80.5, 79.8, 82.3, 81.5, 79.2, 78.5, 78.9, 80.2, 79.5, 80.8, 79.9, 79.4, 80.6, 80.0, 78.8, 81.2, 79.8, 80.5, 79.2, 78.5, 79.3, 80.8, 80.1, 79.2, 79.8, 80.2],
    },
    fiscalSpillover: {
      name: 'Fiscal Spillover',
      newsHeat: [35, 38, 42, 45, 48, 52, 55, 58, 54, 50, 47, 43, 40, 38, 42, 45, 48, 52, 55, 58, 54, 50, 47, 43, 40, 38, 42, 45, 48, 52],
      assetPrice: [85.2, 85.8, 86.5, 87.2, 87.8, 88.5, 89.2, 90.0, 89.2, 88.5, 87.8, 87.2, 86.5, 86.0, 86.8, 87.5, 88.2, 89.0, 89.8, 90.5, 89.8, 89.0, 88.2, 87.5, 86.8, 86.2, 87.0, 87.8, 88.5, 89.2],
    },
    liquidityShift: {
      name: 'Liquidity Shift',
      // CIRCUIT BREAKER TEST DATA: Last 4 days heat declining < 20, price falling
      newsHeat: [25, 28, 32, 35, 30, 28, 25, 22, 20, 18, 22, 25, 28, 32, 35, 38, 35, 32, 28, 25, 22, 20, 18, 22, 25, 28, 15, 12, 8, 5],
      assetPrice: [195.5, 196.2, 197.8, 198.5, 197.8, 197.2, 196.5, 195.8, 195.2, 194.8, 195.5, 196.2, 197.0, 198.2, 199.0, 199.8, 199.2, 198.5, 197.5, 196.8, 196.0, 195.5, 195.0, 194.5, 194.0, 193.5, 192.0, 190.5, 188.0, 185.5],
    },
    deglobalization: {
      name: 'De-globalization',
      newsHeat: [40, 42, 38, 35, 32, 30, 28, 32, 35, 38, 42, 45, 48, 45, 42, 38, 35, 32, 28, 25, 28, 32, 35, 38, 42, 45, 48, 50, 47, 44],
      assetPrice: [420.5, 419.8, 418.2, 417.5, 416.8, 416.2, 415.5, 416.8, 418.2, 419.5, 421.0, 422.5, 424.0, 423.2, 422.0, 420.5, 419.0, 417.8, 416.5, 415.0, 416.0, 417.5, 419.2, 420.8, 422.5, 424.0, 425.5, 426.8, 425.5, 424.2],
    },
    // Phase 1: New 5th narrative - AI CapEx & Infra
    aiCapex: {
      name: 'AI CapEx & Infra',
      newsHeat: [55, 58, 62, 68, 72, 75, 78, 82, 85, 88, 86, 84, 82, 80, 78, 76, 74, 72, 70, 68, 66, 64, 62, 60, 58, 56, 54, 52, 50, 48],
      assetPrice: [65.2, 66.5, 68.2, 70.5, 72.8, 75.2, 78.5, 82.0, 85.5, 88.2, 87.5, 86.8, 85.2, 84.5, 83.8, 82.5, 81.2, 80.5, 79.8, 78.5, 77.2, 76.5, 75.8, 74.5, 73.2, 72.5, 71.8, 70.5, 69.2, 68.5],
    },
  };

  const result: Record<string, any> = {};
  const circuitBreakerTriggered: string[] = [];

  for (const [key, data] of Object.entries(narratives)) {
    const iv = calculateIV(data.newsHeat, data.assetPrice);
    const trendSummary = generateTrendSummary(data.name, data.newsHeat, data.assetPrice);
    const circuitBroken = checkCircuitBreaker(data.newsHeat, data.assetPrice);
    
    if (circuitBroken) {
      circuitBreakerTriggered.push(key);
    }

    result[key] = {
      ...data,
      timestamps,
      iv,
      ivChange: Number((Math.random() * 4 - 2).toFixed(2)), // Simulated IV change
      trendSummary,
      circuitBroken,
      assetSymbol: key === 'geoSqueeze' ? 'USO' : key === 'fiscalSpillover' ? 'ITA' : key === 'liquidityShift' ? 'IWM' : key === 'aiCapex' ? 'XLU' : 'SOXX',
    };
  }

  // Send webhook alerts for circuit breakers
  for (const key of circuitBreakerTriggered) {
    const narrative = result[key];
    console.log(`[SECURITY ALERT]: Narrative ${key} Invalidated. Triggering Webhook...`);
    
    // Fire and forget webhook
    sendWebhookAlert(
      'CIRCUIT_BREAKER',
      `叙事 "${narrative.name}" 已触发熔断机制`,
      {
        narrative: key,
        name: narrative.name,
        lastHeat: narrative.newsHeat[narrative.newsHeat.length - 1],
        lastPrice: narrative.assetPrice[narrative.assetPrice.length - 1],
        iv: narrative.iv,
      }
    );
  }

  return result;
}

// Generate news with IV impact tags
function generateEnhancedNews() {
  return [
    { id: '1', title: '美军宣布增加中东地区军费开支', timestamp: Date.now() - 1000 * 60 * 5, source: '路透社', tags: ['军费', '中东'], ivImpact: 'high' },
    { id: '2', title: '美联储暗示可能在Q3开始降息', timestamp: Date.now() - 1000 * 60 * 15, source: '彭博社', tags: ['降息'], ivImpact: 'medium' },
    { id: '3', title: '新关税政策将针对半导体行业', timestamp: Date.now() - 1000 * 60 * 30, source: '华尔街日报', tags: ['关税'], ivImpact: 'high' },
    { id: '4', title: '以色列与黎巴嫩边境冲突升级', timestamp: Date.now() - 1000 * 60 * 45, source: '半岛电视台', tags: ['冲突', '中东'], ivImpact: 'high' },
    { id: '5', title: '美国对华科技制裁名单扩大', timestamp: Date.now() - 1000 * 60 * 60, source: '金融时报', tags: ['制裁'], ivImpact: 'medium' },
    { id: '6', title: '通胀数据超预期，市场波动加剧', timestamp: Date.now() - 1000 * 60 * 90, source: 'CNBC', tags: ['通胀'], ivImpact: 'high' },
    { id: '7', title: '经济学家警告2026年衰退风险上升', timestamp: Date.now() - 1000 * 60 * 120, source: '经济学人', tags: ['衰退'], ivImpact: 'medium' },
    { id: '8', title: '五角大楼提交新年度国防预算', timestamp: Date.now() - 1000 * 60 * 150, source: '防务新闻', tags: ['军费'], ivImpact: 'low' },
  ];
}

// Generate AI narrative summary
function generateAINarrative(narratives: Record<string, any>, news: any[]) {
  // Find dominant narrative (highest average heat)
  const heatAvgs = Object.entries(narratives).map(([key, data]) => ({
    key,
    name: data.name,
    avgHeat: data.newsHeat.slice(-5).reduce((a: number, b: number) => a + b, 0) / 5,
    iv: data.iv,
  }));
  
  const dominant = heatAvgs.sort((a, b) => b.avgHeat - a.avgHeat)[0];
  
  // Find most frequent tag
  const tagCounts: Record<string, number> = {};
  news.forEach(n => n.tags.forEach((t: string) => tagCounts[t] = (tagCounts[t] || 0) + 1));
  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '宏观';
  
  // Check for IV crush risk
  const ivCrushRisk = Object.values(narratives).some((n: any) => 
    n.newsHeat[n.newsHeat.length - 1] > 40 && n.iv < 20
  );
  
  const ivWarning = ivCrushRisk ? '注意 IV Crush 暗示的定价回落风险。' : '';
  
  return {
    summary: `当前${dominant.name}叙事占据主导，资金在${topTag}板块形成拥挤，${ivWarning}IV 中枢位于 ${dominant.iv.toFixed(2)}%。`,
    dominantNarrative: dominant.key,
    confidence: Number((0.7 + Math.random() * 0.25).toFixed(2)),
    generatedAt: Date.now(),
  };
}

export const GET: RequestHandler = async () => {
  try {
    // Check cache
    const now = Date.now();
    if (cache && (now - cache.timestamp) < CACHE_TTL) {
      return json({
        ...cache.data,
        meta: {
          status: 'cached',
          cachedAt: cache.timestamp,
          age: now - cache.timestamp,
        },
      });
    }

    // Generate fresh data
    const narratives = generateEnhancedNarrativeData();
    const news = generateEnhancedNews();
    const aiSummary = generateAINarrative(narratives, news);

    const responseData = {
      narratives,
      news,
      aiSummary,
      serverTime: now,
    };

    // Update cache
    cache = {
      data: responseData,
      timestamp: now,
      status: 'fresh',
    };

    return json({
      ...responseData,
      meta: {
        status: 'fresh',
        generatedAt: now,
      },
    });

  } catch (error) {
    // Fallback to cache on error
    if (cache) {
      return json({
        ...cache.data,
        meta: {
          status: 'cached',
          cachedAt: cache.timestamp,
          error: String(error),
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Failed to generate data', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
