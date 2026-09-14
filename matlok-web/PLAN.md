# Plán dalšího vývoje

Pořadí určil Martin 14. 9. 2026, aby se na něj nemuselo myslet. Další bod se
začíná, až je předchozí nasazený a ověřený. Každý bod = vlastní branch
a pull request. Pořadí se mění jen po domluvě.

## Hotovo

- **Upozornění a týdenní report z automatu** — e-mail, když zboží dochází nebo
  se vyprodá a když MůjAutomat neodpovídá; každé pondělí souhrn prodejů
  a tržeb s návrhem, co doplnit. Kód `worker/provoz.ts`, nastavení v Sanity
  u dokumentu Automat, provoz v `NASAZENI.md`.

## Na řadě

### 1. Cizojazyčné AI překlady

Web v dalších jazycích pro hosty Špindlerova Mlýna.

- **Jak:** překlad připraví AI v Sanity, člověk ho před zveřejněním schválí.
  Adresy `/de/…`, `/pl/…`, `/en/…`, `hreflang` a sitemap pro každý jazyk.
- **Rozhodnout:** které jazyky, které stránky (automat a kontakt určitě,
  právní texty spíš ne bez právníka), kdo překlady schvaluje.
- **Pozor:** názvy divizí a značky se nepřekládají, ceny zůstávají v Kč
  a jako konečné (neplátce DPH).

### 2. Doklady do účetnictví

Aby účetní dostávala podklady sama, bez přeposílání.

- **Jak:** napojení na účetní systém, který účetní používá (Fakturoid,
  iDoklad, Pohoda…). Měsíční souhrn tržeb z automatu — MůjAutomat má
  účetní export přes stejný typ API klíče — a přijaté doklady.
- **Rozhodnout:** jaký systém, co přesně a v jakém formátu účetní chce,
  jestli jen automat, nebo i Digital Services.
- **Pozor:** tržby a doklady jen interně, nikdy na web.

### 3. Recenze

Sběr a zobrazení skutečných hodnocení.

- **Jak:** QR kód u automatu a odkaz po dokončené zakázce vedou na hodnocení
  na Googlu. Na webu vybrané recenze se jménem a zdrojem. AI může navrhnout
  odpověď na recenzi, odesílá ji člověk.
- **Pozor:** o hodnocení se žádá všech zákazníků, ne jen spokojených, a nic se
  za ně neplatí (pravidla Googlu). Zákon o ochraně spotřebitele vyžaduje u
  zveřejněných recenzí uvést, jestli a jak se ověřuje, že jsou od skutečných
  zákazníků. Hvězdičky ve výsledcích Googlu u vlastních recenzí firmy
  nečekat — Google je pro Organization nezobrazuje.

### 4. AI asistent (chatbot)

Asistent na webu, který odpovídá z obsahu webu.

- **Jak:** endpoint ve workeru, klíč k modelu jen v Cloudflare. Odpovídá
  výhradně ze Sanity (služby, ceník, FAQ, automat); když odpověď nezná,
  nabídne poptávkový formulář. Omezení počtu dotazů a Turnstile jako u
  formuláře.
- **Rozhodnout:** poskytovatel modelu, na kterých stránkách, jazyky
  (navazuje na bod 1), měsíční rozpočet.
- **Pozor:** návštěvník musí vědět, že píše s AI (AI Act, čl. 50, platí od
  2. 8. 2026). Smlouva o zpracování osobních údajů s poskytovatelem a zmínka
  v zásadách ochrany osobních údajů. Ceny a termíny jen z ceníku, nic
  nevymýšlet.

## Otevřené body mimo kód

| Co | Kdo |
|---|---|
| Právní kontrola textů cookies a zásad ochrany osobních údajů | Lukáš |
| Nový klíč MůjAutomat — ten starý byl kdysi vložený do chatu. Vygenerovat nový, vložit do Cloudflare jako `MUJAUTOMAT_API_KEY`, starý zneplatnit | Martin |
| Doplnit `--azure-800` (#147390) do styleguidu v iCloudu | Martin |
| Search Console: odeslat `https://matlok.cz/sitemap-index.xml` | Martin |
| Cloudflare → Caching → Browser Cache TTL: „Respect Existing Headers“ (volitelné) | Martin |
| Vizuální identita Digital Services — odloženo | oba |
| Smazat šest ukázkových produktů z prototypu v Sanity (volitelné) | Martin |
