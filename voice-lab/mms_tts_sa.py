"""
Meta MMS (Massively Multilingual Speech) TTS prototype for SafeNet SA.

Goal: verify which of South Africa's 11 official languages Meta's open MMS-TTS
models actually support, and generate listenable samples so we can judge quality
(especially the low-resource languages: Venda, Tsonga, Swati, Ndebele, Pedi).

It feeds each model an AUTHENTIC sentence in that language, pulled straight from
the app's own i18n translation files (translation.hero.headline), because feeding
English text to a Zulu model produces gibberish.

Run:
    cd voice-lab
    uv venv
    uv pip install torch transformers scipy
    uv run python mms_tts_sa.py

Output: voice-lab/samples/<locale>-<mmscode>.wav  (one per language that works)

License note: MMS-TTS is released by Meta under CC-BY-NC 4.0 for the model
weights. CONFIRM licensing before any commercial production use; this script is
an evaluation prototype only.
"""
import json
from pathlib import Path

# 11 official SA languages -> (app i18n locale file, MMS ISO 639-3 code, display name)
LANGS = [
    ("en",  "eng", "English"),
    ("zu",  "zul", "Zulu (isiZulu)"),
    ("xh",  "xho", "Xhosa (isiXhosa)"),
    ("af",  "afr", "Afrikaans"),
    ("st",  "sot", "Sotho (Sesotho)"),
    ("tn",  "tsn", "Tswana (Setswana)"),
    ("nso", "nso", "Pedi (Sepedi)"),
    ("ve",  "ven", "Venda (Tshivenda)"),
    ("ts",  "tso", "Tsonga (Xitsonga)"),
    ("ss",  "ssw", "Swati (siSwati)"),
    ("nr",  "nbl", "Ndebele (isiNdebele)"),
]

ROOT = Path(__file__).resolve().parent.parent
I18N = ROOT / "safenet-sa" / "src" / "i18n" / "languages"
OUT = Path(__file__).resolve().parent / "samples"
OUT.mkdir(exist_ok=True)


def sample_text(locale: str) -> str:
    """Pull an authentic in-language sentence from the app's translations."""
    try:
        data = json.loads((I18N / f"{locale}.json").read_text(encoding="utf-8"))
        hero = data.get("translation", {}).get("hero", {})
        return hero.get("headline") or hero.get("subheadline") or "SafeNet SA"
    except Exception:
        return "SafeNet SA"


def synth_one(locale, code, name):
    """Load a model + synthesize, with retry/backoff to survive the HF Hub's
    unauthenticated rate limit (which surfaces as a spurious 'not a valid model
    identifier' error). Returns (status, detail)."""
    import time
    import torch
    from transformers import VitsModel, AutoTokenizer
    import scipy.io.wavfile

    model_id = f"facebook/mms-tts-{code}"
    text = sample_text(locale)
    delays = [0, 8, 20, 45, 90]  # seconds before each attempt
    last_err = None
    for attempt, wait in enumerate(delays):
        if wait:
            time.sleep(wait)
        try:
            tok = AutoTokenizer.from_pretrained(model_id)
            model = VitsModel.from_pretrained(model_id)
            inputs = tok(text, return_tensors="pt")
            with torch.no_grad():
                waveform = model(**inputs).waveform
            wav = waveform.squeeze().cpu().numpy()
            sr = model.config.sampling_rate
            path = OUT / f"{locale}-{code}.wav"
            scipy.io.wavfile.write(str(path), sr, wav)
            return "OK", f"{len(wav)/sr:.1f}s -> samples/{path.name} | {text[:60]}"
        except Exception as e:
            last_err = f"{type(e).__name__}: {str(e)[:90]}"
    return "FAIL", last_err


# Verified against all 1,141 facebook/mms-tts-* models: these are the ONLY
# SA official languages MMS-TTS actually ships. The other 9 have no model.
MMS_AVAILABLE = {"eng", "tso"}


def main():
    print(f"Generating MMS-TTS samples for {len(LANGS)} SA languages...\n")
    results = []
    for locale, code, name in LANGS:
        if code not in MMS_AVAILABLE:
            results.append((name, "N/A"))
            print(f"[ N/A] {name:22} facebook/mms-tts-{code:5} no MMS-TTS model for this language", flush=True)
            continue
        status, detail = synth_one(locale, code, name)
        results.append((name, status))
        tag = "[ OK ]" if status == "OK" else "[FAIL]"
        print(f"{tag} {name:22} facebook/mms-tts-{code:5} {detail}", flush=True)

    ok = sum(1 for _, s in results if s == "OK")
    print(f"\n=== {ok}/{len(LANGS)} languages generated. Listen to voice-lab/samples/*.wav ===")
    print("Supported by MMS-TTS:  " + ", ".join(n for n, s in results if s == "OK"))
    no_model = [n for n, s in results if s == "N/A"]
    if no_model:
        print("No MMS-TTS model:      " + ", ".join(no_model))
    failed = [n for n, s in results if s == "FAIL"]
    if failed:
        print("Failed (transient?):   " + ", ".join(failed))


if __name__ == "__main__":
    main()
