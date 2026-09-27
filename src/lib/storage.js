// Безопасная обёртка над localStorage (в приватном режиме / WebView может бросать исключения)
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch (e) {
    return { ...fallback };
  }
}

export function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}
