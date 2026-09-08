import {defineField, defineType} from 'sanity'

export const legalPage = defineType({
  name: 'legalPage',
  title: 'Právní stránka',
  type: 'document',
  fields: [
    defineField({
      name: 'titulek',
      title: 'Titulek',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Adresa stránky',
      type: 'slug',
      options: {source: 'titulek', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'ucinnostOd',
      title: 'Účinnost od',
      type: 'date',
      options: {dateFormat: 'D. M. YYYY'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'array',
      of: [
        {type: 'block'},
        {
          // Tabulka cookies ze stránky /cookies. Portable Text tabulky neumí,
          // a rozepsat je do odstavců by znamenalo přijít o strukturu.
          type: 'object',
          name: 'tabulka',
          title: 'Tabulka',
          fields: [
            {name: 'popisek', title: 'Popisek', type: 'string'},
            {
              name: 'zahlavi',
              title: 'Záhlaví',
              type: 'array',
              of: [{type: 'string'}],
            },
            {
              name: 'radky',
              title: 'Řádky',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'radek',
                  fields: [{name: 'bunky', title: 'Buňky', type: 'array', of: [{type: 'string'}]}],
                  preview: {
                    select: {bunky: 'bunky'},
                    prepare: ({bunky}) => ({title: (bunky ?? []).join(' · ')}),
                  },
                },
              ],
            },
          ],
          preview: {
            select: {title: 'popisek', radky: 'radky'},
            prepare: ({title, radky}) => ({
              title: title || 'Tabulka',
              subtitle: `${(radky ?? []).length} řádků`,
            }),
          },
        },
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'titulek', slug: 'slug.current', ucinnostOd: 'ucinnostOd'},
    prepare: ({title, slug, ucinnostOd}) => ({
      title,
      subtitle: `/${slug ?? ''} · účinnost od ${ucinnostOd ?? '—'}`,
    }),
  },
})
