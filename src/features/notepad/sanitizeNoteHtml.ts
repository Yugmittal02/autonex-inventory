export function sanitizeNoteHtml(rawHtml: unknown): string {
  const html = rawHtml === null || rawHtml === undefined ? '' : String(rawHtml);
  if (!html) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc
      .querySelectorAll(
        'script, iframe, object, embed, link, meta, style, svg, math, form, input, textarea, select, option, button'
      )
      .forEach((n) => n.remove());

    const allowedTags = new Set([
      'div',
      'p',
      'br',
      'span',
      'b',
      'strong',
      'i',
      'em',
      'u',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'a',
      'img',
    ]);

    const allowedStyleProps = new Set([
      'background-color',
      'color',
      'font-weight',
      'font-style',
      'text-decoration',
    ]);

    const unwrapElement = (el: Element) => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    };

    const all = Array.from(doc.body.querySelectorAll('*'));
    all.forEach((el) => {
      const tag = el.tagName.toLowerCase();

      const originalHref = el.getAttribute('href') || '';
      const originalSrc = el.getAttribute('src') || '';
      const originalAlt = el.getAttribute('alt') || '';

      if (!allowedTags.has(tag)) {
        unwrapElement(el);
        return;
      }

      // Strip attributes except style (re-applied safely below)
      [...el.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          return;
        }
        if (name !== 'style') el.removeAttribute(attr.name);
      });

      if (tag === 'a') {
        const href = originalHref.trim();
        const hrefLower = href.toLowerCase();
        const ok =
          hrefLower.startsWith('https://') ||
          hrefLower.startsWith('http://') ||
          hrefLower.startsWith('mailto:') ||
          hrefLower.startsWith('tel:') ||
          hrefLower.startsWith('#');
        if (ok && !hrefLower.startsWith('javascript:')) {
          el.setAttribute('href', href);
        } else {
          el.removeAttribute('href');
        }
      }

      if (tag === 'img') {
        const src = originalSrc.trim();
        const srcLower = src.toLowerCase();
        const ok =
          srcLower.startsWith('data:image/') ||
          srcLower.startsWith('https://') ||
          srcLower.startsWith('http://');
        if (!ok) {
          el.remove();
          return;
        }
        if (srcLower.startsWith('data:image/') && src.length > 2_000_000) {
          el.remove();
          return;
        }
        el.setAttribute('src', src);
        const alt = originalAlt.trim();
        if (alt) el.setAttribute('alt', alt);
      }

      const style = el.getAttribute('style');
      if (style) {
        const safeParts: string[] = [];
        style
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((decl) => {
            const idx = decl.indexOf(':');
            if (idx === -1) return;
            const prop = decl.slice(0, idx).trim().toLowerCase();
            const val = decl.slice(idx + 1).trim();
            if (!allowedStyleProps.has(prop)) return;
            if (/url\(/i.test(val)) return;
            safeParts.push(`${prop}: ${val}`);
          });

        if (safeParts.length) el.setAttribute('style', safeParts.join('; '));
        else el.removeAttribute('style');
      }
    });

    return doc.body.innerHTML;
  } catch {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || '';
  }
}
