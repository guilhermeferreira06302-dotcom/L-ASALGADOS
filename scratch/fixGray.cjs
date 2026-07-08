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

    // Mudar os cinzas claros (400 e 500) para cinzas escuros (600 e 700) para leitura no modo light
    content = content.replace(/text-slate-400/g, 'text-slate-700');
    content = content.replace(/text-slate-500/g, 'text-slate-600');

    // E corrigir os hovers também se existirem (ex: hover:text-slate-400) - embora eu tenha usado replace global
    // O regex acima já pega hover:text-slate-400 porque usou replace global sem word boundary.
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed gray text in ${file}`);
});
