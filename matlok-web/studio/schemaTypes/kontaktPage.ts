import {defineField, defineType} from 'sanity'

/** Dvojice text + strojová hodnota. Hodnota je smlouva se serverovou funkcí, text se smí měnit. */
const volba = (nazev: string, titulek: string, hodnoty?: {title: string; value: string}[]) => ({
  type: 'object' as const,
  name: nazev,
  title: titulek,
  fields: [
    {name: 'text', title: 'Text', type: 'string'},
    hodnoty
      ? {name: 'hodnota', title: 'Hodnota', type: 'string', options: {list: hodnoty}}
      : {name: 'hodnota', title: 'Hodnota', type: 'string'},
  ],
  preview: {select: {title: 'text', subtitle: 'hodnota'}},
})

export const kontaktPage = defineType({
  name: 'kontaktPage',
  title: 'Stránka Kontakt',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Úvod'},
    {name: 'formular', title: 'Formulář'},
    {name: 'faq', title: 'FAQ'},
  ],
  fields: [
    // --- Úvod ---
    defineField({name: 'slib', title: 'Odznak nad nadpisem', type: 'string', group: 'hero',
      description: 'Například: Konzultace i cenová nabídka zdarma'}),
    defineField({name: 'heroNadpis', title: 'Nadpis — první řádek', type: 'string', group: 'hero',
      validation: (r) => r.required()}),
    defineField({name: 'heroNadpisTip', title: 'Nadpis — druhý řádek', type: 'string', group: 'hero',
      validation: (r) => r.required()}),
    defineField({name: 'heroLead', title: 'Perex', type: 'text', rows: 4, group: 'hero',
      validation: (r) => r.required()}),
    defineField({
      name: 'popiskyUdaju', title: 'Popisky kontaktních údajů', type: 'object', group: 'hero',
      description: 'Samotné hodnoty se berou z Nastavení webu, tady jsou jen jejich názvy.',
      fields: [
        {name: 'spolecnost', title: 'Společnost', type: 'string'},
        {name: 'sidlo', title: 'Sídlo', type: 'string'},
        {name: 'ico', title: 'IČO', type: 'string'},
        {name: 'zapis', title: 'Zápis v obchodním rejstříku', type: 'string'},
        {name: 'telefon', title: 'Telefon', type: 'string'},
        {name: 'email', title: 'E-mail', type: 'string'},
      ],
    }),

    // --- Formulář ---
    defineField({
      name: 'nadpisyKroku', title: 'Nadpisy kroků', type: 'object', group: 'formular',
      fields: [
        {name: 'zamer', title: 'Krok 1', type: 'string'},
        {name: 'sluzby', title: 'Krok 2 — digitální řešení', type: 'string'},
        {name: 'lokalita', title: 'Krok 2 — automat', type: 'string'},
        {name: 'kontakt', title: 'Krok 3', type: 'string'},
      ],
    }),
    defineField({
      name: 'zamery', title: 'Volby záměru', type: 'array', group: 'formular',
      description: 'Podle hodnoty se přepíná druhý blok polí a třídí se poptávky.',
      of: [{
        type: 'object', name: 'zamer',
        fields: [
          {name: 'text', title: 'Text', type: 'string'},
          {name: 'popis', title: 'Popis pod textem', type: 'string'},
          {
            name: 'hodnota', title: 'Hodnota', type: 'string',
            options: {
              list: [
                {title: 'Digitální řešení', value: 'services'},
                {title: 'Automat na lokalitu', value: 'automat'},
                {title: 'Něco jiného', value: 'jine'},
              ],
            },
          },
        ],
        preview: {select: {title: 'text', subtitle: 'popis'}},
      }],
      validation: (r) => r.max(3),
    }),
    defineField({name: 'sluzbyVolby', title: 'Zaškrtávátka služeb', type: 'array', group: 'formular',
      of: [volba('sluzbaVolba', 'Služba')]}),
    defineField({name: 'stavVolby', title: 'Jak jsou na tom teď', type: 'array', group: 'formular',
      of: [{type: 'string'}]}),
    defineField({name: 'typVolby', title: 'Typ lokality', type: 'array', group: 'formular',
      of: [{type: 'string'}]}),
    defineField({name: 'navstevnostVolby', title: 'Odhad návštěvnosti', type: 'array', group: 'formular',
      of: [{type: 'string'}]}),
    defineField({name: 'rezimVolby', title: 'Preferovaný režim', type: 'array', group: 'formular',
      of: [{type: 'string'}]}),
    defineField({
      name: 'napovedy', title: 'Nápovědy v polích', type: 'object', group: 'formular',
      description: 'Text, který je v prázdném poli. U výběrových polí slouží jako první, nevybraná položka.',
      fields: [
        {name: 'obor', title: 'Obor podnikání', type: 'string'},
        {name: 'stav', title: 'Jak jste na tom teď', type: 'string'},
        {name: 'typ', title: 'Typ lokality', type: 'string'},
        {name: 'misto', title: 'Obec / adresa', type: 'string'},
        {name: 'navstevnost', title: 'Odhad návštěvnosti', type: 'string'},
        {name: 'rezim', title: 'Preferovaný režim', type: 'string'},
        {name: 'jmeno', title: 'Jméno', type: 'string'},
        {name: 'firma', title: 'Firma', type: 'string'},
        {name: 'email', title: 'E-mail', type: 'string'},
        {name: 'telefon', title: 'Telefon', type: 'string'},
        {name: 'zprava', title: 'Zpráva', type: 'string'},
      ],
    }),
    defineField({name: 'odeslatText', title: 'Text odesílacího tlačítka', type: 'string', group: 'formular'}),
    defineField({name: 'souhlasText', title: 'Text pod tlačítkem', type: 'text', rows: 3, group: 'formular',
      description: 'Slovo v hranatých závorkách se stane odkazem na zásady, například [zásad].'}),
    defineField({name: 'souhlasOdkaz', title: 'Cíl odkazu v textu pod tlačítkem', type: 'string', group: 'formular'}),
    defineField({name: 'potvrzeni', title: 'Potvrzení po odeslání', type: 'text', rows: 2, group: 'formular',
      description: 'Nahradí formulář po úspěšném odeslání. Zprovozní se v Session 4.'}),

    // --- FAQ ---
    defineField({name: 'faqEyebrow', title: 'Nadřádek', type: 'string', group: 'faq'}),
    defineField({name: 'faqNadpis', title: 'Nadpis', type: 'string', group: 'faq'}),
    defineField({name: 'faqLead', title: 'Perex', type: 'text', rows: 3, group: 'faq'}),
    defineField({
      name: 'faqFiltry', title: 'Filtry kategorií', type: 'array', group: 'faq',
      of: [volba('faqFiltr', 'Filtr', [
        {title: 'Vše', value: 'all'},
        {title: 'O skupině', value: 'skupina'},
        {title: 'Weby a digitál', value: 'web'},
        {title: 'Automaty', value: 'automat'},
      ])],
    }),
    defineField({
      name: 'poznamkaDph', title: 'Poznámka o DPH', type: 'text', rows: 2, group: 'faq',
      description: 'Nikdy nepsat "ceny bez DPH". Společnost není plátcem DPH, ceny jsou konečné.',
      validation: (rule) =>
        rule.custom((hodnota) =>
          typeof hodnota === 'string' && /bez\s+DPH/i.test(hodnota)
            ? 'Nepoužívat "bez DPH". Společnost není plátcem DPH, ceny jsou konečné.'
            : true,
        ),
    }),
  ],
  preview: {prepare: () => ({title: 'Stránka Kontakt'})},
})
