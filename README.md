# Webperf-tester

Webb-UI och API som kör samma tester som [webperf.se](https://webperf.se). Under huven körs den officiella
Docker-imagen [`webperfse/webperf-core`](https://github.com/Webperf-se/webperf_core) (MIT), så tester och betyg
blir identiska med webperf_core.

## Krav

- Node.js 20+
- Docker Desktop (eller Docker Engine) som körs
- Cirka 4 GB ledigt minne per pågående test. Imagen är på flera GB.

## Kom igång

```sh
npm install
npm run pull-image   # hämtar webperfse/webperf-core:latest (görs annars vid första testet)
npm run dev          # http://127.0.0.1:3000 med Vite och hot reload
```

Produktion:

```sh
npm run build
npm start
```

## Så fungerar det

1. Ett jobb skapas via UI:t eller `POST /api/jobs` och läggs i en kö. Ett jobb körs i taget.
2. Jobbet delas upp i körningar: testerna som webperf_core kör som sitespeed.io-plugins (2, 9, 26–30) körs
   tillsammans, och övriga tester körs ett och ett. Varje körning är en egen container:
   `docker run webperfse/webperf-core python3 default.py -u <url> -t <tester> -L <språk> -o result-<n>.json`.
   Ett test som hänger eller kraschar påverkar då bara sin egen körning.
3. `data/jobs/<id>/` innehåller `job.json`, `log.txt` och `result-<n>.json` (webperf_core:s egna JSON-format).

Eftersom testerna körs i separata körningar räknas webperf_core:s sammanvägda totalbetyg (`type_of_test -1`)
inte fram. Betygen per test är desamma som webperf_core ger.

## API

| Metod | Sökväg | Beskrivning |
|---|---|---|
| GET | `/api/status` | Om Docker körs och om imagen finns |
| GET | `/api/tests` | Tillgängliga tester, förvalda tester och språk |
| GET | `/api/jobs` | Alla jobb, nyast först |
| POST | `/api/jobs` | `{ "url": "https://…", "tests": [21, 30], "language": "sv", "mobile": false }` |
| GET | `/api/jobs/:id` | Jobb med tolkade resultat (betyg 1–5 och rapporter) och slutet av loggen |
| POST | `/api/jobs/:id/cancel` | Avbryt ett jobb i kö eller under körning |

## Tester

| Nr | Test | Nr | Test |
|---|---|---|---|
| 2 | 404-sida | 24 | E-post (beta) |
| 9 | Standardfiler | 25 | Mjukvara |
| 15 | Prestanda (Sitespeed.io) | 26 | Tillgänglighetsredogörelse (alfa) |
| 18 | Tillgänglighet (Pa11y) | 27 | CSS-lint |
| 20 | Webbkoll | 28 | HTML-lint |
| 21 | HTTP och nätverk | 29 | JS-lint |
| 22 | Energieffektivitet | 30 | Google Lighthouse |
| 23 | Spårning och integritet | 31 | Integritet (Privacy) |
| | | 32 | DNS |

## Inställningar (miljövariabler)

| Variabel | Standard | Beskrivning |
|---|---|---|
| `PORT` | `3000` | Port för servern |
| `HOST` | `127.0.0.1` | Servern startar containrar, så exponera den inte publikt utan autentisering |
| `WEBPERF_IMAGE` | `webperfse/webperf-core:latest` | Egen image, t.ex. med egen `settings.json` |
| `WEBPERF_TIMEOUT_MIN` | `15` | Max körtid per körning (ett test eller plugin-gruppen) |
| `DATA_DIR` | `data/jobs` | Var jobb och resultat sparas |

Vill du ändra webperf_core:s inställningar permanent kan du bygga en egen image ovanpå den officiella och peka ut den med `WEBPERF_IMAGE`:

```dockerfile
FROM webperfse/webperf-core:latest
COPY settings.json /usr/src/runner/settings.json
```

## Kända begränsningar

- Lighthouse-testet misslyckas ibland med `NO_NAVSTART` i webperf_core. Kör om jobbet.
- HTTP-testet (21) kör en Firefox-körning per TLS-version och kan ibland hänga i långa körningar.
  Tidsgränsen per körning stoppar det, och övriga tester påverkas inte.
- På Linux körs containern som användaren `sitespeedio`, så mappen `data/` måste vara skrivbar för den.
