const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalLen = content.length;

  // 1. Remove wp-emoji-styles-inline-css style block
  content = content.replace(/<style id=["']wp-emoji-styles-inline-css["']>[\s\S]*?<\/style>\s*/gi, '');

  // 2. Remove wp-emoji-settings and loader script blocks
  content = content.replace(/<script id=["']wp-emoji-settings["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
  content = content.replace(/<script type=["']module["']>[\s\S]*?wp-emoji-loader[\s\S]*?<\/script>\s*/gi, '');

  // 3. For index.html, add hero image preload if not present
  if (path.basename(filePath) === 'index.html' && !content.includes('assets/images/Mask-group.webp" fetchpriority="high"')) {
    content = content.replace(
      '<meta charset="utf-8"/>',
      '<meta charset="utf-8"/>\n<link rel="preload" as="image" href="assets/images/Mask-group.webp" fetchpriority="high"/>'
    );
  }

  if (content.length !== originalLen) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Cleaned:', path.basename(filePath), 'Saved bytes:', originalLen - content.length);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      cleanFile(full);
    }
  }
}

walk('src/public');
console.log('Optimization script completed.');
