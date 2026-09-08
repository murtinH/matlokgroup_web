import {defineField, defineType} from 'sanity'

export const service = defineType({
  name: 'service',
  title: 'Služba',
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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'popis',
      title: 'Popis',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'ikona',
      title: 'Ikona',
      type: 'string',
      description: 'Klíč ikony v komponentě, například "web" nebo "foto".',
    }),
  ],
  orderings: [
    {title: 'Podle pořadí', name: 'poradiAsc', by: [{field: 'poradi', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'nazev', poradi: 'poradi', subtitle: 'popis'},
    prepare: ({title, poradi, subtitle}) => ({title: `${poradi}. ${title}`, subtitle}),
  },
})
