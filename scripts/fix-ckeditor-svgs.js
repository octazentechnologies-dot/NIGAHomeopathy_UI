/**
 * Strip unsupported SVG namespace attrs from CKEditor icons so CRA/@svgr can compile them
 * even when webpack is not customized (e.g. before craco is used).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "node_modules", "@ckeditor");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".svg")) out.push(full);
  }
  return out;
}

let fixed = 0;
for (const file of walk(root)) {
  const original = fs.readFileSync(file, "utf8");
  const next = original.replace(/\s*xmlns:[A-Za-z0-9_-]+="[^"]*"/g, "");
  if (next !== original) {
    fs.writeFileSync(file, next);
    fixed += 1;
  }
}

if (fixed) {
  console.log(`[fix-ckeditor-svgs] cleaned namespace attrs in ${fixed} SVG(s)`);
}
