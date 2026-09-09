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
      name: 'nadradek',
      title: 'Nadřádek',
      type: 'string',
      description: 'Malý text nad nadpisem, například "Právní informace".',
    }),
    defineField({
      name: 'popisekUcinnost',
      title: 'Popisek účinnosti',
      type: 'string',
      description: 'Uvozuje datum v podtitulku, například "Účinné od".',
    }),
    defineField({
      name: 'popisekSpravce',
      title: 'Popisek správce',
      type: 'string',
      description: 'Uvozuje údaje o firmě v podtitulku, například "Správce".',
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
              name: 'kodovySloupec',
              title: 'Sloupec strojopisem',
              type: 'number',
              description:
                'Pořadí sloupce (od 0), jehož buňky se vysází strojopisem jako názvy cookies. Nechat prázdné, když to není potřeba.',
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

    // --- Vyhledávače ---
    defineField({
      name: 'seoTitulek', title: 'Titulek pro vyhledávače', type: 'string',
      description: 'Prázdné = poskládá se z nadpisu a názvu společnosti. Google zobrazí zhruba 60 znaků.',
      validation: (rule) => rule.max(60).warning('Delší než 60 znaků Google zkrátí.'),
    }),
    defineField({
      name: 'seoPopis', title: 'Popis pro vyhledávače', type: 'text', rows: 3,
      description: 'Prázdné = zkrácený perex. Perexy jsou na popis ve výsledku vyhledávání skoro vždy moc dlouhé. Ideálně 120–155 znaků.',
      validation: (rule) => rule.max(160).warning('Delší než 160 znaků se ve výsledcích ořízne.'),
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
