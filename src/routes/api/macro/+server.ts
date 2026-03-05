import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Cache for macro data
interface CacheEntry {
  data: any;
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 45000; // 45 seconds

// Generate dual-track sensitivity data
function generateMacroEvents() {
  const now = new Date();
  const nextFOMC = new Date(now);
  nextFOMC.setDate(nextFOMC.getDate() + 14); // 14 days to next FOMC
  
  return [
    {
      id: 'rate-cut-jun-2026',
      title: 'Jun 2026 Rate Cut',
      probability: 42.5,
      volume: 12500000,
      endDate: '2026-06-18',
      trend: [35, 36, 38, 40, 41, 42, 42.5],
      catalyst: 'FOMC Meeting',
      daysToEvent: 14,
      // Phase 1: Dual-track sensitivity data
      impacts: {
        tactical_1w: [
          // 1W tactical: Bonds most sensitive
          { ticker: 'TLT', sensitivity: 0.92, type: 'bond', iv: 28.5 },
          { ticker: 'TMF', sensitivity: 0.88, type: 'bond', iv: 42.3 },
          { ticker: 'DXY', sensitivity: -0.75, type: 'fx', iv: 18.2 },
          { ticker: 'GLD', sensitivity: 0.65, type: 'commodity', iv: 22.1 },
          { ticker: 'VIX', sensitivity: -0.55, type: 'volatility', iv: 65.4 },
        ],
        strategic_3m: [
          // 3M strategic: Equities catch up
          { ticker: 'XLK', sensitivity: 0.72, type: 'equity', iv: 24.8 },
          { ticker: 'IWM', sensitivity: 0.78, type: 'equity', iv: 28.5 },
          { ticker: 'ARKK', sensitivity: 0.85, type: 'equity', iv: 45.2 },
          { ticker: 'XLF', sensitivity: 0.45, type: 'equity', iv: 22.3 },
          { ticker: 'XLU', sensitivity: 0.38, type: 'equity', iv: 19.5 },
        ],
      },
      // Phase 3: Execution tooltip data
      execution: {
        crowdedness: 'IV 85% 极高分位',
        fundingRisk: '期权链集中 105-110',
        rr: 2.54, // Risk:Reward ratio
        resistance: 105.20,
        support: 92.40,
        invalidation: '核心 PCE 环比 > 0.3%',
        position: 'TLT 看涨期权价差',
      },
    },
    {
      id: 'recession-q3-2026',
      title: 'Q3 2026 Recession',
      probability: 38.2,
      volume: 8900000,
      endDate: '2026-09-30',
      trend: [45, 44, 42, 40, 39, 38.5, 38.2],
      catalyst: 'GDP Report',
      daysToEvent: 89,
      impacts: {
        tactical_1w: [
          { ticker: 'SQQQ', sensitivity: 0.82, type: 'equity', iv: 48.5 },
          { ticker: 'UVXY', sensitivity: 0.78, type: 'volatility', iv: 85.2 },
          { ticker: 'TLT', sensitivity: 0.45, type: 'bond', iv: 25.3 },
          { ticker: 'GLD', sensitivity: 0.42, type: 'commodity', iv: 20.1 },
          { ticker: 'UUP', sensitivity: 0.35, type: 'fx', iv: 15.8 },
        ],
        strategic_3m: [
          { ticker: 'XLP', sensitivity: -0.65, type: 'equity', iv: 18.5 },
          { ticker: 'XLU', sensitivity: -0.42, type: 'equity', iv: 19.2 },
          { ticker: 'XLF', sensitivity: -0.88, type: 'equity', iv: 32.5 },
          { ticker: 'XLE', sensitivity: -0.72, type: 'equity', iv: 35.8 },
          { ticker: 'BITO', sensitivity: -0.55, type: 'crypto', iv: 55.2 },
        ],
      },
      execution: {
        crowdedness: 'VIX 期货升水 15%',
        fundingRisk: '空头拥挤度 78%',
        rr: 1.85,
        resistance: 18.50,
        support: 12.20,
        invalidation: '非农就业 3个月均 > 20万',
        position: 'VIX 看涨日历价差',
      },
    },
    {
      id: 'cpi-accel-jul-2026',
      title: 'Jul CPI Re-acceleration',
      probability: 28.5,
      volume: 5600000,
      endDate: '2026-07-15',
      trend: [22, 24, 26, 28, 28.5, 28.5, 28.5],
      catalyst: 'CPI Release',
      daysToEvent: 42,
      impacts: {
        tactical_1w: [
          { ticker: 'TBT', sensitivity: 0.88, type: 'bond', iv: 38.5 },
          { ticker: 'UUP', sensitivity: 0.72, type: 'fx', iv: 16.5 },
          { ticker: 'GLD', sensitivity: -0.45, type: 'commodity', iv: 22.8 },
          { ticker: 'SPY', sensitivity: -0.82, type: 'equity', iv: 25.6 },
          { ticker: 'QQQ', sensitivity: -0.88, type: 'equity', iv: 28.2 },
        ],
        strategic_3m: [
          { ticker: 'XLRE', sensitivity: -0.92, type: 'equity', iv: 28.5 },
          { ticker: 'XLU', sensitivity: -0.35, type: 'equity', iv: 18.5 },
          { ticker: 'TLT', sensitivity: -0.85, type: 'bond', iv: 26.8 },
          { ticker: 'DXY', sensitivity: 0.68, type: 'fx', iv: 17.2 },
          { ticker: 'DBA', sensitivity: 0.45, type: 'commodity', iv: 22.5 },
        ],
      },
      execution: {
        crowdedness: '债券期货净空 历史极值',
        fundingRisk: '回购利率波动扩大',
        rr: 2.12,
        resistance: 38.80,
        support: 28.50,
        invalidation: 'CPI 同比 < 2.5%',
        position: 'TBT 看涨期权',
      },
    },
  ];
}

// Check if event should be circuit broken
function checkCircuitBreaker(probability: number): boolean {
  return probability < 20;
}

export const GET: RequestHandler = async () => {
  try {
    // Check cache
    const now = Date.now();
    if (cache && (now - cache.timestamp) < CACHE_TTL) {
      return json({
        events: cache.data,
        meta: {
          status: 'cached',
          cachedAt: cache.timestamp,
          age: now - cache.timestamp,
        },
      });
    }

    // Generate fresh data
    const events = generateMacroEvents().map(event => ({
      ...event,
      circuitBroken: checkCircuitBreaker(event.probability),
    }));

    // Update cache
    cache = {
      data: events,
      timestamp: now,
    };

    return json({
      events,
      meta: {
        status: 'fresh',
        generatedAt: now,
      },
    });

  } catch (error) {
    // Fallback to cache on error
    if (cache) {
      return json({
        events: cache.data,
        meta: {
          status: 'cached',
          cachedAt: cache.timestamp,
          error: String(error),
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Failed to generate macro data', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
