import {sanity, type Obrazek} from './sanity'

export interface Odkaz {
  text: string
  odkaz: string
}

export interface SiteSettings {
  nazev: string
  logo?: Obrazek
  logoInverzni?: Obrazek
  adresa: string
  ico: string
  spisovaZnacka?: string
  telefon: string
  email: string
  popisPaticky?: string
  socialniSite?: {sit: string; url: string}[]
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
  turnstileSiteKey?: string
  ogObrazek?: Obrazek
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
  /** Když je vyplněno, hodnotu přepíše živý údaj z automatu. */
  zdroj?: 'pocet' | 'prodano'
}

export interface HomePage extends Seo {
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
  vize?: {nadpis: string; text: string}
  procEyebrow: string
  procNadpis: string
  duvody?: {nadpis: string; text: string; ikona?: string}[]
  ctaEyebrow?: string
  ctaNadpis?: string
  ctaLead?: string
  ctaTlacitko?: Odkaz
}

export interface Product {
  nazev: string
  cena: number
  /** Volný řetězec, kategorie určuje MůjAutomat. */
  kategorie: string
  dostupnost: number
  kapacita?: number
  nejprodavanejsi?: boolean
}

export interface MatlokPage extends Seo {
  heroEyebrow: string
  heroNadpis: string
  heroNadpisTip: string
  heroLead: string
  heroTlacitka?: Odkaz[]
  foto?: unknown
  fotoPopisek?: string
  kpi?: {hodnota: string; popisek: string; zdroj?: 'pocet' | 'prodano'}[]
  nabidkaNadpis: string
  nabidkaStitek?: string
  nabidkaPoznamka?: string
  hranicePoslednichKusu?: number
  vyhody?: {nadpis: string; text: string; ikona?: string}[]
  ctaEyebrow?: string
  ctaNadpis?: string
  ctaLead?: string
  ctaTlacitko?: Odkaz
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

export interface SluzbyPage extends Seo {
  heroEyebrow: string
  heroNadpis: string
  heroNadpisTip: string
  heroLead: string
  filozofieEyebrow?: string
  filozofieNadpis?: string
  filozofieLead?: string
  sluzbyEyebrow?: string
  sluzbyNadpis?: string
  procesEyebrow?: string
  procesNadpis?: string
  procesLead?: string
  proces?: {nadpis: string; popis: string}[]
  vzorekEyebrow?: string
  vzorekNadpis?: string
  vzorekText?: string
  vzorekFakta?: {hodnota: string; popisek: string}[]
  ctaEyebrow?: string
  ctaNadpis?: string
  ctaLead?: string
  ctaTlacitko?: Odkaz
}

export interface Faq {
  poradi: number
  kategorie: 'skupina' | 'web' | 'automat'
  otazka: string
  odpoved: string
}

/** Volitelný ruční přepis titulku a popisu pro vyhledávače. */
export interface Seo {
  seoTitulek?: string
  seoPopis?: string
}

export interface Tarif {
  stitek?: string
  nazev: string
  cena: string
  /** Jen pro strukturovaná data. Na stránce se nezobrazuje. */
  cenaCislo?: number
  polozky?: string[]
  vCene?: string
  zvyraznit?: boolean
}

export interface BlokCeniku {
  nadpis: string
  popis?: string
  polozky?: {nazev: string; popis?: string; cena?: string}[]
  poznamka?: string
}

export interface CenovaSkupina {
  eyebrow?: string
  nadpis: string
  kotva: string
  lead?: string
  tarify?: Tarif[]
  poznamka?: string
  bloky?: BlokCeniku[]
}

export interface CenikPage extends Seo {
  heroEyebrow: string
  heroNadpis: string
  heroNadpisTip: string
  heroLead: string
  heroTlacitko?: Odkaz
  poznamkaDph: string
  skupiny?: CenovaSkupina[]
  automatyEyebrow?: string
  automatyNadpis?: string
  automatyLead?: string
  automatyFaktory?: {nadpis: string; text: string; ikona?: string}[]
  automatyCtaNadpis?: string
  automatyCtaLead?: string
  automatyTlacitko?: Odkaz
  procesZobrazit?: boolean
  procesEyebrow?: string
  procesNadpis?: string
  proces?: {nadpis: string; popis: string}[]
  slevyEyebrow?: string
  slevyNadpis?: string
  slevyLead?: string
  slevy?: {hodnota: string; nazev: string; popis?: string}[]
  slevyTlacitko?: Odkaz
}

/** Automat v terénu. Zatím jediný, ale dotaz počítá s víc než jedním. */
export interface Machine {
  nazev: string
  machineId: string
  lokalita: string
  gps?: {lat: number; lng: number}
  oteviraciDoba?: string
  platby?: string[]
  stav: 'live' | 'off'
}

export interface KontaktPage extends Seo {
  slib?: string
  heroNadpis: string
  heroNadpisTip: string
  heroLead: string
  popiskyUdaju?: {spolecnost?: string; sidlo?: string; ico?: string; zapis?: string; telefon?: string; email?: string}
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

export interface LegalPage extends Seo {
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
  return sanity.fetch('*[_type == "product" && zobrazit == true] | order(_id asc){..., "kategorie": select(kategorie == "drink" => "Nápoje", kategorie == "snack" => "Občerstvení", kategorie)}')
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

export function strankaCenik(): Promise<CenikPage> {
  return sanity.fetch('*[_id == "cenikPage"][0]')
}

/**
 * Automat pro strukturovaná data na /matlok. Zatím je jediný, dotaz ale
 * bere první v provozu, ať přidání druhého boxu nerozbije stránku.
 */
export function automat(): Promise<Machine | null> {
  return sanity.fetch('*[_type == "machine" && stav == "live"] | order(_id asc)[0]')
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
