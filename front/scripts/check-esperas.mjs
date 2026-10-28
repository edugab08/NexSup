// Falha se algum arquivo da suíte usar espera fixa: cy.wait(1000), cy.wait(500)...
// (cy.wait('@alias') é permitido: espera uma requisição real, não um tempo.)
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PADRAO = /cy\.wait\(\s*\d/;
const achados = [];

function varrer(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const caminho = join(dir, e.name);
    if (e.isDirectory()) {
      if (!['videos', 'screenshots', 'downloads'].includes(e.name)) varrer(caminho);
    } else if (e.name.endsWith('.ts') && PADRAO.test(readFileSync(caminho, 'utf8'))) {
      achados.push(caminho);
    }
  }
}

varrer('cypress');
if (achados.length) {
  console.error('Espera fixa encontrada em:\n - ' + achados.join('\n - '));
  process.exit(1);
}
console.log('OK: nenhuma espera fixa (cy.wait(<ms>)) na suíte.');
