import { readFileSync } from 'node:fs';
import { prepareSample, selectScope, guidedAnswer } from '../src/coworker-engine.mjs';
const request = JSON.parse(readFileSync(0, 'utf8'));
const bundle = JSON.parse(readFileSync(new URL('../src/data/atlas-bundle.json', import.meta.url), 'utf8'));
const data = selectScope(prepareSample(bundle, request.sample || 'canonical').data, request.filters || {});
process.stdout.write(JSON.stringify(guidedAnswer(data, request.question, request.parameters)));
