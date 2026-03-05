<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as echarts from 'echarts';
  import type { NarrativeChartData } from '$lib/types';
  import { formatPercent } from '$lib/types';

  export let data: NarrativeChartData;
  export let circuitBroken: boolean = false;

  let chartContainer: HTMLDivElement;
  let chart: echarts.ECharts | null = null;

  // IV Crush detection: high heat but declining IV
  $: ivCrushRisk = data.iv !== undefined && 
    data.newsHeat[data.newsHeat.length - 1] > 40 && 
    data.iv < 25 && 
    data.ivChange !== undefined && 
    data.ivChange < -2;

  function initChart() {
    if (!chartContainer) return;

    chart = echarts.init(chartContainer, 'dark', {
      renderer: 'canvas',
    });

    // Calculate min/max for IV axis normalization
    const ivMin = data.iv ? Math.max(0, data.iv - 30) : 0;
    const ivMax = data.iv ? Math.min(100, data.iv + 30) : 100;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: {
        text: data.name,
        left: 'center',
        top: 8,
        textStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          color: circuitBroken ? '#6b7280' : '#f1f5f9',
        },
      },
      grid: {
        left: 45,
        right: 45,
        top: 50,
        bottom: 30,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f1f5f9', fontSize: 10 },
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#6b7280' },
        },
        formatter: (params: any) => {
          let result = `<div class="font-medium">${params[0].axisValue}</div>`;
          params.forEach((p: any) => {
            if (p.seriesName === 'News Heat') {
              result += `<div class="text-xs text-amber-400">热度: ${p.value}</div>`;
            } else if (p.seriesName === 'Asset Price') {
              result += `<div class="text-xs text-blue-400">价格: ${Number(p.value).toFixed(2)}</div>`;
            } else if (p.seriesName === 'IV') {
              result += `<div class="text-xs text-purple-400">IV: ${Number(p.value).toFixed(2)}%</div>`;
            }
          });
          if (data.iv !== undefined) {
            result += `<div class="mt-1 text-[10px] text-gray-500">IV: ${data.iv.toFixed(2)}% (${data.ivChange && data.ivChange > 0 ? '+' : ''}${data.ivChange?.toFixed(2) || 0})</div>`;
          }
          return result;
        },
      },
      xAxis: {
        type: 'category',
        data: data.timestamps.slice(-14),
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#6b7280', 
          fontSize: 9,
          rotate: 45,
          formatter: (value: string) => value.slice(5),
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '热度',
          position: 'left',
          axisLine: { show: false },
          axisLabel: { color: '#6b7280', fontSize: 9 },
          splitLine: { lineStyle: { color: '#1f2937' } },
          nameTextStyle: { color: '#6b7280', fontSize: 9 },
          max: 100,
        },
        {
          type: 'value',
          name: '资产',
          position: 'right',
          axisLine: { show: false },
          axisLabel: { color: '#6b7280', fontSize: 9 },
          splitLine: { show: false },
          nameTextStyle: { color: '#6b7280', fontSize: 9 },
        },
        {
          type: 'value',
          name: 'IV',
          position: 'right',
          offset: 40,
          axisLine: { show: false },
          axisLabel: { 
            color: '#a855f7', 
            fontSize: 8,
            formatter: '{value}%',
          },
          splitLine: { show: false },
          nameTextStyle: { color: '#a855f7', fontSize: 9 },
          min: ivMin,
          max: ivMax,
        },
      ],
      series: [
        {
          name: 'News Heat',
          type: 'bar',
          data: circuitBroken 
            ? data.newsHeat.slice(-14).map(() => 0) 
            : data.newsHeat.slice(-14),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#d97706' },
            ]),
            opacity: circuitBroken ? 0.3 : 0.8,
          },
          barWidth: '35%',
        },
        {
          name: 'Asset Price',
          type: 'line',
          yAxisIndex: 1,
          data: data.assetPrice.slice(-14),
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            color: circuitBroken ? '#6b7280' : '#3b82f6',
            width: circuitBroken ? 1 : 2,
            type: circuitBroken ? 'dashed' : 'solid',
          },
          itemStyle: {
            color: circuitBroken ? '#6b7280' : '#3b82f6',
          },
        },
        // IV Line (Phase 3)
        ...(data.iv !== undefined ? [{
          name: 'IV',
          type: 'line' as const,
          yAxisIndex: 2,
          data: data.newsHeat.slice(-14).map((_, i) => {
            // Simulate IV curve based on real IV value
            const baseIV = data.iv || 30;
            const variation = Math.sin(i * 0.5) * 5 + (Math.random() - 0.5) * 3;
            return Number((baseIV + variation).toFixed(2));
          }),
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#a855f7', // purple-500
            width: 1,
            type: 'dashed' as const,
            opacity: 0.7,
          },
        }] : []),
      ],
    };

    chart.setOption(option);
  }

  function handleResize() {
    chart?.resize();
  }

  onMount(() => {
    initChart();
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
    chart?.dispose();
  });

  $: if (chart && data) {
    const ivMin = data.iv ? Math.max(0, data.iv - 30) : 0;
    const ivMax = data.iv ? Math.min(100, data.iv + 30) : 100;

    chart.setOption({
      title: {
        textStyle: {
          color: circuitBroken ? '#6b7280' : '#f1f5f9',
        },
      },
      series: [
        {
          data: circuitBroken 
            ? data.newsHeat.slice(-14).map(() => 0) 
            : data.newsHeat.slice(-14),
          itemStyle: {
            opacity: circuitBroken ? 0.3 : 0.8,
          },
        },
        {
          lineStyle: {
            color: circuitBroken ? '#6b7280' : '#3b82f6',
            width: circuitBroken ? 1 : 2,
            type: circuitBroken ? 'dashed' : 'solid',
          },
          itemStyle: {
            color: circuitBroken ? '#6b7280' : '#3b82f6',
          },
        },
        ...(data.iv !== undefined ? [{
          data: data.newsHeat.slice(-14).map((_, i) => {
            const baseIV = data.iv || 30;
            const variation = Math.sin(i * 0.5) * 5 + (Math.random() - 0.5) * 3;
            return Number((baseIV + variation).toFixed(2));
          }),
        }] : []),
      ],
    });
  }
</script>

<div class="relative h-full w-full min-h-[220px]">
  <div bind:this={chartContainer} class="h-full w-full"></div>
  
  <!-- IV Crush Risk Badge -->
  {#if ivCrushRisk}
    <div class="absolute right-2 top-2 animate-pulse">
      <div class="flex items-center gap-1 rounded-full bg-purple-900/60 px-2 py-0.5 text-[10px] font-bold text-purple-300">
        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
        IV Crush Risk
      </div>
    </div>
  {/if}

  <!-- IV Value Display -->
  {#if data.iv !== undefined && !circuitBroken}
    <div class="absolute left-2 top-2">
      <div class="text-[10px] text-gray-500">
        IV: <span class="font-mono {data.ivChange && data.ivChange < 0 ? 'text-purple-400' : 'text-gray-400'}">{data.iv.toFixed(2)}%</span>
        {#if data.ivChange !== undefined}
          <span class="{data.ivChange > 0 ? 'text-emerald-400' : data.ivChange < 0 ? 'text-rose-400' : 'text-gray-400'}">
            {data.ivChange > 0 ? '+' : ''}{data.ivChange.toFixed(2)}
          </span>
        {/if}
      </div>
    </div>
  {/if}
</div>
