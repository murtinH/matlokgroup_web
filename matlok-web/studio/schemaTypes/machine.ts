import {defineField, defineType} from 'sanity'

export const machine = defineType({
  name: 'machine',
  title: 'Automat',
  type: 'document',
  fields: [
    defineField({
      name: 'nazev',
      title: 'Název',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'machineId',
      title: 'ID v MůjAutomat',
      type: 'string',
      description:
        'Identifikátor stroje v Partner API MůjAutomat. Podle něj se načítá živá nabídka. Není to tajný údaj — klíč k API se sem nepíše.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lokalita',
      title: 'Lokalita',
      type: 'string',
      description: 'Adresa nebo popis místa, kde box stojí.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gps',
      title: 'GPS',
      type: 'geopoint',
    }),
    defineField({
      name: 'oteviraciDoba',
      title: 'Otevírací doba',
      type: 'string',
      initialValue: '24/7',
    }),
    defineField({
      name: 'platby',
      title: 'Způsoby platby',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Platební karta', value: 'karta'},
          {title: 'Telefon', value: 'telefon'},
          {title: 'QR kód', value: 'qr'},
        ],
      },
      description: 'Hotovost box nepřijímá.',
    }),
    defineField({
      name: 'stav',
      title: 'Stav',
      type: 'string',
      options: {
        list: [
          {title: 'V provozu', value: 'live'},
          {title: 'Mimo provoz', value: 'off'},
        ],
        layout: 'radio',
      },
      initialValue: 'live',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'nazev', subtitle: 'lokalita'},
  },
})
