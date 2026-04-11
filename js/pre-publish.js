import fs from 'fs/promises';

await fs.mkdir('dist', { recursive: true });
let p = JSON.parse(await fs.readFile('package.json', 'utf-8'));
delete p.scripts;
delete p.devDependencies;
delete p.files;
await fs.writeFile('dist/package.json', JSON.stringify(p, null, 2));
