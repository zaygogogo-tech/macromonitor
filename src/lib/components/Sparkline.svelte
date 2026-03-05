<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as echarts from 'echarts';

  export let data: number[] = [];
  export let color: string = '#3b82f6'; // default blue

  let chartContainer: HTMLDivElement;
  let chart: echarts.ECharts | null = null;

  function initChart() {
    if (!chartContainer || data.length === 0) return;

    chart = echarts.init(chartContainer, 'dark', {
      renderer: 'svg',
    });

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: 0,
        right: 0,
        top: 2,
        bottom: 2,
      },
      xAxis: {
        type: 'category',
        show: false,
        data: data.map((_, i) => i),
      },
      yAxis: {
        type: 'value',
        show: false,
        min: Math.min(...data) * 0.95,
        max: Math.max(...data) * 1.05,
      },
      series: [
        {
          type: 'line',
          data: data,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: color,
            width: 2,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + '40' }, // 25% opacity
              { offset: 1, color: color + '00' }, // 0% opacity
            ]),
          },
        },
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

  $: if (chart && data.length > 0) {
    chart.setOption({
      series: [{ data }],
    });
  }
</script>

<div bind:this={chartContainer} class="h-8 w-20"></div>
