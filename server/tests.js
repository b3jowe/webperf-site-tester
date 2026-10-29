// Testnummer enligt TEST_* i webperf_core/helpers/test_helper.py
export const TESTS = [
  { id: 2, name: '404-sida', description: 'Kontrollerar att sajten har en korrekt 404-sida' },
  { id: 9, name: 'Standardfiler', description: 'robots.txt, sitemap, security.txt, favicon m.m.' },
  { id: 15, name: 'Prestanda (Sitespeed.io)', description: 'Laddtider och prestanda via sitespeed.io' },
  { id: 18, name: 'Tillgänglighet (Pa11y)', description: 'Automatiska tillgänglighetskontroller' },
  { id: 20, name: 'Webbkoll', description: 'Säkerhet, dataskydd och integritet' },
  { id: 21, name: 'HTTP och nätverk', description: 'HTTPS, HTTP/2–3, TLS, IPv6 m.m.' },
  { id: 22, name: 'Energieffektivitet', description: 'Uppskattad klimatpåverkan per sidvisning' },
  { id: 23, name: 'Spårning och integritet', description: 'Cookies, tredjepartsanrop och spårare' },
  { id: 24, name: 'E-post (beta)', description: 'MX, SPF, DMARC, MTA-STS m.m.' },
  { id: 25, name: 'Mjukvara', description: 'Identifierad mjukvara och kända sårbarheter' },
  { id: 26, name: 'Tillgänglighetsredogörelse (alfa)', description: 'Finns och följer redogörelsen kraven?' },
  { id: 27, name: 'CSS-lint (Stylelint)', description: 'Fel och varningar i CSS' },
  { id: 28, name: 'HTML-lint (html-validate)', description: 'Fel och varningar i HTML' },
  { id: 29, name: 'JS-lint (ESLint)', description: 'Fel och varningar i JavaScript' },
  { id: 30, name: 'Google Lighthouse', description: 'Prestanda, tillgänglighet, best practice och SEO' },
  { id: 31, name: 'Integritet (Privacy)', description: 'Användarens integritet via Webbkoll-backend' },
  { id: 32, name: 'DNS', description: 'DNS-konfiguration och DNSSEC' }
];

// Körs som plugins i en gemensam sitespeed.io-körning i webperf_core (TEST_USE_SITESPEED)
export const SITESPEED_PLUGIN_TESTS = [2, 9, 26, 27, 28, 29, 30];

export const DEFAULT_TESTS =[2, 9, 21, 22, 23, 25, 27, 28, 29, 30];

export const LANGUAGES = ['sv', 'en'];

export const isValidTestId = (id) => TESTS.some((test) => test.id === id);
