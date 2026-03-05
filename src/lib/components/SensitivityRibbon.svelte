<script lang="ts">
  import type { SensitivityItem } from '$lib/types';
  import { formatPercent } from '$lib/types';

  export let items: SensitivityItem[] = [];
  export let label: string = '';
  export let circuitBroken: boolean = false;

  // Phase 1: Smart density control - show top 4 by absolute sensitivity
  $: displayItems = items
    .slice() // copy
    .sort((a, b) => Math.abs(b.sensitivity) - Math.abs(a.sensitivity)) // sort by impact
    .slice(0, 4); // take top 4

  $: hiddenCount = items.length - displayItems.length;

  // Phase 2: Tooltip state
  let hoveredItem: SensitivityItem | null = null;
  let tooltipX = 0;
  let showAllModal = false;
  let ribbonEl: HTMLElement;

  function handleMouseEnter(item: SensitivityItem, event: MouseEvent) {
    hoveredItem = item;
    const rect = ribbonEl.getBoundingClientRect();
    tooltipX = event.clientX - rect.left;
  }

  function handleMouseMove(event: MouseEvent) {
    if (!ribbonEl) return;
    const rect = ribbonEl.getBoundingClientRect();
    tooltipX = event.clientX - rect.left;
  }

  function handleMouseLeave() {
    hoveredItem = null;
  }

  // Calculate position on the ribbon: -1 -> 0%, 0 -> 50%, +1 -> 100%
  function getPosition(sensitivity: number): string {
    const pct = ((sensitivity + 1) / 2) * 100;
    // Keep within bounds (5% - 95%) to avoid edge clipping
    return `${Math.max(5, Math.min(95, pct))}%`;
  }

  // Get color for sensitivity value
  function getSensitivityColor(sensitivity: number): string {
    if (sensitivity > 0.7) return 'bg-emerald-400 shadow-emerald-400/50';
    if (sensitivity > 0.3) return 'bg-emerald-500';
    if (sensitivity > 0) return 'bg-emerald-600';
    if (sensitivity < -0.7) return 'bg-rose-400 shadow-rose-400/50';
    if (sensitivity < -0.3) return 'bg-rose-500';
    if (sensitivity < 0) return 'bg-rose-600';
    return 'bg-gray-500';
  }

  // Get glow intensity based on sensitivity magnitude
  function getGlowClass(sensitivity: number): string {
    const abs = Math.abs(sensitivity);
    if (abs > 0.8) return 'shadow-lg';
    if (abs > 0.5) return 'shadow-md';
    return '';
  }
</script>

<div 
  bind:this={ribbonEl}
  class="relative w-full py-3"
  class:opacity-40={circuitBroken}
  class:grayscale={circuitBroken}
>
  <!-- Header with Label and Count -->
  <div class="flex justify-between items-center mb-2">
    <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</span>
    <div class="flex items-center gap-2">
      {#if hiddenCount > 0}
        <button 
          class="text-[9px] text-gray-500 hover:text-gray-300 transition-colors"
          on:click={() => showAllModal = !showAllModal}
        >
          +{hiddenCount} 更多
        </button>
      {/if}
      <div class="flex items-center gap-1 text-[9px] text-gray-600">
        <span class="text-rose-400">-1.0</span>
        <span class="text-gray-500">|</span>
        <span class="text-gray-400">0</span>
        <span class="text-gray-500">|</span>
        <span class="text-emerald-400">+1.0</span>
      </div>
    </div>
  </div>

  <!-- Ribbon Background -->
  <div class="relative h-2 w-full rounded-full bg-gradient-to-r from-rose-500 via-gray-600 to-emerald-500">
    <!-- Center marker -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 bg-gray-300"></div>
    
    <!-- Ticker Nodes - Phase 1: Only top 4, no numeric labels to avoid clutter -->
    {#each displayItems as item}
      {@const position = getPosition(item.sensitivity)}
      
      <button
        type="button"
        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group focus:outline-none"
        style="left: {position};"
        on:mouseenter={(e) => handleMouseEnter(item, e)}
        on:mousemove={handleMouseMove}
        on:mouseleave={handleMouseLeave}
        aria-label="{item.ticker} 敏感度 {item.sensitivity > 0 ? '+' : ''}{formatPercent(item.sensitivity)}"
      >
        <!-- Node Dot with glow for high sensitivity -->
        <div class="relative">
          <div class="w-2.5 h-2.5 rounded-full {getSensitivityColor(item.sensitivity)} ring-2 ring-gray-900 group-hover:ring-white transition-all duration-200 {getGlowClass(item.sensitivity)}"></div>
          
          <!-- Vertical guide line -->
          <div class="absolute left-1/2 -translate-x-1/2 w-px h-3 -top-3.5 bg-gray-600/50 group-hover:bg-gray-400 transition-colors"></div>
        </div>
        
        <!-- Phase 2: Compact label - only ticker, no number -->
        <div class="absolute left-1/2 -translate-x-1/2 -top-5 whitespace-nowrap opacity-70 group-hover:opacity-100 transition-opacity">
          <span class="text-[10px] font-bold text-gray-300 group-hover:text-white transition-colors">{item.ticker}</span>
        </div>
      </button>
    {/each}
  </div>

  <!-- Phase 2: Expanded List Modal (when "+X more" clicked) -->
  {#if showAllModal && !circuitBroken}
    <div class="absolute z-40 right-0 top-6 w-48 p-2 rounded-lg border border-gray-700 bg-gray-800/95 backdrop-blur shadow-xl">
      <div class="text-[10px] text-gray-400 mb-2 pb-1 border-b border-gray-700">全部标的 ({items.length})</div>
      <div class="space-y-1 max-h-32 overflow-y-auto">
        {#each items.sort((a, b) => b.sensitivity - a.sensitivity) as item}
          <div class="flex items-center justify-between text-[10px]">
            <span class="text-gray-300">{item.ticker}</span>
            <span class={item.sensitivity > 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {item.sensitivity > 0 ? '+' : ''}{formatPercent(item.sensitivity)}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Phase 3: Execution Tooltip (appears on hover) -->
  {#if hoveredItem && !circuitBroken}
    <div 
      class="absolute z-50 w-48 p-2.5 rounded-lg border border-gray-700 bg-gray-900/95 backdrop-blur shadow-2xl pointer-events-none"
      style="left: {Math.min(Math.max(tooltipX - 96, 0), (ribbonEl?.clientWidth || 200) - 192)}px; top: -110px;"
    >
      <!-- Ticker & Direction -->
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-sm font-bold text-white">{hoveredItem.ticker}</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded {hoveredItem.sensitivity > 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'}">
          {hoveredItem.sensitivity > 0 ? '看多' : '看空'}
        </span>
      </div>
      
      <!-- Key Metrics -->
      <div class="grid grid-cols-2 gap-2 mb-2 text-[10px]">
        <div class="bg-gray-800/50 rounded px-1.5 py-1">
          <span class="text-gray-500 block">敏感度</span>
          <span class="font-mono {hoveredItem.sensitivity > 0 ? 'text-emerald-400' : 'text-rose-400'}">
            {hoveredItem.sensitivity > 0 ? '+' : ''}{formatPercent(hoveredItem.sensitivity)}
          </span>
        </div>
        <div class="bg-gray-800/50 rounded px-1.5 py-1">
          <span class="text-gray-500 block">IV</span>
          <span class="font-mono text-purple-400">{hoveredItem.iv.toFixed(1)}%</span>
        </div>
      </div>
      
      <!-- Compact Execution Data -->
      <div class="space-y-1 border-t border-gray-700/50 pt-1.5">
        <div class="flex justify-between text-[9px]">
          <span class="text-gray-500">R:R</span>
          <span class="font-mono text-amber-400">2.54</span>
        </div>
        <div class="flex justify-between text-[9px]">
          <span class="text-gray-500">阻力</span>
          <span class="font-mono text-rose-400">$105.20</span>
        </div>
        <div class="flex justify-between text-[9px]">
          <span class="text-gray-500">支撑</span>
          <span class="font-mono text-emerald-400">$92.40</span>
        </div>
        <div class="mt-1.5 p-1 rounded bg-rose-900/20 border border-rose-800/30">
          <span class="text-[9px] text-rose-400 block">证伪: PCE环比&gt;0.3%</span>
        </div>
      </div>
    </div>
  {/if}
</div>
