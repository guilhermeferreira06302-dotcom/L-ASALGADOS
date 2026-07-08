const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Replace backgrounds
    content = content.replace(/bg-slate-950/g, 'bg-slate-50');
    content = content.replace(/bg-slate-900/g, 'bg-white');
    content = content.replace(/bg-slate-800/g, 'bg-slate-100');
    content = content.replace(/bg-slate-700/g, 'bg-slate-200');

    // Replace text colors
    // Note: We need to be careful with text-white in buttons. Let's do a smart replace where we can,
    // or just a global replace and fix manually. Let's just do global, it's easier to fix a few buttons.
    content = content.replace(/text-white/g, 'text-slate-900');
    content = content.replace(/text-slate-100/g, 'text-slate-900');
    content = content.replace(/text-slate-200/g, 'text-slate-800');
    content = content.replace(/text-slate-300/g, 'text-slate-700');
    content = content.replace(/text-slate-400/g, 'text-slate-600');
    content = content.replace(/text-slate-500/g, 'text-slate-500'); // stays same
    content = content.replace(/text-slate-600/g, 'text-slate-400'); // flip dark to light
    
    // Replace borders
    content = content.replace(/border-slate-800/g, 'border-slate-200');
    content = content.replace(/border-slate-700/g, 'border-slate-300');
    
    // Some specific hover states
    content = content.replace(/hover:bg-slate-800/g, 'hover:bg-slate-100');
    content = content.replace(/hover:bg-slate-900/g, 'hover:bg-slate-50');
    content = content.replace(/hover:border-slate-700/g, 'hover:border-slate-300');
    content = content.replace(/hover:text-white/g, 'hover:text-slate-900');

    // Tooltips backgrounds in recharts (contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }})
    content = content.replace(/backgroundColor: '#0f172a'/g, "backgroundColor: '#ffffff'");
    content = content.replace(/borderColor: '#334155'/g, "borderColor: '#e2e8f0'");
    content = content.replace(/stroke="#64748b"/g, 'stroke="#94a3b8"'); // Lighten axes a bit or keep same

    // Selection background
    content = content.replace(/selection:text-slate-950/g, 'selection:text-white');

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
});
