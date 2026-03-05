import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Cache for markets data
interface CacheEntry {
  data: any;
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 60000; // 1 minute

// GICS Sector definitions with hierarchical data
function generateGICSData() {
  const sectors = [
    {
      name: 'Information Technology',
      value: 8500,
      change: 1.25,
      children: [
        { name: 'AAPL', value: 2800, change: 1.52 },
        { name: 'MSFT', value: 2600, change: 0.85 },
        { name: 'NVDA', value: 1800, change: 3.24 },
        { name: 'AVGO', value: 800, change: -0.45 },
        { name: 'ORCL', value: 300, change: 0.68 },
        { name: 'ADBE', value: 200, change: -1.23 },
      ],
    },
    {
      name: 'Financials',
      value: 4200,
      change: -0.45,
      children: [
        { name: 'BRK.B', value: 800, change: 0.22 },
        { name: 'JPM', value: 600, change: -0.78 },
        { name: 'V', value: 500, change: 0.55 },
        { name: 'MA', value: 400, change: 0.33 },
        { name: 'BAC', value: 350, change: -1.12 },
        { name: 'WFC', value: 250, change: -0.89 },
        { name: 'GS', value: 200, change: 0.15 },
        { name: 'MS', value: 180, change: -0.34 },
        { name: 'BLK', value: 120, change: 0.67 },
        { name: 'C', value: 100, change: -1.45 },
      ],
    },
    {
      name: 'Health Care',
      value: 3800,
      change: 0.65,
      children: [
        { name: 'LLY', value: 700, change: 1.23 },
        { name: 'UNH', value: 450, change: -0.32 },
        { name: 'JNJ', value: 380, change: 0.44 },
        { name: 'ABBV', value: 350, change: 0.78 },
        { name: 'MRK', value: 280, change: 0.56 },
        { name: 'PFE', value: 220, change: -0.89 },
        { name: 'TMO', value: 180, change: 1.05 },
        { name: 'ABT', value: 140, change: 0.33 },
      ],
    },
    {
      name: 'Consumer Discretionary',
      value: 3200,
      change: -1.20,
      children: [
        { name: 'AMZN', value: 1200, change: -0.85 },
        { name: 'TSLA', value: 800, change: -2.45 },
        { name: 'HD', value: 350, change: 0.22 },
        { name: 'MCD', value: 200, change: 0.55 },
        { name: 'NKE', value: 180, change: -1.12 },
        { name: 'LOW', value: 150, change: 0.38 },
        { name: 'BKNG', value: 120, change: -0.67 },
        { name: 'TJX', value: 100, change: 0.45 },
      ],
    },
    {
      name: 'Communication Services',
      value: 2800,
      change: 0.85,
      children: [
        { name: 'GOOGL', value: 1200, change: 1.12 },
        { name: 'META', value: 900, change: 1.55 },
        { name: 'NFLX', value: 350, change: -0.52 },
        { name: 'VZ', value: 200, change: 0.22 },
        { name: 'T', value: 80, change: -0.35 },
        { name: 'DIS', value: 70, change: 0.68 },
      ],
    },
    {
      name: 'Industrials',
      value: 2400,
      change: 0.35,
      children: [
        { name: 'GE', value: 350, change: 0.82 },
        { name: 'CAT', value: 280, change: 1.25 },
        { name: 'BA', value: 200, change: -0.55 },
        { name: 'RTX', value: 180, change: 0.65 },
        { name: 'LMT', value: 150, change: 0.78 },
        { name: 'HON', value: 140, change: 0.32 },
        { name: 'UNP', value: 130, change: -0.18 },
        { name: 'UPS', value: 120, change: 0.45 },
        { name: 'NOC', value: 100, change: 1.12 },
        { name: 'GD', value: 90, change: 0.55 },
        { name: 'TDG', value: 80, change: 0.89 },
        { name: 'ITW', value: 70, change: 0.23 },
      ],
    },
    {
      name: 'Consumer Staples',
      value: 1800,
      change: -0.25,
      children: [
        { name: 'WMT', value: 550, change: 0.33 },
        { name: 'COST', value: 350, change: 0.55 },
        { name: 'PG', value: 380, change: -0.22 },
        { name: 'KO', value: 270, change: -0.44 },
        { name: 'PEP', value: 180, change: 0.15 },
        { name: 'PM', value: 120, change: -0.68 },
      ],
    },
    {
      name: 'Energy',
      value: 1400,
      change: 1.85,
      children: [
        { name: 'XOM', value: 450, change: 2.15 },
        { name: 'CVX', value: 380, change: 1.85 },
        { name: 'COP', value: 150, change: 2.55 },
        { name: 'SLB', value: 120, change: 1.25 },
        { name: 'EOG', value: 100, change: 1.85 },
        { name: 'OXY', value: 80, change: 2.05 },
        { name: 'MPC', value: 70, change: 1.45 },
        { name: 'VLO', value: 50, change: 1.65 },
      ],
    },
    {
      name: 'Utilities',
      value: 900,
      change: -0.65,
      children: [
        { name: 'NEE', value: 200, change: -0.55 },
        { name: 'SO', value: 120, change: -0.85 },
        { name: 'DUK', value: 100, change: -0.32 },
        { name: 'AEP', value: 80, change: -0.68 },
        { name: 'EXC', value: 70, change: -0.45 },
        { name: 'XEL', value: 60, change: -0.78 },
        { name: 'ED', value: 50, change: -0.22 },
        { name: 'WEC', value: 45, change: -0.55 },
      ],
    },
    {
      name: 'Real Estate',
      value: 700,
      change: -1.10,
      children: [
        { name: 'AMT', value: 150, change: -1.25 },
        { name: 'PLD', value: 120, change: -0.95 },
        { name: 'CCI', value: 80, change: -1.55 },
        { name: 'EQIX', value: 70, change: -0.85 },
        { name: 'PSA', value: 60, change: -1.05 },
        { name: 'O', value: 50, change: -0.75 },
        { name: 'WELL', value: 45, change: -1.15 },
        { name: 'DLR', value: 40, change: -0.95 },
      ],
    },
    {
      name: 'Materials',
      value: 600,
      change: 0.45,
      children: [
        { name: 'LIN', value: 180, change: 0.65 },
        { name: 'APD', value: 100, change: 0.35 },
        { name: 'SHW', value: 90, change: 0.55 },
        { name: 'FCX', value: 80, change: 1.25 },
        { name: 'NEM', value: 70, change: -0.45 },
        { name: 'ECL', value: 40, change: 0.25 },
      ],
    },
  ];

  // Apply strict precision to all values
  return sectors.map(sector => ({
    ...sector,
    value: Number(sector.value.toFixed(2)),
    change: Number(sector.change.toFixed(2)),
    children: sector.children?.map(child => ({
      ...child,
      value: Number(child.value.toFixed(2)),
      change: Number(child.change.toFixed(2)),
    })),
  }));
}

export const GET: RequestHandler = async () => {
  try {
    // Check cache
    const now = Date.now();
    if (cache && (now - cache.timestamp) < CACHE_TTL) {
      return json({
        sectors: cache.data,
        meta: {
          status: 'cached',
          cachedAt: cache.timestamp,
          age: now - cache.timestamp,
        },
      });
    }

    // Generate fresh data
    const sectors = generateGICSData();

    // Update cache
    cache = {
      data: sectors,
      timestamp: now,
    };

    return json({
      sectors,
      meta: {
        status: 'fresh',
        generatedAt: now,
      },
    });

  } catch (error) {
    // Fallback to cache on error
    if (cache) {
      return json({
        sectors: cache.data,
        meta: {
          status: 'cached',
          cachedAt: cache.timestamp,
          error: String(error),
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Failed to generate markets data', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
