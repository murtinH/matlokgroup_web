# matlok-web

Web skupiny **Matlok Group s.r.o.** — Astro 7 + Sanity + Cloudflare Pages.

## Co je v repozitáři

| Složka / soubor | Co to je |
|---|---|
| `ZADANI.md` | Technické zadání — stack, routy, formulář, obsahový model, integrace API. **Začni tady.** |
| `CLAUDE.md` | Konvence projektu — čte se automaticky v Claude Code. |
| `prototyp/` | Statický HTML prototyp všech stránek. Vizuální předloha. Nepatří do produkce. |
| `src/styles/tokens/` | Design tokeny ze styleguidu. Kopie — needitovat ručně. |
| `studio/` | Sanity Studio (redakční systém). Vlastní npm workspace. |
| `.env.example` | Šablona proměnných prostředí. Skutečné klíče do repozitáře nikdy. |

## Stav

**Fáze 1 — kostra stojí.** Astro i Studio běží lokálně, tokeny jsou napojené, stránky zatím nejsou.

## Jak to rozjet

```bash
npm install        # nainstaluje Astro i Studio najednou (npm workspaces)
npm run dev        # web na http://localhost:4321
npm run dev:studio # Sanity Studio na http://localhost:3333
npm run build      # statický build do dist/
```

Do Studia se přihlašuješ svým Sanity účtem. Projekt: `jew7wcoq`, dataset `production`.

Potřebuješ Node 22.12 nebo novější (`node -v`).

## Kdo na tom dělá

- Lukáš Diblíček — obsah, texty, fotky
- Martin Hrouda — technika, nasazení, doména, API

Pracujeme přes branche a pull requesty. Do `main` se needituje přímo.
