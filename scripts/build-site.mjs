import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { requireMain, remoteMain } from './production-source.mjs';

if (process.env.VERCEL_ENV === 'production') {
  requireMain(process.env.DEPLOY_SOURCE_BRANCH || process.env.VERCEL_GIT_COMMIT_REF,
    process.env.DEPLOY_SOURCE_SHA || process.env.VERCEL_GIT_COMMIT_SHA,
    remoteMain('https://github.com/nealshulman/flattensf-expanded.git'));
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8').replaceAll('\r\n', '\n');
const payload = JSON.parse(read('sf_flat_routes/web/route-page-data.json'));
const asset = (name, extension, text) => {
  const hash = createHash('sha1').update(text).digest('hex').slice(0, 10);
  const filename = `${name}-${hash}.${extension}`;
  writeFileSync(resolve(root, 'site', filename), text);
  return filename;
};
for (const name of readdirSync(resolve(root, 'site'))) {
  if (/^app-[a-f0-9]{10}\.(js|css)$/.test(name)) unlinkSync(resolve(root, 'site', name));
}
const appJs = asset('app', 'js', read('sf_flat_routes/web/engine.js') + '\n' + read('sf_flat_routes/web/simple.js'));
const appCss = asset('app', 'css', read('sf_flat_routes/web/simple.css'));
const leafletJs = asset('leaflet', 'js', read('sf_flat_routes/vendor/leaflet-1.9.4.min.js'));
const leafletCss = asset('leaflet', 'css', read('sf_flat_routes/vendor/leaflet-1.9.4.css'));
let html = read('sf_flat_routes/web/simple.html');
const replacements = {
  '/*__REPO_URL__*/': 'https://github.com/nealshulman/flattensf-expanded',
  '<!--__HEAD_EXTRA__-->': '<link rel="icon" href="favicon.svg" type="image/svg+xml">\n<link rel="preload" href="' + payload.bundle_url + '" as="fetch" crossorigin>',
  '<style>/*__LEAFLET_CSS__*/</style>': `<link rel="stylesheet" href="${leafletCss}">`,
  '<style>/*__APP_CSS__*/</style>': `<link rel="stylesheet" href="${appCss}">`,
  '<script>/*__LEAFLET_JS__*/</script>': `<script src="${leafletJs}"></script>`,
  '<script>/*__APP_JS__*/</script>': `<script src="${appJs}"></script>`,
  '/*__DATA__*/': JSON.stringify(payload),
};
for (const [before, after] of Object.entries(replacements)) html = html.replaceAll(before, after);
writeFileSync(resolve(root, 'site/index.html'), html);
console.log('Built static route finder from source, using the original street and elevation data.');
