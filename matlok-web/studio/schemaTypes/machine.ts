import {defineArrayMember, defineField, defineType} from 'sanity'

export const machine = defineType({
  name: 'machine',
  title: 'Automat',
  type: 'document',
  fieldsets: [
    {
      name: 'provoz',
      title: 'Upozornění a týdenní report',
      description: 'Jen pro majitele. Nic z toho se na webu nezobrazuje.',
      options: {collapsible: true, collapsed: false},
    },
  ],
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

    // --- Upozornění a report. Čte je worker/provoz.ts. ---
    defineField({
      name: 'prijemci',
      title: 'E-maily pro upozornění a report',
      type: 'array',
      fieldset: 'provoz',
      of: [defineArrayMember({type: 'string', validation: (rule) => rule.email()})],
      description:
        'Kam chodí upozornění a týdenní report. Prázdné = e-mail pro poptávky z Nastavení webu. Report obsahuje tržby — uvádějte jen lidi, kteří je smějí vidět.',
    }),
    defineField({
      name: 'upozorneniZapnuto',
      title: 'Upozornění',
      type: 'boolean',
      fieldset: 'provoz',
      initialValue: true,
      description:
        'E-mail, když zboží dochází nebo se vyprodá, a když automat delší dobu neodpovídá. Chodí jen při zhoršení a ne mezi 22. a 7. hodinou — co se stane v noci, přijde ráno.',
    }),
    defineField({
      name: 'upozorneniHranice',
      title: 'Hlásit „dochází“, když zbývá nejvýš',
      type: 'number',
      fieldset: 'provoz',
      description: 'Počet kusů. Prázdné = stejná hranice jako „poslední kusy“ na webu.',
      validation: (rule) => rule.integer().min(1).max(50),
    }),
    defineField({
      name: 'reportZapnuty',
      title: 'Týdenní report',
      type: 'boolean',
      fieldset: 'provoz',
      initialValue: true,
      description: 'Každé pondělí v 7:00 souhrn prodejů a tržeb za minulý týden a návrh, co doplnit.',
    }),
  ],
  preview: {
    select: {title: 'nazev', subtitle: 'lokalita'},
  },
})
