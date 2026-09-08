import {sanity} from './sanity'

export interface Odkaz {
  text: string
  odkaz: string
}

export interface SiteSettings {
  nazev: string
  logo?: unknown
  logoInverzni?: unknown
  adresa: string
  ico: string
  spisovaZnacka?: string
  telefon: string
  email: string
  neplatceDph: boolean
  popisPaticky?: string
  navigace?: Odkaz[]
  navigaceTlacitko?: Odkaz
  patickaSloupce?: {nadpis: string; odkazy: Odkaz[]}[]
}

export interface Division {
  poradi: number
  nazev: string
  kod: string
  stav: 'live' | 'soon'
  popis: string
  claim: string
  odkaz?: string
}

export interface Founder {
  jmeno: string
  role: string
  claim: string
  bio: string
  lidskyDetail?: string
  stitky?: string[]
  foto?: unknown
}

export interface Statistika {
  hodnota: string
  popisek: string
  maleFormatovani?: boolean
}

export interface HomePage {
  heroEyebrow: string
  heroNadpis: string
  heroNadpisTip: string
  heroLead: string
  heroTlacitka?: Odkaz[]
  heroStatistiky?: Statistika[]
  zivaKarta?: {
    titulek: string
    stav: string
    misto: string
    podtitulek: string
    kpi?: Statistika[]
    poznamka: string
  }
  pas?: string[]
  divizeEyebrow: string
  divizeNadpis: string
  divizeLead: string
  zakladateleEyebrow: string
  zakladateleNadpis: string
  zakladateleNadpisTip: string
  zakladateleLead: string
  pribehy?: {nadpis: string; text: string}[]
  vize?: {nadpis: string; text: string}
  procEyebrow: string
  procNadpis: string
  duvody?: {nadpis: string; text: string}[]
}

export interface Product {
  nazev: string
  cena: number
  kategorie: 'drink' | 'snack'
  dostupnost: number
  kapacita?: number
  nejprodavanejsi?: boolean
}

export interface MatlokPage {
  heroEyebrow: string
  heroNadpis: string
  heroNadpisTip: string
  heroLead: string
  heroTlacitka?: Odkaz[]
  foto?: unknown
  fotoPopisek?: string
  kpi?: {hodnota: string; popisek: string}[]
  nabidkaNadpis: string
  nabidkaStitek?: string
  kategorie?: {text: string; hodnota: string}[]
  nabidkaPoznamka?: string
  hranicePoslednichKusu?: number
  vyhody?: {nadpis: string; text: string; ikona?: string}[]
  ctaEyebrow?: string
  ctaNadpis?: string
  ctaLead?: string
  ctaTlacitko?: Odkaz
  ctaPoznamka?: string
}

export function nastaveni(): Promise<SiteSettings> {
  return sanity.fetch('*[_id == "siteSettings"][0]')
}

export function domovskaStranka(): Promise<HomePage> {
  return sanity.fetch('*[_id == "homePage"][0]')
}

export function divize(): Promise<Division[]> {
  return sanity.fetch('*[_type == "division"] | order(poradi asc)')
}

export function zakladatele(): Promise<Founder[]> {
  // Pořadí podle prototypu: Lukáš, pak Martin.
  return sanity.fetch('*[_type == "founder"] | order(jmeno asc)')
}

export function strankaMatlok(): Promise<MatlokPage> {
  return sanity.fetch('*[_id == "matlokPage"][0]')
}

/**
 * Záložní nabídka ze Sanity. V Session 5 ji nahradí živá data z Partner API
 * a tenhle dotaz zůstane jako záchrana pro případ, že API neodpoví.
 */
export function produkty(): Promise<Product[]> {
  // Řazení podle _id drží pořadí z prototypu (product-1 až product-6).
  // Je to dočasné — v Session 5 určí pořadí API podle spirál v automatu.
  return sanity.fetch('*[_type == "product" && zobrazit == true] | order(_id asc)')
}
