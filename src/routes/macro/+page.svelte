<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import MacroEventCard from '$lib/components/MacroEventCard.svelte';
  import ExpectationCard from '$lib/components/ExpectationCard.svelte';
  import SWRStatus from '$lib/components/SWRStatus.svelte';
  import { fetchWithSWR, type SWRCache } from '$lib/swr';
  import type { MacroEvent, MacroIndicator } from '$lib/types';
  import { generateMacroData } from '$lib/mockData';

  let eventsStatus: SWRCache<{ events: MacroEvent[] }> = {
    data: null,
    error: null,
    isLoading: true,
    isStale: false,
    lastUpdated: null,
  };

  // Static macro indicators (NFP, CPI, PCE)
  let macroIndicators: MacroIndicator[] = [];

  let refreshInterval: ReturnType<typeof setInterval>;

  async function loadData() {
    // Phase 1: Load from new API
    eventsStatus = { ...eventsStatus, isLoading: true };
    const result = await fetchWithSWR<{ events: MacroEvent[] }>('/api/macro', {
      cacheDuration: 45000,
      retries: 2,
    });
    eventsStatus = result;

    // Static indicators
    macroIndicators = generateMacroData();
  }

  onMount(() => {
    loadData();
    refreshInterval = setInterval(loadData, 20000);
  });

  onDestroy(() => {
    clearInterval(refreshInterval);
  });
</script>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-100">宏观监控</h1>
      <p class="text-sm text-gray-500">双轨敏感度推演 • 战术动量 × 战略流动性</p>
    </div>
    <div class="flex items-center gap-4">
      <SWRStatus status={eventsStatus} />
      <div class="flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-amber-500"></span>
        <span class="text-xs text-gray-400">数据更新: {new Date().toLocaleDateString('zh-CN')}</span>
      </div>
    </div>
  </div>

  <!-- Legend -->
  <div class="flex flex-wrap items-center gap-4 rounded-lg border border-gray-800 bg-gray-800/30 px-4 py-2">
    <span class="text-xs text-gray-400">敏感度轴:</span>
    <div class="flex items-center gap-2">
      <div class="w-8 h-1 rounded bg-gradient-to-r from-rose-500 to-gray-600"></div>
      <span class="text-xs text-gray-500">利空</span>
    </div>
    <div class="flex items-center gap-2">
      <div class="w-4 h-1 rounded bg-gray-600"></div>
      <span class="text-xs text-gray-500">中性</span>
    </div>
    <div class="flex items-center gap-2">
      <div class="w-8 h-1 rounded bg-gradient-to-r from-gray-600 to-emerald-500"></div>
      <span class="text-xs text-gray-500">利好</span>
    </div>
    <span class="ml-auto text-xs text-gray-500">
      Hover Ticker 查看执行推板
    </span>
  </div>

  <!-- Macro Events with Dual-Track Sensitivity (Phase 2 & 3) -->
  <section>
    <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-200">
      <span class="h-4 w-1 rounded-full bg-purple-500"></span>
      预测市场与敏感度推演
      {#if eventsStatus.isStale && eventsStatus.data}
        <span class="ml-2 text-xs font-normal text-amber-400">(缓存)</span>
      {/if}
    </h2>
    
    {#if eventsStatus.data?.events}
      <div class="grid gap-4 lg:grid-cols-3">
        {#each eventsStatus.data.events as event}
          <MacroEventCard {event} />
        {/each}
      </div>
    {:else if eventsStatus.isLoading}
      <div class="grid gap-4 lg:grid-cols-3">
        {#each [1, 2, 3] as i}
          <div class="h-64 animate-pulse rounded-lg border border-gray-800 bg-gray-800/30"></div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- Expectation Gap Section (Legacy) -->
  <section>
    <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-200">
      <span class="h-4 w-1 rounded-full bg-blue-500"></span>
      预期差分析
    </h2>
    <div class="grid gap-4 lg:grid-cols-3">
      {#each macroIndicators as indicator}
        <ExpectationCard {indicator} />
      {/each}
    </div>
    <p class="mt-3 text-xs text-gray-500">
      * 预期差 = 实际值 - 一致预期。正值(绿色)表示超预期，负值(红色)表示低于预期。所有数值严格截断至2位小数。
    </p>
  </section>

  <!-- Summary Stats -->
  <section class="rounded-lg border border-gray-800 bg-gray-800/30 p-6">
    <h3 class="mb-4 font-semibold text-gray-200">宏观环境概览</h3>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="text-center">
        <div class="text-3xl font-bold text-amber-400">3.2%</div>
        <div class="text-xs text-gray-500">当前通胀率 (CPI)</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold text-blue-400">4.25-4.50%</div>
        <div class="text-xs text-gray-500">联邦基金利率</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold text-emerald-400">3.8%</div>
        <div class="text-xs text-gray-500">失业率</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold text-purple-400">42.5%</div>
        <div class="text-xs text-gray-500">2026年6月降息概率</div>
      </div>
    </div>
  </section>
</div>
