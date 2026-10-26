import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

// Emits dist/sw.js with a precache list of every built file and a content-hash version, so each deployment installs cleanly.
export function swPlugin(extra: string[] = []): Plugin {
  return {
    name: 'ironpath-sw',
    apply: 'build',
    generateBundle(_o, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map')).sort();
      const h = createHash('sha1');
      files.forEach((f) => { const b: any = bundle[f]; h.update(f); h.update(b.type === 'chunk' ? b.code : b.source); });
      const tpl = readFileSync(new URL('./sw.template.js', import.meta.url), 'utf8');
      const source = tpl.replace('__VERSION__', h.digest('hex').slice(0, 10)).replace('__CORE__', JSON.stringify(['./', ...files])).replace('__OPT__', JSON.stringify(extra));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
