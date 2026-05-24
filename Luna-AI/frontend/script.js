/* ════════════════════════════════════════════════════════════════
   Luna AI · script.js  (ESM module)
════════════════════════════════════════════════════════════════ */

// Xenova/transformers is loaded dynamically inside initSentiment() so a CDN
// failure cannot block the rest of the module from executing.

/* ════════════════════════════════════════════════════════════════
   LUNA VOICE ASSISTANT
   Silero VAD → Groq Whisper STT → Client Sentiment → Groq LLM → Chatterbox TTS
════════════════════════════════════════════════════════════════ */
(async function () {
  const sphereWrap = document.getElementById('sphereWrap');
  if (!sphereWrap) return;

  /* ── State ── */
  let state        = 'setup';
  let history      = [];        // conversation history (user/assistant only)
  let vadInstance  = null;
  let isProcessing = false;     // guard against overlapping pipeline runs
  let audioCtx     = null;
  let lunaAudio    = null;      // single persistent Audio element, unlocked on first gesture

  const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  /* ── Sphere state → CSS data-state ── */
  function setState(s) {
    state = s;
    sphereWrap.dataset.state = (s === 'wake' || s === 'stopped') ? 'idle' : s;
  }

  /* ════════════════════════════════════════════════════════════════
     VOICE PICKER
  ════════════════════════════════════════════════════════════════ */
  const VOICES = {
    female: [
      { id: 'aura-asteria-en', name: 'Asteria', style: 'Warm, conversational' },
      { id: 'aura-luna-en',    name: 'Luna',    style: 'Soft, natural' },
      { id: 'aura-stella-en',  name: 'Stella',  style: 'Upbeat, bright' },
      { id: 'aura-athena-en',  name: 'Athena',  style: 'Confident, clear' },
      { id: 'aura-hera-en',    name: 'Hera',    style: 'Mature, authoritative' },
    ],
    male: [
      { id: 'aura-orion-en',   name: 'Orion',   style: 'Deep, smooth' },
      { id: 'aura-arcas-en',   name: 'Arcas',   style: 'Casual, friendly' },
      { id: 'aura-perseus-en', name: 'Perseus', style: 'Clear, professional' },
      { id: 'aura-orpheus-en', name: 'Orpheus', style: 'Rich, expressive' },
      { id: 'aura-helios-en',  name: 'Helios',  style: 'British accent' },
      { id: 'aura-zeus-en',    name: 'Zeus',    style: 'Bold, commanding' },
      { id: 'aura-angus-en',   name: 'Angus',   style: 'Scottish accent' },
    ],
  };

  function getSelectedVoice() {
    return localStorage.getItem('luna_voice') || 'aura-asteria-en';
  }

  function getVoiceName(id) {
    const all = [...VOICES.female, ...VOICES.male];
    return all.find(v => v.id === id)?.name || 'Asteria';
  }

  function showVoicePicker() {
    if (document.getElementById('voice-picker-overlay')) return;
    const current = getSelectedVoice();

    const overlay = document.createElement('div');
    overlay.id = 'voice-picker-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '99999',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter,sans-serif', padding: '16px',
    });

    const buildSection = (label, voices) => {
      const cards = voices.map(v => `
        <button class="vp-card ${v.id === current ? 'vp-card--active' : ''}"
                data-voice="${v.id}" type="button">
          <span class="vp-name">${v.name}</span>
          <span class="vp-style">${v.style}</span>
          ${v.id === current ? '<span class="vp-check">✓</span>' : ''}
        </button>`).join('');
      return `
        <div class="vp-section-label">${label}</div>
        <div class="vp-grid">${cards}</div>`;
    };

    overlay.innerHTML = `
      <div class="vp-modal">
        <div class="vp-header">
          <h2 class="vp-title">Choose Luna's Voice</h2>
          <button class="vp-close" id="vp-close" type="button">✕</button>
        </div>
        <div class="vp-body">
          ${buildSection('Female', VOICES.female)}
          ${buildSection('Male', VOICES.male)}
        </div>
      </div>`;

    document.body.appendChild(overlay);

    // Close button
    document.getElementById('vp-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    // Voice card selection
    overlay.querySelectorAll('.vp-card').forEach(card => {
      card.addEventListener('click', () => {
        const voiceId = card.dataset.voice;
        localStorage.setItem('luna_voice', voiceId);
        updateVoiceStatus(getVoiceName(voiceId) + ' ✓');
        overlay.remove();
      });
    });
  }

  /* ── Voice status badge (clickable to open picker) ── */
  function updateVoiceStatus(text) {
    const el = document.getElementById('voice-status-text');
    if (el) el.textContent = text;
  }

  // Make the status badge open the voice picker on click
  const voiceStatusBadge = document.getElementById('voice-status');
  if (voiceStatusBadge) {
    voiceStatusBadge.style.cursor = 'pointer';
    voiceStatusBadge.style.pointerEvents = 'auto';
    voiceStatusBadge.title = 'Change voice';
    voiceStatusBadge.addEventListener('click', showVoicePicker);
  }

  /* ════════════════════════════════════════════════════════════════
     CHAT BUBBLE  (keeps existing design)
  ════════════════════════════════════════════════════════════════ */
  const bubble = document.createElement('div');
  bubble.id = 'luna-bubble';
  Object.assign(bubble.style, {
    position:       'fixed',
    ...(isMobileDevice
      ? { top: '76px', bottom: 'auto' }
      : { bottom: '88px', top: 'auto' }),
    left:           '50%',
    transform:      'translateX(-50%) translateY(-10px)',
    background:     'rgba(6,6,16,0.95)',
    border:         '1px solid rgba(59,130,246,0.4)',
    borderRadius:   isMobileDevice ? '14px' : '18px',
    padding:        isMobileDevice ? '11px 15px' : '14px 20px',
    color:          '#fff',
    fontSize:       isMobileDevice ? '13px' : '15px',
    lineHeight:     '1.55',
    maxWidth:       isMobileDevice ? '88vw' : '420px',
    minWidth:       '160px',
    textAlign:      'center',
    backdropFilter: 'blur(16px)',
    opacity:        '0',
    transition:     'opacity 0.3s ease, transform 0.3s ease',
    zIndex:         '9999',
    pointerEvents:  'none',
    fontFamily:     'Inter,sans-serif',
    boxShadow:      '0 10px 40px rgba(0,0,0,0.6)',
  });
  document.body.appendChild(bubble);

  /* tiny "listening" badge at bottom of page */
  const badge = document.createElement('div');
  badge.id = 'luna-wake-badge';
  Object.assign(badge.style, {
    position:       'fixed',
    bottom:         '24px',
    left:           '50%',
    transform:      'translateX(-50%)',
    background:     'rgba(6,6,16,0.85)',
    border:         '1px solid rgba(59,130,246,0.3)',
    borderRadius:   '100px',
    padding:        '5px 14px 5px 10px',
    color:          '#9ca3af',
    fontSize:       '12px',
    fontWeight:     '500',
    display:        'flex',
    alignItems:     'center',
    gap:            '7px',
    zIndex:         '9998',
    opacity:        '0',
    transition:     'opacity 0.4s ease',
    fontFamily:     'Inter,sans-serif',
    backdropFilter: 'blur(8px)',
  });
  badge.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:#3b82f6;
    animation:dot-pulse 1.6s ease-in-out infinite;flex-shrink:0;display:inline-block;"></span>
    <span id="luna-badge-text">Listening…</span>`;
  document.body.appendChild(badge);

  /* ── Bubble helpers ── */
  let bubbleTimer = null;
  function showBubble(html, autohide = 0) {
    clearTimeout(bubbleTimer);
    bubble.innerHTML = html;
    bubble.style.opacity = '1';
    bubble.style.transform = 'translateX(-50%) translateY(0)';
    if (autohide) bubbleTimer = setTimeout(hideBubble, autohide);
  }
  function hideBubble() {
    bubble.style.opacity = '0';
    bubble.style.transform = isMobileDevice
      ? 'translateX(-50%) translateY(-10px)'
      : 'translateX(-50%) translateY(14px)';
  }
  function showBadge(show) { badge.style.opacity = show ? '1' : '0'; }

  /* ════════════════════════════════════════════════════════════════
     SENTIMENT DETECTION  (client-side, Xenova/transformers)
  ════════════════════════════════════════════════════════════════ */
  let sentimentPipeline = null;

  async function initSentiment() {
    try {
      const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
      sentimentPipeline = await pipeline(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );
    } catch (e) {
      console.warn('Luna: sentiment model failed to load:', e.message);
    }
  }

  async function detectSentiment(text) {
    const lower = text.toLowerCase();
    if (/\b(hack(ed)?|breach(ed)?|compromised|urgent|attack(ed)?|stolen|pwned)\b/.test(lower)) return 'stressed';
    if (/\b(why|how|what|explain|confused|don't understand|what is|what are)\b/.test(lower) && lower.length < 80) return 'confused';
    if (!sentimentPipeline) return 'casual';
    try {
      const result = await sentimentPipeline(text);
      const { label, score } = result[0];
      if (label === 'NEGATIVE' && score > 0.85) return 'frustrated';
      if (label === 'POSITIVE' && score > 0.92) return 'excited';
    } catch {}
    return 'casual';
  }

  /* ════════════════════════════════════════════════════════════════
     WAV ENCODER  (pure Web Audio API, no libraries)
  ════════════════════════════════════════════════════════════════ */
  function float32ToWav(samples, sampleRate = 16000) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view   = new DataView(buffer);
    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4,  36 + samples.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1,  true);   // PCM
    view.setUint16(22, 1,  true);   // mono
    view.setUint32(24, sampleRate,       true);
    view.setUint32(28, sampleRate * 2,   true);
    view.setUint16(32, 2,  true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    const pcm = new Int16Array(buffer, 44);
    for (let i = 0; i < samples.length; i++) {
      pcm[i] = Math.max(-32768, Math.min(32767, samples[i] * 32768));
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }

  /* ════════════════════════════════════════════════════════════════
     STT  — Groq Whisper Large V3 Turbo via /api/transcribe
  ════════════════════════════════════════════════════════════════ */
  async function transcribeAudio(float32Array) {
    const wav         = float32ToWav(float32Array);
    const arrayBuffer = await wav.arrayBuffer();
    const bytes       = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    const res  = await fetch('/api/transcribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ audio: base64 }),
    });
    const data = await res.json();
    return data.text || '';
  }

  /* ════════════════════════════════════════════════════════════════
     LLM  — Groq Llama 3.3 via /api/chat (sentiment injected server-side)
  ════════════════════════════════════════════════════════════════ */
  async function callGroq(sentiment) {
    const scanContext = window._lunaLastScan
      ? `\n\nRecent scan of ${window._lunaLastScan.url}: Score ${window._lunaLastScan.score}/100 (${window._lunaLastScan.verdict}). Findings: ${window._lunaLastScan.findings.map(f => `${f.name}: ${f.status}${f.detail ? ' — ' + f.detail : ''}`).join('; ')}.`
      : null;

    const res = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages: history, sentiment, scanContext }),
    });
    if (!res.ok) throw new Error('api_fail');
    const data = await res.json();
    return (data.reply || '').trim();
  }

  /* ════════════════════════════════════════════════════════════════
     TTS  — Deepgram Aura via /api/tts with user-selected voice
  ════════════════════════════════════════════════════════════════ */
  async function synthesizeSpeech(text, exaggeration = 0.6) {
    const res = await fetch('/api/tts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text, exaggeration, voice: getSelectedVoice() }),
    });
    if (!res.ok) throw new Error(`tts_fail:${res.status}`);
    return await res.json(); // { audio: base64, format, fallback? }
  }

  // Called once inside acquireMicAndStart() which runs during a user gesture.
  // iOS tracks unlocked Audio elements — the same element can play() from async
  // contexts forever after being activated during a gesture.
  function initAudioElement() {
    lunaAudio = new Audio();
    lunaAudio.playsInline = true;
    // Touch-play a silent WAV to fully unlock the element on iOS
    lunaAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    lunaAudio.volume = 0;
    lunaAudio.play().catch(() => {});
    lunaAudio.volume = 1;
  }

  async function playBase64Audio(base64, format = 'wav') {
    return new Promise((resolve) => {
      try {
        const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const blob = new Blob([bytes], { type: mimeType });
        const url  = URL.createObjectURL(blob);

        if (!lunaAudio) {
          // Fallback if initAudioElement() wasn't called (e.g. desktop)
          lunaAudio = new Audio();
          lunaAudio.playsInline = true;
        }

        const cleanup = () => URL.revokeObjectURL(url);
        lunaAudio.onended = () => { cleanup(); resolve(); };
        lunaAudio.onerror = () => { cleanup(); resolve(); };
        lunaAudio.src = url;
        lunaAudio.play().catch(() => { cleanup(); resolve(); });
      } catch (err) {
        console.error('Luna: audio playback error:', err);
        resolve();
      }
    });
  }

  /* ── TTS warm-up on page load: fire and forget ── */
  async function warmUpTTS() {
    try {
      await fetch('/api/tts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: 'Hello.', exaggeration: 0.5 }),
      });
      updateVoiceStatus('Chatterbox-Turbo ready');
      console.log('Luna: TTS warm-up complete');
    } catch {
      console.log('Luna: TTS warm-up failed (will retry on first use)');
    }
  }

  /* ════════════════════════════════════════════════════════════════
     MAIN VOICE PIPELINE
     VAD fires onSpeechEnd → transcribe → sentiment → LLM → TTS → play
  ════════════════════════════════════════════════════════════════ */
  async function handleUserSpeech(audioFloat32) {
    if (isProcessing) return;
    isProcessing = true;

    try {
      // 1. Transcribe
      setState('thinking');
      updateVoiceStatus('Transcribing…');
      const transcript = await transcribeAudio(audioFloat32);
      if (!transcript || transcript.trim().length < 2) {
        setState('wake');
        isProcessing = false;
        return;
      }

      showBubble(`<span style="color:#9ca3af;font-size:13px;">You</span><br/>"${transcript}"`);

      // 2. Sentiment (fast — keyword then ML)
      const sentiment = await detectSentiment(transcript);

      // 3. Add to history and call LLM
      updateVoiceStatus('Thinking…');
      history.push({ role: 'user', content: transcript });
      if (history.length > 12) history.splice(0, 2); // keep last 6 turns

      const rawResponse = await callGroq(sentiment);
      if (!rawResponse) throw new Error('empty_reply');

      history.push({ role: 'assistant', content: rawResponse });
      if (history.length > 12) history.splice(0, 2);

      // Show clean text in bubble (strip emotion tags for display)
      const cleanText = rawResponse.replace(/\[.*?\]/g, '').trim();
      showBubble(`<span style="color:#60a5fa;font-size:13px;font-weight:600;">Luna</span><br/>${cleanText}`);

      // 4. TTS — send raw response WITH tags to Chatterbox (it renders them natively)
      setState('speaking');
      updateVoiceStatus('Speaking…');
      const exaggeration = sentiment === 'excited' ? 0.75 : sentiment === 'stressed' ? 0.45 : 0.6;
      const ttsData = await synthesizeSpeech(rawResponse, exaggeration);

      // 5. Play
      await playBase64Audio(ttsData.audio, ttsData.format);
      updateVoiceStatus(getVoiceName(getSelectedVoice()) + ' ✓');
      setTimeout(hideBubble, 5000);

    } catch (err) {
      console.error('Luna pipeline error:', err);
      showBubble("Something glitched on my end. I'm still here though!", 3500);
    }

    setState('wake');
    showBadge(true);
    isProcessing = false;
  }

  /* ── Greeting on session start ── */
  async function greet() {
    const lines = [
      "Hey! I'm Luna, your AI security buddy. What's on your mind?",
      "Oh hey, finally someone to talk to. I'm Luna — ask me anything.",
      "You called? I'm Luna. Cybersecurity, small talk, and the occasional terrible joke.",
    ];
    const line = lines[Math.floor(Math.random() * lines.length)];
    history.push({ role: 'assistant', content: line });

    showBubble(`<span style="color:#60a5fa;font-size:13px;font-weight:600;">Luna</span><br/>${line}`);
    setState('speaking');
    isProcessing = true;

    try {
      const ttsData = await synthesizeSpeech(line, 0.6);
      await playBase64Audio(ttsData.audio, ttsData.format);
      updateVoiceStatus(getVoiceName(getSelectedVoice()) + ' ✓');
    } catch {
      // If TTS fails on greeting, the bubble text is still visible — carry on
    }

    setState('wake');
    showBadge(true);
    isProcessing = false;
  }

  /* ════════════════════════════════════════════════════════════════
     VAD  — Silero VAD via @ricky0123/vad-web CDN
  ════════════════════════════════════════════════════════════════ */
  async function initVAD() {
    // Wait for CDN script to make window.vad available
    for (let i = 0; i < 50; i++) {
      if (window.vad) break;
      await new Promise(r => setTimeout(r, 200));
    }
    if (!window.vad) throw new Error('VAD library not available');

    vadInstance = await window.vad.MicVAD.new({
      onSpeechStart: () => {
        if (isProcessing) return;
        setState('listening');
        showBubble('<span style="color:#60a5fa;">Listening…</span>');
        console.log('Luna: speech start');
      },
      onSpeechEnd: async (audioFloat32) => {
        if (isProcessing) return;
        setState('thinking');
        await handleUserSpeech(audioFloat32);
      },
      positiveSpeechThreshold: 0.8,
      negativeSpeechThreshold: 0.35,
      minSpeechFrames:         5,
    });

    await vadInstance.start();
    console.log('Luna: VAD started');
  }

  /* ── Start full session ── */
  async function acquireMicAndStart() {
    updateVoiceStatus('Starting…');
    setState('wake');
    showBadge(true);
    initAudioElement(); // must run inside a user-gesture call stack for iOS unlock

    try {
      await initVAD();
      updateVoiceStatus('Ready');
    } catch (err) {
      console.error('Luna: VAD failed:', err.message);
      updateVoiceStatus('Voice error — please refresh');
      showBubble('Could not start voice detection. Please refresh and allow microphone access.', 6000);
      setState('stopped');
      showBadge(false);
      return;
    }

    // Load sentiment model in background — don't block
    initSentiment();

    // Greet
    await greet();
  }

  /* ════════════════════════════════════════════════════════════════
     PERMISSION MODAL  (first visit)
  ════════════════════════════════════════════════════════════════ */
  function showPermissionModal() {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '99999',
      background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter,sans-serif',
    });
    overlay.innerHTML = `
      <div style="background:#0d0d1a;border:1px solid rgba(59,130,246,0.4);border-radius:24px;
        padding:36px 32px;max-width:380px;width:90%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,0.7);">
        <div style="width:72px;height:72px;border-radius:50%;margin:0 auto 20px;
          background:radial-gradient(circle at 35% 30%,#93c5fd,#3b82f6 40%,#1e3a8a);
          box-shadow:0 0 32px rgba(59,130,246,0.7);display:flex;align-items:center;justify-content:center;font-size:28px;">🎤</div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;">Luna needs your mic</h3>
        <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin-bottom:6px;">
          Allow microphone access <b style="color:#fff">once</b> and Luna will<br/>
          automatically detect when you speak.
        </p>
        <p style="color:#4b5563;font-size:12px;margin-bottom:24px;">Audio never stored. Used only by the AI.</p>
        <div style="display:flex;gap:10px;">
          <button id="lp-deny" style="flex:1;padding:11px;border-radius:10px;
            border:1px solid rgba(255,255,255,0.1);background:transparent;color:#9ca3af;
            font-size:14px;font-weight:500;cursor:pointer;font-family:Inter,sans-serif;">Not now</button>
          <button id="lp-allow" style="flex:2;padding:11px;border-radius:10px;border:none;
            background:#2563eb;color:#fff;font-size:14px;font-weight:600;cursor:pointer;
            font-family:Inter,sans-serif;">Allow microphone</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('lp-allow').addEventListener('click', () => {
      overlay.remove();
      localStorage.setItem('luna_mic_ok', '1');
      acquireMicAndStart();
    });
    document.getElementById('lp-deny').addEventListener('click', () => overlay.remove());
  }

  /* ════════════════════════════════════════════════════════════════
     SPHERE CLICK  — interrupt / re-activate
  ════════════════════════════════════════════════════════════════ */
  sphereWrap.addEventListener('click', (e) => {
    if (['lp-allow', 'lp-deny'].includes(e.target.id)) return;

    if (state === 'speaking' && isProcessing) {
      // Interrupt Luna mid-speech
      isProcessing = false;
      setState('wake');
      showBadge(true);
      hideBubble();
      return;
    }
    if (state === 'stopped') { acquireMicAndStart(); return; }
    if (state === 'setup')   { showPermissionModal(); return; }
  });

  /* ── iOS/Android audio session unlock (must be inside a user gesture) ── */
  const unlockAudio = () => {
    try {
      audioCtx = new (window.AudioContext || window['webkitAudioContext'])();
      audioCtx.resume();
      const buf = audioCtx.createBuffer(1, 1, 22050);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(audioCtx.destination);
      src.start(0);
    } catch {}
  };
  document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  document.addEventListener('click',      unlockAudio, { once: true });

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init() {
    warmUpTTS();
    updateVoiceStatus(getVoiceName(getSelectedVoice()) + ' — click to change');

    if (localStorage.getItem('luna_mic_ok') === '1') {
      showBadge(true);
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'microphone' }).then(p => {
          if (p.state === 'granted') {
            acquireMicAndStart();
          } else if (p.state === 'denied') {
            localStorage.removeItem('luna_mic_ok');
            showBadge(false);
            updateVoiceStatus('Mic blocked — check browser settings');
            showBubble('Mic access is blocked. Allow it in browser settings then refresh.', 6000);
          }
          // 'prompt' → wait for click (general click handler handles state === 'setup')
          p.onchange = () => {
            if (p.state === 'granted' && state === 'setup') acquireMicAndStart();
          };
        }).catch(() => { /* permissions API unsupported — wait for click */ });
      }
      // If no permissions API: click handler will fire showPermissionModal via state === 'setup'
    }
    // First visit: state stays 'setup', click handler shows modal
  }

  init();
})();


/* ── Live Sphere: mouse tracking + idle bob ── */
(function () {
  const sphereWrap = document.getElementById('sphereWrap');
  const sphere     = document.getElementById('sphere');
  const eyeLeft    = document.getElementById('eyeLeft');
  const eyeRight   = document.getElementById('eyeRight');
  if (!sphereWrap || !eyeLeft || !eyeRight) return;

  const pupilLeft  = eyeLeft.querySelector('.pupil');
  const pupilRight = eyeRight.querySelector('.pupil');

  // Max pupil travel inside eye (px)
  const MAX_TRAVEL = 5;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  // Track mouse globally
  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function movePupil(eyeEl, pupilEl) {
    const rect   = eyeEl.getBoundingClientRect();
    const cx     = rect.left + rect.width  / 2;
    const cy     = rect.top  + rect.height / 2;
    const dx     = currentX - cx;
    const dy     = currentY - cy;
    const dist   = Math.sqrt(dx * dx + dy * dy) || 1;
    const travel = Math.min(dist / 18, MAX_TRAVEL);
    const px     = (dx / dist) * travel;
    const py     = (dy / dist) * travel;
    pupilEl.style.transform = `translate(${px}px, ${py}px)`;
  }

  // Smooth follow loop
  function tick() {
    currentX += (mouseX - currentX) * 0.12;
    currentY += (mouseY - currentY) * 0.12;
    movePupil(eyeLeft,  pupilLeft);
    movePupil(eyeRight, pupilRight);
    requestAnimationFrame(tick);
  }
  tick();

  // Sphere tilt toward cursor
  sphereWrap.addEventListener('mousemove', e => {
    const rect  = sphereWrap.getBoundingClientRect();
    const cx    = rect.left + rect.width  / 2;
    const cy    = rect.top  + rect.height / 2;
    const rotY  = ((e.clientX - cx) / rect.width)  * 18;
    const rotX  = -((e.clientY - cy) / rect.height) * 14;
    sphere.style.transition = 'transform 0.1s ease-out, filter 0.3s ease';
    sphere.style.transform  = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
  });
  sphereWrap.addEventListener('mouseleave', () => {
    sphere.style.transition = 'transform 0.6s ease, filter 0.3s ease';
    sphere.style.transform  = '';
  });

  // Click: excited bounce + glow burst
  sphereWrap.addEventListener('click', () => {
    sphere.style.transition = 'transform 0.15s ease, filter 0.15s ease';
    sphere.style.transform  = 'scale(1.18)';
    sphere.style.filter     =
      'drop-shadow(0 0 80px rgba(37,99,235,1)) drop-shadow(0 0 140px rgba(96,165,250,0.7))';
    setTimeout(() => {
      sphere.style.transform = 'scale(0.95)';
      setTimeout(() => {
        sphere.style.transform = '';
        sphere.style.filter    = '';
        sphere.style.transition = '';
      }, 200);
    }, 150);
  });
})();

/* ── Navbar scroll effect ── */
(function () {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();


/* ── Smooth-scroll nav-link active state ── */
(function () {
  const links = document.querySelectorAll('.nav-link[href^="#"]');
  const sections = [];

  links.forEach(link => {
    const id = link.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) sections.push({ el, link });
  });

  const onScroll = () => {
    const scrollY = window.scrollY + 80; // offset for navbar height
    let current = null;

    sections.forEach(({ el, link }) => {
      if (el.offsetTop <= scrollY) current = link;
    });

    links.forEach(l => l.classList.remove('active'));
    if (current) current.classList.add('active');
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ── Mobile hamburger menu ── */
(function () {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close menu when a link is clicked
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
})();


/* ── Features tab switching ── */
(function () {
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const dppWords  = document.querySelectorAll('.dpp-word');

  if (!tabBtns.length) return;

  function activateTab(index) {
    // Buttons
    tabBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
      btn.setAttribute('aria-selected', String(i === index));
    });

    // Panels
    tabPanels.forEach((panel, i) => {
      panel.classList.toggle('active', i === index);
    });

    // DETECT.PROTECT.PREVENT highlight
    dppWords.forEach((word, i) => {
      word.classList.toggle('active', i === index);
    });
  }

  tabBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => activateTab(i));
  });

  // Also allow clicking the DPP words themselves
  dppWords.forEach((word, i) => {
    word.style.cursor = 'pointer';
    word.addEventListener('click', () => activateTab(i));
  });

  // Initialise first tab
  activateTab(0);
})();


/* ════════════════════════════════════════════════════════════════
   SUPABASE — Auth + Scan History
════════════════════════════════════════════════════════════════ */
let _supabase   = null;
let _currentUser = null;

async function initSupabase() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return;
    const { supabaseUrl, supabaseKey } = await res.json();
    if (!supabaseUrl || !supabaseKey || !window.supabase) return;

    _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const { data: { session } } = await _supabase.auth.getSession();
    if (session) _setUser(session.user);

    _supabase.auth.onAuthStateChange((_ev, session) => _setUser(session?.user || null));
  } catch {}
}

function _setUser(user) {
  _currentUser = user;
  const authBtn   = document.getElementById('auth-btn');
  const authUser  = document.getElementById('auth-user');
  const authEmail = document.getElementById('auth-email');
  if (!authBtn) return;
  if (user) {
    authBtn.style.display  = 'none';
    if (authUser)  authUser.style.display  = 'flex';
    if (authEmail) authEmail.textContent   = user.email;
  } else {
    authBtn.style.display  = '';
    if (authUser)  authUser.style.display  = 'none';
  }
  window.dispatchEvent(new CustomEvent('luna-auth-changed', { detail: user }));
}

async function _saveScan(url, type, score, verdict, findings) {
  if (!_supabase || !_currentUser) return;
  try {
    await _supabase.from('scans').insert({
      user_id: _currentUser.id,
      url, type, score, verdict,
      findings: Array.from(findings.values()),
    });
  } catch {}
}

/* ── Auth modal ── */
function showAuthModal() {
  if (document.getElementById('auth-modal')) return;
  let mode = 'signin';

  const overlay = document.createElement('div');
  overlay.id = 'auth-modal';
  overlay.className = 'auth-overlay';

  const box = document.createElement('div');
  box.className = 'auth-box';

  // Title
  const titleEl = document.createElement('h2');
  titleEl.className = 'auth-title';
  titleEl.textContent = 'Sign in to Luna';

  // Subtitle toggle
  const toggle = document.createElement('p');
  toggle.className = 'auth-toggle';

  // Email
  const emailLabel = document.createElement('label');
  emailLabel.className = 'auth-label';
  emailLabel.textContent = 'Email';
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.className = 'auth-input';
  emailInput.placeholder = 'you@example.com';
  emailInput.autocomplete = 'email';

  // Password
  const passLabel = document.createElement('label');
  passLabel.className = 'auth-label';
  passLabel.textContent = 'Password';
  const passInput = document.createElement('input');
  passInput.type = 'password';
  passInput.className = 'auth-input';
  passInput.placeholder = '••••••••';
  passInput.autocomplete = 'current-password';

  // Error
  const errorEl = document.createElement('p');
  errorEl.className = 'auth-error';

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'btn-primary auth-submit';
  submitBtn.textContent = 'Sign In';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'auth-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '✕';

  function refreshMode() {
    if (mode === 'signin') {
      titleEl.textContent  = 'Sign in to Luna';
      submitBtn.textContent = 'Sign In';
      toggle.textContent   = "Don't have an account? ";
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'auth-link';
      link.textContent = 'Create one';
      link.addEventListener('click', () => { mode = 'signup'; refreshMode(); });
      toggle.appendChild(link);
    } else {
      titleEl.textContent  = 'Create your account';
      submitBtn.textContent = 'Create Account';
      toggle.textContent   = 'Already have an account? ';
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'auth-link';
      link.textContent = 'Sign in';
      link.addEventListener('click', () => { mode = 'signin'; refreshMode(); });
      toggle.appendChild(link);
    }
    errorEl.textContent = '';
  }
  refreshMode();

  submitBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const pass  = passInput.value;
    if (!email || !pass) { errorEl.textContent = 'Please fill in both fields.'; return; }
    if (!_supabase) { errorEl.textContent = 'Auth service unavailable.'; return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Please wait…';
    errorEl.textContent = '';

    const fn = mode === 'signup'
      ? _supabase.auth.signUp({ email, password: pass })
      : _supabase.auth.signInWithPassword({ email, password: pass });

    const { error } = await fn;
    submitBtn.disabled = false;
    refreshMode();

    if (error) {
      errorEl.textContent = error.message;
    } else {
      if (mode === 'signup') {
        errorEl.style.color = '#4ade80';
        errorEl.textContent = 'Check your email to confirm your account.';
      } else {
        overlay.remove();
      }
    }
  });

  passInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitBtn.click(); });
  closeBtn.addEventListener('click',  () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  box.append(closeBtn, titleEl, toggle, emailLabel, emailInput, passLabel, passInput, errorEl, submitBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  emailInput.focus();
}

/* ════════════════════════════════════════════════════════════════
   SCAN HISTORY MODAL
════════════════════════════════════════════════════════════════ */
function showHistoryModal() {
  if (document.getElementById('history-modal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'history-modal';
  overlay.className = 'history-overlay';

  const box = document.createElement('div');
  box.className = 'history-box';

  // Header
  const header = document.createElement('div');
  header.className = 'history-header';
  const title = document.createElement('h2');
  title.className = 'history-title';
  title.textContent = 'Scan History';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'history-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => overlay.remove());
  header.append(title, closeBtn);

  // List area
  const list = document.createElement('div');
  list.className = 'history-list';

  const loading = document.createElement('p');
  loading.className = 'history-loading';
  loading.textContent = 'Loading…';
  list.appendChild(loading);

  box.append(header, list);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  // Fetch scans
  (async () => {
    if (!_supabase) {
      loading.textContent = 'Auth service unavailable.';
      return;
    }
    try {
      const { data, error } = await _supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      list.removeChild(loading);

      if (error) throw error;

      if (!data || data.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'history-empty';
        empty.textContent = 'No scans yet. Run your first scan above.';
        list.appendChild(empty);
        return;
      }

      const verdictColor = {
        'Safe': '#22c55e', 'Low Risk': '#84cc16',
        'Suspicious': '#f59e0b', 'High Risk': '#f97316', 'Critical': '#ef4444',
      };

      data.forEach(scan => {
        const card = document.createElement('div');
        card.className = 'history-card';

        // Top row: verdict badge + score
        const top = document.createElement('div');
        top.className = 'history-card-top';

        const badge = document.createElement('span');
        badge.className = 'history-verdict-badge';
        badge.textContent = scan.verdict || 'Unknown';
        badge.style.color = verdictColor[scan.verdict] || '#9ca3af';
        badge.style.borderColor = verdictColor[scan.verdict] || '#9ca3af';

        const score = document.createElement('span');
        score.className = 'history-score';
        score.textContent = `${scan.score ?? '—'}/100`;
        score.style.color = verdictColor[scan.verdict] || '#9ca3af';

        top.append(badge, score);

        // URL
        const urlEl = document.createElement('div');
        urlEl.className = 'history-card-url';
        const urlText = (scan.url || '').length > 60
          ? (scan.url || '').slice(0, 57) + '…'
          : (scan.url || '');
        urlEl.textContent = urlText;
        urlEl.title = scan.url || '';

        // Meta row: date + scan type chip
        const meta = document.createElement('div');
        meta.className = 'history-card-meta';

        const dateEl = document.createElement('span');
        const d = new Date(scan.created_at);
        dateEl.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const typeChip = document.createElement('span');
        typeChip.className = 'history-type-chip';
        typeChip.textContent = scan.type === 'ddos' ? 'Web Security' : 'Phishing';

        meta.append(dateEl, typeChip);
        card.append(top, urlEl, meta);
        list.appendChild(card);
      });
    } catch (e) {
      list.removeChild(loading);
      const err = document.createElement('p');
      err.className = 'history-empty';
      err.textContent = 'Could not load history. Please try again.';
      list.appendChild(err);
    }
  })();
}

/* ════════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
════════════════════════════════════════════════════════════════ */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  // Force reflow then animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { toast.classList.add('toast--visible'); });
  });
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3500);
}

/* ════════════════════════════════════════════════════════════════
   RAZORPAY SUBSCRIPTION
════════════════════════════════════════════════════════════════ */
(function initRazorpay() {
  const guardianBtn = document.getElementById('guardian-plan-btn');
  if (!guardianBtn) return;

  guardianBtn.addEventListener('click', async () => {
    if (!_currentUser) {
      showAuthModal();
      return;
    }

    guardianBtn.disabled = true;
    guardianBtn.textContent = 'Loading…';

    try {
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'guardian' }),
      });

      if (!orderRes.ok) {
        showToast('Payment service unavailable. Please try again later.', 'error');
        return;
      }

      const data = await orderRes.json();

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Luna AI',
        description: 'Guardian Shield — ₹999/month',
        order_id: data.orderId,
        prefill: { email: _currentUser?.email },
        theme: { color: '#2563eb' },
        handler: async (response) => {
          try {
            const vRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                userId: _currentUser.id,
              }),
            });
            if (vRes.ok) {
              showToast('Guardian Shield activated!', 'success');
            } else {
              showToast('Payment verification failed. Contact support.', 'error');
            }
          } catch {
            showToast('Payment verification failed. Contact support.', 'error');
          }
        },
      });
      rzp.open();
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      guardianBtn.disabled = false;
      guardianBtn.textContent = 'Choose Plan';
    }
  });
})();

// Wire up navbar auth buttons
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('auth-btn')     ?.addEventListener('click', showAuthModal);
  document.getElementById('signout-btn')  ?.addEventListener('click', async () => {
    if (_supabase) await _supabase.auth.signOut();
  });
  document.getElementById('history-btn')  ?.addEventListener('click', showHistoryModal);
});

initSupabase();


/* ════════════════════════════════════════════════════════════════
   RISK SCORE ENGINE
════════════════════════════════════════════════════════════════ */
const SCORE_WEIGHTS = {
  // phishing
  urlpatterns:  20,
  domain:       30,
  ssl:          20,
  redirect:     15,
  info:         15,
  safebrowsing: 35,
  // web
  headers:      30,
  response:     15,
};

function calcScore(findings) {
  let score = 0;
  findings.forEach(f => {
    if (f.status === 'vulnerable') {
      score += SCORE_WEIGHTS[f.id] ?? 10;
    }
  });
  return Math.min(score, 100);
}

function scoreToVerdict(score) {
  if (score === 0)   return { label: 'Safe',        color: '#22c55e', cls: 'safe'     };
  if (score <= 25)   return { label: 'Low Risk',    color: '#84cc16', cls: 'low'      };
  if (score <= 55)   return { label: 'Suspicious',  color: '#f59e0b', cls: 'suspicious'};
  if (score <= 80)   return { label: 'High Risk',   color: '#f97316', cls: 'high'     };
  return               { label: 'Critical',      color: '#ef4444', cls: 'critical'  };
}


/* ════════════════════════════════════════════════════════════════
   PDF REPORT
════════════════════════════════════════════════════════════════ */
function generatePDF(scanUrl, type, score, verdict, findings) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleString();

  // Header bar
  doc.setFillColor(10, 10, 26);
  doc.rect(0, 0, W, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('luna!', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('SECURITY SCAN REPORT', W - 14, 18, { align: 'right' });

  // Meta
  doc.setTextColor(30, 30, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let y = 40;
  doc.text(`Target:`, 14, y);
  doc.setFont('helvetica', 'bold');
  doc.text(scanUrl.slice(0, 80), 40, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Scan type:`, 14, y);
  doc.setFont('helvetica', 'bold');
  doc.text(type === 'phishing' ? 'Phishing Detection' : 'Web Security Audit', 40, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated:`, 14, y);
  doc.setFont('helvetica', 'bold');
  doc.text(now, 40, y);

  // Score card
  y += 14;
  doc.setFillColor(245, 247, 255);
  doc.roundedRect(14, y, W - 28, 26, 3, 3, 'F');

  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');

  // Colour the score
  const rgb = verdict.cls === 'safe'       ? [34, 197, 94]
            : verdict.cls === 'low'        ? [132, 204, 22]
            : verdict.cls === 'suspicious' ? [245, 158, 11]
            : verdict.cls === 'high'       ? [249, 115, 22]
            :                               [239, 68, 68];
  doc.setTextColor(...rgb);
  doc.text(`${score}/100`, 20, y + 17);

  doc.setFontSize(14);
  doc.text(verdict.label.toUpperCase(), 70, y + 17);

  // Progress bar background
  doc.setFillColor(220, 220, 230);
  doc.roundedRect(14, y + 20, W - 28, 3, 1, 1, 'F');
  // Filled portion
  doc.setFillColor(...rgb);
  const barW = ((W - 28) * score) / 100;
  if (barW > 0) doc.roundedRect(14, y + 20, barW, 3, 1, 1, 'F');

  // Findings table
  y += 36;
  doc.setTextColor(30, 30, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Findings', 14, y);
  y += 5;

  doc.setDrawColor(200, 200, 215);
  doc.setLineWidth(0.3);
  doc.line(14, y, W - 14, y);
  y += 5;

  findings.forEach(f => {
    if (f.status === 'scanning') return;
    const isVuln = f.status === 'vulnerable';
    const dotRgb = isVuln ? [239, 68, 68] : [34, 197, 94];

    // Status dot
    doc.setFillColor(...dotRgb);
    doc.circle(17, y - 1, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 50);
    doc.text(f.name || '', 21, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(f.detail || (isVuln ? 'Issue detected' : 'No issues found'), 21, y + 4.5);

    y += 13;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated by Luna AI · meet-luna-ai.vercel.app', W / 2, 290, { align: 'center' });

  const safeName = scanUrl.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
  doc.save(`luna-scan-${safeName}.pdf`);
}


/* ════════════════════════════════════════════════════════════════
   LIVE SCAN ENGINE  (SSE-powered)
════════════════════════════════════════════════════════════════ */
function startLiveScan(url, type, resultsContainer, btn, btnOriginal) {
  while (resultsContainer.firstChild) resultsContainer.removeChild(resultsContainer.firstChild);

  // ── Build results card ──────────────────────────────────────
  const card = document.createElement('div');
  card.className = 'scan-results';

  // Header row
  const header = document.createElement('div');
  header.className = 'scan-results-header';
  const title = document.createElement('span');
  title.className = 'scan-results-title';
  title.textContent = 'Live Scan Results';
  const statusBadge = document.createElement('span');
  statusBadge.className = 'scan-status-badge scan-status-badge--running';
  statusBadge.textContent = 'Scanning…';
  header.append(title, statusBadge);
  card.appendChild(header);

  // Score card (hidden until complete)
  const scoreCard = document.createElement('div');
  scoreCard.className = 'score-card';
  scoreCard.style.display = 'none';
  card.appendChild(scoreCard);

  // Module list
  const moduleList = document.createElement('div');
  moduleList.className = 'scan-module-list';
  card.appendChild(moduleList);

  resultsContainer.appendChild(card);

  // ── Module rows ─────────────────────────────────────────────
  const rowMap   = {};
  const findings = new Map(); // id → {id, name, status, detail}

  function upsertRow(id, name, status, detail) {
    findings.set(id, { id, name, status, detail });

    if (rowMap[id]) {
      const row = rowMap[id];
      row.className = `scan-module-row scan-module-row--${status}`;
      const iconEl   = row.querySelector('.scan-module-icon');
      const detailEl = row.querySelector('.scan-module-detail');
      iconEl.textContent = status === 'scanning' ? '' : status === 'vulnerable' ? '⚠' : '✓';
      if (detailEl && detail) detailEl.textContent = detail;
      return;
    }

    const row  = document.createElement('div');
    row.className = `scan-module-row scan-module-row--${status}`;
    rowMap[id] = row;

    const icon = document.createElement('span');
    icon.className = 'scan-module-icon';
    icon.setAttribute('aria-hidden', 'true');
    if (status !== 'scanning') icon.textContent = status === 'vulnerable' ? '⚠' : '✓';

    const info = document.createElement('div');
    info.className = 'scan-module-info';

    const nameEl = document.createElement('span');
    nameEl.className = 'scan-module-name';
    nameEl.textContent = name;

    const detailEl = document.createElement('span');
    detailEl.className = 'scan-module-detail';
    if (detail) detailEl.textContent = detail;

    info.append(nameEl, detailEl);
    row.append(icon, info);
    moduleList.appendChild(row);
  }

  // ── SSE connection ──────────────────────────────────────────
  const sse = new EventSource(`/api/scan?url=${encodeURIComponent(url)}&type=${encodeURIComponent(type)}`);

  sse.addEventListener('status', (e) => {
    try { statusBadge.textContent = JSON.parse(e.data).message; } catch {}
  });

  sse.addEventListener('finding', (e) => {
    try {
      const d = JSON.parse(e.data);
      if (typeof d.id !== 'string' || typeof d.name !== 'string') return;
      const status = ['scanning', 'safe', 'vulnerable'].includes(d.status) ? d.status : 'safe';
      const detail = typeof d.detail === 'string' ? d.detail : '';
      upsertRow(d.id, d.name, status, detail);
    } catch {}
  });

  sse.addEventListener('complete', () => {
    sse.close();
    statusBadge.className   = 'scan-status-badge scan-status-badge--done';
    statusBadge.textContent = 'Complete';

    // ── Score card ──────────────────────────────────────────
    const score   = calcScore(findings);
    const verdict = scoreToVerdict(score);

    scoreCard.style.display = '';

    const scoreLine = document.createElement('div');
    scoreLine.className = 'score-card-top';

    const scoreNum = document.createElement('span');
    scoreNum.className = 'score-number';
    scoreNum.textContent = `${score}`;
    scoreNum.style.color = verdict.color;

    const scoreDenom = document.createElement('span');
    scoreDenom.className = 'score-denom';
    scoreDenom.textContent = '/100';

    const verdictBadge = document.createElement('span');
    verdictBadge.className = `verdict-badge verdict-badge--${verdict.cls}`;
    verdictBadge.textContent = verdict.label;

    scoreLine.append(scoreNum, scoreDenom, verdictBadge);

    const bar = document.createElement('div');
    bar.className = 'score-bar-track';
    const fill = document.createElement('div');
    fill.className = 'score-bar-fill';
    fill.style.width = `${score}%`;
    fill.style.background = verdict.color;
    bar.appendChild(fill);

    // PDF download button
    const pdfBtn = document.createElement('button');
    pdfBtn.type = 'button';
    pdfBtn.className = 'btn-pdf';
    pdfBtn.textContent = '↓ PDF Report';
    pdfBtn.addEventListener('click', () => {
      generatePDF(url, type, score, verdict, Array.from(findings.values()));
    });

    // Alert button
    const alertBtn = document.createElement('button');
    alertBtn.type = 'button';
    alertBtn.className = 'btn-pdf'; // reusing PDF styles
    alertBtn.innerHTML = '✉ Get Alert';
    alertBtn.style.marginLeft = '8px';
    alertBtn.addEventListener('click', async () => {
      if (!_currentUser) { showAuthModal(); return; }
      alertBtn.disabled = true;
      alertBtn.textContent = 'Sending…';
      try {
        const res = await fetch('/api/alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: _currentUser.email,
            subject: `Luna Security Alert: ${verdict.label} for ${url}`,
            html: `<h3>Luna Security Report</h3>
                   <p><b>Target:</b> ${url}</p>
                   <p><b>Score:</b> ${score}/100</p>
                   <p><b>Verdict:</b> ${verdict.label}</p>
                   <p>Findings: ${Array.from(findings.values()).map(f => f.name + ': ' + f.status).join(', ')}</p>`
          })
        });
        if (res.ok) {
          alertBtn.textContent = '✓ Sent';
          showToast('Security alert sent to your email!');
        } else {
          throw new Error('Failed');
        }
      } catch {
        alertBtn.textContent = '✕ Error';
        showToast('Failed to send email alert.', 'error');
      } finally {
        setTimeout(() => { alertBtn.disabled = false; alertBtn.innerHTML = '✉ Get Alert'; }, 3000);
      }
    });

    scoreCard.append(scoreLine, bar, pdfBtn, alertBtn);

    // Store scan context for Luna voice assistant
    window._lunaLastScan = {
      url,
      type,
      score,
      verdict: verdict.label,
      findings: Array.from(findings.values()).filter(f => f.status !== 'scanning'),
    };
    updateVoiceStatus('Scan analyzed — ask me anything');

    // Save to Supabase if logged in
    _saveScan(url, type, score, verdict.label, findings);

    // Reset button
    btn.textContent    = '✓ Done';
    btn.style.background = '#16a34a';
    btn.disabled       = false;
    btn.style.opacity  = '';
    setTimeout(() => {
      btn.textContent      = btnOriginal;
      btn.style.background = '';
    }, 3000);
  });

  sse.onerror = () => {
    sse.close();
    statusBadge.className   = 'scan-status-badge scan-status-badge--error';
    statusBadge.textContent = 'Error — could not reach scan engine';
    btn.textContent         = btnOriginal;
    btn.style.background    = '';
    btn.disabled            = false;
    btn.style.opacity       = '';
  };
}


/* ── Scan Now button (Phishing panel) ── */
(function () {
  const scanBtn = document.getElementById('phish-scan-btn');
  const input = document.getElementById('phish-input');
  const modeBtns = document.querySelectorAll('.mode-btn');
  if (!scanBtn || !input) return;

  let currentMode = 'url';

  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'scan-results-wrap';
  input.parentNode.appendChild(resultsContainer);

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.id === 'mode-url' ? 'url' : 'text';
      input.placeholder = currentMode === 'url' 
        ? "Paste your fishy website link (e.g. http://secure-login-bank.com)"
        : "Paste the email or message text you want me to analyze for phishing signals...";
    });
  });

  scanBtn.addEventListener('click', async () => {
    const val = input.value.trim();
    if (!val) {
      input.style.borderColor = '#dc2626';
      setTimeout(() => { input.style.borderColor = ''; }, 1800);
      return;
    }

    const originalText = scanBtn.textContent;
    scanBtn.textContent = 'Analyzing…';
    scanBtn.disabled = true;

    if (currentMode === 'url') {
      startLiveScan(val, 'phishing', resultsContainer, scanBtn, originalText);
    } else {
      // AI Message Analysis
      while (resultsContainer.firstChild) resultsContainer.removeChild(resultsContainer.firstChild);
      const card = document.createElement('div');
      card.className = 'scan-results';
      card.innerHTML = '<p style="color:#60a5fa; text-align:center;">Analyzing message patterns...</p>';
      resultsContainer.appendChild(card);

      try {
        const res = await fetch('/api/phish-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: val })
        });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        card.innerHTML = `
          <div class="score-card">
            <div class="score-card-top">
              <span class="score-number" style="color:${data.score > 70 ? '#ef4444' : data.score > 30 ? '#fbbf24' : '#22c55e'}">${data.score}</span>
              <span class="score-denom">/100</span>
              <span class="verdict-badge verdict-badge--${data.score > 70 ? 'critical' : data.score > 30 ? 'suspicious' : 'safe'}">${data.verdict}</span>
            </div>
            <div style="font-size:14px; line-height:1.6; color:#e2e8f0; white-space:pre-wrap; margin-top:10px;">${data.detail}</div>
          </div>
        `;
      } catch (err) {
        card.innerHTML = `<p style="color:#ef4444; text-align:center;">Error: ${err.message}</p>`;
      } finally {
        scanBtn.textContent = originalText;
        scanBtn.disabled = false;
      }
    }
  });
})();


/* ── URL scan button (Web Security panel) ── */
(function () {
  const urlScanBtn = document.querySelector('.url-scan-btn');
  const urlInput   = document.querySelector('.url-input');
  const autofill   = document.querySelector('.autofill-pill');
  if (!urlScanBtn || !urlInput) return;

  if (autofill) {
    autofill.addEventListener('click', () => {
      urlInput.value = 'https://example-website.com';
      urlInput.focus();
    });
  }

  const urlScanRow = document.querySelector('.url-scan-row');
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'scan-results-wrap';
  if (urlScanRow?.parentNode) {
    urlScanRow.parentNode.insertBefore(resultsContainer, urlScanRow.nextSibling);
  }

  urlScanBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) {
      urlInput.style.borderColor = '#dc2626';
      urlInput.placeholder = 'Please enter a URL or IP…';
      setTimeout(() => {
        urlInput.style.borderColor = '';
        urlInput.placeholder = 'Paste your website URL or IP Address here';
      }, 1800);
      return;
    }
    const original = urlScanBtn.textContent;
    urlScanBtn.textContent = '…';
    urlScanBtn.disabled    = true;
    startLiveScan(url, 'ddos', resultsContainer, urlScanBtn, original);
  });
})();


/* ── Go Premium button ── */
(function () {
  const premBtn = document.querySelector('.btn-gradient');
  if (!premBtn) return;
  premBtn.addEventListener('click', () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();


/* ── Intersection Observer: subtle entrance animations ── */
(function () {
  if (!window.IntersectionObserver) return;

  const targets = document.querySelectorAll(
    '.v-card, .pricing-card, .stat-box, .feature-bar, .panel-card'
  );

  // Give each target its starting state
  targets.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.5s ease ${(i % 6) * 0.07}s, transform 0.5s ease ${(i % 6) * 0.07}s`;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach(el => observer.observe(el));
})();


/* ── Plan button interactions ── */
(function () {
  document.querySelectorAll('.plan-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Simple feedback – in a real app this would open a checkout flow
      const orig = btn.textContent;
      btn.textContent = 'Processing…';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = orig;
        btn.disabled = false;
      }, 1200);
    });
  });
})();

/* ── AI Code Guardian & API Management ── */
(function() {
  const guardBtn = document.getElementById('guard-btn');
  const codeInput = document.getElementById('code-input');
  const guardResult = document.getElementById('guard-result');
  const modeCodeBtn = document.getElementById('guard-mode-code');
  const modeDepsBtn = document.getElementById('guard-mode-deps');

  let activeGuardMode = 'code';

  if (modeCodeBtn && modeDepsBtn) {
    modeCodeBtn.addEventListener('click', () => {
      modeCodeBtn.classList.add('active');
      modeDepsBtn.classList.remove('active');
      activeGuardMode = 'code';
      guardBtn.textContent = 'Review Code';
      codeInput.placeholder = 'Paste your source code here (JS, Python, Go, etc.)...';
    });
    modeDepsBtn.addEventListener('click', () => {
      modeDepsBtn.classList.add('active');
      modeCodeBtn.classList.remove('active');
      activeGuardMode = 'deps';
      guardBtn.textContent = 'Audit Dependencies';
      codeInput.placeholder = 'Paste list of dependencies (e.g. lodash@4.17.15, axios@0.19.0)...';
    });
    
    document.getElementById('guard-mode-github')?.addEventListener('click', () => {
      const btn = document.getElementById('guard-mode-github');
      btn.textContent = 'Connecting...';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = '✓ Connected';
        btn.style.borderColor = '#22c55e';
        btn.style.color = '#22c55e';
        showToast('GitHub repository sync enabled!');
      }, 1500);
    });
  }

  if (guardBtn) {
    guardBtn.addEventListener('click', async () => {
      const inputVal = codeInput.value.trim();
      if (!inputVal) return;

      const originalText = guardBtn.textContent;
      guardBtn.disabled = true;
      guardBtn.textContent = 'Analyzing…';
      guardResult.innerHTML = `<div class="guard-placeholder"><p>Luna is ${activeGuardMode === 'code' ? 'auditing your code' : 'checking dependencies'} for vulnerabilities...</p></div>`;

      try {
        if (activeGuardMode === 'code') {
          const res = await fetch('/api/guard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: inputVal })
          });
          const data = await res.json();
          if (data.review) {
            const htmlReport = data.review
              .replace(/🔴/g, '<span style="color:#f87171">🔴</span>')
              .replace(/🟡/g, '<span style="color:#fbbf24">🟡</span>')
              .replace(/🟢/g, '<span style="color:#4ade80">🟢</span>')
              .replace(/\n/g, '<br/>');
            guardResult.innerHTML = `<div class="guard-review-content">${htmlReport}</div>`;
          } else {
            throw new Error(data.error || 'Audit failed');
          }
        } else {
          // Dependency Audit
          const deps = inputVal.split(/[\n,]/).map(s => s.trim()).filter(s => s.length > 0);
          const res = await fetch('/api/dep-scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dependencies: deps })
          });
          const data = await res.json();
          
          if (data.findings) {
            guardResult.innerHTML = `
              <div class="guard-review-content">
                <h4 style="margin-bottom:15px; color:#fff;">Dependency Audit Report</h4>
                <div style="display:flex; flex-direction:column; gap:10px;">
                  ${data.findings.map(f => `
                    <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:8px; border-left:4px solid ${f.isVulnerable ? (f.severity === 'High' || f.severity === 'Critical' ? '#ef4444' : '#f59e0b') : '#22c55e'}">
                      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span style="font-weight:600;">${f.name}</span>
                        <span style="font-size:11px; text-transform:uppercase; font-weight:700; color:${f.isVulnerable ? '#ef4444' : '#22c55e'}">${f.isVulnerable ? f.severity : 'Secure'}</span>
                      </div>
                      ${f.isVulnerable ? `<p style="font-size:12px; color:#94a3b8;">${f.cve}: ${f.detail}</p>` : `<p style="font-size:12px; color:#64748b;">No known vulnerabilities.</p>`}
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          } else {
            throw new Error(data.error || 'Dependency audit failed');
          }
        }
      } catch (err) {
        guardResult.innerHTML = `<div class="guard-placeholder" style="color:#f87171"><p>Error: ${err.message}</p></div>`;
      } finally {
        guardBtn.disabled = false;
        guardBtn.textContent = originalText;
      }
    });
  }

  // API Key Management
  const createKeyBtn = document.getElementById('create-key-btn');
  const keyList = document.getElementById('key-list');
  const apiKeySection = document.getElementById('api-key-section');
  const apiAuthPrompt = document.getElementById('api-auth-prompt');

  async function refreshKeys() {
    if (!window._supabase) return;
    const { data: { user } } = await window._supabase.auth.getUser();
    
    if (!user) {
      if (apiKeySection) apiKeySection.style.display = 'none';
      if (apiAuthPrompt) apiAuthPrompt.style.display = 'block';
      return;
    }

    if (apiKeySection) apiKeySection.style.display = 'block';
    if (apiAuthPrompt) apiAuthPrompt.style.display = 'none';

    const { data: keys } = await window._supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (keyList) {
      if (keys && keys.length > 0) {
        keyList.innerHTML = keys.map(k => `
          <div class="key-item">
            <div class="key-info">
              <span class="key-name">${k.name}</span>
              <span class="key-value">${k.key.substring(0, 8)}****************</span>
            </div>
            <button class="btn-text" onclick="navigator.clipboard.writeText('${k.key}'); alert('Key copied!')">Copy</button>
          </div>
        `).join('');
      } else {
        keyList.innerHTML = '<p style="color:#64748b; text-align:center;">No API keys yet. Generate one to get started.</p>';
      }
    }
  }

  if (createKeyBtn) {
    createKeyBtn.addEventListener('click', async () => {
      const { data: { user } } = await window._supabase.auth.getUser();
      if (!user) return;

      const keyName = prompt('Enter a name for this key:', 'Production Key');
      if (!keyName) return;

      const randomBytes = new Uint8Array(24);
      window.crypto.getRandomValues(randomBytes);
      const newKey = 'luna_' + btoa(String.fromCharCode(...randomBytes)).replace(/[+/=]/g, '').toLowerCase();

      const { error } = await window._supabase
        .from('api_keys')
        .insert([{ user_id: user.id, name: keyName, key: newKey }]);

      if (error) {
        alert('Failed to generate key: ' + error.message);
      } else {
        refreshKeys();
      }
    });
  }

  window.addEventListener('luna-auth-changed', refreshKeys);
  setTimeout(refreshKeys, 2000);
})();

/* ── Sentinel Monitoring Simulation ── */
(function() {
  const bars = document.querySelectorAll('.mon-chart-sim .bar');
  const statusLabels = document.querySelectorAll('.mon-labels');
  
  function updateSentinel() {
    bars.forEach(bar => {
      const h = 70 + Math.random() * 25;
      bar.style.height = `${h}%`;
    });
    
    if (statusLabels[1]) {
      const now = new Date();
      statusLabels[1].textContent = `Last checked: ${now.getSeconds() % 60}s ago`;
    }
  }

  setInterval(updateSentinel, 3000);
})();
