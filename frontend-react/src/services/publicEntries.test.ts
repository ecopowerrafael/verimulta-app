import { describe, expect, it } from 'vitest';
import landingHtml from '../../index.html?raw';
import appHtml from '../../app.html?raw';
import adminHtml from '../../admin.html?raw';
import manifest from '../../public/manifest.json';
import serviceWorker from '../../public/sw.js?raw';

describe('public entries and PWA policy', () => {
  it('keeps the landing indexable and separates app/admin entries', () => {
    expect((landingHtml.match(/<meta name="description"/g) ?? [])).toHaveLength(1);
    expect(landingHtml).toContain('<link rel="canonical" href="https://www.verimulta.com.br/">');
    expect(landingHtml).toContain('id="formEspera"');
    expect(landingHtml).toContain('src="/src/landing-main.tsx"');
    expect(appHtml).toContain('src="/src/main.tsx"');
    expect(appHtml).toContain('noindex,nofollow');
    expect(adminHtml).toContain('src="/src/admin-main.tsx"');
  });

  it('opens the authenticated app when installed and defines public icons', () => {
    expect(manifest.start_url).toBe('app.html');
    expect(manifest.id).toBe('/app.html');
    expect(manifest.scope).toBe('./');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toHaveLength(2);
  });

  it('does not cache API, admin, or credential-bearing requests', () => {
    expect(serviceWorker).toContain("url.pathname.startsWith('/v1/')");
    expect(serviceWorker).toContain("url.pathname === '/admin.html'");
    expect(serviceWorker).toContain("e.request.headers.has('authorization')");
    expect(serviceWorker).toContain("e.request.headers.has('x-admin-secret')");
    expect(serviceWorker).toContain("e.request.mode !== 'navigate'");
    expect(serviceWorker).toContain("verimulta-public-v3");
  });
});
