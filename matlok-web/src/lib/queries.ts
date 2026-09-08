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
