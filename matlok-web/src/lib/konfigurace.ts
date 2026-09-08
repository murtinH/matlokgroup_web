/**
 * Veřejné identifikátory projektu. Jediné místo, kde jsou zapsané.
 *
 * Čte je build webu i serverový skript, takže se nemůžou rozejít.
 * Nejsou to tajné údaje — project ID i název datasetu jsou veřejné
 * a dají se vyčíst z každého požadavku na Sanity.
 *
 * TAJNÉ ÚDAJE SEM NEPATŘÍ. Tokeny a klíče žijí výhradně jako šifrované
 * proměnné v Cloudflare, případně v .dev.vars pro lokální vývoj.
 */
export const SANITY_PROJECT_ID = 'jew7wcoq'
export const SANITY_DATASET = 'production'

/** Verze API Sanity. Změna znamená jiné chování dotazů — měnit vědomě. */
export const SANITY_API_VERZE = '2025-08-15'
