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
  chystanaStranka?: {nadradek?: string; titulek?: string; text?: string}
  cookieLista?: {
    text?: string
    odkazText?: string
    odkaz?: string
    souhlas?: string
    odmitnuti?: string
  }
  analytikaToken?: string
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
  duvody?: {nadpis: string; text: string; ikona?: string}[]
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

export interface Service {
  poradi: number
  nazev: string
  popis: string
  ikona?: string
}

export interface Principle {
  poradi: number
  nadpis: string
  text: string
}

export interface SluzbyPage {
  heroEyebrow: string
  heroNadpis: string
  heroNadpisTip: string
  heroLead: string
  filozofieEyebrow?: string
  filozofieNadpis?: string
  filozofieLead?: string
  sluzbyEyebrow?: string
  sluzbyNadpis?: string
  proces?: {nadpis: string; popis: string}[]
  vzorekEyebrow?: string
  vzorekNadpis?: string
  vzorekText?: string
  vzorekFakta?: {hodnota: string; popisek: string}[]
  ctaEyebrow?: string
  ctaNadpis?: string
  ctaLead?: string
  ctaTlacitko?: Odkaz
  ctaPoznamka?: string
}

export interface Faq {
  poradi: number
  kategorie: 'skupina' | 'web' | 'automat'
  otazka: string
  odpoved: string
}

export interface KontaktPage {
  slib?: string
  heroNadpis: string
  heroNadpisTip: string
  heroLead: string
  popiskyUdaju?: {spolecnost?: string; sidlo?: string; ico?: string; telefon?: string; email?: string}
  nadpisyKroku?: {zamer?: string; sluzby?: string; lokalita?: string; kontakt?: string}
  zamery?: {text: string; popis?: string; hodnota: string}[]
  sluzbyVolby?: {text: string; hodnota: string}[]
  stavVolby?: string[]
  typVolby?: string[]
  navstevnostVolby?: string[]
  rezimVolby?: string[]
  napovedy?: Record<string, string>
  odeslatText?: string
  souhlasText?: string
  souhlasOdkaz?: string
  potvrzeni?: string
  faqEyebrow?: string
  faqNadpis?: string
  faqLead?: string
  faqFiltry?: {text: string; hodnota: string}[]
  poznamkaDph?: string
}

export interface LegalPage {
  titulek: string
  slug: {current: string}
  ucinnostOd?: string
  nadradek?: string
  popisekUcinnost?: string
  popisekSpravce?: string
  text?: unknown[]
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

export function strankaSluzby(): Promise<SluzbyPage> {
  return sanity.fetch('*[_id == "sluzbyPage"][0]')
}

export function sluzby(): Promise<Service[]> {
  return sanity.fetch('*[_type == "service"] | order(poradi asc)')
}

export function principy(): Promise<Principle[]> {
  return sanity.fetch('*[_type == "principle"] | order(poradi asc)')
}

export function strankaKontakt(): Promise<KontaktPage> {
  return sanity.fetch('*[_id == "kontaktPage"][0]')
}

export function otazky(): Promise<Faq[]> {
  return sanity.fetch('*[_type == "faq" && zobrazit == true] | order(poradi asc)')
}

export function pravniStranky(): Promise<LegalPage[]> {
  return sanity.fetch('*[_type == "legalPage"]')
}
