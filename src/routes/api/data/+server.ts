import { json } from '@sveltejs/kit';
import { generateTreemapData, generateMacroData, generatePolymarketData, generateNarrativeData, generateNewsData } from '$lib/mockData';

// Circuit breaker simulation - 20% chance of failure
function shouldFail(): boolean {
  return Math.random() > 0.8;
}

export async function GET({ url }) {
  const type = url.searchParams.get('type');
  
  // Simulate random API failures (20% error rate)
  if (shouldFail()) {
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable', code: 503 }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

  try {
    switch (type) {
      case 'treemap':
        return json({ data: generateTreemapData(), timestamp: Date.now() });
      case 'macro':
        return json({ data: generateMacroData(), timestamp: Date.now() });
      case 'polymarket':
        return json({ data: generatePolymarketData(), timestamp: Date.now() });
      case 'narrative':
        return json({ data: generateNarrativeData(), timestamp: Date.now() });
      case 'news':
        return json({ data: generateNewsData(), timestamp: Date.now() });
      default:
        return json({
          treemap: generateTreemapData(),
          macro: generateMacroData(),
          polymarket: generatePolymarketData(),
          narrative: generateNarrativeData(),
          news: generateNewsData(),
          timestamp: Date.now(),
        });
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 500 }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
