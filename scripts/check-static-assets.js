const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'docs');
const htmlFiles = [];

function walk(d) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, f.name);
        if (f.isDirectory()) walk(p);
        else if (f.name.endsWith('.html')) htmlFiles.push(p);
    }
}
walk(root);

const missing = [];

function resolveLocal(u, baseDir) {
    if (!u || /^https?:|^data:|^mailto:|^#/i.test(u) || u.startsWith('//')) return null;
    const clean = u.split('?')[0];
    return path.normalize(path.join(baseDir, clean));
}

for (const hf of htmlFiles) {
    const t = fs.readFileSync(hf, 'utf8');
    const baseDir = path.dirname(hf);
    const re = /(?:src|href)=["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(t))) {
        const target = resolveLocal(m[1], baseDir);
        if (!target) continue;
        if (!fs.existsSync(target)) {
            missing.push({ from: path.relative(root, hf), ref: m[1] });
        }
    }
}

console.log(JSON.stringify(missing, null, 2));
console.log('missing count:', missing.length, 'html files:', htmlFiles.length);
