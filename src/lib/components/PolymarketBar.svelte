<script lang="ts">
  import type { PolymarketEvent } from '$lib/types';
  import { formatPercent } from '$lib/types';
  import Sparkline from './Sparkline.svelte';

  export let event: PolymarketEvent;

  // Format volume with K/M/B
  $: formattedVolume = event.volume >= 1000000000 
    ? `${(event.volume / 1000000000).toFixed(2)}B`
    : event.volume >= 1000000 
      ? `${(event.volume / 1000000).toFixed(2)}M`
      : `${(event.volume / 1000).toFixed(2)}K`;

  $: probStr = formatPercent(event.probability);

  // Calculate momentum (last value vs first value)
  $: momentum = event.trend && event.trend.length >= 2
    ? event.trend[event.trend.length - 1] - event.trend[0]
    : 0;
  
  $: momentumColor = momentum > 0 ? '#3b82f6' : momentum < 0 ? '#f43f5e' : '#6b7280';
</script>

<div class="rounded-lg border border-gray-800 bg-gray-800/30 p-5">
  <div class="flex items-start justify-between">
    <div class="flex-1">
      <h3 class="font-medium text-gray-200">{event.title}</h3>
      <p class="mt-1 text-xs text-gray-500">截止: {event.endDate} • 成交量: ${formattedVolume}</p>
    </div>
    <div class="ml-4 text-right">
      <div class="text-2xl font-bold text-blue-400">{probStr}%</div>
      <div class="text-xs text-gray-500">概率</div>
    </div>
  </div>

  <!-- Progress Bar + Sparkline Row -->
  <div class="mt-4 flex items-center gap-4">
    <!-- Progress Bar -->
    <div class="flex-1">
      <div class="relative h-3 overflow-hidden rounded-full bg-gray-700">
        <!-- YES side (blue) -->
        <div 
          class="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
          style="width: {event.probability}%"
        ></div>
        <!-- NO side (red) -->
        <div 
          class="absolute right-0 top-0 h-full bg-gradient-to-l from-rose-600 to-rose-400 transition-all duration-500"
          style="width: {100 - event.probability}%"
        ></div>
        <!-- Center divider -->
        <div 
          class="absolute top-0 h-full w-0.5 bg-white/50"
          style="left: {event.probability}%"
        ></div>
      </div>
      <div class="mt-2 flex justify-between text-xs">
        <span class="text-blue-400">YES {probStr}%</span>
        <span class="text-rose-400">NO {formatPercent(100 - event.probability)}%</span>
      </div>
    </div>

    <!-- Sparkline (7-day trend) -->
    {#if event.trend && event.trend.length > 0}
      <div class="flex items-center gap-2 border-l border-gray-700 pl-4">
        <div class="text-right">
          <div class="text-[10px] text-gray-500">7日走势</div>
          <div 
            class="text-xs font-medium"
            style="color: {momentumColor}"
          >
            {momentum >= 0 ? '+' : ''}{formatPercent(momentum)}pp
          </div>
        </div>
        <Sparkline data={event.trend} color={momentumColor} />
      </div>
    {/if}
  </div>

  <!-- Pill Badge for Trend -->
  <div class="mt-4 flex gap-2">
    {#if event.probability > 60}
      <span class="rounded-full bg-blue-900/40 px-2 py-1 text-xs font-bold text-blue-400">高概率</span>
    {:else if event.probability < 40}
      <span class="rounded-full bg-rose-900/40 px-2 py-1 text-xs font-bold text-rose-400">低概率</span>
    {:else}
      <span class="rounded-full bg-amber-900/40 px-2 py-1 text-xs font-bold text-amber-400">不确定</span>
    {/if}
    <span class="rounded-full bg-gray-700/50 px-2 py-1 text-xs text-gray-400">预测市场</span>
  </div>
</div>
