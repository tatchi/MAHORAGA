export function capByVolumeKeepingPinnedMap<V extends { volume: number }>(
  snapshot: Map<string, V>,
  maxSymbols: number,
  pinnedSymbols: Iterable<string> = []
): Map<string, V> {
  // Returns a new Map containing:
  // - all pinned symbols present (up to maxSymbols, by volume), plus
  // - the remaining top-by-volume symbols until maxSymbols is reached.
  // This is used to bound persisted social snapshots in Durable Object state.
  if (maxSymbols <= 0) return new Map();
  if (snapshot.size <= maxSymbols) return snapshot;

  const pinnedSet = new Set(pinnedSymbols);
  const pinnedPresent: Array<[string, V]> = [];
  for (const symbol of pinnedSet) {
    const value = snapshot.get(symbol);
    if (value) pinnedPresent.push([symbol, value]);
  }

  pinnedPresent.sort((a, b) => (b[1].volume ?? 0) - (a[1].volume ?? 0));

  const result = new Map<string, V>();
  for (const [symbol, value] of pinnedPresent.slice(0, maxSymbols)) {
    result.set(symbol, value);
  }

  if (result.size >= maxSymbols) return result;

  const remaining: Array<[string, V]> = [];
  for (const [symbol, value] of snapshot) {
    if (result.has(symbol)) continue;
    remaining.push([symbol, value]);
  }

  remaining.sort((a, b) => (b[1].volume ?? 0) - (a[1].volume ?? 0));
  for (const [symbol, value] of remaining.slice(0, maxSymbols - result.size)) {
    result.set(symbol, value);
  }

  return result;
}

export function capByVolumeKeepingPinnedRecord<V extends { volume: number }>(
  cache: Record<string, V>,
  maxSymbols: number,
  pinnedSymbols: Iterable<string> = []
): Record<string, V> {
  // Record/JSON version of capByVolumeKeepingPinnedMap for already-materialized caches.
  const keys = Object.keys(cache);
  if (maxSymbols <= 0) return {};
  if (keys.length <= maxSymbols) return cache;

  const pinnedSet = new Set(pinnedSymbols);
  const pinnedPresent: Array<[string, V]> = [];
  for (const symbol of pinnedSet) {
    const value = cache[symbol];
    if (value) pinnedPresent.push([symbol, value]);
  }
  pinnedPresent.sort((a, b) => (b[1].volume ?? 0) - (a[1].volume ?? 0));

  const result: Record<string, V> = {};
  for (const [symbol, value] of pinnedPresent.slice(0, maxSymbols)) {
    result[symbol] = value;
  }

  if (Object.keys(result).length >= maxSymbols) return result;

  const remaining: Array<[string, V]> = [];
  for (const symbol of keys) {
    if (symbol in result) continue;
    remaining.push([symbol, cache[symbol]!]);
  }
  remaining.sort((a, b) => (b[1].volume ?? 0) - (a[1].volume ?? 0));

  for (const [symbol, value] of remaining.slice(0, maxSymbols - Object.keys(result).length)) {
    result[symbol] = value;
  }

  return result;
}
