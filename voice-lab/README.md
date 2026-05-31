# voice-lab — SafeNet SA TTS evaluation

Evaluation sandbox for **text-to-speech across South Africa's 11 official
languages** for Luna's voice alerts. Not part of the deployed app.

## TL;DR (verified finding)

We tested Meta's open **MMS-TTS** as a free path to all 11 languages.
**It only covers 2 of the 11: English and Tsonga.** The other nine
(Zulu, Xhosa, Afrikaans, Sotho, Tswana, Pedi, Venda, Swati, Ndebele) have
**no MMS-TTS model at all**, confirmed against the full set of 1,141
`facebook/mms-tts-*` models on Hugging Face.

So MMS is *not* the "11 languages, free" answer we hoped for. There is, today,
**no single free (or even paid) off-the-shelf TTS that cleanly covers all 11
SA languages well** — the low-resource ones (Venda, Swati, Ndebele) are the
gap everywhere. This is a real constraint of low-resource languages, not a
SafeNet limitation.

## MMS-TTS coverage for SA (empirically verified)

| Language | MMS model | Status |
|---|---|---|
| English | `facebook/mms-tts-eng` | ✅ works (sample generated) |
| Tsonga (Xitsonga) | `facebook/mms-tts-tso` | ✅ works (sample generated) |
| Zulu | `mms-tts-zul` | ❌ does not exist |
| Xhosa | `mms-tts-xho` | ❌ does not exist |
| Afrikaans | `mms-tts-afr` | ❌ does not exist |
| Sotho (Sesotho) | `mms-tts-sot` | ❌ does not exist |
| Tswana | `mms-tts-tsn` | ❌ does not exist |
| Pedi (Sepedi) | `mms-tts-nso` | ❌ does not exist |
| Venda | `mms-tts-ven` | ❌ does not exist |
| Swati | `mms-tts-ssw` | ❌ does not exist |
| Ndebele | `mms-tts-nbl` | ❌ does not exist |

(MMS-TTS *does* cover many other African languages: Swahili, Yoruba, Hausa,
Shona, Nyanja, Kinyarwanda, Luganda, etc. The SA Bantu set just isn't in it.)

## Recommended free-first routing (per language)

| Language | Best free option today | Quality |
|---|---|---|
| English | **Deepgram Aura** (already wired in `api/luna-tts.js`) | Excellent — keep |
| Tsonga | **MMS-TTS** (`tso`) | Good, free |
| Afrikaans | Browser Web Speech (`af-ZA`, present on most Android/Google TTS) | OK |
| Zulu | Browser Web Speech (`zu-ZA` where available) | Varies by device |
| Xhosa, Sotho, Tswana, Pedi, Venda, Swati, Ndebele | **No good free TTS exists yet** | — |

For the seven with no free TTS: ship **text alerts** in-language first (we
already have translations in `src/i18n/languages/`), and treat voice for those
as a later, paid/commissioned effort.

## Honest options to actually get all 11 (later, mostly paid/effort)

1. **SADiLaR / Lwazi** — South African Centre for Digital Language Resources
   has SA-language speech corpora and TTS research. The real local asset;
   needs integration/training effort.
2. **IMS Toucan TTS** — research multilingual TTS claiming very broad
   low-resource coverage. Unverified for SA quality; worth a spike.
3. **Commission voices** — record native speakers per language (most reliable
   quality, real cost).
4. **Cloud TTS (Azure/Google)** — only covers a few SA languages (af, maybe
   zu); paid; does not solve the low-resource gap.

## License note

MMS-TTS weights are **CC-BY-NC 4.0 (non-commercial)**. Fine for this
evaluation; production commercial use (SafeNet sells plans) needs a licensed
path. Deepgram (English) is already commercially licensed.

## How to run

```bash
cd voice-lab
uv venv
uv pip install torch --index-url https://download.pytorch.org/whl/cpu
uv pip install transformers scipy
# HF_TOKEN only needed to lift the anonymous download quota:
HF_TOKEN=hf_xxx uv run python mms_tts_sa.py
```

Output: `voice-lab/samples/*.wav` (git-ignored). Only `en-eng.wav` and
`ts-tso.wav` will generate; the rest report "does not exist".
