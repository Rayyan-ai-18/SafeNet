# voice-lab — SafeNet SA TTS evaluation

Evaluation sandbox for **text-to-speech across South Africa's 11 official
languages** for Luna's voice alerts. Not part of the deployed app.

## TL;DR (verified finding)

We compared three open engines for SA's 11 languages. **IMS Toucan is the
winner: it covers 10 of 11 (all except Southern Ndebele) and is Apache-2.0,
so commercially usable.** MMS covers only 2; OmniVoice ~6 but with a
restrictive license and heavy GPU-studio infra.

## Engine comparison (verified by grepping each project's own language list)

| Engine | SA coverage | License | Fit |
|---|---|---|---|
| **IMS Toucan** | **10/11** (missing only Ndebele/nbl) | Apache-2.0 (commercial OK) | Best: model, can run as batched service |
| OmniVoice (k2-fsa) | ~6/11 (Eng, Zulu, Xhosa, Afrikaans, Tswana, Pedi) | model unclear; Studio app is FSL non-commercial | GPU desktop studio, poor fit for serverless |
| Meta MMS-TTS | 2/11 (English, Tsonga) | CC-BY-NC (non-commercial) | Only Tsonga useful for us |

Per-language: Toucan has Zulu, Xhosa, Afrikaans, Sotho, Tswana, Pedi, Venda,
Tsonga, Swati (+ English). **Only Southern Ndebele (nbl) has no model in any
engine** — it would need commissioned/recorded audio.

Coverage means a model exists; **per-language audio quality still needs a
listen test** (next step: install Toucan, generate samples for the 9, judge
quality). Toucan is massively-multilingual via phonetic features, so quality
varies by language and should be verified before shipping each voice.

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

## Recommended routing (per language)

| Language | Best option | Notes |
|---|---|---|
| English | **Deepgram Aura** (already wired in `api/luna-tts.js`) | Excellent, keep as-is |
| Zulu, Xhosa, Afrikaans, Sotho, Tswana, Pedi, Venda, Tsonga, Swati | **IMS Toucan** | Apache-2.0, model exists; verify per-language quality, then wire as a batched service |
| Ndebele (nbl) | No model anywhere | Ship **text alert** (we have the i18n) until a voice is recorded/commissioned |

Architecture: keep Deepgram for English, run Toucan as a small batched
inference service for the other 9 (generate once, cache the audio so we don't
pay per request), and fall back to in-language **text** for Ndebele.

For any not-yet-wired voice: ship **text alerts** in-language first (we already
have translations in `src/i18n/languages/`).

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
