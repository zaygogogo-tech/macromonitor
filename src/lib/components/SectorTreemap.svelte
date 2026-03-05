<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as echarts from 'echarts';
  import type { TreemapItem } from '$lib/types';
  import { activeSector } from '$lib/stores/activeSector';

  export let data: TreemapItem[] = [];

  let chartContainer: HTMLDivElement;
  let chart: echarts.ECharts | null = null;
  let currentActiveSector: string | null = null;
  let currentDrillPath: string[] = [];
  let isAtRoot = true;

  // Subscribe to active sector store (for cross-module linkage)
  const unsubscribe = activeSector.subscribe((state) => {
    currentActiveSector = state.sector;
    if (chart && data.length > 0) {
      updateChartHighlight();
      
      // Phase 3: Auto-drill if drillTarget is set
      if (state.drillTarget && chart && isAtRoot) {
        setTimeout(() => {
          autoDrillToSector(state.drillTarget);
        }, 100);
      }
    }
  });

  function getColorByChange(change: number): string {
    if (change >= 2) return '#059669';
    if (change >= 1) return '#10b981';
    if (change > 0) return '#34d399';
    if (change === 0) return '#6b7280';
    if (change > -1) return '#fb7185';
    if (change > -2) return '#f43f5e';
    return '#e11d48';
  }

  function processData(items: TreemapItem[]): any[] {
    return items.map(item => {
      const isActive = currentActiveSector && 
        (item.name === currentActiveSector || 
         item.name.toLowerCase().includes(currentActiveSector.toLowerCase()));
      const isDimmed = currentActiveSector && !isActive && !isAtRoot;

      return {
        name: item.name,
        value: item.value,
        change: item.change,
        itemStyle: {
          color: getColorByChange(item.change),
          borderColor: isActive ? '#fbbf24' : '#0f172a',
          borderWidth: isActive ? 3 : 1,
          gapWidth: 1,
          opacity: isDimmed ? 0.2 : 1,
        },
        label: {
          show: true,
          opacity: isDimmed ? 0.3 : 1,
          formatter: (params: any) => {
            // Phase 2: Level 1 - show sector name + change only
            const name = params.name;
            const change = params.data.change;
            const changeStr = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
            return `{name|${name}}\n{change|${changeStr}}`;
          },
          rich: {
            name: {
              fontSize: 13,
              fontWeight: 'bold',
              color: isDimmed ? '#6b7280' : '#f1f5f9',
            },
            change: {
              fontSize: 11,
              color: isDimmed ? '#6b7280' : '#94a3b8',
              lineHeight: 18,
            },
          },
        },
        upperLabel: {
          show: false,
        },
        children: item.children?.map(child => {
          const childIsDimmed = isDimmed;
          
          return {
            name: child.name,
            value: child.value,
            change: child.change,
            itemStyle: {
              color: getColorByChange(child.change),
              borderColor: isActive ? '#fbbf24' : '#0f172a',
              borderWidth: isActive ? 2 : 0.5,
              opacity: childIsDimmed ? 0.2 : 1,
            },
            label: {
              show: true,
              opacity: childIsDimmed ? 0.3 : 1,
              formatter: (params: any) => {
                // Level 2 - show ticker + change
                const name = params.name;
                const change = params.data.change;
                const changeStr = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
                return `{name|${name}}\n{change|${changeStr}}`;
              },
              rich: {
                name: {
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: childIsDimmed ? '#6b7280' : '#f1f5f9',
                },
                change: {
                  fontSize: 9,
                  color: childIsDimmed ? '#6b7280' : '#94a3b8',
                  lineHeight: 14,
                },
              },
            },
          };
        }),
      };
    });
  }

  // Phase 3: Auto drill to specific sector
  function autoDrillToSector(sectorName: string | null) {
    if (!chart || !sectorName || !isAtRoot) return;
    
    const sector = data.find(s => 
      s.name.toLowerCase().includes(sectorName.toLowerCase())
    );
    
    if (sector) {
      drillDownToSector(sector);
    }
  }

  function drillDownToSector(sector: TreemapItem) {
    if (!chart) return;
    
    isAtRoot = false;
    currentDrillPath = [sector.name];
    
    // Update chart to show only this sector's children
    chart.setOption({
      series: [{
        data: [{
          name: sector.name,
          value: sector.value,
          change: sector.change,
          itemStyle: {
            color: getColorByChange(sector.change),
            borderColor: '#0f172a',
            borderWidth: 1,
          },
          label: {
            show: false, // Hide parent label when drilled in
          },
          children: sector.children?.map(child => ({
            name: child.name,
            value: child.value,
            change: child.change,
            itemStyle: {
              color: getColorByChange(child.change),
              borderColor: '#0f172a',
              borderWidth: 0.5,
            },
            label: {
              show: true,
              formatter: (params: any) => {
                const name = params.name;
                const change = params.data.change;
                const changeStr = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
                return `{name|${name}}\n{change|${changeStr}}`;
              },
              rich: {
                name: {
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: '#f1f5f9',
                },
                change: {
                  fontSize: 10,
                  color: '#94a3b8',
                  lineHeight: 16,
                },
              },
            },
          })),
        }],
        leafDepth: 2, // Show all levels when drilled in
      }],
    });
  }

  function drillUpToRoot() {
    if (!chart) return;
    
    isAtRoot = true;
    currentDrillPath = [];
    activeSector.clear();
    
    chart.setOption({
      series: [{
        data: processData(data),
        leafDepth: 1,
      }],
    });
  }

  function updateChartHighlight() {
    if (!chart) return;
    chart.setOption({
      series: [{ data: processData(data) }],
    });
  }

  function initChart() {
    if (!chartContainer) return;

    chart = echarts.init(chartContainer, 'dark', {
      renderer: 'canvas',
    });

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: {
          color: '#f1f5f9',
          fontSize: 12,
        },
        formatter: (params: any) => {
          const change = params.data.change;
          const changeStr = change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
          const color = change >= 0 ? '#10b981' : '#f43f5e';
          const isSector = isAtRoot && params.treePathInfo && params.treePathInfo.length <= 2;
          
          if (isSector) {
            return `
              <div class="font-medium">${params.name}</div>
              <div class="text-xs text-gray-400">Sector Cap: $${(params.value / 1000).toFixed(2)}T</div>
              <div class="text-xs" style="color: ${color}">Sector Avg: ${changeStr}%</div>
              <div class="text-[10px] text-gray-500 mt-1">点击查看个股详情</div>
            `;
          } else {
            return `
              <div class="font-medium">${params.name}</div>
              <div class="text-xs text-gray-400">Market Cap: $${(params.value / 1000).toFixed(2)}B</div>
              <div class="text-xs" style="color: ${color}">Change: ${changeStr}%</div>
            `;
          }
        },
      },
      series: [
        {
          type: 'treemap',
          width: '100%',
          height: '100%',
          roam: false,
          nodeClick: false, // Disable default drill, handle manually
          leafDepth: 1,
          breadcrumb: {
            show: false, // Disable default breadcrumb to avoid black block
          },
          label: {
            show: true,
          },
          itemStyle: {
            borderColor: '#0f172a',
            borderWidth: 1,
            gapWidth: 1,
          },
          levels: [
            {
              itemStyle: {
                borderWidth: 1,
                borderColor: '#0f172a',
                gapWidth: 1,
              },
            },
            {
              itemStyle: {
                borderWidth: 0.5,
                borderColor: '#0f172a',
                gapWidth: 0.5,
              },
            },
          ],
          data: processData(data),
        },
      ],
    };

    chart.setOption(option);

    // Handle click for custom drill-down
    chart.on('click', (params: any) => {
      if (isAtRoot && params.data) {
        const sector = data.find(s => s.name === params.name);
        if (sector) {
          drillDownToSector(sector);
        }
      }
    });
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
    unsubscribe();
    chart?.dispose();
  });

  $: if (chart && data.length > 0) {
    updateChartHighlight();
  }
</script>

<div class="relative h-full w-full min-h-[400px]">
  <!-- Custom Breadcrumb Navigation (Clean, no black block) -->
  {#if !isAtRoot}
    <div class="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg bg-gray-800/90 border border-gray-700 px-3 py-2 text-xs backdrop-blur shadow-lg">
      <button 
        class="text-blue-400 hover:text-blue-300 transition-colors font-medium"
        on:click={drillUpToRoot}
      >
        S&P 500
      </button>
      <span class="text-gray-500">/</span>
      <span class="text-gray-200 font-medium">{currentDrillPath[0]}</span>
      <button
        on:click={drillUpToRoot}
        class="ml-2 text-gray-500 hover:text-gray-300 transition-colors"
        title="返回全景"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  {:else}
    <!-- Hint for drill-down -->
    <div class="absolute left-4 top-4 z-10 pointer-events-none">
      <span class="text-[10px] text-gray-600 bg-gray-900/50 px-2 py-1 rounded">
        点击板块查看个股
      </span>
    </div>
  {/if}
  
  <div bind:this={chartContainer} class="h-full w-full"></div>
</div>
