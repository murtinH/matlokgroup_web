# Nasazení na Cloudflare Pages

Postup pro Session 4. Kroky, které vyžadují tvůj účet, jsou označené **[ty]**.
Kroky, které udělám já, jsou označené **[Claude]**.

---

## 0 · Co si připravit předem

| Co | Kde | Poznámka |
|---|---|---|
| Účet Cloudflare | dash.cloudflare.com | zdarma |
| Sanity write token | sanity.io/manage → API → Tokens | oprávnění **Editor** |
| Účet Resend | resend.com | zdarma do 3 000 e-mailů měsíčně |
| Přístup do DNS domény | panel Websupport | **ne Active24, viz kapitola 4** |

**Žádný z těchto klíčů se nesmí objevit v repozitáři ani v chatu.** Vkládají se
přímo do Cloudflare jako šifrované proměnné.

---

## 1 · [ty] Založení projektu v Cloudflare Pages

Cloudflare → Workers & Pages → Create → Pages → Connect to Git → repozitář
`murtinH/matlokgroup_web`.

Nastavení buildu — **root directory je zásadní**, projekt není v kořeni repozitáře:

| Pole | Hodnota |
|---|---|
| Production branch | `main` |
| Root directory | `matlok-web` |
| Build command | `npm run build` |
| Build output directory | `dist` |

Serverové funkce ze složky `matlok-web/functions/` si Cloudflare najde sám.

---

## 2 · [ty] Proměnné prostředí

Settings → Environment variables → Production **i** Preview.

| Název | Hodnota | Typ |
|---|---|---|
| `NODE_VERSION` | `22.12.0` | text |
| `PUBLIC_SANITY_PROJECT_ID` | `jew7wcoq` | text |
| `PUBLIC_SANITY_DATASET` | `production` | text |
| `SANITY_WRITE_TOKEN` | *(token ze Sanity)* | **šifrovaná** |
| `RESEND_API_KEY` | *(klíč z Resendu)* | **šifrovaná** |

`NODE_VERSION` tam musí být — Astro 7 potřebuje Node 22.12 nebo novější
a Cloudflare jinak nasadí starší verzi, na které build spadne.

### Úložiště pro omezení počtu odeslání

Storage & Databases → KV → Create → název `matlok-rate-limit`.
Pak v Pages → Settings → Bindings → Add → KV namespace:

| Variable name | KV namespace |
|---|---|
| `RATE_LIMIT` | `matlok-rate-limit` |

Bez tohohle bindingu formulář funguje dál, jen se neomezuje počet odeslání.
Funkce to pozná sama a nespadne.

---

## 3 · [ty] Resend a odesílací doména

Resend → Domains → Add Domain → `matlok.cz`. Resend vypíše několik DNS
záznamů (DKIM a jeden pro sledování doručení).

**Tyhle záznamy přidávej až po přenosu DNS na Cloudflare** (kapitola 4),
jinak je budeš zadávat dvakrát.

Funkce odesílá z adresy `web@matlok.cz`. Schránka pro ni existovat nemusí —
odpovědi chodí na adresu z formuláře, protože se nastavuje `reply_to`.

Notifikace chodí na adresu z pole **notifikacniEmail** v Nastavení webu
v Sanity. Jde ji změnit bez nasazení.

---

## 4 · [ty + Claude] Doména matlok.cz

### Pozor: nameservery nejsou u Active24

Zadání mluví o Active24, ale doména běží na nameserverech **Websupport**:

```
ns1.websupport.cz
ns2.websupport.cz
ns3.websupport.eu
```

Websupport a Active24 patří do stejné skupiny, takže přihlašovací údaje
nejspíš znáš — jen hledej správný panel.

### Než přepneš nameservery

Cloudflare při zakládání zóny naskenuje současné DNS a většinu záznamů
naimportuje sám. **Není to spolehlivé** a jeden chybějící MX záznam znamená,
že přestane chodit pošta.

**Vyexportuj si zónu z panelu Websupport** (Export / Stáhnout zónový soubor)
a projeď proti tomuhle seznamu. Tohle jsem načetl zvenčí — je to minimum,
které musí po přepnutí sedět:

#### Pošta — nejdůležitější

```
MX   matlok.cz   10   fa96ff1ffd9a8783.mx2.emailprofi.seznam.cz.
MX   matlok.cz   20   fa96ff1ffd9a8783.mx1.emailprofi.seznam.cz.
```

Ten hexadecimální prefix je **unikátní pro tvoji doménu**. Opiš ho znak po znaku.
Všimni si, že `mx2` má nižší číslo priority než `mx1` — je to tak správně,
neopravuj to.

```
TXT  matlok.cz          v=spf1 include:spf.seznam.cz ~all
TXT  _dmarc.matlok.cz   v=DMARC1; p=quarantine; adkim=r; aspf=r;
```

**DKIM zvenčí nevidím** — selektor se nedá uhodnout. V panelu Websupport hledej
záznam typu TXT s názvem končícím na `._domainkey`. Pokud tam je, musí přejít taky,
jinak začne pošta padat do spamu.

#### Poštovní servery

```
A  mail.matlok.cz      45.13.137.122
A  smtp.matlok.cz      45.13.137.122
A  imap.matlok.cz      45.13.137.122
A  webmail.matlok.cz   45.13.137.122
```

#### Ostatní

```
TXT  matlok.cz                     apple-domain-verification=K5gz58KP4KVz81tS
SRV  _autodiscover._tcp.matlok.cz  0 0 443 web.prod.bts.websupport.sk.
A    *.matlok.cz                   37.9.175.165
```

Zástupný záznam `*` míří na současný hosting. **Po přepnutí ho nepřenášej** —
web pojede z Cloudflare a zástupný záznam by přesměrovával neexistující
poddomény na starý server.

### Postup přepnutí

1. Cloudflare → Add a site → `matlok.cz` → Free plan
2. Cloudflare naimportuje záznamy. **Projeď je proti seznamu výš.**
   Chybějící dopiš ručně, teprve pak pokračuj.
3. MX a poštovní záznamy nastav jako **DNS only** (šedý mráček), ne proxied.
   Přes proxy pošta nefunguje.
4. Teprve teď v panelu Websupport přepni nameservery na ty, které dá Cloudflare.
5. Změna se propisuje řádově hodiny. Do té doby běží stará zóna.
6. Po propsání přidej doménu v Pages → Custom domains → `matlok.cz` i `www.matlok.cz`.

### Kontrola po přepnutí

```bash
dig +short MX matlok.cz
dig +short TXT matlok.cz
```

Pošli si testovací e-mail z jiné schránky na `info@matlok.cz` a ověř, že dorazil.
**Dokud to neuděláš, nepovažuj přenos za hotový.**

---

## 5 · [ty] Přestavba webu po změně obsahu

Web je statický — obsah se ze Sanity vytáhne při buildu a zapeče do HTML.
Bez tohohle kroku by se změna textu ve Studiu na webu **nikdy neprojevila**.

1. Cloudflare Pages → Settings → Builds & deployments → Deploy hooks →
   Create → název `sanity`, branch `main`. Zkopíruj vzniklou adresu.
2. sanity.io/manage → projekt → API → Webhooks → Create webhook:

| Pole | Hodnota |
|---|---|
| Name | Přestavba webu |
| URL | *(adresa z kroku 1)* |
| Dataset | `production` |
| Trigger on | Create, Update, Delete |
| Filter | `_type in ["siteSettings","homePage","matlokPage","sluzbyPage","kontaktPage","division","founder","service","principle","faq","product","machine","legalPage"]` |
| HTTP method | POST |

Filtr je tam schválně: bez něj by každá přijatá poptávka spustila přestavbu webu.

Po uložení textu ve Studiu je změna na webu do zhruba dvou minut.

---

## 6 · [Claude] Co je hotové v kódu

- `functions/api/poptavka.ts` — validace, honeypot, omezení počtu odeslání,
  zápis do Sanity, notifikační e-mail
- `src/components/CookieLista.astro` — souhlas, analytika až po něm
- `public/_headers` — bezpečnostní hlavičky, trvalá cache pro soubory s otiskem
- `public/_redirects` — `www.matlok.cz` → `matlok.cz`

---

## Co zbývá po nasazení

- **Token analytiky**: Cloudflare → Web Analytics → přidat `matlok.cz`, token vložit
  do pole *Token Cloudflare Web Analytics* v Nastavení webu v Sanity.
  Dokud je prázdný, lišta se ptá, ale žádné měření se nespouští.
- **Zásady ochrany osobních údajů**: text zatím neexistuje, stránka to poctivě říká.
- **Právní kontrola cookies a GDPR** před spuštěním.
