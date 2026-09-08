import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Nastavení webu',
  type: 'document',
  // Jediný dokument svého druhu. Nezakládat druhý.
  fields: [
    defineField({
      name: 'nazev',
      title: 'Název společnosti',
      type: 'string',
      initialValue: 'Matlok Group s.r.o.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo — tmavé',
      type: 'image',
      description: 'Pro světlé podklady, například navigace.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'logoInverzni',
      title: 'Logo — bílé',
      type: 'image',
      description: 'Pro tmavé podklady, například patička.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'adresa',
      title: 'Sídlo',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'ico',
      title: 'IČO',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'spisovaZnacka',
      title: 'Spisová značka',
      type: 'string',
      description: 'Například: C 451894 vedená u Městského soudu v Praze',
    }),
    defineField({
      name: 'telefon',
      title: 'Telefon',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Veřejný e-mail',
      type: 'string',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'neplatceDph',
      title: 'Není plátcem DPH',
      type: 'boolean',
      initialValue: true,
      description:
        'Když je zapnuto, web uvádí "Nejsme plátci DPH" a ceny popisuje jako konečné. Nikdy nepsat "ceny bez DPH" — pro neplátce je to zavádějící.',
    }),
    defineField({
      name: 'socialniSite',
      title: 'Sociální sítě',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'sit', title: 'Síť', type: 'string'},
            {name: 'url', title: 'Odkaz', type: 'url'},
          ],
          preview: {select: {title: 'sit', subtitle: 'url'}},
        },
      ],
    }),
    defineField({
      name: 'popisPaticky',
      title: 'Popis v patičce',
      type: 'text',
      rows: 3,
      description: 'Krátký odstavec pod logem v patičce.',
    }),
    defineField({
      name: 'navigace',
      title: 'Hlavní navigace',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'polozka',
          fields: [
            {name: 'text', title: 'Text', type: 'string'},
            {name: 'odkaz', title: 'Odkaz', type: 'string'},
          ],
          preview: {select: {title: 'text', subtitle: 'odkaz'}},
        },
      ],
    }),
    defineField({
      name: 'navigaceTlacitko',
      title: 'Tlačítko v navigaci',
      type: 'object',
      fields: [
        {name: 'text', title: 'Text', type: 'string'},
        {name: 'odkaz', title: 'Odkaz', type: 'string'},
      ],
    }),
    defineField({
      name: 'patickaSloupce',
      title: 'Sloupce v patičce',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'sloupec',
          fields: [
            {name: 'nadpis', title: 'Nadpis', type: 'string'},
            {
              name: 'odkazy',
              title: 'Odkazy',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'odkaz',
                  fields: [
                    {name: 'text', title: 'Text', type: 'string'},
                    {name: 'odkaz', title: 'Cíl', type: 'string'},
                  ],
                  preview: {select: {title: 'text', subtitle: 'odkaz'}},
                },
              ],
            },
          ],
          preview: {
            select: {title: 'nadpis', odkazy: 'odkazy'},
            prepare: ({title, odkazy}: any) => ({title, subtitle: `${(odkazy ?? []).length} odkazů`}),
          },
        },
      ],
    }),
    defineField({
      name: 'cookieLista',
      title: 'Cookie lišta',
      type: 'object',
      fields: [
        {name: 'text', title: 'Text', type: 'text', rows: 3},
        {name: 'odkazText', title: 'Text odkazu na zásady', type: 'string'},
        {name: 'odkaz', title: 'Cíl odkazu', type: 'string'},
        {name: 'souhlas', title: 'Tlačítko souhlasu', type: 'string'},
        {name: 'odmitnuti', title: 'Tlačítko odmítnutí', type: 'string'},
      ],
    }),
    defineField({
      name: 'analytikaToken',
      title: 'Token Cloudflare Web Analytics',
      type: 'string',
      description:
        'Veřejný identifikátor měření. Skript se načte až po souhlasu v cookie liště. Prázdné pole = žádné měření.',
    }),
    defineField({
      name: 'chystanaStranka',
      title: 'Text nenapsané stránky',
      type: 'object',
      description:
        'Zobrazí se na právní stránce, jejíž text ještě neexistuje — místo chyby 404. Jakmile dokument vznikne, tenhle text zmizí sám.',
      fields: [
        {name: 'nadradek', title: 'Nadřádek', type: 'string'},
        {name: 'titulek', title: 'Titulek', type: 'string'},
        {name: 'text', title: 'Text', type: 'text', rows: 4},
      ],
    }),
    defineField({
      name: 'notifikacniEmail',
      title: 'E-mail pro poptávky',
      type: 'string',
      description: 'Kam chodí notifikace o vyplněném formuláři. Může se lišit od veřejného e-mailu.',
      validation: (rule) => rule.required().email(),
    }),
  ],
  preview: {
    select: {title: 'nazev', subtitle: 'email'},
  },
})
