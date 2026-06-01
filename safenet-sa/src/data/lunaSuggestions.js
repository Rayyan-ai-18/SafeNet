// Suggested questions for the Luna page, per language.
//
// QA NOTE: `en` and `zu` are human-checked. The other 9 languages are
// AI-drafted and must be reviewed by a native speaker before being treated as
// final, the same quality gate as the Toucan voice sign-off. If a language is
// missing a translation, the UI falls back to English (see getSuggestion).
//
// `icon` is a lucide-react name resolved in Luna.jsx.

export const LUNA_SUGGESTIONS = [
  {
    id: 'protect',
    icon: 'Shield',
    t: {
      en: 'How does SafeNet protect my child?',
      af: 'Hoe beskerm SafeNet my kind?',
      zu: 'I-SafeNet ivikela ingane yami kanjani?',
      xh: 'I-SafeNet ikhusela umntwana wam njani?',
      st: 'SafeNet e sireletsa ngwana wa ka jwang?',
      tn: 'SafeNet e sireletsa ngwana wa me jang?',
      nso: 'SafeNet e šireletša ngwana wa ka bjang?',
      ve: 'SafeNet i tsireledza nwana wanga hani?',
      ts: 'Xana SafeNet yi sirhelela n\'wana wa mina njhani?',
      ss: 'I-SafeNet ivikela umntfwana wami njani?',
      nr: 'I-SafeNet ivikela umntwana wami njani?',
    },
  },
  {
    id: 'honeytrap',
    icon: 'Activity',
    t: {
      en: 'What is a honey trap?',
      af: 'Wat is \'n heuningstrik?',
      zu: 'Uyini ugibe lwezinyosi?',
      xh: 'Yintoni umgibe wobusi?',
      st: 'Leraba la lerato ke eng?',
      tn: 'Leraba la lorato ke eng?',
      nso: 'Leraba la lerato ke eng?',
      ve: 'Tshikwekwe tsha lufuno ndi mini?',
      ts: 'Xana ntlhamu wa rirhandzu i yini?',
      ss: 'Yini lugibe lwetinyosi?',
      nr: 'Yini umgibe wobusi?',
    },
  },
  {
    id: 'threat',
    icon: 'AlertTriangle',
    t: {
      en: 'What happens when Luna detects a threat?',
      af: 'Wat gebeur wanneer Luna \'n bedreiging opspoor?',
      zu: 'Kwenzekani uma uLuna ethola usongo?',
      xh: 'Kwenzeka ntoni xa uLuna efumana isoyikiso?',
      st: 'Ho etsahalang ha Luna a fumana tshokelo?',
      tn: 'Go diragalang fa Luna a bona kotsi?',
      nso: 'Go direga eng ge Luna a hwetša kotsi?',
      ve: 'Hu itea mini musi Luna a tshi wana khombo?',
      ts: 'Ku humelela yini loko Luna a kuma nxungeto?',
      ss: 'Kwentekani nangabe iLuna itfola usongo?',
      nr: 'Kwenzekani nakube iLuna ifumana isongo?',
    },
  },
  {
    id: 'privacy',
    icon: 'Shield',
    t: {
      en: 'Is my child\'s privacy protected?',
      af: 'Word my kind se privaatheid beskerm?',
      zu: 'Ingabe ubumfihlo bengane yami buvikelekile?',
      xh: 'Ingaba ubumfihlo bomntwana wam bukhuselekile?',
      st: 'Na lekunutu la ngwana wa ka le sireletsehile?',
      tn: 'A sephiri sa ngwana wa me se sireleditswe?',
      nso: 'Na sephiri sa ngwana wa ka se šireleditšwe?',
      ve: 'Naa zwidzumbe zwa nwana wanga zwo tsireledzwa?',
      ts: 'Xana vuxokoxoko bya n\'wana wa mina byi sirhelelekile?',
      ss: 'Ingabe imfihlo yemntfwana wami ivikelekile?',
      nr: 'Ingabe imfihlo yomntwana wami ivikelekile?',
    },
  },
  {
    id: 'howuse',
    icon: 'Globe',
    t: {
      en: 'How do I use SafeNet?',
      af: 'Hoe gebruik ek SafeNet?',
      zu: 'Ngingayisebenzisa kanjani i-SafeNet?',
      xh: 'Ndiyisebenzisa njani i-SafeNet?',
      st: 'Ke sebedisa SafeNet jwang?',
      tn: 'Ke dirisa SafeNet jang?',
      nso: 'Ke šomiša SafeNet bjang?',
      ve: 'Ndi shumisa SafeNet hani?',
      ts: 'Ndzi tirhisa SafeNet njhani?',
      ss: 'Ngiyisebentisa njani i-SafeNet?',
      nr: 'Ngiyisebenzisa njani i-SafeNet?',
    },
  },
  {
    id: 'safe',
    icon: 'Sparkles',
    t: {
      en: 'Is my child safe?',
      af: 'Is my kind veilig?',
      zu: 'Ingane yami iphephile?',
      xh: 'Ingaba umntwana wam ukhuselekile?',
      st: 'Na ngwana wa ka o bolokehile?',
      tn: 'A ngwana wa me o babalesegile?',
      nso: 'Na ngwana wa ka o šireletšegile?',
      ve: 'Naa nwana wanga o tsireledzeha?',
      ts: 'Xana n\'wana wa mina u sirhelelekile?',
      ss: 'Ingabe umntfwana wami uphephile?',
      nr: 'Ingabe umntwana wami uphephile?',
    },
  },
]

// Text for a suggestion in `lang`, falling back to English.
export function getSuggestion(q, lang) {
  return q.t[lang] || q.t.en
}
