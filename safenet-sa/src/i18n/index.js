import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './languages/en.json'
import af from './languages/af.json'
import zu from './languages/zu.json'
import xh from './languages/xh.json'
import st from './languages/st.json'
import tn from './languages/tn.json'
import nso from './languages/nso.json'
import ve from './languages/ve.json'
import ts from './languages/ts.json'
import ss from './languages/ss.json'
import nr from './languages/nr.json'

const resources = { en, af, zu, xh, st, tn, nso, ve, ts, ss, nr }

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnObjects: true,
})

export default i18n
