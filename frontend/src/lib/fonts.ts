/** Script fonts are loaded on demand, only for locales that need them — Inter (via index.html) already covers English. */
const FONT_LINKS: Record<string, { id: string; href: string }> = {
  ta: {
    id: 'font-noto-tamil',
    href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap',
  },
  hi: {
    id: 'font-noto-devanagari',
    href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap',
  },
};

export function applyScriptFont(lng: string): void {
  document.querySelectorAll('link[data-script-font]').forEach((el) => {
    if (el.id !== FONT_LINKS[lng]?.id) el.remove();
  });

  const entry = FONT_LINKS[lng];
  if (!entry || document.getElementById(entry.id)) return;

  const link = document.createElement('link');
  link.id = entry.id;
  link.rel = 'stylesheet';
  link.href = entry.href;
  link.dataset.scriptFont = 'true';
  document.head.appendChild(link);
}
