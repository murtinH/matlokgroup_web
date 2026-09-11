import {defineField, defineType} from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'Produkt',
  type: 'document',
  description:
    'Záložní stav nabídky. Živá data tečou z Partner API MůjAutomat; tenhle dokument se použije, když API neodpoví, aby web nespadl kvůli cizí službě.',
  fields: [
    defineField({
      name: 'nazev',
      title: 'Název',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cena',
      title: 'Cena v Kč',
      type: 'number',
      description: 'Konečná cena. Společnost není plátcem DPH, nic se nepřipočítává.',
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: 'kategorie',
      title: 'Kategorie',
      type: 'string',
      description:
        'Musí se přesně shodovat s názvem kategorie v MůjAutomatu (Drinks, Energy & Sport, Snacks, Krkonoše). Podle ní web skládá filtry, takže jiný zápis vytvoří filtr navíc.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'dostupnost',
      title: 'Počet kusů',
      type: 'number',
      description: 'Tři kusy a méně web označí jako "poslední kusy".',
      validation: (rule) => rule.required().min(0).integer(),
    }),
    defineField({
      name: 'kapacita',
      title: 'Kapacita spirály',
      type: 'number',
      description:
        'Kolik kusů se do spirály vejde plných. Podle poměru dostupnost/kapacita se kreslí proužek dostupnosti. V Session 5 tuhle hodnotu dodá Partner API.',
      initialValue: 12,
      validation: (rule) => rule.required().min(1).integer(),
    }),
    defineField({
      name: 'nejprodavanejsi',
      title: 'Nejprodávanější',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'zobrazit',
      title: 'Zobrazit na webu',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {title: 'nazev', cena: 'cena', dostupnost: 'dostupnost', zobrazit: 'zobrazit'},
    prepare({title, cena, dostupnost, zobrazit}) {
      return {
        title: zobrazit ? title : `${title} (skryto)`,
        subtitle: `${cena} Kč · skladem ${dostupnost} ks`,
      }
    },
  },
})
