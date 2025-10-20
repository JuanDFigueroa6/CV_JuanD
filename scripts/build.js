const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();
const dist = path.join(root, 'dist');

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, {recursive:true}); }
function copyFile(src, dest){ ensureDir(path.dirname(dest)); fs.copyFileSync(src,dest); }

console.log('Building site into dist/');
// clean dist
if(fs.existsSync(dist)) { fs.rmSync(dist, { recursive: true, force: true }); }
ensureDir(dist);

// Copy static files (html, assets, css, js)
const copyList = [
  'index.html','portfolio.html','contact.html','robots.txt','sitemap.xml','README.md'
];
copyList.forEach(f => { if(fs.existsSync(path.join(root,f))){ copyFile(path.join(root,f), path.join(dist,f)); }});

// Copy assets
const assetsSrc = path.join(root,'assets');
const assetsDest = path.join(dist,'assets');
if(fs.existsSync(assetsSrc)){
  ensureDir(assetsDest);
  fs.readdirSync(assetsSrc).forEach(f => copyFile(path.join(assetsSrc,f), path.join(assetsDest,f)));
}

// Copy css and js as a fallback
['css','js'].forEach(dir => {
  const src = path.join(root,dir);
  const dst = path.join(dist,dir);
  if(fs.existsSync(src)){
    ensureDir(dst);
    fs.readdirSync(src).forEach(f => copyFile(path.join(src,f), path.join(dst,f)));
  }
});

// Try to minify if tools are available
function run(cmd){ try{ return execSync(cmd,{stdio:'pipe'}).toString(); } catch(e){ return null; } }

console.log('Attempting to minify CSS/JS if minifiers are installed (clean-css-cli / uglify-js).');
const uglify = run('npx uglify-js --version');
const cleancss = run('npx cleancss --version');

if(uglify && cleancss){
  console.log('Minifiers detected, creating minified files...');
  // minify css
  fs.readdirSync(path.join(root,'css')).forEach(file => {
    const src = path.join(root,'css',file);
    const out = path.join(dist,'css',file.replace(/\.css$/,'.min.css'));
    try{ execSync(`npx cleancss -o "${out}" "${src}"`); console.log('minified', file);}catch(e){ console.log('clean-css failed for', file); }
  });
  // minify js
  fs.readdirSync(path.join(root,'js')).forEach(file => {
    const src = path.join(root,'js',file);
    const out = path.join(dist,'js',file.replace(/\.js$/,'.min.js'));
    try{ execSync(`npx uglify-js "${src}" -o "${out}" -c -m`); console.log('minified', file);}catch(e){ console.log('uglify failed for', file); }
  });
  console.log('Note: HTML still references original filenames. You can update HTML to point to .min.css/.min.js as needed.');
} else {
  console.log('Minifier tools not found. Dist contains unminified assets. To minify, install `npm i -D uglify-js clean-css-cli` and re-run build.');
}

console.log('Build complete. You can upload the dist/ folder to your hosting provider.');
