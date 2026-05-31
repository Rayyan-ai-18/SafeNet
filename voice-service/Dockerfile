# SafeNet Luna voice service (Toucan TTS). CPU image; for GPU use an
# nvidia/cuda base + install the CUDA torch wheel.
FROM python:3.11-slim

# System deps: espeak-ng (better G2P), libsndfile (audio I/O), ffmpeg, git.
RUN apt-get update && apt-get install -y --no-install-recommends \
    espeak-ng libsndfile1 ffmpeg git && rm -rf /var/lib/apt/lists/*

WORKDIR /srv

# Clone IMS Toucan (7000-language build) and install its deps, minus the
# gradio demo UI (unsatisfiable pin) and with setuptools<81 (pkg_resources).
RUN git clone --depth 1 -b MassiveScaleToucan https://github.com/DigitalPhonetics/IMS-Toucan.git \
    && grep -ivE "gradio" IMS-Toucan/requirements.txt > IMS-Toucan/req-min.txt \
    && pip install --no-cache-dir "setuptools<81" pip \
    && pip install --no-cache-dir -r IMS-Toucan/req-min.txt

ENV TOUCAN_REPO=/srv/IMS-Toucan
ENV TOUCAN_DEVICE=cpu
# Hugging Face Spaces run the container as a non-root user (UID 1000); keep all
# caches in writable locations so model downloads work at runtime too.
ENV HF_HOME=/srv/.cache/hf
ENV XDG_CACHE_HOME=/srv/.cache

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .

# Warm the model at build time so it's baked into the image (fast cold starts,
# downloads ToucanTTS.pt + Vocoder + speaker embedding into /srv/IMS-Toucan/Models).
RUN mkdir -p /srv/.cache/hf \
    && python -c "import sys; sys.path.insert(0,'/srv/IMS-Toucan'); from InferenceInterfaces.ToucanTTSInterface import ToucanTTSInterface; ToucanTTSInterface(device='cpu')" || true

# Make app + model + cache dirs writable by any UID (HF Spaces runtime user).
RUN chmod -R 777 /srv

EXPOSE 8080
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
