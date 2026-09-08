import {defineField, defineType} from 'sanity'

export const founder = defineType({
  name: 'founder',
  title: 'Zakladatel',
  type: 'document',
  fields: [
    defineField({
      name: 'jmeno',
      title: 'Jméno',
      type: 'string',
      description: 'Včetně titulu, pokud se uvádí.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'Například: Co-founder · vize & strategie',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'claim',
      title: 'Citát',
      type: 'string',
      description: 'Jedna věta v uvozovkách, kterou se člověk představuje.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Životopis',
      type: 'text',
      rows: 5,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lidskyDetail',
      title: 'Lidský detail',
      type: 'text',
      rows: 3,
      description: 'Věta, která z profilu dělá člověka, ne životopis.',
    }),
    defineField({
      name: 'stitky',
      title: 'Štítky',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'foto',
      title: 'Portrét',
      type: 'image',
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          title: 'Alternativní text',
          type: 'string',
          description: 'Popis pro čtečky obrazovky. Bez něj obrázek nepatří na web.',
        },
      ],
    }),
  ],
  preview: {
    select: {title: 'jmeno', subtitle: 'role', media: 'foto'},
  },
})
