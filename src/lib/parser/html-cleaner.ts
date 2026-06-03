// Strip NGA JavaScript residue from post content (ubbcode.attach.load, commonui.*, etc.)
export function cleanNgaHtml(html: string): string {
  // Remove ubbcode.attach.load() calls using balanced parenthesis matching
  const startTag = "ubbcode.attach.load(";
  let idx = html.indexOf(startTag);
  while (idx !== -1) {
    let depth = 0;
    let end = idx + startTag.length;
    for (; end < html.length; end++) {
      if (html[end] === "(") depth++;
      if (html[end] === ")") { if (depth === 0) break; depth--; }
    }
    if (end < html.length && html[end] === ")") {
      let after = end + 1;
      while (after < html.length && (html[after] === " " || html[after] === ";")) after++;
      html = html.substring(0, idx) + html.substring(after);
    } else break;
    idx = html.indexOf(startTag);
  }
  html = html.replace(/显示全部附件/g, "");
  html = html.replace(/commonui\.\w+\s*\([^)]*\)\s*;?/g, "");
  html = html.replace(/改动在\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}修改/g, "");
  html = html.replace(/#\d+\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\s+\d+/g, "");
  // Collapse multiple spaces caused by removals, preserve single spaces
  html = html.replace(/\s{2,}/g, " ").trim();
  return html;
}
