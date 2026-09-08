import {defineField, defineType} from 'sanity'

export const division = defineType({
  name: 'division',
  title: 'Divize',
  type: 'document',
  fields: [
    defineField({
      name: 'poradi',
      title: 'Pořadí',
      type: 'number',
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: 'nazev',
      title: 'Název',
      type: 'string',
      description: 'Bez prefixu. Tedy "Property", ne "Matlok Property".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kod',
      title: 'Kód',
      type: 'string',
      description: 'Dvojčíslí 01–05, zobrazuje se na kartě divize.',
      validation: (rule) => rule.required().regex(/^\d{2}$/, {name: 'dvojčíslí'}),
    }),
    defineField({
      name: 'stav',
      title: 'Stav',
      type: 'string',
      options: {
        list: [
          {title: 'V provozu', value: 'live'},
          {title: 'Připravujeme', value: 'soon'},
        ],
        layout: 'radio',
      },
      initialValue: 'soon',
      description:
        'Přepnutím na "V provozu" se karta na webu rozsvítí. Zásah do kódu k tomu není potřeba.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'popis',
      title: 'Popis',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'claim',
      title: 'Claim',
      type: 'string',
      description: 'Jedna věta pod popisem. Například: Prodej, který nikdy nezavírá.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'odkaz',
      title: 'Odkaz na stránku divize',
      type: 'string',
      description: 'Relativní cesta, například /matlok. Nechat prázdné u divizí, které se teprve připravují.',
    }),
  ],
  orderings: [
    {title: 'Podle pořadí', name: 'poradiAsc', by: [{field: 'poradi', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'nazev', kod: 'kod', stav: 'stav'},
    prepare({title, kod, stav}) {
      return {
        title: `${kod} · ${title}`,
        subtitle: stav === 'live' ? 'V provozu' : 'Připravujeme',
      }
    },
  },
})
