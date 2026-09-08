import {defineField, defineType} from 'sanity'

export const faq = defineType({
  name: 'faq',
  title: 'Častý dotaz',
  type: 'document',
  fields: [
    defineField({
      name: 'poradi',
      title: 'Pořadí',
      type: 'number',
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: 'kategorie',
      title: 'Kategorie',
      type: 'string',
      options: {
        list: [
          {title: 'O skupině', value: 'skupina'},
          {title: 'Weby a digitál', value: 'web'},
          {title: 'Automaty', value: 'automat'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'otazka',
      title: 'Otázka',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'odpoved',
      title: 'Odpověď',
      type: 'text',
      rows: 6,
      description:
        'Nikdy nepsat "ceny bez DPH". Společnost není plátcem DPH — ceny jsou konečné.',
      validation: (rule) =>
        rule.required().custom((hodnota) => {
          if (typeof hodnota === 'string' && /bez\s+DPH/i.test(hodnota)) {
            return 'Nepoužívat "bez DPH". Společnost není plátcem DPH, ceny jsou konečné.'
          }
          return true
        }),
    }),
    defineField({
      name: 'zobrazit',
      title: 'Zobrazit na webu',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  orderings: [
    {title: 'Podle pořadí', name: 'poradiAsc', by: [{field: 'poradi', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'otazka', kategorie: 'kategorie', poradi: 'poradi', zobrazit: 'zobrazit'},
    prepare({title, kategorie, poradi, zobrazit}) {
      const stitky: Record<string, string> = {
        skupina: 'O skupině',
        web: 'Weby a digitál',
        automat: 'Automaty',
      }
      return {
        title: zobrazit ? title : `${title} (skryto)`,
        subtitle: `${poradi}. · ${stitky[kategorie] ?? kategorie}`,
      }
    },
  },
})
