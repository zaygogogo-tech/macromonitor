<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import NarrativeChart from '$lib/components/NarrativeChart.svelte';
  import NewsFeed from '$lib/components/NewsFeed.svelte';
  import AINarrativeBrief from '$lib/components/AINarrativeBrief.svelte';
  import SWRStatus from '$lib/components/SWRStatus.svelte';
  import { fetchWithSWR, type SWRCache } from '$lib/swr';
  import type { NarrativeChartData, NewsItem, AISummary } from '$lib/types';

  interface GeopoliticsData {
    narratives: Record<string, NarrativeChartData>;
    news: NewsItem[];
    aiSummary: AISummary;
    meta?: {
      status: string;
      cachedAt?: number;
      generatedAt?: number;
    };
  }

  // Phase 2 & 3: Dynamic narratives store (for sandbox-generated charts)
  const dynamicNarratives = writable<NarrativeChartData[]>([]);

  let dataStatus: SWRCache<GeopoliticsData> = {
    data: null,
    error: null,
    isLoading: true,
    isStale: false,
    lastUpdated: null,
  };

  let refreshInterval: ReturnType<typeof setInterval>;

  // Circuit breaker states
  let circuitStates: Record<string, boolean> = {};
  let webhookAlerts: string[] = [];

  // Phase 2: Sandbox state
  let sandboxPrompt = '';
  let isGenerating = false;
  let dynamicList: NarrativeChartData[] = [];

  // Subscribe to dynamic narratives
  const unsubscribe = dynamicNarratives.subscribe((list) => {
    dynamicList = list;
  });

  async function loadData() {
    dataStatus = { ...dataStatus, isLoading: !dataStatus.data };
    
    const result = await fetchWithSWR<GeopoliticsData>('/api/geopolitics', {
      cacheDuration: 30000,
      retries: 2,
    });
    
    dataStatus = result;

    // Check for circuit breakers in returned data
    if (result.data?.narratives) {
      circuitStates = {};
      webhookAlerts = [];
      
      for (const [key, narrative] of Object.entries(result.data.narratives)) {
        if (narrative.circuitBroken) {
          circuitStates[key] = true;
          webhookAlerts.push(key);
        }
      }
    }
  }

  // Phase 3: Mock LLM generation function
  async function generateNarrative(prompt: string) {
    isGenerating = true;
    
    // Simulate API delay (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Generate mock data based on prompt
    const timestamps = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });
    
    // Create deterministic-ish mock from prompt
    const baseHeat = 30 + (prompt.length * 2) % 40;
    const newsHeat = timestamps.map((_, i) => {
      const trend = i > 25 ? 15 - (i - 25) * 3 : baseHeat + Math.sin(i * 0.3) * 15 + (Math.random() - 0.5) * 10;
      return Math.max(5, Math.min(100, Math.round(trend)));
    });
    
    const basePrice = 100 + (prompt.charCodeAt(0) % 50);
    const assetPrice = timestamps.map((_, i) => {
      const change = newsHeat[i] > baseHeat ? 0.5 : -0.3;
      return Number((basePrice + i * change + (Math.random() - 0.5) * 2).toFixed(2));
    });
    
    // Calculate IV
    const iv = Number((20 + (newsHeat[newsHeat.length - 1] / 100) * 30 + Math.random() * 10).toFixed(2));
    const ivChange = Number(((Math.random() - 0.5) * 6).toFixed(2));
    
    // Determine asset symbol based on keywords
    let assetSymbol = 'SPY';
    let trendSummary = `${prompt}叙事监控中`;
    
    if (prompt.includes('医药') || prompt.includes('医疗')) {
      assetSymbol = 'XBI';
      trendSummary = '生物医药板块受政策影响波动加剧';
    } else if (prompt.includes('芯片') || prompt.includes('半导体')) {
      assetSymbol = 'SOXX';
      trendSummary = '半导体供应链叙事持续发酵';
    } else if (prompt.includes('能源') || prompt.includes('石油')) {
      assetSymbol = 'XLE';
      trendSummary = '能源转型与传统能源博弈';
    } else if (prompt.includes('房地产') || prompt.includes('地产')) {
      assetSymbol = 'XLRE';
      trendSummary = '地产政策预期反复';
    } else if (prompt.includes('消费') || prompt.includes('零售')) {
      assetSymbol = 'XRT';
      trendSummary = '消费复苏预期博弈';
    }
    
    // Check circuit breaker (for Phase 4 testing)
    const recentHeat = newsHeat.slice(-4);
    const recentPrices = assetPrice.slice(-4);
    const lowHeatCount = recentHeat.filter((h) => h < 20).length;
    const priceDeclining = recentPrices[3] < recentPrices[0];
    const circuitBroken = lowHeatCount >= 3 && priceDeclining;
    
    const newNarrative: NarrativeChartData = {
      name: prompt.slice(0, 20) + (prompt.length > 20 ? '...' : ''),
      newsHeat,
      assetPrice,
      timestamps,
      iv,
      ivChange,
      trendSummary,
      circuitBroken,
      assetSymbol,
      isDynamic: true,
      prompt,
    };
    
    dynamicNarratives.update((list) => [...list, newNarrative]);
    isGenerating = false;
    sandboxPrompt = '';
  }

  function handleSandboxSubmit() {
    if (sandboxPrompt.trim()) {
      generateNarrative(sandboxPrompt.trim());
    }
  }

  function getNarrativeLabel(key: string, index: number): string {
    const labels: Record<string, string> = {
      geoSqueeze: 'A. 地缘挤压',
      fiscalSpillover: 'B. 财政溢出',
      liquidityShift: 'C. 流动性转向',
      deglobalization: 'D. 逆全球化',
      aiCapex: 'E. AI 资本开支与基建',
    };
    return labels[key] || `${String.fromCharCode(70 + index)}. ${key}`;
  }

  onMount(() => {
    loadData();
    refreshInterval = setInterval(loadData, 15000);
  });

  onDestroy(() => {
    clearInterval(refreshInterval);
    unsubscribe();
  });
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-100">地缘政治</h1>
      <p class="text-sm text-gray-500">3x2 叙事矩阵、IV 监控、动态推演与风险资金流向</p>
    </div>
    <div class="flex items-center gap-4">
      <SWRStatus status={dataStatus} />
      <div class="flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
        <span class="text-xs text-gray-400">风险 elevated</span>
      </div>
    </div>
  </div>

  <!-- AI Narrative Brief -->
  {#if dataStatus.data?.aiSummary}
    <AINarrativeBrief summary={dataStatus.data.aiSummary} />
  {/if}

  <!-- Webhook Alert Banner -->
  {#if webhookAlerts.length > 0}
    <div class="rounded-lg border border-rose-600/30 bg-rose-900/20 px-4 py-3">
      <div class="flex items-center gap-3">
        <svg class="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <span class="text-sm font-medium text-rose-300">
            脱屏风控预警已触发
          </span>
          <span class="ml-2 text-xs text-rose-400/70">
            {#each webhookAlerts as alert, i}
              {alert}{i < webhookAlerts.length - 1 ? '、' : ''}
            {/each}
            <span class="ml-1">Webhooks dispatched</span>
          </span>
        </div>
      </div>
    </div>
  {/if}

  <!-- Circuit Breaker Legend -->
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-gray-800 bg-gray-800/30 px-4 py-2">
    <span class="text-xs text-gray-400">熔断机制状态:</span>
    <div class="flex items-center gap-2">
      <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
      <span class="text-xs text-gray-300">有效</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="h-2 w-2 rounded-full bg-gray-500"></span>
      <span class="text-xs text-gray-300">熔断</span>
    </div>
    <div class="flex items-center gap-2 ml-4">
      <span class="h-2 w-2 rounded-full bg-purple-500"></span>
      <span class="text-xs text-gray-300">IV 监控</span>
    </div>
    <div class="flex items-center gap-2 ml-4">
      <span class="h-2 w-2 rounded-full bg-cyan-500"></span>
      <span class="text-xs text-gray-300">动态推演</span>
    </div>
    <span class="ml-auto text-xs text-gray-500">
      3x2 矩阵 • {Object.keys(dataStatus.data?.narratives || {}).length + dynamicList.length} 活跃叙事
    </span>
  </div>

  <!-- 3x2 Narrative Matrix with IV (Phase 1: 3-column grid) -->
  {#if dataStatus.data?.narratives}
    <div class="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      <!-- Hard-coded narratives A-E -->
      {#each Object.entries(dataStatus.data.narratives) as [key, data], index}
        <div 
          class="rounded-lg border border-gray-800 bg-gray-800/30 p-4 transition-all duration-500"
          class:opacity-50={data.circuitBroken}
          class:grayscale={data.circuitBroken}
        >
          <div class="mb-2 flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-gray-200">{getNarrativeLabel(key, index)}</h3>
              <p class="text-xs text-gray-500">{data.assetSymbol} • {data.trendSummary}</p>
            </div>
            <div class="flex items-center gap-2">
              {#if data.circuitBroken}
                <span class="rounded-full bg-gray-700 px-2 py-1 text-xs font-bold text-gray-400">熔断</span>
              {:else}
                <span class="rounded-full bg-emerald-900/40 px-2 py-1 text-xs font-bold text-emerald-400">有效</span>
              {/if}
            </div>
          </div>
          <div class="h-[240px]">
            <NarrativeChart 
              {data} 
              circuitBroken={data.circuitBroken || false} 
            />
          </div>
        </div>
      {/each}

      <!-- Dynamic narratives from sandbox (F, G, H...) -->
      {#each dynamicList as data, index}
        <div 
          class="rounded-lg border border-cyan-800/50 bg-gradient-to-br from-cyan-900/10 to-blue-900/10 p-4 transition-all duration-500"
          class:opacity-50={data.circuitBroken}
          class:grayscale={data.circuitBroken}
        >
          <div class="mb-2 flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-cyan-200">{String.fromCharCode(70 + index)}. {data.name}</h3>
              <p class="text-xs text-cyan-400/70">{data.assetSymbol} • {data.trendSummary}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="rounded-full bg-cyan-900/40 px-2 py-1 text-[10px] font-bold text-cyan-400">AI生成</span>
              {#if data.circuitBroken}
                <span class="rounded-full bg-gray-700 px-2 py-1 text-xs font-bold text-gray-400">熔断</span>
              {:else}
                <span class="rounded-full bg-emerald-900/40 px-2 py-1 text-xs font-bold text-emerald-400">有效</span>
              {/if}
            </div>
          </div>
          <div class="h-[240px]">
            <NarrativeChart 
              {data} 
              circuitBroken={data.circuitBroken || false} 
            />
          </div>
          {#if data.prompt}
            <div class="mt-2 text-[10px] text-gray-500 truncate">
              推演输入: {data.prompt}
            </div>
          {/if}
        </div>
      {/each}

      <!-- Phase 2: Sandbox Input Card -->
      <div class="rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/20 p-4 flex flex-col justify-center min-h-[320px]">
        {#if isGenerating}
          <!-- Loading State -->
          <div class="flex flex-col items-center gap-4">
            <div class="relative">
              <div class="h-12 w-12 rounded-full border-4 border-gray-700 border-t-cyan-500 animate-spin"></div>
              <div class="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" style="animation-duration: 1.5s;"></div>
            </div>
            <p class="text-sm text-cyan-400 animate-pulse">正在链接 LLM 提炼资产映射参数...</p>
            <p class="text-xs text-gray-500">解析宏观概念 • 匹配标的资产 • 生成 IV 曲线</p>
          </div>
        {:else}
          <!-- Input State -->
          <div class="text-center space-y-4">
            <div class="inline-flex items-center justify-center h-12 w-12 rounded-full bg-cyan-900/30 text-cyan-400 mb-2">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 class="text-sm font-medium text-gray-300">+ 新建动态叙事推演</h3>
            <p class="text-xs text-gray-500">输入宏观事件，AI 自动生成监控面板</p>
            
            <div class="space-y-3 pt-2">
              <input
                type="text"
                bind:value={sandboxPrompt}
                placeholder="输入宏观事件 (如: 医药反垄断审查)..."
                class="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
                on:keydown={(e) => e.key === 'Enter' && handleSandboxSubmit()}
              />
              <button
                on:click={handleSandboxSubmit}
                disabled={!sandboxPrompt.trim()}
                class="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-cyan-500/20"
              >
                生成监控面板
              </button>
            </div>
            
            <div class="pt-2 text-[10px] text-gray-600">
              示例: "芯片出口管制" | "房地产纾困政策" | "新能源补贴退坡"
            </div>
          </div>
        {/if}
      </div>
    </div>
  {:else if dataStatus.isLoading}
    <div class="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {#each [1, 2, 3, 4, 5, 6] as i}
        <div class="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
          <div class="flex h-[320px] items-center justify-center">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-blue-500"></div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- News Feed Section -->
  <section>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="flex items-center gap-2 text-lg font-semibold text-gray-200">
        <span class="h-4 w-1 rounded-full bg-amber-500"></span>
        智能新闻流
        {#if dataStatus.data?.meta?.status === 'cached'}
          <span class="ml-2 text-xs font-normal text-amber-400">(缓存)</span>
        {/if}
      </h2>
      {#if dataStatus.isStale && dataStatus.data}
        <span class="text-xs text-amber-400">使用缓存数据</span>
      {/if}
    </div>
    {#if dataStatus.data?.news}
      <NewsFeed news={dataStatus.data.news} />
    {:else if dataStatus.isLoading}
      <div class="space-y-3">
        {#each [1, 2, 3] as i}
          <div class="rounded-lg border border-gray-800 bg-gray-800/30 p-3">
            <div class="h-4 w-3/4 animate-pulse rounded bg-gray-700"></div>
            <div class="mt-2 h-3 w-1/4 animate-pulse rounded bg-gray-700"></div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
