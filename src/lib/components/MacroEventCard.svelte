<script lang="ts">
  import type { MacroEvent } from '$lib/types';
  import { formatPercent } from '$lib/types';
  import SensitivityRibbon from './SensitivityRibbon.svelte';
  import Sparkline from './Sparkline.svelte';

  export let event: MacroEvent;

  // Calculate momentum from trend
  $: momentum = event.trend && event.trend.length >= 2
    ? event.trend[event.trend.length - 1] - event.trend[0]
    : 0;
  
  $: momentumColor = momentum > 0 ? '#3b82f6' : momentum < 0 ? '#f43f5e' : '#6b7280';
  $: probStr = formatPercent(event.probability);

  // Format volume
  $: formattedVolume = event.volume >= 1000000000 
    ? `${(event.volume / 1000000000).toFixed(2)}B`
    : event.volume >= 1000000 
      ? `${(event.volume / 1000000000).toFixed(2)}M`
      : `${(event.volume / 1000).toFixed(2)}K`;
</script>

<div 
  class="relative rounded-lg border border-gray-800 bg-gray-800/30 p-4 transition-all duration-300"
  class:opacity-50={event.circuitBroken}
  class:grayscale={event.circuitBroken}
>
  <!-- Circuit Broken Overlay -->
  {#if event.circuitBroken}
    <div class="absolute inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-[1px] rounded-lg z-10">
      <div class="text-center">
        <span class="text-xs font-bold text-gray-500 tracking-wider">逻辑证伪</span>
        <span class="block text-[10px] text-gray-600 mt-1">概率跌破 20% 阈值</span>
      </div>
    </div>
  {/if}

  <!-- Header -->
  <div class="flex items-start justify-between mb-3">
    <div class="flex-1 min-w-0">
      <h3 class="font-semibold text-gray-200 truncate">{event.title}</h3>
      <div class="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
        <span>{event.catalyst}</span>
        <span>•</span>
        <span>{event.daysToEvent}天</span>
        <span>•</span>
        <span>成交 ${formattedVolume}</span>
      </div>
    </div>
    <div class="text-right ml-3">
      <div class="text-2xl font-bold" class:text-blue-400={!event.circuitBroken} class:text-gray-500={event.circuitBroken}>
        {probStr}%
      </div>
      <div class="text-[10px] text-gray-500">概率</div>
    </div>
  </div>

  <!-- Progress Bar + Sparkline -->
  <div class="flex items-center gap-3 mb-4">
    <div class="flex-1">
      <div class="relative h-2 overflow-hidden rounded-full bg-gray-700">
        <div 
          class="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
          style="width: {event.probability}%"
        ></div>
        <div 
          class="absolute right-0 top-0 h-full bg-gradient-to-l from-rose-600 to-rose-400 transition-all duration-500"
          style="width: {100 - event.probability}%"
        ></div>
        <div 
          class="absolute top-0 h-full w-0.5 bg-white/50"
          style="left: {event.probability}%"
        ></div>
      </div>
      <div class="flex justify-between mt-1.5 text-[10px]">
        <span class="text-blue-400">YES {probStr}%</span>
        <span class="text-rose-400">NO {formatPercent(100 - event.probability)}%</span>
      </div>
    </div>
    
    {#if event.trend && event.trend.length > 0}
      <div class="flex items-center gap-1.5 border-l border-gray-700 pl-3">
        <div class="text-right">
          <div class="text-[9px] text-gray-500">7日</div>
          <div 
            class="text-[10px] font-medium"
            style="color: {momentumColor}"
          >
            {momentum >= 0 ? '+' : ''}{formatPercent(momentum)}pp
          </div>
        </div>
        <Sparkline data={event.trend} color={momentumColor} />
      </div>
    {/if}
  </div>

  <!-- Phase 2: Dual-Track Sensitivity Ribbons -->
  <div class="space-y-3 pt-2 border-t border-gray-700/50">
    <SensitivityRibbon 
      items={event.impacts.tactical_1w} 
      label="1W 战术动量"
      circuitBroken={event.circuitBroken}
    />
    <SensitivityRibbon 
      items={event.impacts.strategic_3m} 
      label="3M 战略流动性"
      circuitBroken={event.circuitBroken}
    />
  </div>

  <!-- Execution Summary (Compact) -->
  {#if !event.circuitBroken}
    <div class="mt-3 pt-3 border-t border-gray-700/50 grid grid-cols-2 gap-2 text-[10px]">
      <div class="flex items-center gap-1.5">
        <span class="text-gray-500">拥挤:</span>
        <span class="text-amber-400 truncate">{event.execution.crowdedness}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-gray-500">资金:</span>
        <span class="text-rose-400 truncate">{event.execution.fundingRisk}</span>
      </div>
    </div>
  {/if}

  <!-- Status Badge -->
  <div class="mt-3 flex gap-2">
    {#if event.circuitBroken}
      <span class="rounded-full bg-gray-700 px-2 py-0.5 text-[10px] font-bold text-gray-400">熔断</span>
    {:else if event.probability > 60}
      <span class="rounded-full bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold text-blue-400">高概率</span>
    {:else if event.probability < 40}
      <span class="rounded-full bg-rose-900/40 px-2 py-0.5 text-[10px] font-bold text-rose-400">低概率</span>
    {:else}
      <span class="rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] font-bold text-amber-400">博弈中</span>
    {/if}
    <span class="rounded-full bg-gray-700/50 px-2 py-0.5 text-[10px] text-gray-400">双轨敏感度</span>
  </div>
</div>
