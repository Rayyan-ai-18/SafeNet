# Luna multi-language picker design

Date: 2026-05-31
Status: approved, implementing

## Goal
Let users pick Luna's language so the 9 newly-enabled Toucan SA voices (plus
Ndebele text) are reachable, not just the EN/ZU toggle. Output-language picker:
the chosen language drives Luna's text reply, her Toucan/Deepgram voice, and the
UI/chip language. Voice INPUT (mic) stays EN/ZU, the only honest STT we have.

## Per-language capability matrix
| code | native     | chat reply | voice out        | mic in |
|------|------------|-----------|------------------|--------|
| en   | English    | yes       | Deepgram         | yes    |
| af   | Afrikaans  | yes       | Toucan           | no     |
| zu   | isiZulu    | yes       | Toucan           | yes    |
| xh   | isiXhosa   | yes       | Toucan           | no     |
| st   | Sesotho    | yes       | Toucan           | no     |
| tn   | Setswana   | yes       | Toucan           | no     |
| nso  | Sepedi     | yes       | Toucan           | no     |
| ve   | Tshivenda  | yes       | Toucan           | no     |
| ts   | Xitsonga   | yes       | Toucan           | no     |
| ss   | siSwati    | yes       | Toucan           | no     |
| nr   | isiNdebele | yes       | none (text only) | no     |

## Components
1. `src/lib/lunaLanguages.js` (new): single source of truth. Array of
   `{ code, native, chatName, canVoice, canMic }`. canMic true only for en/zu;
   canVoice false only for nr.
2. `src/pages/Luna.jsx`: replace EN/ZU pill with a dropdown/popover reusing the
   same pill style + globe icon (no redesign; framer-motion open/close;
   prefers-reduced-motion respected; >=44px targets). Lists 11 native names,
   checkmark on selected, "text" hint on Ndebele. Mic button hides when selected
   language has canMic=false, replaced by a "Type or tap a question below" line.
   Suggested chips render in the selected language.
3. `src/hooks/useLunaVoice.js`: replace `toggleLanguage` with
   `setLanguageCode(code)`. Selected language is the source of truth: typed input
   and chips reply in the selected language (no auto-detect override); mic keeps
   en/zu STT routing. speak() already handles Toucan/Deepgram/Ndebele by lang.
4. `api/luna-chat.js`: map all 11 codes -> "Reply entirely in natural <lang>."
5. `src/data/lunaSuggestions.js` (new): the 6 suggested questions translated into
   all 11 languages. Pilot-quality, flagged for native-speaker review (same gate
   as the voice sign-off).
6. Copy: Luna page `<SEO>` description updated from "Speaks English and Zulu".

## Unchanged
English (Deepgram) and Zulu (Vulavula mic + Toucan voice) paths, orb, gender
flow, conversation history, full design system and tokens.

## Out of scope (YAGNI)
Voice input/STT for the 9 non-EN/ZU languages (no reliable STT exists; real cost,
uncertain quality). Revisit if a pilot shows demand.
