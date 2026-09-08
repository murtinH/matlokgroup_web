# Nasazení na Cloudflare Workers

Postup pro Session 4. Web běží jako **Worker se statickými soubory**, ne jako
Pages — Cloudflare do Pages už rok nepřidává nic nového a v dashboardu nabízí
rovnou tenhle model. Kroky, které vyžadují tvůj účet, jsou označené **[ty]**.
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

## 1 · [ty] Založení projektu

Cloudflare → Workers & Pages → Create → Connect to Git → repozitář
`murtinH/matlokgroup_web`.

| Pole | Hodnota |
|---|---|
| Project name | `matlokgroup-web` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

### Root directory — bez tohohle build spadne

Projekt **není v kořeni repozitáře**, ale v podsložce `matlok-web/`. Když se
to nenastaví, pustí Cloudflare `npm run build` tam, kde žádný `package.json`
není, a build skončí hned.

V průvodci se to pole neobjeví. Po založení projektu jdi do
**Settings → Build → Root directory** a nastav `matlok-web`.

Jestli první build spadne dřív, než to stihneš, nevadí — po opravě nastavení
spustíš nový přes **Retry deployment**.

### Co je v repozitáři

`matlok-web/wrangler.jsonc` říká Cloudflaru, kde jsou statické soubory
(`./dist`) a který skript obsluhuje zbytek (`worker/index.ts`). Konfigurace
tedy žije v gitu, ne v dashboardu — když ji někdo změní, je to vidět v historii.

---

## 2 · [ty] Proměnné prostředí

Settings → Variables and Secrets.

| Název | Hodnota | Typ |
|---|---|---|
| `SANITY_WRITE_TOKEN` | *(token ze Sanity, viz níž)* | **Secret** |
| `RESEND_API_KEY` | *(klíč z Resendu)* | **Secret** |

**Nic dalšího tam nepatří.** Veřejné identifikátory Sanity jsou
v `src/lib/konfigurace.ts` — build i serverový skript je čtou odtud,
takže se nemůžou rozejít a nemusí se nikde klikat.

`NODE_VERSION` nastavovat nemusíš, Cloudflare sám používá Node 24.

### Sanity token

Token jsem už vytvořil přes příkazovou řádku, jmenuje se **`cloudflare-poptavky`**
a má roli Editor. Jeho hodnotu ale neznám ani já, ani ty — Sanity ji ukáže jen
jednou při vytvoření a já ji uložil rovnou do souboru `.dev.vars`, který je
mimo repozitář.

Pro Cloudflare si vytvoř vlastní: sanity.io/manage → projekt → API → Tokens →
Add API token, role **Editor**. Hodnotu zkopíruj rovnou do Cloudflare a nikam
jinam ji nevkládej.

### Úložiště pro omezení počtu odeslání

Storage & Databases → KV → Create → název `matlok-rate-limit`.
Zkopíruj **ID** vzniklého úložiště a pošli mi ho — doplním ho do
`wrangler.jsonc`, aby konfigurace zůstala v gitu:

```jsonc
"kv_namespaces": [{ "binding": "RATE_LIMIT", "id": "<id z dashboardu>" }]
```

ID není tajné, je to jen identifikátor.

Bez tohohle bindingu formulář funguje dál, jen se neomezuje počet odeslání.
Skript to pozná sám a nespadne.

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
6. Po propsání přidej doménu v projektu → Settings → Domains & Routes →
   `matlok.cz` i `www.matlok.cz`. Přesměrování z www na holou doménu řeší skript sám.

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

1. Cloudflare → projekt → Settings → Builds → Deploy hooks → Create →
   název `sanity`, branch `main`. Zkopíruj vzniklou adresu.
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

- `wrangler.jsonc` — kde jsou statické soubory a co obsluhuje zbytek
- `worker/index.ts` — směrování, přesměrování z www
- `worker/poptavka.ts` — validace, honeypot, omezení počtu odeslání,
  zápis do Sanity, notifikační e-mail
- `src/components/CookieLista.astro` — souhlas, analytika až po něm
- `public/_headers` — bezpečnostní hlavičky, trvalá cache pro soubory s otiskem

Vyzkoušené lokálně přes `npm run cf:dev` proti skutečnému Sanity:
stránky se servírují, `/api/poptavka` odmítá GET, past na roboty vrací
„odesláno" a nic neuloží, chybné vstupy vrací srozumitelné hlášky
a platná poptávka se v Sanity objeví jen s poli, která k danému záměru patří.

---

## Co zbývá po nasazení

- **Token analytiky**: Cloudflare → Web Analytics → přidat `matlok.cz`, token vložit
  do pole *Token Cloudflare Web Analytics* v Nastavení webu v Sanity.
  Dokud je prázdný, lišta se ptá, ale žádné měření se nespouští.
- **Zásady ochrany osobních údajů**: text zatím neexistuje, stránka to poctivě říká.
- **Právní kontrola cookies a GDPR** před spuštěním.
