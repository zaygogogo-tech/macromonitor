<script>
  import "../app.css";
  import { page } from "$app/state";

  const navItems = [
    { path: "/markets", label: "市场" },
    { path: "/macro", label: "宏观" },
    { path: "/geopolitics", label: "地缘" },
  ];
</script>

<div class="min-h-screen bg-gray-900 text-gray-100">
  <!-- Top Navigation -->
  <nav class="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
      <div class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded bg-blue-600">
          <span class="text-sm font-bold">M</span>
        </div>
        <span class="font-semibold tracking-tight">宏观监控</span>
      </div>

      <div class="flex items-center gap-1">
        {#each navItems as item}
          <a
            href={item.path}
            class="relative px-4 py-2 text-sm font-medium transition-colors"
            class:text-gray-100={page.url.pathname === item.path}
            class:text-gray-400={page.url.pathname !== item.path}
            class:hover:text-gray-200={page.url.pathname !== item.path}
          >
            {item.label}
            {#if page.url.pathname === item.path}
              <span class="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-blue-500"></span>
            {/if}
          </a>
        {/each}
      </div>

      <div class="flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-xs text-gray-400">LIVE</span>
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <main class="mx-auto max-w-7xl px-4 py-6">
    <slot />
  </main>

  <!-- Footer -->
  <footer class="border-t border-gray-800 py-4">
    <div class="mx-auto max-w-7xl px-4 text-center text-xs text-gray-500">
      宏观监控仪表盘 V7 • 双轨敏感度推演 • GICS 分层钻取 • 动态叙事沙盒 • 数据仅供演示
    </div>
  </footer>
</div>
