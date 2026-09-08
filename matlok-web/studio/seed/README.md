# Počáteční obsah

`obsah.ndjson` je jednorázový import obsahu opsaný z prototypu ve složce `prototyp/`.
Slouží k naplnění prázdného datasetu, ne k průběžné správě — jakmile se obsah edituje
ve Studiu, tenhle soubor přestává být zdrojem pravdy.

## Import

```bash
npx sanity login                                  # jednou, otevře prohlížeč
npx sanity dataset import seed/obsah.ndjson production --replace
```

`--replace` přepíše dokumenty se stejným `_id`. Import lze pustit znovu, aniž vzniknou duplicity.

## Co je uvnitř

| Typ | Počet | Odkud |
|---|---|---|
| `siteSettings` | 1 | patička prototypu |
| `division` | 5 | `prototyp/index.html` |
| `machine` | 1 | `prototyp/matlok.html` |
| `product` | 6 | `prototyp/matlok.html` — **ukázková data**, ne skutečné zásoby |
| `service` | 6 | `prototyp/sluzby.html` |
| `principle` | 6 | `prototyp/sluzby.html` |
| `founder` | 2 | `prototyp/index.html` |
| `faq` | 18 | `prototyp/kontakt.html` |
| `legalPage` | 1 | `prototyp/cookies.html` |

## Co v importu chybí

- **`machine.machineId` má hodnotu `DOPLNIT`.** Skutečné ID dodá Lukáš nebo Martin
  (otevřený bod č. 1 v `ZADANI.md`). Bez něj nepojede živá nabídka v Session 5.
- **Fotky.** Portréty zakladatelů ani logo import neobsahuje — nahrají se ve Studiu.
- **Zásady ochrany osobních údajů.** Text zatím neexistuje, dodá Lukáš.
  Cookies jsou hotové a v importu jsou.
- **Sociální sítě** v `siteSettings` jsou prázdné — nikde v prototypu nebyly odkazy.
