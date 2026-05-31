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

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .

# Warm the model at build time so first request is fast (downloads ToucanTTS.pt).
RUN python -c "import sys; sys.path.insert(0,'/srv/IMS-Toucan'); from InferenceInterfaces.ToucanTTSInterface import ToucanTTSInterface; ToucanTTSInterface(device='cpu')" || true

EXPOSE 8080
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
