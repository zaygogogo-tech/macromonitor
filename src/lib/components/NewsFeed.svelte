<script lang="ts">
  import { goto } from '$app/navigation';
  import type { NewsItem } from '$lib/types';
  import { logicMap } from '$lib/types';
  import { activeSector } from '$lib/stores/activeSector';

  export let news: NewsItem[] = [];

  function formatTime(timestamp: number): string {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  }

  // Match news title against logic map and return tags with sentiment
  function getLogicTags(title: string): Array<{ tag: string; type: 'bullish' | 'bearish' | 'neutral'; assets: string[]; sector: string }> {
    const tags: Array<{ tag: string; type: 'bullish' | 'bearish' | 'neutral'; assets: string[]; sector: string }> = [];
    
    // Sector mapping for drill-down
    const sectorMap: Record<string, string> = {
      'ITA': 'Industrials',
      'RTX': 'Industrials',
      'LMT': 'Industrials',
      'IWM': 'Financials',
      'DXY': 'Financials',
      'USO': 'Energy',
      'SOXX': 'Information Technology',
      'XBI': 'Health Care',
      'XLRE': 'Real Estate',
      'XLU': 'Utilities',
    };
    
    for (const [keyword, mapping] of Object.entries(logicMap)) {
      if (title.includes(keyword)) {
        // Check if bullish assets are mentioned
        for (const asset of mapping.bullish) {
          tags.push({ 
            tag: `${asset}+`, 
            type: 'bullish', 
            assets: [asset],
            sector: sectorMap[asset] || 'Industrials'
          });
        }
        // Check if bearish assets are mentioned
        for (const asset of mapping.bearish) {
          tags.push({ 
            tag: `${asset}-`, 
            type: 'bearish', 
            assets: [asset],
            sector: sectorMap[asset] || 'Industrials'
          });
        }
      }
    }
    
    return tags;
  }

  // Handle tag click - activate sector, drill to it, and navigate to markets
  function handleTagClick(tag: string, type: 'bullish' | 'bearish', assets: string[], sector: string) {
    // Extract symbol from tag (e.g., "ITA+" -> "ITA")
    const symbol = tag.replace(/[+-]$/, '');
    
    // Phase 3: Activate with drill target for auto-drill
    activeSector.activateWithDrill(sector, symbol, sector);
    
    // Navigate to markets page
    goto('/markets');
  }
</script>

<div class="space-y-3">
  {#each news as item}
    {@const logicTags = getLogicTags(item.title)}
    <div class="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-800/30 p-3 transition-colors hover:border-gray-700">
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-medium text-gray-200 leading-relaxed">{item.title}</h4>
        <div class="mt-2 flex items-center gap-3 text-xs text-gray-500">
          <span>{item.source}</span>
          <span>•</span>
          <span>{formatTime(item.timestamp)}</span>
        </div>
      </div>
      
      <!-- Logic Map Tags (Pill Badges) - Clickable -->
      {#if logicTags.length > 0}
        <div class="flex flex-wrap gap-1.5 shrink-0">
          {#each logicTags as tag}
            {#if tag.type === 'bullish'}
              <button 
                on:click={() => handleTagClick(tag.tag, tag.type, tag.assets, tag.sector)}
                class="rounded-full px-2 py-1 text-xs font-bold text-emerald-400 bg-emerald-900/40 hover:bg-emerald-900/60 transition-colors cursor-pointer"
                title="点击查看产业链联动并钻取至板块"
              >
                {tag.tag}
              </button>
            {:else if tag.type === 'bearish'}
              <button 
                on:click={() => handleTagClick(tag.tag, tag.type, tag.assets, tag.sector)}
                class="rounded-full px-2 py-1 text-xs font-bold text-rose-400 bg-rose-900/40 hover:bg-rose-900/60 transition-colors cursor-pointer"
                title="点击查看产业链联动并钻取至板块"
              >
                {tag.tag}
              </button>
            {/if}
          {/each}
        </div>
      {:else}
        <div class="flex flex-wrap gap-1.5 shrink-0">
          {#each item.tags as tag}
            <span class="rounded-full px-2 py-1 text-xs font-medium text-gray-400 bg-gray-700/40">
              {tag}
            </span>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>
