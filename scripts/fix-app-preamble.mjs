import fs from 'node:fs';

const filePath = 'src/App.tsx';
const src = fs.readFileSync(filePath, 'utf8');

const startNeedle = 'type PriorityQueueEntry';
const markerNeedle = '// Component definitions extracted to separate files:';

const start = src.indexOf(startNeedle);
const end = src.indexOf(markerNeedle);

if (start < 0 || end < 0 || end <= start) {
  console.error('Could not locate rewrite markers in src/App.tsx', { start, end });
  process.exit(1);
}

const before = src.slice(0, start);
const after = src.slice(end);

const replacement =
  "type PriorityQueueEntry<T> = { value: T; priority: number };\n\n" +
  "class PriorityQueue<T> {\n" +
  "  private items: PriorityQueueEntry<T>[] = [];\n\n" +
  "  enqueue(value: T, priority: number) {\n" +
  "    const entry: PriorityQueueEntry<T> = { value, priority };\n" +
  "    const idx = this.items.findIndex((i) => priority < i.priority);\n" +
  "    if (idx === -1) this.items.push(entry);\n" +
  "    else this.items.splice(idx, 0, entry);\n" +
  "  }\n\n" +
  "  dequeue(): T | undefined {\n" +
  "    return this.items.shift()?.value;\n" +
  "  }\n\n" +
  "  peek(): T | undefined {\n" +
  "    return this.items[0]?.value;\n" +
  "  }\n\n" +
  "  get size() {\n" +
  "    return this.items.length;\n" +
  "  }\n\n" +
  "  clear() {\n" +
  "    this.items = [];\n" +
  "  }\n" +
  "}\n\n" +
  "// Global instances\n" +
  "const searchCache = new Map<string, any>();\n\n" +
  "// Expose diagnostics for debugging\n" +
  "try {\n" +
  "  (window as any).__dukan_tabId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;\n" +
  "  (window as any).__dukan_dumpDiagnostics = () => ({\n" +
  "    tabId: (window as any).__dukan_tabId,\n" +
  "    cacheSize: searchCache.size,\n" +
  "    localStorage: {\n" +
  "      backup: localStorage.getItem('dukan:backup') ? 'exists' : 'none',\n" +
  "      pendingDeletes: localStorage.getItem('dukan:pendingDeletes'),\n" +
  "    },\n" +
  "  });\n" +
  "} catch {\n" +
  "  /* noop */\n" +
  "}\n\n" +
  "// ??? TOOLS COMPONENT - extracted to src/tools/ToolsHub.tsx\n\n";

fs.writeFileSync(filePath, before + replacement + after, 'utf8');
console.log('Patched src/App.tsx preamble successfully');
