<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  onMount(() => {
    goto("/markets");
  });
</script>

<div class="flex h-64 items-center justify-center">
  <div class="flex flex-col items-center gap-4">
    <div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-blue-500"></div>
    <p class="text-sm text-gray-400">加载仪表盘...</p>
  </div>
</div>
