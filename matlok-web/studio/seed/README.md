# Počáteční obsah

`obsah.ndjson` je jednorázový import obsahu opsaný z prototypu ve složce `prototyp/`.
Slouží k naplnění prázdného datasetu, ne k průběžné správě — jakmile se obsah edituje
ve Studiu, tenhle soubor přestává být zdrojem pravdy.

**Import proběhl 8. 9. 2026** do datasetu `production`. Od té chvíle je zdrojem pravdy
Studio.

> **Pozor:** `--replace` nahrazuje celé dokumenty, ne jen změněná pole. Cokoli, co
> v tomhle souboru chybí, import smaže — přesně takhle zmizela z `siteSettings` obě
> loga. Proto sem patří i odkazy na nahrané obrázky. Než soubor pustíš znovu, ověř,
> že obsahuje všechno, co je v datasetu.

## Import

```bash
npx sanity login                                  # jednou, otevře prohlížeč
npx sanity dataset import seed/obsah.ndjson production --replace
```

`--replace` přepíše dokumenty se stejným `_id`. Import lze pustit znovu, aniž vzniknou duplicity.

## Co je uvnitř

| Typ | Počet | Odkud |
|---|---|---|
| `siteSettings` | 1 | patička prototypu, včetně odkazů na obě loga |
| `homePage` | 1 | `prototyp/index.html` — texty, které nemají vlastní dokument |
| `matlokPage` | 1 | `prototyp/matlok.html` — texty, které nemají vlastní dokument |
| `sluzbyPage` | 1 | `prototyp/sluzby.html` — texty, které nemají vlastní dokument |
| `kontaktPage` | 1 | `prototyp/kontakt.html` — texty formuláře, nápovědy polí a volby |
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
- **Portréty zakladatelů.** Nahrají se ve Studiu. Do té doby se v kartách zobrazuje
  monogram, stejně jako v prototypu.
- **Obrázky samotné.** Import odkazuje na assety podle ID, ale binární data nenahrává.
  Do prázdného datasetu je proto potřeba obrázky nahrát zvlášť, jinak zůstanou odkazy viset.
- **Zásady ochrany osobních údajů.** Text zatím neexistuje, dodá Lukáš.
  Cookies jsou hotové a v importu jsou.
- **Sociální sítě** v `siteSettings` jsou prázdné — nikde v prototypu nebyly odkazy.
