# SafeNet Luna voice service (Toucan TTS). CPU image for free hosts (HF Spaces).
FROM python:3.11-slim

# System deps. build-essential/cmake/pkg-config let pip compile any dep that
# lacks a prebuilt wheel; espeak-ng (G2P), libsndfile/ffmpeg (audio); git (clone).
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake pkg-config git \
    espeak-ng libsndfile1 ffmpeg \
    libportaudio2 \
    && rm -rf /var/lib/apt/lists/*
# libportaudio2: IMS-Toucan imports `sounddevice` (PortAudio bindings) even for
# file-only synthesis; without the system lib it raises
# "OSError: PortAudio library not found" at first /tts. No audio device needed,
# just the shared library must be present on this headless box.

WORKDIR /srv

# CPU-only torch FIRST (the default torch pulls multi-GB CUDA wheels that blow
# up a free build). setuptools<81 keeps librosa's pkg_resources import working.
RUN pip install --no-cache-dir "setuptools<81" pip \
    && pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# Clone Toucan and install its deps MINUS gradio (unsatisfiable pin) and MINUS
# torch* (already installed as CPU above, so they aren't re-pulled as CUDA).
RUN git clone --depth 1 -b MassiveScaleToucan https://github.com/DigitalPhonetics/IMS-Toucan.git \
    && grep -ivE "gradio|^torch|^torchaudio|^torchvision" IMS-Toucan/requirements.txt > IMS-Toucan/req-min.txt \
    && pip install --no-cache-dir -r IMS-Toucan/req-min.txt

ENV TOUCAN_REPO=/srv/IMS-Toucan
ENV TOUCAN_DEVICE=cpu
# HF Spaces run as a non-root user (UID 1000) and site-packages is read-only.
# Route EVERY library's cache/scratch to a writable path or model load throws a
# bare OSError: HF hub, torch.hub, numba (via librosa), and matplotlib all try
# to write next to their modules by default. HOME points at writable /srv too.
ENV HOME=/srv
ENV HF_HOME=/srv/.cache/hf
ENV XDG_CACHE_HOME=/srv/.cache
ENV TORCH_HOME=/srv/.cache/torch
ENV NUMBA_CACHE_DIR=/tmp/numba
ENV MPLCONFIGDIR=/tmp/mpl

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .

# Model downloads on first request (keeps the build light enough for free tier).
# Make caches + model dir writable by any runtime UID.
RUN mkdir -p /srv/.cache/hf /srv/.cache/torch /srv/IMS-Toucan/Models /tmp/numba /tmp/mpl \
    && chmod -R 777 /srv /tmp/numba /tmp/mpl

EXPOSE 8080
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
