// Prerender the home page into build/index.html so it paints before any
// JavaScript runs, and write build/app.html (empty root) as the SPA fallback
// for every other route (/labs/*, /learn).
import { readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname ?? new URL('.', import.meta.url).pathname, '..');
const out = join(root, 'build');
const ssrDir = join(root, 'build-ssr');

const template = readFileSync(join(out, 'index.html'), 'utf8');
const { render } = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href);

// Preload the variable text font: the hero headline is the LCP element.
const assets = readdirSync(join(out, 'assets'));
const inter = assets.find((f) => /^inter-latin-wght-normal.*\.woff2$/.test(f));
const preload = inter
  ? `<link rel="preload" href="/assets/${inter}" as="font" type="font/woff2" crossorigin>`
  : '';

const appHtml = render('/');
if (!appHtml.includes('Siddhesh')) throw new Error('prerender produced no page content');

// Inline the stylesheet into the home page: one fewer render-blocking round
// trip before first paint (~9 KB compressed). app.html keeps the cacheable link.
const cssLink = template.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/);
let homeTemplate = template;
if (cssLink) {
  const css = readFileSync(join(out, cssLink[1]), 'utf8');
  homeTemplate = template.replace(cssLink[0], () => `<style>${css}</style>`);
}

const page = homeTemplate.replace('<!--preload-->', preload).replace('<!--app-html-->', () => appHtml);
writeFileSync(join(out, 'index.html'), page);
writeFileSync(join(out, 'app.html'), template.replace('<!--preload-->', '').replace('<!--app-html-->', ''));
rmSync(ssrDir, { recursive: true, force: true });

console.log(`prerendered / (${(page.length / 1024).toFixed(1)} KB html), wrote app.html fallback${inter ? ', preloaded ' + inter : ''}`);
