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
      title: 'Logo',
      type: 'image',
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
