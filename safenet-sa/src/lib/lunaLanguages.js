// Single source of truth for Luna's languages.
//
//   native   : label shown in the picker (the language's own name)
//   chatName : how we name the language to the chat LLM (with a hint to
//              disambiguate the Sotho/Nguni clusters)
//   canVoice : Luna can speak it (Deepgram for en, Toucan for the SA langs).
//              Ndebele has no voice model, so it is text only.
//   canMic   : we have honest speech-to-text for it (English + Zulu only).
//
// Order = picker order. English first, then the SA languages.
export const LUNA_LANGUAGES = [
  { code: 'en',  native: 'English',    chatName: 'English',                          canVoice: true,  canMic: true },
  { code: 'af',  native: 'Afrikaans',  chatName: 'Afrikaans',                        canVoice: true,  canMic: false },
  { code: 'zu',  native: 'isiZulu',    chatName: 'isiZulu (Zulu)',                   canVoice: true,  canMic: true },
  { code: 'xh',  native: 'isiXhosa',   chatName: 'isiXhosa (Xhosa)',                 canVoice: true,  canMic: false },
  { code: 'st',  native: 'Sesotho',    chatName: 'Sesotho (Southern Sotho)',         canVoice: true,  canMic: false },
  { code: 'tn',  native: 'Setswana',   chatName: 'Setswana (Tswana)',                canVoice: true,  canMic: false },
  { code: 'nso', native: 'Sepedi',     chatName: 'Sepedi (Northern Sotho)',          canVoice: true,  canMic: false },
  { code: 've',  native: 'Tshivenda',  chatName: 'Tshivenda (Venda)',                canVoice: true,  canMic: false },
  { code: 'ts',  native: 'Xitsonga',   chatName: 'Xitsonga (Tsonga)',                canVoice: true,  canMic: false },
  { code: 'ss',  native: 'siSwati',    chatName: 'siSwati (Swati)',                  canVoice: true,  canMic: false },
  { code: 'nr',  native: 'isiNdebele', chatName: 'isiNdebele (Southern Ndebele)',    canVoice: false, canMic: false },
]

const BY_CODE = Object.fromEntries(LUNA_LANGUAGES.map((l) => [l.code, l]))

export function getLanguage(code) {
  return BY_CODE[code] || BY_CODE.en
}

export function canMic(code) {
  return Boolean(BY_CODE[code]?.canMic)
}

export function canVoice(code) {
  return Boolean(BY_CODE[code]?.canVoice)
}
