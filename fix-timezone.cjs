const fs = require('fs');
const path = require('path');

const utilsDir = path.join(__dirname, 'src', 'utils');
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

fs.writeFileSync(path.join(utilsDir, 'timezone.ts'), `
export {};

declare global {
  interface String {
    toBRTDateString(): string;
  }
  interface Date {
    toBRTISOString(): string;
  }
}

String.prototype.toBRTDateString = function() {
  if (!this.includes('T') && !this.includes('-')) return this.toString();
  try {
    const d = new Date(this.toString());
    if (isNaN(d.getTime())) return this.toString().split('T')[0];
    const brt = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const pad = (n) => n.toString().padStart(2, '0');
    return \`\${brt.getFullYear()}-\${pad(brt.getMonth() + 1)}-\${pad(brt.getDate())}\`;
  } catch(e) {
    return this.toString().split('T')[0];
  }
};

Date.prototype.toBRTISOString = function() {
  const brt = new Date(this.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const pad = (n) => n.toString().padStart(2, '0');
  return \`\${brt.getFullYear()}-\${pad(brt.getMonth() + 1)}-\${pad(brt.getDate())}T\${pad(brt.getHours())}:\${pad(brt.getMinutes())}:\${pad(brt.getSeconds())}-03:00\`;
};
`);

const scanAndReplace = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanAndReplace(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (file === 'timezone.ts') continue;
      
      let changed = false;

      if (content.includes('.toISOString()')) {
        content = content.replace(/\.toISOString\(\)/g, '.toBRTISOString()');
        changed = true;
      }

      if (content.includes(".split('T')[0]")) {
        content = content.replace(/\.split\('T'\)\[0\]/g, '.toBRTDateString()');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Modified', fullPath);
      }
    }
  }
};

scanAndReplace(path.join(__dirname, 'src'));

const mainTsxPath = path.join(__dirname, 'src', 'main.tsx');
let mainContent = fs.readFileSync(mainTsxPath, 'utf8');
if (!mainContent.includes('./utils/timezone')) {
  mainContent = "import './utils/timezone';\n" + mainContent;
  fs.writeFileSync(mainTsxPath, mainContent, 'utf8');
  console.log('Modified main.tsx');
}
