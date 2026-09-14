/**
 * Odeslání e-mailu přes Resend.
 *
 * Používá ho provoz automatu — upozornění a týdenní report. Poptávkový
 * formulář má odesílání vlastní a zůstává, jak je: funguje a nemá důvod
 * se měnit spolu s automatem.
 *
 * Bez RESEND_API_KEY (typicky lokálně ve wrangler dev) se e-mail neodešle,
 * jen se celý vypíše do logu. Volající to bere jako doručené — lokálně se
 * tak dá ověřit, že druhý běh už stejné upozornění neposílá. V produkci
 * klíč nastavený je, jinak by nechodily ani poptávky.
 */
import type {Env} from './index'

export interface Email {
  komu: string[]
  predmet: string
  html: string
  /** Čistý text pro klienty, které HTML nezobrazí, a pro log. */
  text: string
}

const ODESILATEL = 'Automat Matlok <web@matlok.cz>'

export async function posliEmail(env: Env, email: Email): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn(`RESEND_API_KEY není nastavený, e-mail se jen vypíše.\nKomu: ${email.komu.join(', ')}\nPředmět: ${email.predmet}\n\n${email.text}`)
    return
  }

  const odpoved = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: ODESILATEL,
      to: email.komu,
      subject: email.predmet,
      html: email.html,
      text: email.text,
    }),
  })

  if (!odpoved.ok) {
    throw new Error(`Resend odpověděl ${odpoved.status}: ${await odpoved.text()}`)
  }
}
