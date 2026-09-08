# Konvence projektu matlok-web

Přečti si `ZADANI.md` dřív, než začneš cokoli stavět. Je to zadání, ne inspirace.

## Značka a názvosloví

- Společnost je vždy **Matlok Group s.r.o.** Nikdy „ML Group" — ML je jen logo-monogram.
- Divize: **Matlok**, **Digital Services**, **Property**, **Living**, **PopUp**. Bez prefixu.
- Společnost **není plátcem DPH**. Nikdy nepsat „ceny bez DPH" — psát, že ceny jsou konečné.
- Web je v češtině. Vykání. Krátké oznamovací věty, žádné vykřičníky, žádná emoji.

## Design

- Tokeny jsou v repozitáři: `src/styles/tokens/*.css`. Načítá je `src/styles/global.css`.
  Zdroj pravdy je design systém v iCloudu
  (`03 Matlok Group s.r.o./05 Brand/01 Styleguide/ PRO CLAUDE DESIGN – Design System/tokens/`);
  do repozitáře jsou zkopírované, aby build na Cloudflare nezávisel na iCloudu.
  Když se změní styleguide, tokeny se překopírují — neupravovat je ručně.
- Barvy nikdy natvrdo — vždy přes CSS proměnné.
- Paleta je chladná s jedním modrým akcentem (Azure `#20B9E8`) a jedním teplým (Winter Red).
  **Nové barvy nezavádět.** Odlišení sekcí se dělá odstínem podkladu, ne novým odstínem.
- Azurový čtverec je značkový motiv: patka pod nadpisem, rohový jazýček karty, aktivní filtr.
  Nepoužívat jako odrážku před každým nadpisem.
- Žádné gradienty. Stíny nízké a chladné. Animace 120–360 ms, bez pružení.
- Respektovat `prefers-reduced-motion`.

## Kód

- Astro 7, TypeScript, statický výstup. React jen tam, kde je nutná interaktivita.
  (Zadání psalo Astro 5; při scaffoldu 8. 9. 2026 byla aktuální 7 a projekt je na zelené louce.)
- Tailwind 4. Výchozí paleta Tailwindu je vypnutá v `global.css` — dostupné jsou jen
  značkové barvy (`bg-azure-500`, `text-ink-800`, …). To je záměr, ne chyba.
- Komponenta = jeden účel. Obsah nikdy natvrdo v komponentě — vždy ze Sanity.
- Obrázky přes Sanity CDN s responzivním `srcset`.
- Serverové funkce v `functions/api/`. **Žádný API klíč se nikdy nedostane do klientského kódu.**
- Mobil je výchozí, ne dodatečná úprava.

## Bezpečnost

- Klíč MůjAutomat má `partner:write` — umí zakládat i rušit objednávky. Jen serverově, jen z env.
- Když cizí API neodpoví, web ukáže poslední známý stav ze Sanity. Nikdy nespadne.

## Práce v repozitáři

- Branch na každou změnu, pull request, review druhým.
- Malé commity. `main` je vždy nasaditelný.
