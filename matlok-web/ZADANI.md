# Matlok Group — zadání pro vývoj webu

Předávací dokument pro implementaci v Astro + Sanity. Vychází z prototypu ve složce `site/`.
Verze 1 · září 2026 · Matlok Group s.r.o.

---

## 1. Stack a nasazení

| Vrstva | Řešení |
|---|---|
| Framework | Astro 5, TypeScript, Tailwind, statický výstup |
| CMS | Sanity (Studio v `/studio`) |
| Hosting | Cloudflare Pages, automatický deploy z GitHubu |
| Doména | matlok.cz — registrátor Active24, nameservery přesměrovat na Cloudflare (**pozor na MX záznamy pro e-mail**) |
| Serverové funkce | Cloudflare Functions (`/functions/api/*`) |
| Repozitář | GitHub org, repo `matlok-web` |

Design tokeny vzít z `PRO CLAUDE DESIGN – Design System/tokens/*.css`, nepsat barvy natvrdo.

---

## 2. Stránky

| Route | Soubor v prototypu | Pozadí | Poznámka |
|---|---|---|---|
| `/` | `index.html` | Ink → Snow | Hero s živou kartou, 5 divizí, **sekce Zakladatelé** (`#zakladatele`), proč Matlok |
| `/matlok` | `matlok.html` | `--azure-50` | Fotka, KPI, živá nabídka, jak to funguje |
| `/sluzby` | `sluzby.html` | `--neutral-100` | Digital Services — filozofie (6 principů), služby, proces, pás „náš vzorek" |
| `/kontakt` | `kontakt.html` | Ink + Snow | Formulář s výběrem záměru + FAQ |
| `/ochrana-osobnich-udaju` | — | Snow | Zatím nenapsáno |
| `/cookies` | `cookies.html` | Snow | **Napsáno** — funkční + analytické cookies, GDPR odstavec |

---

## 3. Poptávkový formulář

Jeden formulář se **segmentovaným výběrem záměru**. Podle volby se zobrazí druhý blok polí.
Důvod pro jeden formulář místo dvou: uživatel často neví, do které škatulky patří, a dvě URL
tříští návštěvnost i měření.

### 3.1 Struktura

```
1 · Co vás zajímá   (povinné, výchozí "services")
    ○ services  — Digitální řešení        → panel A
    ○ automat   — Automat na lokalitu     → panel B
    ○ jine      — Něco jiného             → bez panelu

2 · Panel A (services)
    sluzby[]     checkbox  web | foto | social | video | reklama | sprava
    obor         text      "Obor podnikání"
    stav         select    Začínám od nuly | Mám web, ale nevyhovuje mi | Mám jen sociální sítě | Mám vše, chci to zlepšit

2 · Panel B (automat)
    typ          select    Hotel nebo penzion | Sportoviště | Firemní areál | Obec nebo veřejné místo | Jiné
    misto        text      "Obec / adresa lokality"
    navstevnost  select    Do 50 | 50–200 | 200–500 | Přes 500 lidí denně
    rezim        select    Nájem za místo | Podíl z prodeje | Pronájem automatu | Zatím nevím

3 · Kontakt
    jmeno    text     povinné
    firma    text     nepovinné
    email    email    povinné, validace formátu
    telefon  tel      nepovinné
    zprava   textarea nepovinné
```

### 3.2 Chování

- Panel se přepíná bez reloadu; skrytá pole se **neodesílají**.
- Odesílá se vždy i `zamer` (services / automat / jine) — podle něj se leady třídí.
- Honeypot pole `website` (skryté). Vyplněné = spam, tiše zahodit.
- Po odeslání se formulář nahradí potvrzením: „Děkujeme. Ozveme se do jednoho pracovního dne."
- Text u tlačítka: „Konzultace a cenová nabídka jsou zdarma a nezávazné."

### 3.3 Zpracování na serveru

Cloudflare Function `POST /api/poptavka`:

1. validace + honeypot + rate limit (max 5 odeslání z jedné IP za hodinu)
2. zápis dokumentu `lead` do Sanity (write token v env, nikdy ve frontendu)
3. odeslání notifikačního e-mailu (Resend / MailChannels) na adresu ze `siteSettings`
4. odpověď `{ ok: true }`

Předmět notifikace: `Poptávka – {zamer} – {jmeno}` — ať je vidět v mobilu na první pohled.

---

## 4. FAQ

Osmnáct otázek, tři kategorie (`skupina`, `web`, `automat`), filtr Vše / O skupině / Weby a digitál / Automaty. Pod seznamem je poznámka „Všechny uvedené ceny jsou bez DPH."
Otázky žijí v Sanity jako dokument `faq` (pole: `poradi`, `kategorie`, `otazka`, `odpoved`, `zobrazit`),
aby šly doplňovat bez zásahu do kódu. Plné znění je v prototypu `site/kontakt.html`.

Implementovat jako `<details>/<summary>` — funguje bez JS, JS jen filtruje kategorie.
Přidat `FAQPage` structured data (JSON-LD) — Google to zobrazuje ve výsledcích a u lokálních
firem to má měřitelný efekt na prokliky.

---

## 5. Obsahový model Sanity

| Dokument | Pole |
|---|---|
| `siteSettings` | nazev, logo, adresa, ICO, spisovaZnacka, telefon, email (info@matlok.cz), neplatceDph (bool), socialni site, notifikacniEmail |
| `division` | poradi, nazev, kod (01–05), stav (`live` / `soon`), popis, claim, odkaz |
| `machine` | nazev, machineId (MůjAutomat), lokalita, gps, otevirací doba, platby, stav |
| `product` | nazev, cena, kategorie (`drink` / `snack` / …), dostupnost, nejprodavanejsi (bool), zobrazit (bool) |
| `service` | poradi, nazev, popis, ikona |
| `principle` | poradi, nadpis, text — šest principů filozofie |
| `founder` | jmeno, role, claim, bio, lidskyDetail, stitky[], foto |
| `faq` | poradi, kategorie, otazka, odpoved, zobrazit |
| `legalPage` | titulek, slug, ucinnostOd, text |
| `lead` | zamer, sluzby[], obor, termin, typ, misto, navstevnost, elektrina, jmeno, firma, email, telefon, zprava, vytvoreno |

`stav` u divize je celý mechanismus „coming soon" — přepnutím pole se karta rozsvítí bez zásahu do kódu.

---

## 6. Integrace MůjAutomat (Partner API)

```
Base URL   https://www.mujautomat.cz/api/partner/v1
Auth       Authorization: Bearer muj_live_<klíč>
Scopes     partner:write (automaty, objednávky) · catalog:write (katalog)
```

**Fáze 1 — jen čtení nabídky.** Cloudflare Function `GET /api/automat`:

1. volá `GET /machines/{machineId}` se serverovým klíčem
2. **seskupí řádky podle produktu** — API vrací řádek na každou spirálu, jeden produkt ve dvou
   spirálách přijde dvakrát; zásoby sečíst
3. výsledek cachovat 10–15 minut (Cache API), aby se API nevolalo při každém načtení
4. při chybě vrátit poslední známý stav ze Sanity + čas poslední aktualizace — **web nesmí spadnout
   kvůli cizímu API**

Frontend zobrazuje kategorie (Vše / Nápoje / Občerstvení / Nejprodávanější / Poslední kusy),
proužek dostupnosti a hranici „poslední kusy" (návrh: ≤ 3 ks nebo ≤ 25 % kapacity spirály).

**Bezpečnost:** klíč má `partner:write`, tedy umí zakládat i rušit objednávky. Nikdy nesmí být
v klientském JavaScriptu. Uložit jako šifrovanou proměnnou v Cloudflare.

**Fáze 2 (zatím neschváleno)** — objednávka s výdejním kódem přes `POST /machines/{id}/orders`.
Vyžaduje platební bránu, obchodní podmínky, reklamační řád a řešení nevydaného zboží. Samostatný projekt.

Na web nepatří: tržby, marže, počty prodejů v korunách, obsah objednávek zákazníků.

---

## 7. Právní a měření

- Cookie lišta: analytika se spustí až po souhlasu; volba se ukládá lokálně.
- Zásady GDPR i cookies psát vlastní, nekopírovat z jiného webu.
- Měření: Cloudflare Web Analytics (bez cookies) nebo GA4 po souhlasu.
- Konverzní cíl: odeslání formuláře, s rozlišením podle pole `zamer`.
- **Společnost není plátcem DPH.** V patičce i u všech cenových sdělení uvádět „Nejsme plátci DPH" — ceny v nabídkách jsou konečné. Nikdy nepsat „ceny bez DPH", to je pro neplátce zavádějící.

---

## 8. Otevřené body

| # | Co chybí | Kdo dodá |
|---|---|---|
| 1 | `machineId` automatu | Lukáš / Martin |
| 2 | API klíč MůjAutomat — vložit přímo do Cloudflare, ne do chatu | Martin |
| 3b | Právní kontrola textu cookies před zveřejněním | Lukáš |
| 4 | Přesná adresa umístění automatu | Lukáš |
| 5 | Další fotky — detail displeje, produkty, večerní záběr | Lukáš |
| 6 | Portréty zakladatelů | oba |
| 7 | Rozhodnutí Fáze 2 (objednávky) | oba |
