import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildTokenCss } from '../src/css';

const out = fileURLToPath(new URL('../src/web/tokens.css', import.meta.url));
writeFileSync(out, buildTokenCss());
console.log(`wrote ${out}`);
