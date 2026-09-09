// Obsahový model podle kapitoly 5 v ZADANI.md.
// cenikPage v zadání není — přibyl s cenovou nabídkou platnou od 1. 10. 2026.
import {siteSettings} from './siteSettings'
import {homePage} from './homePage'
import {matlokPage} from './matlokPage'
import {sluzbyPage} from './sluzbyPage'
import {cenikPage} from './cenikPage'
import {kontaktPage} from './kontaktPage'
import {division} from './division'
import {machine} from './machine'
import {product} from './product'
import {service} from './service'
import {principle} from './principle'
import {founder} from './founder'
import {faq} from './faq'
import {legalPage} from './legalPage'
import {lead} from './lead'

export const schemaTypes = [
  siteSettings,
  homePage,
  matlokPage,
  sluzbyPage,
  cenikPage,
  kontaktPage,
  division,
  machine,
  product,
  service,
  principle,
  founder,
  faq,
  legalPage,
  lead,
]
