<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { TickerData } from '$lib/types';
  import { formatPrice, formatChange } from '$lib/types';

  let tickers: TickerData[] = [];
  let interval: ReturnType<typeof setInterval>;

  function updateTickers() {
    // Simulate price updates
    tickers = [
      { symbol: 'SPY', name: 'S&P 500', price: 585.42 + (Math.random() - 0.5) * 2, change: 0.85 + (Math.random() - 0.5) * 0.5, timestamp: Date.now() },
      { symbol: 'QQQ', name: 'Nasdaq 100', price: 498.35 + (Math.random() - 0.5) * 1.5, change: 1.12 + (Math.random() - 0.5) * 0.5, timestamp: Date.now() },
      { symbol: 'VIX', name: 'VIX', price: 14.25 + (Math.random() - 0.5) * 0.5, change: -2.35 + (Math.random() - 0.5) * 0.5, timestamp: Date.now() },
      { symbol: 'DXY', name: 'US Dollar', price: 103.85 + (Math.random() - 0.5) * 0.3, change: -0.15 + (Math.random() - 0.5) * 0.2, timestamp: Date.now() },
      { symbol: 'USO', name: 'WTI Oil', price: 78.92 + (Math.random() - 0.5) * 0.8, change: 1.45 + (Math.random() - 0.5) * 0.5, timestamp: Date.now() },
      { symbol: 'GLD', name: 'Gold', price: 215.80 + (Math.random() - 0.5) * 0.5, change: 0.32 + (Math.random() - 0.5) * 0.2, timestamp: Date.now() },
      { symbol: 'TLT', name: 'Treasury 20+', price: 89.45 + (Math.random() - 0.5) * 0.3, change: -0.28 + (Math.random() - 0.5) * 0.2, timestamp: Date.now() },
      { symbol: 'IWM', name: 'Russell 2000', price: 198.75 + (Math.random() - 0.5) * 1, change: 0.65 + (Math.random() - 0.5) * 0.3, timestamp: Date.now() },
    ];
  }

  onMount(() => {
    updateTickers();
    interval = setInterval(updateTickers, 3000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });

  function getChangeColor(change: number): string {
    if (change > 0) return 'text-emerald-400';
    if (change < 0) return 'text-rose-400';
    return 'text-gray-400';
  }

  // Duplicate for seamless scrolling
  $: displayTickers = [...tickers, ...tickers];
</script>

<div class="ticker-wrapper relative overflow-hidden border-y border-gray-800 bg-gray-900/80 py-2">
  <div class="ticker-content flex items-center gap-8">
    {#each displayTickers as ticker}
      <div class="flex shrink-0 items-center gap-2 px-4">
        <span class="text-xs font-bold text-gray-400">{ticker.symbol}</span>
        <span class="text-sm font-semibold text-gray-100">{formatPrice(ticker.price)}</span>
        <span class="text-xs {getChangeColor(ticker.change)}">
          {formatChange(ticker.change)}%
        </span>
      </div>
    {/each}
  </div>
</div>

<style>
  .ticker-wrapper {
    mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
  }
</style>
