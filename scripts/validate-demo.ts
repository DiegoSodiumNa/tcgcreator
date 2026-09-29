import { readFileSync, writeFileSync } from 'node:fs';
import { demoGame } from '../src/fixtures/demo-game.ts';
import { parseGameFile } from '../src/domain/rules.ts';

const path = new URL('../src/fixtures/demo-game.json', import.meta.url);
const serialized = JSON.stringify(demoGame, null, 2) + '\n';
if (process.argv.includes('--write')) writeFileSync(path, serialized, 'utf8');
const actual = readFileSync(path, 'utf8');
parseGameFile(JSON.parse(actual));
if (actual !== serialized) throw new Error('El JSON no coincide con los datos TypeScript. Ejecuta npm run fixtures:write.');
console.log(`Contrato v1 válido: ${demoGame.cards.length} cartas, ${demoGame.definitions.types.length} tipos y ${demoGame.definitions.attributes.length} atributos. JSON sincronizado.`);
