<script lang="ts">
  import type { AISummary } from '$lib/types';
  import { fade } from 'svelte/transition';

  export let summary: AISummary | null = null;

  let displayText = '';
  let typingIndex = 0;
  let isTyping = false;

  $: if (summary && summary.summary) {
    isTyping = true;
    typingIndex = 0;
    displayText = '';
    typeWriter();
  }

  function typeWriter() {
    if (!summary) return;
    
    if (typingIndex < summary.summary.length) {
      displayText += summary.summary.charAt(typingIndex);
      typingIndex++;
      setTimeout(typeWriter, 30);
    } else {
      isTyping = false;
    }
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.85) return 'text-emerald-400';
    if (confidence >= 0.7) return 'text-amber-400';
    return 'text-rose-400';
  }
</script>

{#if summary}
  <div 
    in:fade={{ duration: 300 }}
    class="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-900/20 via-blue-900/20 to-purple-900/20 p-5"
  >
    <!-- Animated border effect -->
    <div class="absolute inset-0 rounded-xl opacity-50">
      <div class="absolute inset-0 animate-pulse rounded-xl border border-cyan-400/20"></div>
    </div>
    
    <!-- Header -->
    <div class="relative mb-3 flex items-center gap-2">
      <div class="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20">
        <svg class="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <span class="text-xs font-bold tracking-wider text-cyan-400">AI 叙事简报</span>
      {#if !isTyping}
        <span class="ml-auto text-xs {getConfidenceColor(summary.confidence)}">
          置信度: {(summary.confidence * 100).toFixed(0)}%
        </span>
      {/if}
      {#if isTyping}
        <span class="ml-auto text-xs animate-pulse text-cyan-400">正在生成...</span>
      {/if}
    </div>

    <!-- Content -->
    <div class="relative">
      <p class="text-sm leading-relaxed text-gray-200">
        {displayText}
        {#if isTyping}
          <span class="inline-block h-4 w-0.5 animate-pulse bg-cyan-400"></span>
        {/if}
      </p>
    </div>

    <!-- Metadata -->
    {#if !isTyping && summary.generatedAt}
      <div class="relative mt-3 flex items-center gap-4 text-[10px] text-gray-500">
        <span>生成时间: {new Date(summary.generatedAt).toLocaleTimeString('zh-CN')}</span>
        <span>•</span>
        <span>主导叙事: {summary.dominantNarrative}</span>
      </div>
    {/if}
  </div>
{/if}
