import {defineField, defineType} from 'sanity'

/**
 * Poptávka z formuláře. Zapisuje ji serverová funkce POST /api/poptavka,
 * v Studiu se jen čte — proto je celý dokument readOnly.
 *
 * POZOR na rozpor v zadání: kapitola 5 v ZADANI.md uvádí u leadu pole
 * "termin" a "elektrina", ale formulář v kapitole 3.1 je nesbírá — místo
 * nich posílá "stav" (panel A) a "rezim" (panel B). Schéma sedí na
 * formulář, protože ten určuje, co reálně přiteče. Kdyby se "termin"
 * nebo "elektrina" měly sbírat, musí nejdřív přibýt do formuláře.
 */
export const lead = defineType({
  name: 'lead',
  title: 'Poptávka',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({
      name: 'zamer',
      title: 'Záměr',
      type: 'string',
      options: {
        list: [
          {title: 'Digitální řešení', value: 'services'},
          {title: 'Automat na lokalitu', value: 'automat'},
          {title: 'Něco jiného', value: 'jine'},
        ],
      },
    }),

    // --- Panel A: digitální řešení ---
    defineField({
      name: 'sluzby',
      title: 'Služby',
      type: 'array',
      of: [{type: 'string'}],
      hidden: ({document}) => document?.zamer !== 'services',
    }),
    defineField({
      name: 'obor',
      title: 'Obor podnikání',
      type: 'string',
      hidden: ({document}) => document?.zamer !== 'services',
    }),
    defineField({
      name: 'stav',
      title: 'Jak jsou na tom teď',
      type: 'string',
      hidden: ({document}) => document?.zamer !== 'services',
    }),

    // --- Panel B: automat na lokalitu ---
    defineField({
      name: 'typ',
      title: 'Typ lokality',
      type: 'string',
      hidden: ({document}) => document?.zamer !== 'automat',
    }),
    defineField({
      name: 'misto',
      title: 'Obec / adresa lokality',
      type: 'string',
      hidden: ({document}) => document?.zamer !== 'automat',
    }),
    defineField({
      name: 'navstevnost',
      title: 'Odhad denní návštěvnosti',
      type: 'string',
      hidden: ({document}) => document?.zamer !== 'automat',
    }),
    defineField({
      name: 'rezim',
      title: 'Preferovaný režim',
      type: 'string',
      hidden: ({document}) => document?.zamer !== 'automat',
    }),

    // --- Kontakt ---
    defineField({name: 'jmeno', title: 'Jméno', type: 'string'}),
    defineField({name: 'firma', title: 'Firma', type: 'string'}),
    defineField({name: 'email', title: 'E-mail', type: 'string'}),
    defineField({name: 'telefon', title: 'Telefon', type: 'string'}),
    defineField({name: 'zprava', title: 'Zpráva', type: 'text', rows: 5}),
    defineField({name: 'vytvoreno', title: 'Přijato', type: 'datetime'}),
  ],
  orderings: [
    {title: 'Od nejnovější', name: 'vytvorenoDesc', by: [{field: 'vytvoreno', direction: 'desc'}]},
  ],
  preview: {
    select: {jmeno: 'jmeno', firma: 'firma', zamer: 'zamer', vytvoreno: 'vytvoreno'},
    prepare({jmeno, firma, zamer, vytvoreno}) {
      const stitky: Record<string, string> = {
        services: 'Digitální řešení',
        automat: 'Automat',
        jine: 'Jiné',
      }
      const datum = vytvoreno ? new Date(vytvoreno).toLocaleDateString('cs-CZ') : '—'
      return {
        title: firma ? `${jmeno} · ${firma}` : jmeno,
        subtitle: `${stitky[zamer] ?? zamer} · ${datum}`,
      }
    },
  },
})
