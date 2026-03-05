<script lang="ts">
  import type { MacroIndicator } from '$lib/types';
  import { formatPercent } from '$lib/types';

  export let indicator: MacroIndicator;

  // Calculate expectation gap (actual - consensus)
  $: expectationGap = indicator.actual !== null 
    ? Number(indicator.actual - indicator.consensus).toFixed(2)
    : null;

  $: gapNumber = expectationGap !== null ? parseFloat(expectationGap) : 0;
  
  // Format all numbers with strict precision
  $: prevStr = formatPercent(indicator.previous);
  $: consStr = formatPercent(indicator.consensus);
  $: actualStr = indicator.actual !== null ? formatPercent(indicator.actual) : '待公布';
</script>

<div class="rounded-lg border border-gray-800 bg-gray-800/30 p-5">
  <div class="flex items-start justify-between">
    <div>
      <h3 class="font-semibold text-gray-200">{indicator.name}</h3>
      <p class="text-xs text-gray-500">发布日期: {indicator.releaseDate}</p>
    </div>
    {#if expectationGap !== null}
      <div class="flex flex-col items-end">
        <span class="text-xs text-gray-500">预期差</span>
        <span 
          class="text-lg font-bold"
          class:text-emerald-400={gapNumber > 0}
          class:text-rose-400={gapNumber < 0}
          class:text-gray-400={gapNumber === 0}
        >
          {gapNumber > 0 ? '+' : ''}{expectationGap}{indicator.unit}
        </span>
      </div>
    {:else}
      <div class="rounded-full bg-amber-900/40 px-2 py-1 text-xs font-medium text-amber-400">
        待公布
      </div>
    {/if}
  </div>

  <div class="mt-4 grid grid-cols-3 gap-4">
    <div class="rounded bg-gray-900/50 p-3 text-center">
      <div class="text-xs text-gray-500">前值</div>
      <div class="mt-1 text-lg font-semibold text-gray-300">
        {prevStr}{indicator.unit}
      </div>
    </div>
    <div class="rounded bg-gray-900/50 p-3 text-center">
      <div class="text-xs text-gray-500">一致预期</div>
      <div class="mt-1 text-lg font-semibold text-blue-400">
        {consStr}{indicator.unit}
      </div>
    </div>
    <div class="rounded bg-gray-900/50 p-3 text-center">
      <div class="text-xs text-gray-500">实际值</div>
      <div class="mt-1 text-lg font-semibold" class:text-gray-400={indicator.actual === null}>
        {actualStr}{indicator.actual !== null ? indicator.unit : ''}
      </div>
    </div>
  </div>

  <!-- Visualization Bar -->
  <div class="mt-4">
    <div class="flex items-center gap-2 text-xs text-gray-500">
      <span>前值: {prevStr}</span>
      <div class="flex-1">
        <div class="relative h-2 rounded-full bg-gray-700">
          <!-- Previous marker -->
          <div 
            class="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-gray-500"
            style="left: {Math.min(Math.max((indicator.previous / 10) * 100, 0), 100)}%"
          ></div>
          <!-- Consensus marker -->
          <div 
            class="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-blue-500 ring-2 ring-blue-500/30"
            style="left: {Math.min(Math.max((indicator.consensus / 10) * 100, 0), 100)}%"
          ></div>
          <!-- Actual marker (if available) -->
          {#if indicator.actual !== null}
            {@const actualColor = indicator.actual > indicator.consensus ? 'emerald' : indicator.actual < indicator.consensus ? 'rose' : 'gray'}
            <div 
              class="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full ring-2 bg-{actualColor}-500"
              style="left: {Math.min(Math.max((indicator.actual / 10) * 100, 0), 100)}%; --tw-ring-color: rgb({actualColor === 'emerald' ? '16 185 129' : actualColor === 'rose' ? '244 63 94' : '107 114 128'} / 0.3)"
            ></div>
          {/if}
        </div>
      </div>
      <span>范围: 0-10%</span>
    </div>
  </div>
</div>
