<script lang="ts">
  import type { SWRCache } from '$lib/swr';

  export let status: SWRCache<unknown>;

  function formatTime(timestamp: number | null): string {
    if (!timestamp) return '从未';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}秒前`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分钟前`;
    return `${Math.floor(minutes / 60)}小时前`;
  }
</script>

{#if status.isStale && status.data}
  <div class="flex items-center gap-2 rounded-full bg-amber-900/40 px-3 py-1.5">
    <svg class="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    <span class="text-xs font-medium text-amber-400">
      离线 / 缓存数据 ({formatTime(status.lastUpdated)})
    </span>
  </div>
{:else if status.error && !status.data}
  <div class="flex items-center gap-2 rounded-full bg-rose-900/40 px-3 py-1.5">
    <svg class="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span class="text-xs font-medium text-rose-400">
      连接失败
    </span>
  </div>
{:else if status.isLoading && !status.data}
  <div class="flex items-center gap-2 rounded-full bg-blue-900/40 px-3 py-1.5">
    <svg class="h-4 w-4 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span class="text-xs font-medium text-blue-400">
      加载中...
    </span>
  </div>
{:else}
  <div class="flex items-center gap-2 rounded-full bg-emerald-900/40 px-3 py-1.5">
    <!-- Breathing animation indicator -->
    <span class="relative flex h-2.5 w-2.5">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
    </span>
    <span class="text-xs font-medium text-emerald-400">
      实时 ({formatTime(status.lastUpdated)})
    </span>
  </div>
{/if}
