<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import TickerTape from '$lib/components/TickerTape.svelte';
  import SectorTreemap from '$lib/components/SectorTreemap.svelte';
  import SWRStatus from '$lib/components/SWRStatus.svelte';
  import { fetchWithSWR, type SWRCache } from '$lib/swr';
  import { activeSector } from '$lib/stores/activeSector';
  import type { TreemapItem } from '$lib/types';
  import { formatPrice, formatPercent } from '$lib/types';

  let treemapStatus: SWRCache<{ sectors: TreemapItem[] }> = {
    data: null,
    error: null,
    isLoading: true,
    isStale: false,
    lastUpdated: null,
  };

  // Subscribe to active sector
  let currentActiveSector: string | null = null;
  let currentSymbol: string | null = null;
  const unsubscribe = activeSector.subscribe((state) => {
    currentActiveSector = state.sector;
    currentSymbol = state.symbol;
  });

  let refreshInterval: ReturnType<typeof setInterval>;

  async function loadData() {
    treemapStatus = { ...treemapStatus, isLoading: true };
    const result = await fetchWithSWR<{ sectors: TreemapItem[] }>('/api/markets', {
      cacheDuration: 60000,
      retries: 2,
    });
    treemapStatus = result;
  }

  onMount(() => {
    loadData();
    refreshInterval = setInterval(loadData, 10000);
  });

  onDestroy(() => {
    clearInterval(refreshInterval);
    unsubscribe();
  });

  function clearFocus() {
    activeSector.clear();
  }

  // Mock index data with strict precision
  const indexData = {
    spx: { price: 5854.22, change: 0.85 },
    ndx: { price: 18492.35, change: 1.12 },
    rut: { price: 2187.45, change: 0.65 },
    ty10: { price: 4.25, change: -0.03 },
    dji: { price: 42345.67, change: 0.52 },
    gold: { price: 215.80, change: 0.32 },
    oil: { price: 78.92, change: 1.45 },
    vix: { price: 14.25, change: -2.35 },
  };

  // Get drill-down hint text
  $: drillHint = currentActiveSector 
    ? `正在查看 ${currentActiveSector} 内部详情` 
    : '点击板块查看个股详情';
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-100">市场</h1>
      <p class="text-sm text-gray-500">GICS 板块分层监控 • 点击钻取查看个股</p>
    </div>
    <div class="flex items-center gap-4">
      <SWRStatus status={treemapStatus} />
      <div class="flex items-center gap-2">
        <span class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span class="text-xs text-gray-400">交易中</span>
      </div>
    </div>
  </div>

  <!-- Active Sector / Drill-down Hint Alert -->
  {#if currentActiveSector}
    <div class="flex items-center justify-between rounded-lg border border-amber-600/30 bg-amber-900/20 px-4 py-3">
      <div class="flex items-center gap-3">
        <span class="text-amber-400">⭐</span>
        <span class="text-sm text-amber-200">
          {drillHint}
        </span>
        {#if currentSymbol}
          <span class="text-xs text-amber-400/70">
            关注标的: {currentSymbol}
          </span>
        {/if}
      </div>
      <button 
        on:click={clearFocus}
        class="rounded bg-amber-800/50 px-3 py-1 text-xs text-amber-300 hover:bg-amber-800/70 transition-colors"
      >
        返回全景
      </button>
    </div>
  {:else}
    <div class="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/30 px-4 py-2">
      <svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="text-xs text-gray-400">{drillHint}</span>
    </div>
  {/if}

  <!-- Ticker Tape -->
  <TickerTape />

  <!-- Main Content -->
  <div class="grid gap-6">
    <!-- Sector Treemap with Drill-down -->
    <div class="rounded-lg border border-gray-800 bg-gray-800/30">
      <div class="border-b border-gray-800 px-4 py-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-gray-200">S&P 500 板块分层</h2>
            <p class="text-xs text-gray-500">第一层: 11大 GICS 行业 • 第二层: 行业个股</p>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <div class="flex items-center gap-1">
              <span class="h-3 w-3 rounded bg-emerald-500"></span>
              <span class="text-gray-400">上涨</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="h-3 w-3 rounded bg-rose-500"></span>
              <span class="text-gray-400">下跌</span>
            </div>
          </div>
        </div>
      </div>
      <div class="p-4">
        <div class="h-[500px]">
          {#if treemapStatus.data?.sectors}
            <SectorTreemap data={treemapStatus.data.sectors} />
          {:else if treemapStatus.isLoading}
            <div class="flex h-full items-center justify-center">
              <div class="flex flex-col items-center gap-3">
                <div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-blue-500"></div>
                <p class="text-sm text-gray-500">加载板块数据中...</p>
              </div>
            </div>
          {:else if treemapStatus.error && !treemapStatus.data}
            <div class="flex h-full flex-col items-center justify-center gap-3">
              <svg class="h-12 w-12 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p class="text-gray-400">数据加载失败</p>
              <button 
                on:click={loadData}
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                重试
              </button>
            </div>
          {/if}
        </div>
      </div>
      <div class="border-t border-gray-800 px-4 py-2 text-xs text-gray-500">
        第一层: 11大 GICS 行业板块 (面积=行业市值, 颜色=行业均涨跌) • 
        第二层: 点击板块查看行业个股详情
        {#if treemapStatus.isStale && treemapStatus.data}
          <span class="ml-2 text-amber-400">• 连接异常，显示缓存数据</span>
        {/if}
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
        <div class="text-xs text-gray-500">S&P 500</div>
        <div class="mt-1 text-2xl font-bold text-gray-100">{formatPrice(indexData.spx.price)}</div>
        <div class="mt-1 text-xs font-medium" class:text-emerald-400={indexData.spx.change >= 0} class:text-rose-400={indexData.spx.change < 0}>
          {indexData.spx.change >= 0 ? '+' : ''}{formatPercent(indexData.spx.change)}%
        </div>
      </div>
      <div class="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
        <div class="text-xs text-gray-500">Nasdaq</div>
        <div class="mt-1 text-2xl font-bold text-gray-100">{formatPrice(indexData.ndx.price)}</div>
        <div class="mt-1 text-xs font-medium" class:text-emerald-400={indexData.ndx.change >= 0} class:text-rose-400={indexData.ndx.change < 0}>
          {indexData.ndx.change >= 0 ? '+' : ''}{formatPercent(indexData.ndx.change)}%
        </div>
      </div>
      <div class="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
        <div class="text-xs text-gray-500">Dow Jones</div>
        <div class="mt-1 text-2xl font-bold text-gray-100">{formatPrice(indexData.dji.price)}</div>
        <div class="mt-1 text-xs font-medium" class:text-emerald-400={indexData.dji.change >= 0} class:text-rose-400={indexData.dji.change < 0}>
          {indexData.dji.change >= 0 ? '+' : ''}{formatPercent(indexData.dji.change)}%
        </div>
      </div>
      <div class="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
        <div class="text-xs text-gray-500">Russell 2000</div>
        <div class="mt-1 text-2xl font-bold text-gray-100">{formatPrice(indexData.rut.price)}</div>
        <div class="mt-1 text-xs font-medium" class:text-emerald-400={indexData.rut.change >= 0} class:text-rose-400={indexData.rut.change < 0}>
          {indexData.rut.change >= 0 ? '+' : ''}{formatPercent(indexData.rut.change)}%
        </div>
      </div>
      
      <div class="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
        <div class="text-xs text-gray-500">10Y 国债收益率</div>
        <div class="mt-1 text-2xl font-bold text-gray-100">{formatPercent(indexData.ty10.price)}%</div>
        <div class="mt-1 text-xs font-medium" class:text-emerald-400={indexData.ty10.change >= 0} class:text-rose-400={indexData.ty10.change < 0}>
          {indexData.ty10.change >= 0 ? '+' : ''}{formatPercent(indexData.ty10.change)}%
        </div>
      </div>
      <div class="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
        <div class="text-xs text-gray-500">黄金 (GLD)</div>
        <div class="mt-1 text-2xl font-bold text-gray-100">${formatPrice(indexData.gold.price)}</div>
        <div class="mt-1 text-xs font-medium" class:text-emerald-400={indexData.gold.change >= 0} class:text-rose-400={indexData.gold.change < 0}>
          {indexData.gold.change >= 0 ? '+' : ''}{formatPercent(indexData.gold.change)}%
        </div>
      </div>
      <div class="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
        <div class="text-xs text-gray-500">原油 (WTI)</div>
        <div class="mt-1 text-2xl font-bold text-gray-100">${formatPrice(indexData.oil.price)}</div>
        <div class="mt-1 text-xs font-medium" class:text-emerald-400={indexData.oil.change >= 0} class:text-rose-400={indexData.oil.change < 0}>
          {indexData.oil.change >= 0 ? '+' : ''}{formatPercent(indexData.oil.change)}%
        </div>
      </div>
      <div class="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
        <div class="text-xs text-gray-500">VIX 恐慌指数</div>
        <div class="mt-1 text-2xl font-bold text-gray-100">{formatPrice(indexData.vix.price)}</div>
        <div class="mt-1 text-xs font-medium" class:text-emerald-400={indexData.vix.change >= 0} class:text-rose-400={indexData.vix.change < 0}>
          {indexData.vix.change >= 0 ? '+' : ''}{formatPercent(indexData.vix.change)}%
        </div>
      </div>
    </div>
  </div>
</div>
