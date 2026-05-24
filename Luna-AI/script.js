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
  let state = 'setup';
  let vadInstance = null;

  // ── Conversation memory: localStorage (guests) + Supabase (logged-in users) ──
  const HISTORY_KEY = 'luna_chat_history';
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
  }
  function saveHistory(h) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-20))); } catch { }
  }
  let history = loadHistory();
  let isProcessing = false;     // guard against overlapping pipeline runs
  let audioCtx = null;
  let lunaAudio = null;      // single persistent Audio element, unlocked on first gesture
  let awake = false;     // wake-word gate: false = sleeping, true = active conversation

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
      { id: 'aura-luna-en', name: 'Luna', style: 'Soft, natural' },
      { id: 'aura-stella-en', name: 'Stella', style: 'Upbeat, bright' },
      { id: 'aura-athena-en', name: 'Athena', style: 'Confident, clear' },
      { id: 'aura-hera-en', name: 'Hera', style: 'Mature, authoritative' },
    ],
    male: [
      { id: 'aura-orion-en', name: 'Orion', style: 'Deep, smooth' },
      { id: 'aura-arcas-en', name: 'Arcas', style: 'Casual, friendly' },
      { id: 'aura-perseus-en', name: 'Perseus', style: 'Clear, professional' },
      { id: 'aura-orpheus-en', name: 'Orpheus', style: 'Rich, expressive' },
      { id: 'aura-helios-en', name: 'Helios', style: 'British accent' },
      { id: 'aura-zeus-en', name: 'Zeus', style: 'Bold, commanding' },
      { id: 'aura-angus-en', name: 'Angus', style: 'Scottish accent' },
    ],
  };

  const PERSONAS = [
    { id: 'friendly', name: 'Friendly', style: 'Warm, supportive, conversational' },
    { id: 'professional', name: 'Professional', style: 'Direct, concise, data-first' },
    { id: 'hacker', name: 'Hacker', style: 'Dramatic, punchy, terminal energy' },
  ];

  function getSelectedVoice() {
    return localStorage.getItem('luna_voice') || 'aura-asteria-en';
  }

  function getSelectedPersona() {
    return localStorage.getItem('luna_persona') || 'friendly';
  }

  function getVoiceName(id) {
    const all = [...VOICES.female, ...VOICES.male];
    return all.find(v => v.id === id)?.name || 'Asteria';
  }

  function getPersonaLabel(id = getSelectedPersona()) {
    return PERSONAS.find(p => p.id === id)?.name || 'Friendly';
  }

  function getIdleVoiceStatus() {
    return `${getVoiceName(getSelectedVoice())} · ${getPersonaLabel()}`;
  }

  function showVoicePicker() {
    if (document.getElementById('voice-picker-overlay')) return;
    const current = getSelectedVoice();
    const currentPersona = getSelectedPersona();

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

    const buildPersonaSection = () => {
      const cards = PERSONAS.map(p => `
        <button class="vp-card ${p.id === currentPersona ? 'vp-card--active' : ''}"
                data-persona="${p.id}" type="button">
          <span class="vp-name">${p.name}</span>
          <span class="vp-style">${p.style}</span>
          ${p.id === currentPersona ? '<span class="vp-check">✓</span>' : ''}
        </button>`).join('');
      return `
        <div class="vp-section-label">Response Style</div>
        <div class="vp-grid">${cards}</div>`;
    };

    overlay.innerHTML = `
      <div class="vp-modal">
        <div class="vp-header">
          <h2 class="vp-title">Tune Luna</h2>
          <button class="vp-close" id="vp-close" type="button">✕</button>
        </div>
        <div class="vp-body">
          ${buildPersonaSection()}
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
        const personaId = card.dataset.persona;

        if (voiceId) {
          localStorage.setItem('luna_voice', voiceId);
          overlay.querySelectorAll('[data-voice]').forEach(el => el.classList.remove('vp-card--active'));
          card.classList.add('vp-card--active');
          updateVoiceStatus(`${getVoiceName(voiceId)} · ${getPersonaLabel()}`);
          return;
        }

        if (personaId) {
          localStorage.setItem('luna_persona', personaId);
          overlay.querySelectorAll('[data-persona]').forEach(el => el.classList.remove('vp-card--active'));
          card.classList.add('vp-card--active');
          updateVoiceStatus(`${getVoiceName(getSelectedVoice())} · ${getPersonaLabel(personaId)}`);
          showToast(`Luna is now in ${getPersonaLabel(personaId)} mode.`, 'success');
        }
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
    position: 'fixed',
    ...(isMobileDevice
      ? { top: '76px', bottom: 'auto' }
      : { bottom: '88px', top: 'auto' }),
    left: '50vw',
    transform: 'translateX(-50%) translateY(-10px)',
    background: 'rgba(6,6,16,0.95)',
    border: '1px solid rgba(59,130,246,0.4)',
    borderRadius: isMobileDevice ? '14px' : '18px',
    padding: isMobileDevice ? '11px 15px' : '14px 20px',
    color: '#fff',
    fontSize: isMobileDevice ? '13px' : '15px',
    lineHeight: '1.55',
    maxWidth: isMobileDevice ? '88vw' : '420px',
    minWidth: '160px',
    textAlign: 'center',
    backdropFilter: 'blur(16px)',
    opacity: '0',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    zIndex: '9999',
    pointerEvents: 'none',
    fontFamily: 'Inter,sans-serif',
    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
  });
  document.body.appendChild(bubble);

  /* tiny "listening" badge at bottom of page */
  const badge = document.createElement('div');
  badge.id = 'luna-wake-badge';
  Object.assign(badge.style, {
    position: 'fixed',
    top: '80px',
    right: '20px',
    background: 'rgba(6,6,16,0.85)',
    border: '1px solid rgba(59,130,246,0.4)',
    borderRadius: '100px',
    padding: '5px 14px 5px 10px',
    color: '#9ca3af',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    zIndex: '9997',
    opacity: '0',
    transition: 'opacity 0.4s ease',
    fontFamily: 'Inter,sans-serif',
    backdropFilter: 'blur(8px)',
    whiteSpace: 'nowrap',
  });
  badge.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:#3b82f6;
    animation:dot-pulse 1.6s ease-in-out infinite;flex-shrink:0;display:inline-block;"></span>
    <span id="luna-badge-text">Luna · Active</span>`;
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
  function showBadge(show) {
    badge.style.transition = show ? 'opacity 0.4s ease' : 'none';
    badge.style.opacity = show ? '1' : '0';
    const pill = document.querySelector('.api-pill');
    if (pill) pill.style.opacity = show ? '0' : '1';
  }

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
    } catch { }
    return 'casual';
  }

  /* ════════════════════════════════════════════════════════════════
     WAV ENCODER  (pure Web Audio API, no libraries)
  ════════════════════════════════════════════════════════════════ */
  function float32ToWav(samples, sampleRate = 16000) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);   // PCM
    view.setUint16(22, 1, true);   // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
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
    const wav = float32ToWav(float32Array);
    const arrayBuffer = await wav.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: base64 }),
    });
    const data = await res.json();
    return data.text || '';
  }

  /* ════════════════════════════════════════════════════════════════
     LLM  — Groq Llama 3.3 via /api/chat (sentiment injected server-side)
  ════════════════════════════════════════════════════════════════ */
  async function callGroq(sentiment) {
    // Rich structured scan context so LLM can reason about it properly
    let scanContext = null;
    if (window._lunaLastScan) {
      const s = window._lunaLastScan;
      const vulns = s.findings.filter(f => f.status === 'vulnerable').map(f => f.detail);
      scanContext = `ACTIVE SCAN RESULT — ${s.url}\nRisk Score: ${s.score}/100 | Verdict: ${s.verdict}\nVulnerabilities found: ${vulns.length > 0 ? vulns.join('; ') : 'none'}\nScan type: ${s.type}`;
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, sentiment, scanContext, persona: getSelectedPersona() }),
    });
    if (!res.ok) throw new Error('api_fail');
    const data = await res.json();
    return (data.reply || '').trim();
  }

  /* ════════════════════════════════════════════════════════════════
     LUNA AGENCY — Execute UI commands from LLM <CMD> responses
  ════════════════════════════════════════════════════════════════ */
  function executeLunaCommand(cmd) {
    const TAB_MAP = { phishing: 0, websec: 1, code: 2, api: 3, sentinel: 4, autopilot: 5 };
    const SECTION_MAP = { hero: '#hero', features: '#features', about: '#about', pricing: '#pricing', contact: '#contact' };

    try {
      switch (cmd.action) {
        case 'scroll_to': {
          const el = document.querySelector(SECTION_MAP[cmd.payload] || cmd.payload);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        }
        case 'switch_tab': {
          const idx = TAB_MAP[cmd.payload];
          if (idx !== undefined) {
            document.querySelector(`.tab-btn[data-tab="${idx}"]`)?.click();
            document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
          }
          break;
        }
        case 'run_scan': {
          const url = cmd.payload;
          if (!url) break;
          // Switch to phishing tab, fill input, trigger scan
          document.querySelector('.tab-btn[data-tab="0"]')?.click();
          document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
          requestAnimationFrame(() => {
            const inp = document.getElementById('phish-input');
            if (inp) {
              inp.value = url;
              inp.focus();
              setTimeout(() => document.getElementById('phish-scan-btn')?.click(), 400);
            }
          });
          break;
        }
        case 'show_history': {
          document.getElementById('history-btn')?.click();
          break;
        }
        case 'export_pdf': {
          document.querySelector('.pdf-btn')?.click();
          break;
        }
      }
    } catch (e) {
      console.warn('Luna command error:', e);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     TTS  — Deepgram Aura via /api/tts with user-selected voice
  ════════════════════════════════════════════════════════════════ */
  // Returns the voice ID adjusted for current threat context
  // User's chosen voice is always respected for non-threat responses
  function getContextualVoice() {
    const scan = window._lunaLastScan;
    const base = getSelectedVoice();
    if (!scan) return base;
    // For critical/high-risk scans, switch to a more urgent voice temporarily
    // but only if user is on a female voice (don't swap across genders)
    const femaleVoices = VOICES.female.map(v => v.id);
    const isFemale = femaleVoices.includes(base);
    if (scan.score >= 75 && isFemale) return 'aura-hera-en';     // authoritative, serious
    if (scan.score >= 40 && isFemale) return 'aura-athena-en';   // confident, clear
    return base;
  }

  async function synthesizeSpeech(text, exaggeration = 0.6) {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, exaggeration, voice: getContextualVoice() }),
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
    lunaAudio.play().catch(() => { });
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
        const url = URL.createObjectURL(blob);

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello.', exaggeration: 0.5 }),
      });
      updateVoiceStatus(getIdleVoiceStatus());
      console.log('Luna: TTS warm-up complete');
    } catch {
      console.log('Luna: TTS warm-up failed (will retry on first use)');
    }
  }

  /* ════════════════════════════════════════════════════════════════
     MAIN VOICE PIPELINE
     VAD fires onSpeechEnd → transcribe → sentiment → LLM → TTS → play
  ════════════════════════════════════════════════════════════════ */
  /* Wake word helpers */
  function isWakeWord(t) { return /\b(hey\s+luna|luna)\b/i.test(t); }
  function isSleepPhrase(t) { return /\b(goodbye\s+luna|bye\s+luna|stop\s+luna)\b/i.test(t); }
  function stripWakeWord(t) { return t.replace(/^\s*(hey\s+luna|luna)[,.\s]*/i, '').trim(); }
  async function wakeUp() {
    awake = true;
    setState('wake');
    showBadge(true);
    updateVoiceStatus('Active - say "Goodbye Luna" to stop');
    const lines = ["Hey, I'm listening.", "Yeah? What's up?", "You called - I'm here.", "Go ahead!"];
    const line = lines[Math.floor(Math.random() * lines.length)];
    showBubble('<span style="color:#60a5fa;font-size:13px;font-weight:600;">Luna</span><br/>' + line);
    try { const d = await synthesizeSpeech(line, 0.6); await playBase64Audio(d.audio, d.format); } catch { }
  }
  async function goToSleep() {
    awake = false;
    setState('wake');
    showBadge(false);
    updateVoiceStatus('Say "Luna" or "Hey Luna" to wake me');
    const lines = ["Goodbye! I'll be here when you need me.", "Going quiet - say hey Luna anytime.", "Sure, taking a break!"];
    const line = lines[Math.floor(Math.random() * lines.length)];
    showBubble('<span style="color:#60a5fa;font-size:13px;font-weight:600;">Luna</span><br/>' + line);
    try { const d = await synthesizeSpeech(line, 0.6); await playBase64Audio(d.audio, d.format); } catch { }
    setTimeout(hideBubble, 4000);
  }
  /* Main voice pipeline - wake-word gated */
  async function handleUserSpeech(audioFloat32) {
    if (isProcessing) return;
    isProcessing = true;
    try {
      setState('thinking');
      updateVoiceStatus('Transcribing...');
      const transcript = await transcribeAudio(audioFloat32);
      if (!transcript || transcript.trim().length < 2) {
        setState('wake'); showBadge(awake); isProcessing = false; return;
      }
      const t = transcript.trim();
      // Sleep phrase always works
      if (isSleepPhrase(t)) { isProcessing = false; await goToSleep(); return; }
      // Sleeping - only react to wake word
      if (!awake) {
        if (isWakeWord(t)) {
          isProcessing = false;
          await wakeUp();
          const remainder = stripWakeWord(t);
          if (remainder.length > 3) {
            isProcessing = false;
            awake = true;
            // Process the remainder as a question by re-running the pipeline logic inline
            const sentiment2 = await detectSentiment(remainder);
            history.push({ role: 'user', content: remainder });
            if (history.length > 12) history.splice(0, 2);
            saveHistory(history); _saveMessage('user', remainder);
            const rawResp2 = await callGroq(sentiment2);
            if (rawResp2) {
              history.push({ role: 'assistant', content: rawResp2 });
              if (history.length > 12) history.splice(0, 2);
              saveHistory(history); _saveMessage('assistant', rawResp2);
              const clean2 = rawResp2.replace(/\[.*?\]/g, '').trim();
              showBubble('<span style="color:#60a5fa;font-size:13px;font-weight:600;">Luna</span><br/>' + clean2);
              setState('speaking');
              const d2 = await synthesizeSpeech(rawResp2, 0.6);
              await playBase64Audio(d2.audio, d2.format);
              updateVoiceStatus(getIdleVoiceStatus());
              setTimeout(hideBubble, 5000);
            }
          }
        }
        setState('wake'); showBadge(false); isProcessing = false; return;
      }
      // Awake - full conversation
      const query = isWakeWord(t) ? (stripWakeWord(t) || t) : t;
      showBubble('<span style="color:#9ca3af;font-size:13px;">You</span><br/>"' + query + '"');
      const sentiment = await detectSentiment(query);
      updateVoiceStatus('Thinking...');
      history.push({ role: 'user', content: query });
      if (history.length > 12) history.splice(0, 2);
      saveHistory(history); _saveMessage('user', query);
      const rawResponse = await callGroq(sentiment);
      if (!rawResponse) throw new Error('empty_reply');

      // ── Extract and execute any <CMD> from LLM response ──────────────────
      const cmdMatch = rawResponse.match(/<CMD>([\s\S]*?)<\/CMD>/);
      // Strip <CMD> tags AND any bare JSON the model leaks without tags
      const spokenText = rawResponse
        .replace(/<CMD>[\s\S]*?<\/CMD>/g, '')
        .replace(/\{"action"[^}]*\}/g, '')
        .replace(/\{'action'[^}]*\}/g, '')
        .trim();
      if (cmdMatch) {
        try {
          const cmd = JSON.parse(cmdMatch[1]);
          setTimeout(() => executeLunaCommand(cmd), 800); // slight delay after speech starts
        } catch {}
      }

      history.push({ role: 'assistant', content: spokenText });
      if (history.length > 12) history.splice(0, 2);
      saveHistory(history); _saveMessage('assistant', spokenText);
      const cleanText = spokenText.replace(/\[.*?\]/g, '').trim();
      showBubble('<span style="color:#60a5fa;font-size:13px;font-weight:600;">Luna</span><br/>' + cleanText);
      setState('speaking');
      updateVoiceStatus('Speaking...');
      // Blend sentiment + scan threat level into TTS urgency
      const scanScore = window._lunaLastScan?.score || 0;
      const threatBoost = scanScore >= 75 ? 0.15 : scanScore >= 40 ? 0.08 : 0;
      const baseExaggeration = sentiment === 'excited' ? 0.75 : sentiment === 'stressed' ? 0.45 : 0.6;
      const exaggeration = Math.min(0.95, baseExaggeration + threatBoost);
      const ttsData = await synthesizeSpeech(spokenText, exaggeration);
      await playBase64Audio(ttsData.audio, ttsData.format);
      updateVoiceStatus(getIdleVoiceStatus());
      setTimeout(hideBubble, 5000);
    } catch (err) {
      console.error('Luna pipeline error:', err);
      showBubble("Something glitched on my end. Still here!", 3500);
    }
    setState('wake'); showBadge(awake); isProcessing = false;
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
    saveHistory(history); _saveMessage('assistant', line);

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
        hideBubble();
        console.log('Luna: speech start');
      },
      onSpeechEnd: async (audioFloat32) => {
        if (isProcessing) return;
        setState('thinking');
        await handleUserSpeech(audioFloat32);
      },
      positiveSpeechThreshold: 0.8,
      negativeSpeechThreshold: 0.35,
      minSpeechFrames: 5,
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
      updateVoiceStatus(getIdleVoiceStatus());
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
    if (state === 'setup') { showPermissionModal(); return; }
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
    } catch { }
  };
  document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  document.addEventListener('click', unlockAudio, { once: true });

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init() {
    warmUpTTS();
    updateVoiceStatus(getIdleVoiceStatus());

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

  // Expose for use outside the IIFE (e.g. voice onboarding in _setUser)
  window._lunaSpeak = async (text) => {
    try {
      const d = await synthesizeSpeech(text);
      if (d?.audio) await playBase64Audio(d.audio, d.format);
    } catch { }
  };
  window._lunaBubble = (html, ms) => showBubble(html, ms);

  // ── Extension proactive alert bridge ─────────────────────────────────────
  // luna-bridge.js (extension content script) dispatches this event when
  // a threat is detected on another tab while Luna is open
  window.addEventListener('luna:proactive', async (e) => {
    if (isProcessing) return; // don't interrupt if already speaking
    const { message, score, verdict, domain } = e.detail;

    // Store as scan context so Luna is aware during any follow-up
    window._lunaLastScan = window._lunaLastScan || {
      url: 'https://' + domain,
      type: 'phishing',
      score,
      verdict,
      findings: [],
    };

    // Wake Luna up visually
    setState('speaking');
    showBubble(
      `<span style="color:#f59e0b;font-size:13px;font-weight:600;">⚠ Luna</span><br/>${message}`
    );
    updateVoiceStatus('Threat detected');

    isProcessing = true;
    try {
      const ttsData = await synthesizeSpeech(message, score >= 75 ? 0.8 : 0.65);
      await playBase64Audio(ttsData.audio, ttsData.format);
    } catch { }

    setState('wake');
    showBadge(awake);
    isProcessing = false;
    setTimeout(hideBubble, 6000);
  });

  init();
})();


/* ── Live Sphere: mouse tracking + idle bob ── */
(function () {
  const sphereWrap = document.getElementById('sphereWrap');
  const sphere = document.getElementById('sphere');
  const eyeLeft = document.getElementById('eyeLeft');
  const eyeRight = document.getElementById('eyeRight');
  if (!sphereWrap || !eyeLeft || !eyeRight) return;

  const pupilLeft = eyeLeft.querySelector('.pupil');
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
    const rect = eyeEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = currentX - cx;
    const dy = currentY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const travel = Math.min(dist / 18, MAX_TRAVEL);
    const px = (dx / dist) * travel;
    const py = (dy / dist) * travel;
    pupilEl.style.transform = `translate(${px}px, ${py}px)`;
  }

  // Smooth follow loop
  function tick() {
    currentX += (mouseX - currentX) * 0.12;
    currentY += (mouseY - currentY) * 0.12;
    movePupil(eyeLeft, pupilLeft);
    movePupil(eyeRight, pupilRight);
    requestAnimationFrame(tick);
  }
  tick();

  // Sphere tilt toward cursor
  sphereWrap.addEventListener('mousemove', e => {
    const rect = sphereWrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rotY = ((e.clientX - cx) / rect.width) * 18;
    const rotX = -((e.clientY - cy) / rect.height) * 14;
    sphere.style.transition = 'transform 0.1s ease-out, filter 0.3s ease';
    sphere.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
  });
  sphereWrap.addEventListener('mouseleave', () => {
    sphere.style.transition = 'transform 0.6s ease, filter 0.3s ease';
    sphere.style.transform = '';
  });

  // Click: excited bounce + glow burst
  sphereWrap.addEventListener('click', () => {
    sphere.style.transition = 'transform 0.15s ease, filter 0.15s ease';
    sphere.style.transform = 'scale(1.18)';
    sphere.style.filter =
      'drop-shadow(0 0 80px rgba(37,99,235,1)) drop-shadow(0 0 140px rgba(96,165,250,0.7))';
    setTimeout(() => {
      sphere.style.transform = 'scale(0.95)';
      setTimeout(() => {
        sphere.style.transform = '';
        sphere.style.filter = '';
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
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const dppWords = document.querySelectorAll('.dpp-word');

  if (!tabBtns.length) return;

  const tabButtonsWrap = document.querySelector('.tab-buttons');
  if (tabButtonsWrap && !document.querySelector('.tab-btn[data-tab="5"]')) {
    const autopilotPanel = document.querySelector('.tab-panel[data-panel="5"]');
    if (autopilotPanel) {
      const btn = document.createElement('button');
      btn.className = 'tab-btn';
      btn.dataset.tab = '5';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.innerHTML = `
        <span class="tab-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </span>
        Luna Autopilot
      `;
      tabButtonsWrap.appendChild(btn);
    }
  }

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

    if (index === 3 && typeof window._refreshApiKeys === 'function') {
      window._refreshApiKeys();
    }
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
let _supabase = null;
let _currentUser = null;
let _currentPlan = 'free';

const DEFAULT_HERO_COPY = {
  title: 'Your AI that protects you<br/>while you browse',
  sub: 'Detects phishing. Scans websites. Watches every tab.<br/>Speaks up before you click something dangerous.',
};

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
  } catch { }
}

let _greeted = false;
function _titleCaseToken(token) {
  return token ? token.charAt(0).toUpperCase() + token.slice(1).toLowerCase() : '';
}

function _getStoredUserName(user) {
  if (!user?.id) return '';
  try {
    return localStorage.getItem(`luna_profile_name:${user.id}`) || '';
  } catch {
    return '';
  }
}

function _getExplicitUserName(user) {
  const meta = user?.user_metadata || {};
  return [
    _getStoredUserName(user),
    meta.display_name,
    meta.full_name,
    meta.name,
  ].find(value => typeof value === 'string' && value.trim())?.trim() || '';
}

function _formatEmailName(email = '') {
  const local = (email.split('@')[0] || '').replace(/[._-]+/g, ' ').trim();
  if (!local) return '';
  return local
    .split(/\s+/)
    .filter(Boolean)
    .map(_titleCaseToken)
    .join(' ');
}

function _getUserDisplayName(user) {
  return _getExplicitUserName(user) || _formatEmailName(user?.email || '') || 'there';
}

function _getUserFirstName(user) {
  return _getUserDisplayName(user).split(/\s+/).filter(Boolean)[0] || 'there';
}

function _getPlanLabel(plan = _currentPlan) {
  const labels = {
    free: 'Free Plan',
    guardian: 'Guardian Shield',
    sentinel: 'Sentinel Edge',
    fortress: 'Fortress Prime',
  };
  return labels[plan] || 'Luna Workspace';
}

function _refreshPricingState(user, plan = _currentPlan) {
  const eyebrow = document.getElementById('pricing-eyebrow');
  const title = document.getElementById('pricing-title');
  const sub = document.getElementById('pricing-sub');
  const cards = Array.from(document.querySelectorAll('[data-plan-card]'));
  if (!title || !sub || !cards.length) return;

  const cardMap = Object.fromEntries(cards.map(card => [card.dataset.planCard, card]));
  const buttonMap = {
    guardian: document.getElementById('guardian-plan-btn'),
    sentinel: document.getElementById('sentinel-plan-btn'),
    fortress: document.querySelector('[data-plan-card="fortress"] .plan-btn'),
  };
  const badgeMap = {
    guardian: document.querySelector('[data-plan-badge="guardian"]'),
    sentinel: document.querySelector('[data-plan-badge="sentinel"]'),
    fortress: document.querySelector('[data-plan-badge="fortress"]'),
  };

  cards.forEach(card => {
    card.style.display = '';
    card.classList.remove('pricing-card--active-plan');
  });
  Object.values(badgeMap).forEach(badge => {
    if (!badge) return;
    badge.style.display = 'none';
    badge.textContent = '';
  });

  if (!user) {
    if (eyebrow) eyebrow.style.display = 'none';
    title.textContent = 'Plans Built for Every Need';
    sub.textContent = 'Flexible pricing to safeguard your business—tailored for startups, enterprises, and innovators alike.';
    if (buttonMap.guardian) {
      buttonMap.guardian.textContent = 'Choose Plan';
      buttonMap.guardian.disabled = false;
    }
    if (buttonMap.sentinel) {
      buttonMap.sentinel.textContent = 'Choose Plan';
      buttonMap.sentinel.disabled = false;
    }
    if (buttonMap.fortress) buttonMap.fortress.textContent = 'Call Us';
    return;
  }

  const activePlan = ['guardian', 'sentinel', 'fortress'].includes(plan) ? plan : 'free';
  const visiblePlans = activePlan === 'free'
    ? ['guardian', 'sentinel', 'fortress']
    : activePlan === 'guardian'
      ? ['guardian', 'sentinel', 'fortress']
      : activePlan === 'sentinel'
        ? ['sentinel', 'fortress']
        : ['fortress'];

  cards.forEach(card => {
    if (!visiblePlans.includes(card.dataset.planCard)) card.style.display = 'none';
  });

  if (eyebrow) {
    eyebrow.textContent = activePlan === 'free' ? 'Account Plans' : `Active Plan: ${_getPlanLabel(activePlan)}`;
    eyebrow.style.display = 'inline-flex';
  }
  title.textContent = activePlan === 'free' ? 'Choose the right Luna plan' : 'Your plan and available upgrades';
  sub.textContent = activePlan === 'free'
    ? 'Pick the Luna plan that fits your workflow and unlock the security modules you need.'
    : 'Your current plan stays highlighted, and only relevant upgrade paths are shown.';

  if (activePlan !== 'free' && cardMap[activePlan]) {
    cardMap[activePlan].classList.add('pricing-card--active-plan');
  }
  if (activePlan !== 'free' && badgeMap[activePlan]) {
    badgeMap[activePlan].textContent = 'Current Plan';
    badgeMap[activePlan].style.display = 'inline-flex';
  }

  if (buttonMap.guardian) {
    buttonMap.guardian.textContent = activePlan === 'guardian' ? 'Current Plan' : 'Upgrade to Guardian';
    buttonMap.guardian.disabled = activePlan === 'guardian';
  }
  if (buttonMap.sentinel) {
    buttonMap.sentinel.textContent = activePlan === 'sentinel' ? 'Current Plan' : 'Upgrade to Sentinel';
    buttonMap.sentinel.disabled = activePlan === 'sentinel';
  }
  if (buttonMap.fortress) {
    buttonMap.fortress.textContent = activePlan === 'fortress' ? 'Current Plan' : 'Talk to Sales';
  }
}

function _refreshHeroState(user, plan = _currentPlan) {
  const heroHeadline = document.querySelector('.hero-headline');
  const heroTitle = document.getElementById('hero-title') || document.querySelector('.hero-title');
  const heroSub = document.getElementById('hero-sub') || document.querySelector('.hero-sub');
  const heroCta = document.getElementById('hero-cta') || document.querySelector('.hero-cta');
  const heroPlanChip = document.getElementById('hero-plan-chip');
  const navCta = document.getElementById('nav-cta');
  const mobileNavCta = document.getElementById('mobile-nav-cta');
  if (!heroHeadline || !heroTitle || !heroSub || !heroCta) return;

  if (!user) {
    heroHeadline.classList.remove('hero-headline--signed-in');
    heroTitle.innerHTML = DEFAULT_HERO_COPY.title;
    heroSub.innerHTML = DEFAULT_HERO_COPY.sub;
    heroTitle.style.display = '';
    heroSub.style.display = '';
    heroCta.style.display = '';
    if (heroPlanChip) {
      heroPlanChip.style.display = 'none';
      heroPlanChip.textContent = '';
    }
    if (navCta) navCta.style.display = '';
    if (mobileNavCta) mobileNavCta.style.display = '';
    _refreshPricingState(null, 'free');
    return;
  }

  const firstName = _getUserFirstName(user);
  const planLabel = _getPlanLabel(plan);
  heroHeadline.classList.add('hero-headline--signed-in');
  heroTitle.textContent = `Welcome back, ${firstName}.`;
  heroSub.textContent = `${planLabel} is active on your account. Your Luna workspace is ready with the tools available for your current plan.`;
  heroTitle.style.display = '';
  heroSub.style.display = '';
  heroCta.style.display = 'none';
  if (heroPlanChip) {
    heroPlanChip.textContent = planLabel;
    heroPlanChip.style.display = 'inline-flex';
  }
  if (navCta) navCta.style.display = 'none';
  if (mobileNavCta) mobileNavCta.style.display = 'none';
  _refreshPricingState(user, plan);
}

async function _loadUserProfile(user) {
  if (!_supabase || !user?.id) {
    _currentPlan = 'free';
    _refreshHeroState(user, _currentPlan);
    _refreshPricingState(user, _currentPlan);
    return;
  }

  try {
    const { data, error } = await _supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle();

    _currentPlan = error ? 'free' : (data?.plan || 'free');
  } catch {
    _currentPlan = 'free';
  }

  _refreshHeroState(user, _currentPlan);
  _refreshPricingState(user, _currentPlan);
  initSentinelDashboard(_currentPlan);
}

function _setTeamNameDefault(user) {
  const input = document.getElementById('team-name-input');
  if (!input || input.dataset.userEdited === '1') return;
  const firstName = _getUserFirstName(user);
  if (!firstName || firstName.toLowerCase() === 'there') return;
  input.value = firstName.endsWith('s') ? `${firstName}' Team` : `${firstName}'s Team`;
}

function _dismissNamePrompt(user) {
  if (!user?.id) return;
  try {
    sessionStorage.setItem(`luna_name_prompt_dismissed:${user.id}`, '1');
  } catch { }
}

function _maybePromptForName(user) {
  if (!user?.id || _getExplicitUserName(user)) return;
  if (document.getElementById('profile-name-modal') || document.getElementById('auth-modal')) return;
  try {
    if (sessionStorage.getItem(`luna_name_prompt_dismissed:${user.id}`) === '1') return;
  } catch { }
  setTimeout(() => {
    if (!_currentUser || _currentUser.id !== user.id || _getExplicitUserName(_currentUser)) return;
    showProfileNameModal();
  }, 450);
}

function _setUser(user) {
  const wasLoggedIn = !!_currentUser;
  _currentUser = user;
  window._currentUser = user || null;
  if (document.body) {
    document.body.classList.toggle('is-auth', !!user);
  }
  const authBtn = document.getElementById('auth-btn');
  const authUser = document.getElementById('auth-user');
  const authEmail = document.getElementById('auth-email');
  if (!authBtn) return;
  if (user) {
    authBtn.style.display = 'none';
    if (authUser) authUser.style.display = 'flex';
    if (authEmail) {
      const explicitName = _getExplicitUserName(user);
      const fallbackName = _getUserFirstName(user);
      authEmail.textContent = explicitName || fallbackName || 'Account';
      authEmail.title = user.email || '';
      authEmail.style.cursor = 'pointer';
      authEmail.setAttribute('role', 'button');
      authEmail.onclick = () => showProfileNameModal();
    }
    _refreshHeroState(user, _currentPlan);
    _loadUserProfile(user);
    if (typeof window._refreshApiKeys === 'function') {
      window._refreshApiKeys();
    } else {
      setTimeout(() => {
        if (typeof window._refreshApiKeys === 'function') window._refreshApiKeys();
      }, 1200);
    }
    _setTeamNameDefault(user);
    _maybePromptForName(user);

    // Load this user's conversation history from Supabase on login
    if (!wasLoggedIn && _supabase) {
      _supabase
        .from('conversations')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => {
          if (data && data.length > 0) {
            // Rows come newest-first — reverse to get chronological order
            const loaded = data.reverse().map(r => ({ role: r.role, content: r.content }));
            // Merge with localStorage (localStorage may have unsaved guest messages)
            const guestHistory = loadHistory().filter(m =>
              !loaded.some(l => l.role === m.role && l.content === m.content)
            );
            history = [...loaded, ...guestHistory].slice(-20);
            saveHistory(history);
          }
        });
    }

    // Voice onboarding — greet once per session on first sign-in
    if (!wasLoggedIn && !_greeted) {
      _greeted = true;
      const name = _getUserFirstName(user);
      const isNew = !localStorage.getItem('luna_signed_in_before');
      localStorage.setItem('luna_signed_in_before', '1');
      const greeting = isNew
        ? `Welcome to Luna, ${name}! I'm your AI security assistant. Ask me anything, or paste a URL to run your first scan.`
        : `Welcome back, ${name}! Ready to keep things secure?`;
      setTimeout(() => {
        if (window._lunaSpeak) window._lunaSpeak(greeting);
        if (window._lunaBubble) {
          const safe = document.createElement('span');
          safe.textContent = greeting;
          window._lunaBubble(
            `<span style="color:#60a5fa;font-size:13px;font-weight:600;">Luna</span><br/>` + safe.textContent,
            6000
          );
        }
      }, 800);
    }
  } else {
    _greeted = false;
    _currentPlan = 'free';
    authBtn.style.display = '';
    if (authUser) authUser.style.display = 'none';
    if (typeof window._refreshApiKeys === 'function') {
      window._refreshApiKeys();
    } else {
      setTimeout(() => {
        if (typeof window._refreshApiKeys === 'function') window._refreshApiKeys();
      }, 1200);
    }
    _refreshHeroState(null, _currentPlan);
    initSentinelDashboard(_currentPlan);
  }
  window.dispatchEvent(new CustomEvent('luna-auth-changed', { detail: user }));
  document.dispatchEvent(new CustomEvent('luna:auth', { detail: { user: _currentUser } }));
}

// Save a single conversation message to Supabase for the logged-in user
async function _saveMessage(role, content) {
  if (!_supabase || !_currentUser) return;
  try {
    await _supabase.from('conversations').insert({
      user_id: _currentUser.id,
      role,
      content,
    });
    // Prune old messages — keep latest 100 per user (fire-and-forget)
    _supabase
      .from('conversations')
      .select('id, created_at')
      .eq('user_id', _currentUser.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 100) {
          const toDelete = data.slice(100).map(r => r.id);
          _supabase.from('conversations').delete().in('id', toDelete);
        }
      });
  } catch { }
}

async function _saveScan(url, type, score, verdict, findings) {
  if (!_supabase || !_currentUser) return;
  try {
    await _supabase.from('scans').insert({
      user_id: _currentUser.id,
      url, type, score, verdict,
      findings: Array.from(findings.values()),
    });
  } catch { }
}

async function _checkProactiveInsights(url, score, verdict) {
  if (!_supabase || !_currentUser) return;
  try {
    const domain = new URL(url).hostname;
    // Fetch last 20 scans for this user
    const res = await fetch(
      `${_supabase.url}/rest/v1/scans?select=url,score,verdict,created_at&user_id=eq.${_currentUser.id}&order=created_at.desc&limit=20`,
      { headers: { apikey: _supabase.anonKey, Authorization: `Bearer ${_supabase.accessToken}` } }
    );
    if (!res.ok) return;
    const scans = await res.json();
    if (!Array.isArray(scans) || scans.length < 3) return;

    // Pattern 1: same domain scanned before with different result
    const prev = scans.find(s => {
      try { return new URL(s.url).hostname === domain && s.url !== url; } catch { return false; }
    });
    if (prev && prev.verdict !== verdict) {
      const msg = `I noticed you scanned ${domain} before and it was ${prev.verdict}, but now it\u2019s ${verdict}. Something may have changed on this site.`;
      if (window._lunaBubble) window._lunaBubble(msg);
      if (window._lunaSpeak) window._lunaSpeak(msg);
      return;
    }

    // Pattern 2: 3+ high-risk scans this session
    const recentRisky = scans.slice(0, 10).filter(s => s.score > 55);
    if (recentRisky.length >= 3 && score > 55) {
      const msg = `Heads up \u2014 you\u2019ve scanned ${recentRisky.length} high-risk sites recently. You might be browsing a dangerous network or targeted campaign.`;
      if (window._lunaBubble) window._lunaBubble(msg);
      if (window._lunaSpeak) window._lunaSpeak(msg);
      return;
    }

    // Pattern 3: 5+ crypto-related domains scanned
    const cryptoWords = ['crypto', 'defi', 'nft', 'wallet', 'token', 'coin', 'swap', 'uniswap', 'opensea'];
    const cryptoScans = scans.filter(s => { try { return cryptoWords.some(w => new URL(s.url).hostname.includes(w)); } catch { return false; } });
    if (cryptoScans.length >= 3 && cryptoWords.some(w => domain.includes(w))) {
      const msg = `I\u2019ve noticed you\u2019re visiting a lot of crypto and DeFi sites. These are common phishing targets \u2014 want me to add them to a watchlist?`;
      if (window._lunaBubble) window._lunaBubble(msg);
      if (window._lunaSpeak) window._lunaSpeak(msg);
      return;
    }
  } catch { }
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

  // Name
  const nameLabel = document.createElement('label');
  nameLabel.className = 'auth-label';
  nameLabel.textContent = 'Name';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'auth-input';
  nameInput.placeholder = 'What should Luna call you?';
  nameInput.autocomplete = 'name';
  nameInput.style.display = 'none';

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
      titleEl.textContent = 'Sign in to Luna';
      submitBtn.textContent = 'Sign In';
      toggle.textContent = "Don't have an account? ";
      nameLabel.style.display = 'none';
      nameInput.style.display = 'none';
      passInput.autocomplete = 'current-password';
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'auth-link';
      link.textContent = 'Create one';
      link.addEventListener('click', () => { mode = 'signup'; refreshMode(); });
      toggle.appendChild(link);
    } else {
      titleEl.textContent = 'Create your account';
      submitBtn.textContent = 'Create Account';
      toggle.textContent = 'Already have an account? ';
      nameLabel.style.display = '';
      nameInput.style.display = '';
      passInput.autocomplete = 'new-password';
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
    const fullName = nameInput.value.trim().replace(/\s+/g, ' ');
    const email = emailInput.value.trim();
    const pass = passInput.value;
    if (mode === 'signup' && !fullName) { errorEl.textContent = 'Please enter your name.'; return; }
    if (!email || !pass) { errorEl.textContent = 'Please fill in all required fields.'; return; }
    if (!_supabase) { errorEl.textContent = 'Auth service unavailable.'; return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Please wait…';
    errorEl.textContent = '';

    const fn = mode === 'signup'
      ? _supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { display_name: fullName, full_name: fullName, name: fullName }
        }
      })
      : _supabase.auth.signInWithPassword({ email, password: pass });

    const { data, error } = await fn;
    submitBtn.disabled = false;
    refreshMode();

    if (error) {
      errorEl.textContent = error.message;
    } else {
      if (mode === 'signup') {
        if (data?.user?.id && fullName) {
          try {
            localStorage.setItem(`luna_profile_name:${data.user.id}`, fullName);
          } catch { }
        }
        errorEl.style.color = '#4ade80';
        errorEl.textContent = 'Check your email to confirm your account.';
      } else {
        overlay.remove();
      }
    }
  });

  passInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitBtn.click(); });
  closeBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  box.append(closeBtn, titleEl, toggle, nameLabel, nameInput, emailLabel, emailInput, passLabel, passInput, errorEl, submitBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  emailInput.focus();
}

function showProfileNameModal() {
  if (!_supabase || !_currentUser || document.getElementById('profile-name-modal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'profile-name-modal';
  overlay.className = 'auth-overlay';

  const box = document.createElement('div');
  box.className = 'auth-box';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'auth-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '✕';

  const titleEl = document.createElement('h2');
  titleEl.className = 'auth-title';
  titleEl.textContent = 'What should Luna call you?';

  const subEl = document.createElement('p');
  subEl.className = 'auth-toggle';
  subEl.textContent = 'Add your name once and Luna will use it in greetings and team setup.';

  const nameLabel = document.createElement('label');
  nameLabel.className = 'auth-label';
  nameLabel.textContent = 'Your name';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'auth-input';
  nameInput.placeholder = 'Enter your name';
  nameInput.autocomplete = 'name';
  nameInput.value = _formatEmailName(_currentUser.email || '');

  const errorEl = document.createElement('p');
  errorEl.className = 'auth-error';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'btn-primary auth-submit';
  submitBtn.textContent = 'Save Name';

  const dismiss = () => {
    _dismissNamePrompt(_currentUser);
    overlay.remove();
  };

  submitBtn.addEventListener('click', async () => {
    const fullName = nameInput.value.trim().replace(/\s+/g, ' ');
    if (!fullName) {
      errorEl.textContent = 'Enter the name you want Luna to use.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    errorEl.textContent = '';

    const { data, error } = await _supabase.auth.updateUser({
      data: { display_name: fullName, full_name: fullName, name: fullName }
    });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Name';

    if (error) {
      errorEl.textContent = error.message || 'Failed to save your name.';
      return;
    }

    try {
      localStorage.setItem(`luna_profile_name:${_currentUser.id}`, fullName);
    } catch { }

    overlay.remove();
    _setUser(data?.user || {
      ..._currentUser,
      user_metadata: {
        ...(_currentUser.user_metadata || {}),
        display_name: fullName,
        full_name: fullName,
        name: fullName,
      }
    });
    showToast(`Saved. Luna will call you ${fullName}.`, 'success');
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitBtn.click();
  });
  closeBtn.addEventListener('click', dismiss);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss();
  });

  box.append(closeBtn, titleEl, subEl, nameLabel, nameInput, errorEl, submitBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  nameInput.focus();
  nameInput.select();
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
    if (!_supabase || !_currentUser) {
      list.removeChild(loading);
      // Show last local scan as a teaser if available
      const lastScan = window._lunaLastScan;
      if (lastScan) {
        const teaser = document.createElement('div');
        teaser.className = 'history-card history-card--teaser';
        const tRow = document.createElement('div');
        tRow.className = 'history-card-top';
        const tBadge = document.createElement('span');
        tBadge.className = 'history-verdict-badge';
        tBadge.textContent = lastScan.verdict || 'Unknown';
        const tScore = document.createElement('span');
        tScore.className = 'history-score';
        tScore.textContent = `${lastScan.score ?? '—'}/100`;
        tRow.append(tBadge, tScore);
        const tUrl = document.createElement('p');
        tUrl.className = 'history-url';
        tUrl.textContent = lastScan.url;
        const tNote = document.createElement('p');
        tNote.className = 'history-empty';
        tNote.style.marginTop = '16px';
        tNote.textContent = 'Sign in to save and view your full scan history.';
        const signInBtn = document.createElement('button');
        signInBtn.className = 'btn-primary';
        signInBtn.style.cssText = 'margin-top:12px;width:100%';
        signInBtn.textContent = 'Sign In to Save History';
        signInBtn.addEventListener('click', () => { overlay.remove(); showAuthModal(); });
        teaser.append(tRow, tUrl, tNote, signInBtn);
        list.appendChild(teaser);
      } else {
        const note = document.createElement('p');
        note.className = 'history-empty';
        note.textContent = 'Sign in to save and view your scan history.';
        const signInBtn = document.createElement('button');
        signInBtn.className = 'btn-primary';
        signInBtn.style.cssText = 'margin-top:12px;width:100%';
        signInBtn.textContent = 'Sign In';
        signInBtn.addEventListener('click', () => { overlay.remove(); showAuthModal(); });
        list.append(note, signInBtn);
      }
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
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: _currentUser.id,
                plan: 'guardian',
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
  document.getElementById('auth-btn')?.addEventListener('click', showAuthModal);
  document.getElementById('signout-btn')?.addEventListener('click', async () => {
    if (_supabase) await _supabase.auth.signOut();
  });
  document.getElementById('history-btn')?.addEventListener('click', showHistoryModal);

  // Auto-populate scan from shared link (?scan=url&type=phishing|web)
  const params = new URLSearchParams(location.search);
  const sharedScan = params.get('scan');
  const sharedType = params.get('type') || 'phishing';
  if (sharedScan) {
    // Use requestAnimationFrame loop to wait until the tab panels are rendered
    function applySharedScan(attempts) {
      const tabBtn = document.querySelector(sharedType === 'web' ? '.tab-btn[data-tab="1"]' : '.tab-btn[data-tab="0"]');
      const inp = sharedType === 'web' ? document.querySelector('.url-input') : document.getElementById('phish-input');
      if (!tabBtn || !inp) {
        if (attempts < 30) requestAnimationFrame(() => applySharedScan(attempts + 1));
        return;
      }
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
      tabBtn.click();
      // Another rAF to let panel become visible before setting value
      requestAnimationFrame(() => {
        inp.value = sharedScan;
        inp.focus();
        showToast('Shared scan loaded — click Scan Now to run it', 'success');
      });
    }
    setTimeout(() => applySharedScan(0), 400);
  }

  // Autopilot pre-fill from extension "Scan All Tabs"
  const autopilotUrls = params.get('autopilot');
  if (autopilotUrls) {
    setTimeout(() => {
      // Switch to autopilot tab
      document.querySelector('.tab-btn[data-tab="5"]')?.click();
      document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
      requestAnimationFrame(() => {
        const inp = document.getElementById('autopilot-input');
        if (inp) {
          inp.value = decodeURIComponent(autopilotUrls);
          setTimeout(() => document.getElementById('autopilot-run-btn')?.click(), 500);
        }
      });
    }, 600);
  }
});

initSupabase();


/* ════════════════════════════════════════════════════════════════
   RISK SCORE ENGINE
════════════════════════════════════════════════════════════════ */
const SCORE_WEIGHTS = {
  // phishing
  urlpatterns: 20,
  domain: 30,
  ssl: 20,
  redirect: 15,
  info: 15,
  safebrowsing: 35,
  // web
  headers: 30,
  response: 15,
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
  if (score === 0) return { label: 'Safe', color: '#22c55e', cls: 'safe' };
  if (score <= 25) return { label: 'Low Risk', color: '#84cc16', cls: 'low' };
  if (score <= 55) return { label: 'Suspicious', color: '#f59e0b', cls: 'suspicious' };
  if (score <= 80) return { label: 'High Risk', color: '#f97316', cls: 'high' };
  return { label: 'Critical', color: '#ef4444', cls: 'critical' };
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
  const rgb = verdict.cls === 'safe' ? [34, 197, 94]
    : verdict.cls === 'low' ? [132, 204, 22]
      : verdict.cls === 'suspicious' ? [245, 158, 11]
        : verdict.cls === 'high' ? [249, 115, 22]
          : [239, 68, 68];
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
  const rowMap = {};
  const findings = new Map(); // id → {id, name, status, detail}

  function upsertRow(id, name, status, detail) {
    findings.set(id, { id, name, status, detail });

    if (rowMap[id]) {
      const row = rowMap[id];
      row.className = `scan-module-row scan-module-row--${status}`;
      const iconEl = row.querySelector('.scan-module-icon');
      const detailEl = row.querySelector('.scan-module-detail');
      iconEl.textContent = status === 'scanning' ? '' : status === 'vulnerable' ? '⚠' : '✓';
      if (detailEl && detail) detailEl.textContent = detail;
      return;
    }

    const row = document.createElement('div');
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
    try { statusBadge.textContent = JSON.parse(e.data).message; } catch { }
  });

  sse.addEventListener('finding', (e) => {
    try {
      const d = JSON.parse(e.data);
      if (typeof d.id !== 'string' || typeof d.name !== 'string') return;
      const status = ['scanning', 'safe', 'vulnerable'].includes(d.status) ? d.status : 'safe';
      const detail = typeof d.detail === 'string' ? d.detail : '';
      upsertRow(d.id, d.name, status, detail);
    } catch { }
  });

  sse.addEventListener('complete', () => {
    sse.close();
    statusBadge.className = 'scan-status-badge scan-status-badge--done';
    statusBadge.textContent = 'Complete';

    // ── Score card ──────────────────────────────────────────
    const score = calcScore(findings);
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
        const res = await fetch('/api/enterprise-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'alert',
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

    // Share button — copies a pre-filled URL with scan target to clipboard
    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'btn-pdf';
    shareBtn.textContent = '⎘ Share';
    shareBtn.style.marginLeft = '8px';
    shareBtn.addEventListener('click', () => {
      const shareUrl = `${location.origin}/?scan=${encodeURIComponent(url)}&type=${encodeURIComponent(type)}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        shareBtn.textContent = '✓ Copied!';
        showToast('Share link copied to clipboard!', 'success');
        setTimeout(() => { shareBtn.textContent = '⎘ Share'; }, 2500);
      }).catch(() => {
        // Fallback: show the URL in a prompt so user can copy manually
        window.prompt('Copy this link:', shareUrl);
      });
    });

    scoreCard.append(scoreLine, bar, pdfBtn, alertBtn, shareBtn);

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
    _checkProactiveInsights(url, score, verdict.label);

    // Reset button
    btn.textContent = '✓ Done';
    btn.style.background = '#16a34a';
    btn.disabled = false;
    btn.style.opacity = '';
    setTimeout(() => {
      btn.textContent = btnOriginal;
      btn.style.background = '';
    }, 3000);
  });

  sse.onerror = () => {
    sse.close();
    statusBadge.className = 'scan-status-badge scan-status-badge--error';
    statusBadge.textContent = 'Error — could not reach scan engine';
    btn.textContent = btnOriginal;
    btn.style.background = '';
    btn.disabled = false;
    btn.style.opacity = '';
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
  const urlInput = document.querySelector('.url-input');
  const autofill = document.querySelector('.autofill-pill');
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
    urlScanBtn.disabled = true;
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


/* ── Plan card selection highlight ── */
(function () {
  const cards = document.querySelectorAll('.pricing-card');
  cards.forEach(card => {
    const btn = card.querySelector('.plan-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      // Remove featured styling from all cards, then apply to clicked one
      cards.forEach(c => {
        c.classList.remove('pricing-card--featured');
        const b = c.querySelector('.plan-btn');
        if (b) { b.classList.remove('btn-primary'); b.classList.add('btn-outline'); }
      });
      card.classList.add('pricing-card--featured');
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-primary');
    });
  });
})();

/* ── AI Code Guardian & API Management ── */
(function () {
  const guardBtn = document.getElementById('guard-btn');
  const codeInput = document.getElementById('code-input');
  const guardResult = document.getElementById('guard-result');
  const modeCodeBtn = document.getElementById('guard-mode-code');
  const modeDepsBtn = document.getElementById('guard-mode-deps');
  const modeRepoCodeBtn = document.getElementById('guard-mode-repo-code');
  const modeRepoDepsBtn = document.getElementById('guard-mode-repo-deps');
  const guardModeNote = document.getElementById('guardian-mode-note');

  let activeGuardMode = 'code';

  function setGuardMode(mode) {
    activeGuardMode = mode;
    modeCodeBtn?.classList.toggle('active', mode === 'code');
    modeDepsBtn?.classList.toggle('active', mode === 'deps');
    modeRepoCodeBtn?.classList.toggle('active', mode === 'repo-code');
    modeRepoDepsBtn?.classList.toggle('active', mode === 'repo-deps');

    if (mode === 'code') {
      guardBtn.textContent = 'Review Code';
      codeInput.placeholder = 'Paste your source code here (JS, Python, Go, etc.)...';
      if (guardModeNote) guardModeNote.textContent = 'Paste source code for a direct security review.';
      return;
    }

    if (mode === 'deps') {
      guardBtn.textContent = 'Audit Dependencies';
      codeInput.placeholder = 'Paste list of dependencies (e.g. lodash@4.17.15, axios@0.19.0)...';
      if (guardModeNote) guardModeNote.textContent = 'Supports pasted package lists and package.json-style dependency lines.';
      return;
    }

    if (mode === 'repo-code') {
      guardBtn.textContent = 'Review Repo Code';
      codeInput.placeholder = 'Paste a public GitHub repository URL (e.g. https://github.com/vercel/next.js)';
      if (guardModeNote) guardModeNote.textContent = 'Luna will pull a small sample of repo files and run a security review.';
      return;
    }

    guardBtn.textContent = 'Scan Repo Dependencies';
    codeInput.placeholder = 'Paste a public GitHub repository URL (e.g. https://github.com/vercel/next.js)';
    if (guardModeNote) guardModeNote.textContent = 'Luna will fetch supported manifest files from the repo root and audit the dependencies automatically.';
  }

  if (modeCodeBtn && modeDepsBtn && modeRepoCodeBtn && modeRepoDepsBtn) {
    modeCodeBtn.addEventListener('click', () => setGuardMode('code'));
    modeDepsBtn.addEventListener('click', () => setGuardMode('deps'));
    modeRepoCodeBtn.addEventListener('click', () => setGuardMode('repo-code'));
    modeRepoDepsBtn.addEventListener('click', () => setGuardMode('repo-deps'));
    setGuardMode('code');
  }

  if (guardBtn) {
    guardBtn.addEventListener('click', async (e) => {
      if (activeGuardMode !== 'repo-code' && activeGuardMode !== 'repo-deps') return;
      e.preventDefault();
      e.stopImmediatePropagation();

      const inputVal = codeInput.value.trim();
      if (!inputVal) return;

      const originalText = guardBtn.textContent;
      guardBtn.disabled = true;
      guardBtn.textContent = activeGuardMode === 'repo-code' ? 'Reviewing Repo...' : 'Scanning Repo...';
      while (guardResult.firstChild) guardResult.removeChild(guardResult.firstChild);

      const loadDiv = document.createElement('div');
      loadDiv.className = 'guard-placeholder guard-loading';
      const loadP = document.createElement('p');
      loadP.textContent = activeGuardMode === 'repo-code'
        ? 'Luna is sampling the repo files and running a code security review...'
        : 'Luna is pulling the GitHub repo and auditing its manifests for vulnerable packages...';
      loadDiv.appendChild(loadP);
      guardResult.appendChild(loadDiv);

      try {
        const endpoint = activeGuardMode === 'repo-code' ? '/api/repo-code-review' : '/api/repo-dep-scan';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl: inputVal })
        });
        const data = await res.json();
        if (activeGuardMode === 'repo-code') {
          if (!data.review) throw new Error(data.error || 'GitHub repo code review failed');
        } else if (!data.findings) {
          throw new Error(data.error || 'GitHub repo audit failed');
        }

        while (guardResult.firstChild) guardResult.removeChild(guardResult.firstChild);
        const wrap = document.createElement('div');
        wrap.className = 'guard-review-content';
        const title = document.createElement('h4');
        title.className = 'guard-dep-title';
        title.textContent = activeGuardMode === 'repo-code'
          ? `GitHub Repo Code Review${data.repo?.fullName ? ` - ${data.repo.fullName}` : ''}`
          : `GitHub Repo Audit${data.repo?.fullName ? ` - ${data.repo.fullName}` : ''}`;
        wrap.appendChild(title);

        const meta = document.createElement('p');
        meta.className = 'guard-dep-detail';
        if (activeGuardMode === 'repo-code') {
          meta.textContent = `${data.repo?.files?.length ? `Files reviewed: ${data.repo.files.length}.` : ''} ${data.repo?.defaultBranch ? `Branch: ${data.repo.defaultBranch}.` : ''}`.trim();
        } else {
          meta.textContent = `${data.repo?.manifests?.length ? `Manifests: ${data.repo.manifests.join(', ')}.` : 'No supported manifests found at repo root.'} ${typeof data.repo?.dependencyCount === 'number' ? `Dependencies scanned: ${data.repo.dependencyCount}.` : ''}`;
        }
        wrap.appendChild(meta);

        if (activeGuardMode === 'repo-code') {
          data.review.split('\n').forEach(line => {
            const p = document.createElement('p');
            p.className = 'guard-line';
            if (line.includes('🔴')) p.classList.add('guard-line--critical');
            else if (line.includes('🟡')) p.classList.add('guard-line--warn');
            else if (line.includes('🟢')) p.classList.add('guard-line--safe');
            p.textContent = line;
            wrap.appendChild(p);
          });
        } else {
          const list = document.createElement('div');
          list.className = 'guard-dep-list';
          data.findings.forEach(f => {
            const sev = (f.severity || '').toUpperCase();
            const isHigh = sev === 'HIGH' || sev === 'CRITICAL';
            const card = document.createElement('div');
            card.className = `guard-dep-card ${f.isVulnerable ? (isHigh ? 'guard-dep-card--critical' : 'guard-dep-card--warn') : 'guard-dep-card--safe'}`;
            const row = document.createElement('div');
            row.className = 'guard-dep-row';
            const name = document.createElement('span');
            name.className = 'guard-dep-name';
            name.textContent = f.name;
            const badge = document.createElement('span');
            badge.className = 'guard-dep-badge';
            badge.textContent = f.isVulnerable ? (sev || 'WARN') : 'Secure';
            row.append(name, badge);
            card.appendChild(row);
            const detail = document.createElement('p');
            detail.className = 'guard-dep-detail';
            detail.textContent = f.isVulnerable ? `${f.cve}: ${f.detail}` : 'No known vulnerabilities.';
            card.appendChild(detail);
            list.appendChild(card);
          });
          wrap.appendChild(list);
        }
        guardResult.appendChild(wrap);

        const summary = activeGuardMode === 'repo-code'
          ? 'I finished the GitHub repo code review and highlighted the most important issues.'
          : (() => {
              const vulnCount = data.findings.filter(f => f.isVulnerable).length;
              return vulnCount === 0
                ? 'I scanned the GitHub repo and the dependencies I found look clean.'
                : `I scanned the GitHub repo and found ${vulnCount} vulnerable package${vulnCount > 1 ? 's' : ''}.`;
            })();
        if (typeof speak === 'function') speak(summary);
      } catch (err) {
        while (guardResult.firstChild) guardResult.removeChild(guardResult.firstChild);
        const errDiv = document.createElement('div');
        errDiv.className = 'guard-placeholder guard-error';
        const errP = document.createElement('p');
        errP.textContent = `Error: ${err.message}`;
        errDiv.appendChild(errP);
        guardResult.appendChild(errDiv);
      } finally {
        guardBtn.disabled = false;
        guardBtn.textContent = originalText;
      }
    }, true);
  }

  if (guardBtn) {
    guardBtn.addEventListener('click', async () => {
      if (activeGuardMode === 'repo-code' || activeGuardMode === 'repo-deps') return;
      const inputVal = codeInput.value.trim();
      if (!inputVal) return;

      const originalText = guardBtn.textContent;
      guardBtn.disabled = true;
      guardBtn.textContent = 'Analyzing…';
      while (guardResult.firstChild) guardResult.removeChild(guardResult.firstChild);
      const loadDiv = document.createElement('div');
      loadDiv.className = 'guard-placeholder guard-loading';
      const loadP = document.createElement('p');
      loadP.textContent = `Luna is ${activeGuardMode === 'code' ? 'auditing your code' : 'scanning dependencies'} for vulnerabilities…`;
      loadDiv.appendChild(loadP);
      guardResult.appendChild(loadDiv);

      try {
        if (activeGuardMode === 'code') {
          const res = await fetch('/api/guard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: inputVal })
          });
          const data = await res.json();
          if (data.review) {
            while (guardResult.firstChild) guardResult.removeChild(guardResult.firstChild);
            const wrap = document.createElement('div');
            wrap.className = 'guard-review-content';
            // Render each line; replace emoji indicators with styled spans
            data.review.split('\n').forEach(line => {
              const p = document.createElement('p');
              p.className = 'guard-line';
              if (line.includes('🔴')) p.classList.add('guard-line--critical');
              else if (line.includes('🟡')) p.classList.add('guard-line--warn');
              else if (line.includes('🟢')) p.classList.add('guard-line--safe');
              p.textContent = line;
              wrap.appendChild(p);
            });
            guardResult.appendChild(wrap);
            // Luna speaks a summary
            const critCount = (data.review.match(/🔴/g) || []).length;
            const warnCount = (data.review.match(/🟡/g) || []).length;
            const summary = critCount > 0
              ? `I found ${critCount} critical issue${critCount > 1 ? 's' : ''} in your code. Please review them immediately.`
              : warnCount > 0
                ? `Code looks mostly okay but I spotted ${warnCount} warning${warnCount > 1 ? 's' : ''} worth reviewing.`
                : `Great news — your code passed the security audit with no issues found!`;
            if (typeof speak === 'function') speak(summary);
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
            while (guardResult.firstChild) guardResult.removeChild(guardResult.firstChild);
            const wrap = document.createElement('div');
            wrap.className = 'guard-review-content';
            const title = document.createElement('h4');
            title.className = 'guard-dep-title';
            title.textContent = 'Dependency Audit Report';
            wrap.appendChild(title);
            const list = document.createElement('div');
            list.className = 'guard-dep-list';
            data.findings.forEach(f => {
              const isHigh = f.severity === 'High' || f.severity === 'Critical';
              const card = document.createElement('div');
              card.className = `guard-dep-card ${f.isVulnerable ? (isHigh ? 'guard-dep-card--critical' : 'guard-dep-card--warn') : 'guard-dep-card--safe'}`;
              const row = document.createElement('div');
              row.className = 'guard-dep-row';
              const name = document.createElement('span');
              name.className = 'guard-dep-name';
              name.textContent = f.name;
              const badge = document.createElement('span');
              badge.className = 'guard-dep-badge';
              badge.textContent = f.isVulnerable ? f.severity : 'Secure';
              row.append(name, badge);
              card.appendChild(row);
              const detail = document.createElement('p');
              detail.className = 'guard-dep-detail';
              detail.textContent = f.isVulnerable ? `${f.cve}: ${f.detail}` : 'No known vulnerabilities.';
              card.appendChild(detail);
              list.appendChild(card);
            });
            wrap.appendChild(list);
            guardResult.appendChild(wrap);
            // Luna speaks summary
            const vulnCount = data.findings.filter(f => f.isVulnerable).length;
            const summary = vulnCount === 0
              ? 'All your dependencies look clean — no known vulnerabilities found.'
              : `Heads up! I found ${vulnCount} vulnerable package${vulnCount > 1 ? 's' : ''}. Update them as soon as possible.`;
            if (typeof speak === 'function') speak(summary);
          } else {
            throw new Error(data.error || 'Dependency audit failed');
          }
        }
      } catch (err) {
        while (guardResult.firstChild) guardResult.removeChild(guardResult.firstChild);
        const errDiv = document.createElement('div');
        errDiv.className = 'guard-placeholder guard-error';
        const errP = document.createElement('p');
        errP.textContent = `Error: ${err.message}`;
        errDiv.appendChild(errP);
        guardResult.appendChild(errDiv);
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

  window._refreshApiKeys = refreshKeys;
  window.addEventListener('luna-auth-changed', refreshKeys);
  setTimeout(refreshKeys, 2000);
})();



/* ════════════════════════════════════════════════════════════════
   SENTINEL EDGE — Billing + Real Monitoring Dashboard
════════════════════════════════════════════════════════════════ */

// ── Sentinel Edge Razorpay checkout ─────────────────────────────
(function initSentinelBilling() {
  const upgradeBtn = document.getElementById('sentinel-upgrade-btn');
  const sentinelBtn = document.getElementById('sentinel-plan-btn');

  async function checkoutSentinel(btn) {
    if (!_currentUser) { showAuthModal(); return; }
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Loading…';
    try {
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'sentinel' }),
      });
      if (!orderRes.ok) { showToast('Payment service unavailable.', 'error'); return; }
      const data = await orderRes.json();

      new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Luna AI',
        description: data.description || 'Sentinel Edge — ₹19,999/month',
        order_id: data.orderId,
        prefill: { email: _currentUser?.email },
        theme: { color: '#2563eb' },
        handler: async (response) => {
          const vRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: _currentUser.id,
              plan: 'sentinel',
            }),
          });
          if (vRes.ok) {
            showToast('Sentinel Edge activated! Reloading…', 'success');
            setTimeout(() => location.reload(), 1800);
          } else {
            showToast('Payment verification failed. Contact support.', 'error');
          }
        },
      }).open();
    } catch { showToast('Something went wrong.', 'error'); }
    finally { btn.disabled = false; btn.textContent = origText; }
  }

  upgradeBtn?.addEventListener('click', () => checkoutSentinel(upgradeBtn));
  sentinelBtn?.addEventListener('click', () => checkoutSentinel(sentinelBtn));
})();


// ── Sentinel Dashboard — init ────────────────────────────────────
async function initSentinelDashboard(plan) {
  const locked = document.getElementById('sentinel-locked');
  const active = document.getElementById('sentinel-active');
  if (!locked || !active) return;

  const hasSentinel = _currentUser && (plan === 'sentinel' || plan === 'fortress');
  locked.style.display = hasSentinel ? 'none' : '';
  active.style.display = hasSentinel ? '' : 'none';
  if (!hasSentinel) return;

  await loadMonitors();

  document.getElementById('add-monitor-btn')?.addEventListener('click', () => {
    const f = document.getElementById('add-monitor-form');
    if (f) f.style.display = f.style.display === 'none' ? '' : 'none';
  });
  document.getElementById('cancel-monitor-btn')?.addEventListener('click', () => {
    const f = document.getElementById('add-monitor-form');
    if (f) f.style.display = 'none';
  });
  document.getElementById('save-monitor-btn')?.addEventListener('click', addMonitor);

  // Auto-refresh every 30 seconds
  if (window._sentinelRefreshTimer) clearInterval(window._sentinelRefreshTimer);
  window._sentinelRefreshTimer = setInterval(async () => {
    const tab4 = document.querySelector('.tab-panel[data-panel="4"]');
    if (tab4 && tab4.classList.contains('active')) await loadMonitors();
  }, 30000);
}

async function _getToken() {
  if (!_supabase) return null;
  const { data: { session } } = await _supabase.auth.getSession();
  return session?.access_token || null;
}

async function loadMonitors() {
  const token = await _getToken();
  if (!token) return;
  const res = await fetch('/api/monitor?action=list', { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return;
  const { monitors } = await res.json();
  renderMonitors(monitors || []);
}

function renderMonitors(monitors) {
  const list = document.getElementById('monitor-list');
  const empty = document.getElementById('monitor-empty');
  if (!list) return;
  list.querySelectorAll('.monitor-row').forEach(r => r.remove());

  if (!monitors.length) { if (empty) empty.style.display = ''; return; }
  if (empty) empty.style.display = 'none';

  monitors.forEach(mon => {
    const online = mon.last_status >= 200 && mon.last_status < 500;
    const uptime = mon.uptime_pct != null ? parseFloat(mon.uptime_pct).toFixed(1) : '—';
    const ttfb = mon.last_ttfb ? `${mon.last_ttfb}ms` : '—';
    const checked = mon.last_checked
      ? new Date(mon.last_checked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Never';

    const row = document.createElement('div');
    row.className = 'monitor-row';
    row.dataset.id = mon.id;

    const left = document.createElement('div');
    left.className = 'monitor-row-left';
    const dot = document.createElement('span');
    dot.className = `monitor-dot ${online ? 'monitor-dot--online' : 'monitor-dot--down'}`;
    const info = document.createElement('div');
    info.className = 'monitor-info';
    const lbl = document.createElement('span');
    lbl.className = 'monitor-label';
    lbl.textContent = mon.label;
    const urlEl = document.createElement('span');
    urlEl.className = 'monitor-url';
    urlEl.textContent = mon.url;
    info.append(lbl, urlEl);
    left.append(dot, info);

    const right = document.createElement('div');
    right.className = 'monitor-row-right';
    const stats = document.createElement('div');
    stats.className = 'monitor-stats';
    [`${uptime}% uptime`, `TTFB: ${ttfb}`, `Checked: ${checked}`].forEach((t, i) => {
      const s = document.createElement('span');
      s.className = 'monitor-stat' + (i === 2 ? ' monitor-stat--dim' : '');
      s.textContent = t;
      stats.appendChild(s);
    });

    const checkBtn = document.createElement('button');
    checkBtn.className = 'btn-monitor-check';
    checkBtn.type = 'button';
    checkBtn.textContent = '↻';
    checkBtn.title = 'Check now';
    checkBtn.addEventListener('click', () => checkMonitorNow(mon.id, row));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-monitor-del';
    delBtn.type = 'button';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', 'Remove');
    delBtn.addEventListener('click', () => removeMonitor(mon.id, row));

    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn-monitor-check';
    shareBtn.type = 'button';
    shareBtn.textContent = '🔗';
    shareBtn.title = 'Copy status page link';
    shareBtn.addEventListener('click', () => {
      const statusUrl = `${location.origin}/status/${mon.id}`;
      navigator.clipboard.writeText(statusUrl).then(() => {
        shareBtn.textContent = '✓';
        setTimeout(() => { shareBtn.textContent = '🔗'; }, 2000);
        showToast('Status page link copied!', 'success');
      }).catch(() => {
        window.prompt('Copy this link:', statusUrl);
      });
    });

    right.append(stats, shareBtn, checkBtn, delBtn);
    row.append(left, right);
    list.appendChild(row);
  });
}

async function addMonitor() {
  const urlInput = document.getElementById('monitor-url-input');
  const labelInput = document.getElementById('monitor-label-input');
  const saveBtn = document.getElementById('save-monitor-btn');
  if (!urlInput?.value.trim()) { showToast('Please enter a URL', 'error'); return; }
  const token = await _getToken();
  if (!token) { showToast('Please sign in first', 'error'); return; }

  const orig = saveBtn.textContent;
  saveBtn.disabled = true; saveBtn.textContent = 'Adding…';

  const res = await fetch('/api/monitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: 'add', url: urlInput.value.trim(), label: labelInput.value.trim() }),
  });
  saveBtn.disabled = false; saveBtn.textContent = orig;

  if (res.ok) {
    urlInput.value = ''; labelInput.value = '';
    document.getElementById('add-monitor-form').style.display = 'none';
    showToast('Monitor added!', 'success');
    await loadMonitors();
  } else {
    const err = await res.json().catch(() => ({}));
    showToast(err.error || 'Failed to add monitor', 'error');
  }
}

async function checkMonitorNow(id, row) {
  const token = await _getToken();
  if (!token) return;
  const btn = row.querySelector('.btn-monitor-check');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  const res = await fetch(`/api/monitor?action=check&id=${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (btn) { btn.disabled = false; btn.textContent = '↻'; }

  if (res.ok) {
    const data = await res.json();
    const dot = row.querySelector('.monitor-dot');
    if (dot) dot.className = `monitor-dot ${data.check.online ? 'monitor-dot--online' : 'monitor-dot--down'}`;
    const stats = row.querySelectorAll('.monitor-stat');
    if (stats[0]) stats[0].textContent = `${parseFloat(data.uptime_pct).toFixed(1)}% uptime`;
    if (stats[1]) stats[1].textContent = `TTFB: ${data.check.ttfb}ms`;
    if (stats[2]) stats[2].textContent = 'Checked: just now';
    showToast(`${data.check.online ? 'Online' : 'Down'} · ${data.check.ttfb}ms`,
      data.check.online ? 'success' : 'error');
  } else {
    showToast('Check failed', 'error');
  }
}

async function removeMonitor(id, row) {
  const token = await _getToken();
  if (!token) return;
  await fetch('/api/monitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: 'remove', id }),
  });
  row.remove();
  if (!document.querySelectorAll('.monitor-row').length) {
    const empty = document.getElementById('monitor-empty');
    if (empty) empty.style.display = '';
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   ENTERPRISE CONTACT MODAL
══════════════════════════════════════════════════════════════════════════ */
(function initEnterpriseContact() {
  const btn = document.querySelector('.pricing-card--enterprise .plan-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    // Remove existing modal if any
    document.getElementById('enterprise-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'enterprise-modal';
    overlay.className = 'auth-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'auth-modal enterprise-modal';

    const close = document.createElement('button');
    close.className = 'auth-modal-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.addEventListener('click', () => overlay.remove());

    const title = document.createElement('h2');
    title.className = 'auth-modal-title';
    title.textContent = 'Fortress Prime — Enterprise';

    const sub = document.createElement('p');
    sub.className = 'auth-modal-sub';
    sub.textContent = "Tell us about your needs and we\u2019ll get back within 24 hours.";

    const form = document.createElement('form');
    form.className = 'enterprise-form';

    const fields = [
      { id: 'ent-name', type: 'text', placeholder: 'Your Name', required: true },
      { id: 'ent-email', type: 'email', placeholder: 'Work Email', required: true },
      { id: 'ent-company', type: 'text', placeholder: 'Company Name', required: true },
      { id: 'ent-size', type: 'text', placeholder: 'Team Size (e.g. 50–200)' },
    ];
    fields.forEach(f => {
      const input = document.createElement('input');
      input.id = f.id;
      input.type = f.type;
      input.placeholder = f.placeholder;
      input.className = 'auth-input';
      if (f.required) input.required = true;
      form.appendChild(input);
    });

    const msgArea = document.createElement('textarea');
    msgArea.id = 'ent-message';
    msgArea.className = 'auth-input enterprise-textarea';
    msgArea.placeholder = 'Describe your security needs or use case…';
    msgArea.rows = 4;
    form.appendChild(msgArea);

    const errMsg = document.createElement('p');
    errMsg.className = 'auth-error-msg';
    errMsg.style.display = 'none';
    form.appendChild(errMsg);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn-primary';
    submitBtn.style.width = '100%';
    submitBtn.textContent = 'Send Enquiry';
    form.appendChild(submitBtn);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      errMsg.style.display = 'none';

      const body = {
        name: document.getElementById('ent-name').value.trim(),
        email: document.getElementById('ent-email').value.trim(),
        company: document.getElementById('ent-company').value.trim(),
        size: document.getElementById('ent-size').value.trim(),
        message: document.getElementById('ent-message').value.trim(),
      };

      try {
        const res = await fetch('/api/enterprise-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          overlay.remove();
          showToast("Enquiry sent! We\u2019ll reach out within 24 hours.", 'success');
        } else {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Failed to send');
        }
      } catch (err) {
        errMsg.textContent = err.message;
        errMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Enquiry';
      }
    });

    modal.append(close, title, sub, form);
    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  });
})();

/* ══════════════════════════════════════════════════════════════════════════
   ONBOARDING — first visit welcome callout
══════════════════════════════════════════════════════════════════════════ */
(function initOnboarding() {
  if (localStorage.getItem('luna_visited')) return;
  localStorage.setItem('luna_visited', '1');

  const banner = document.createElement('div');
  banner.id = 'onboard-banner';
  banner.className = 'onboard-banner';

  const text = document.createElement('div');
  text.className = 'onboard-text';

  const heading = document.createElement('strong');
  heading.textContent = 'Welcome to Luna AI! ';
  const desc = document.createTextNode('Start by pasting a suspicious URL or domain in the Phishing Detection tab, or say "Hey Luna" to chat with your AI security assistant.');
  text.append(heading, desc);

  const steps = document.createElement('div');
  steps.className = 'onboard-steps';
  [
    { icon: '🔍', label: 'Scan a URL for phishing' },
    { icon: '🛡️', label: 'Check your website security' },
    { icon: '🤖', label: 'Say "Hey Luna" to ask anything' },
  ].forEach(s => {
    const step = document.createElement('span');
    step.className = 'onboard-step';
    step.textContent = `${s.icon} ${s.label}`;
    steps.appendChild(step);
  });

  const closeBtn = document.createElement('button');
  closeBtn.className = 'onboard-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Dismiss');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => banner.remove());

  banner.append(text, steps, closeBtn);

  // Insert after navbar
  const navbar = document.getElementById('navbar');
  if (navbar?.nextSibling) {
    navbar.parentNode.insertBefore(banner, navbar.nextSibling);
  } else {
    document.body.prepend(banner);
  }

  // Auto-dismiss after 12 seconds
  setTimeout(() => banner.remove(), 12000);
})();

/* ════════════════════════════════════════════════════════════════
   LUNA AUTOPILOT — Bulk URL Scanner
════════════════════════════════════════════════════════════════ */
(function () {
  const runBtn = document.getElementById('autopilot-run-btn');
  const exportBtn = document.getElementById('autopilot-export-btn');
  const input = document.getElementById('autopilot-input');
  const results = document.getElementById('autopilot-results');
  if (!runBtn || !input || !results) return;

  let autopilotData = []; // { url, score, verdict, findings }

  function verdictColor(v) {
    if (v === 'Critical' || v === 'High Risk') return '#ef4444';
    if (v === 'Suspicious' || v === 'Low Risk') return '#f59e0b';
    return '#22c55e';
  }

  function renderRow(url, state, score, verdict) {
    let existing = document.getElementById('ap-row-' + btoa(url).slice(0, 16));
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'ap-row-' + btoa(url).slice(0, 16);
      existing.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);margin-bottom:8px;font-size:13px;';
      results.appendChild(existing);
    }
    const domain = (() => { try { return new URL(url).hostname; } catch { return url.slice(0, 40); } })();
    const color = verdictColor(verdict);
    const dot = state === 'scanning'
      ? '<span style="width:10px;height:10px;border-radius:50%;background:#6366f1;display:inline-block;animation:pulse 1s infinite;flex-shrink:0;"></span>'
      : `<span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0;"></span>`;
    const label = state === 'scanning'
      ? '<span style="color:#818cf8;margin-left:auto;">Scanning…</span>'
      : `<span style="color:${color};margin-left:auto;font-weight:600;">${verdict} · ${score}/100</span>`;
    existing.innerHTML = `${dot}<img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16" width="16" height="16" style="border-radius:3px;flex-shrink:0;" onerror="this.style.display='none'"><span style="color:#e2e8f0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${domain}</span>${label}`;
  }

  async function scanOne(url) {
    renderRow(url, 'scanning', 0, '');
    return new Promise((resolve) => {
      const findings = [];
      let done = false;
      const timeout = setTimeout(() => { if (!done) { done = true; resolve({ url, score: 0, verdict: 'Unknown', findings: [] }); } }, 25000);

      const es = new EventSource(`/api/scan?url=${encodeURIComponent(url)}&type=phishing`);
      es.addEventListener('finding', e => {
        try {
          const d = JSON.parse(e.data);
          if (d.status && d.status !== 'scanning') findings.push(d);
        } catch { }
      });
      es.addEventListener('complete', () => {
        es.close();
        clearTimeout(timeout);
        if (done) return;
        done = true;
        const score = Math.min(100, findings.filter(f => f.status === 'vulnerable').length * 15);
        const v = score === 0 ? 'Safe' : score <= 25 ? 'Low Risk' : score <= 55 ? 'Suspicious' : score <= 80 ? 'High Risk' : 'Critical';
        resolve({ url, score, verdict: v, findings });
      });
      es.onerror = () => {
        es.close();
        clearTimeout(timeout);
        if (!done) { done = true; resolve({ url, score: 0, verdict: 'Error', findings: [] }); }
      };
    });
  }

  runBtn.addEventListener('click', async () => {
    const urls = input.value.split('\n').map(u => u.trim()).filter(u => {
      try { const p = new URL(u); return p.protocol === 'http:' || p.protocol === 'https:'; } catch { return false; }
    }).slice(0, 20);

    if (urls.length === 0) { showToast('Paste at least one valid URL', 'error'); return; }

    results.innerHTML = '';
    autopilotData = [];
    exportBtn.style.display = 'none';
    runBtn.disabled = true;
    runBtn.textContent = 'Running…';

    for (const url of urls) {
      const r = await scanOne(url);
      autopilotData.push(r);
      renderRow(url, 'done', r.score, r.verdict);
    }

    // Summary
    const safe = autopilotData.filter(r => r.score === 0).length;
    const risky = autopilotData.filter(r => r.score > 55).length;
    const susp = autopilotData.filter(r => r.score > 0 && r.score <= 55).length;
    const summary = document.createElement('div');
    summary.style.cssText = 'margin-top:14px;padding:12px 16px;border-radius:10px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);font-size:13px;color:#e2e8f0;text-align:center;';
    summary.innerHTML = `Autopilot complete — <span style="color:#22c55e;font-weight:600;">${safe} safe</span> · <span style="color:#f59e0b;font-weight:600;">${susp} suspicious</span> · <span style="color:#ef4444;font-weight:600;">${risky} dangerous</span>`;
    results.appendChild(summary);

    runBtn.disabled = false;
    runBtn.textContent = 'Run Again';
    exportBtn.style.display = '';
  });

  exportBtn.addEventListener('click', () => {
    if (!window.jspdf || autopilotData.length === 0) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(10, 10, 26);
    doc.rect(0, 0, W, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('luna! Autopilot Report', 14, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(new Date().toLocaleString(), W - 14, 16, { align: 'right' });
    let y = 34;
    autopilotData.forEach((r, i) => {
      if (y > 270) { doc.addPage(); y = 14; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 50);
      doc.text(`${i + 1}. ${r.url.slice(0, 70)}`, 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Verdict: ${r.verdict}   Score: ${r.score}/100`, 18, y);
      y += 10;
    });
    doc.save('luna-autopilot-report.pdf');
  });
})();

/* ════════════════════════════════════════════════════════════════
   TEAM DASHBOARD
════════════════════════════════════════════════════════════════ */
(function () {
  const authPrompt   = document.getElementById('team-auth-prompt');
  const createPanel  = document.getElementById('team-create-panel');
  const dashboard    = document.getElementById('team-dashboard');
  if (!authPrompt) return;

  async function getToken() { return await _getToken?.(); }

  async function apiTeam(method, body) {
    const token = await getToken();
    if (!token) return null;
    const url = method === 'GET'
      ? `/api/team?action=${body.action}`
      : '/api/team';
    const opts = { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
    if (method !== 'GET') opts.body = JSON.stringify(body);
    try {
      const r = await fetch(url, opts);
      const data = await r.json().catch(() => null);
      return r.ok ? data : { error: data?.error || 'Request failed' };
    } catch {
      return { error: 'Network error' };
    }
  }

  function renderMembers(members) {
    const list = document.getElementById('team-members-list');
    if (!list) return;
    if (!members.length) {
      list.innerHTML = '<div style="color:#475569;font-size:13px;text-align:center;padding:12px;">No members yet. Invite someone below.</div>';
      return;
    }
    list.innerHTML = members.map(m => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6d28d9,#1e40af);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;">${m.email[0].toUpperCase()}</div>
        <div style="flex:1;overflow:hidden;">
          <div style="font-size:12px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.email}</div>
          <div style="font-size:10px;color:#475569;">${m.role}</div>
        </div>
        <button onclick="removeMember('${m.id}', this)" style="background:none;border:none;color:#475569;cursor:pointer;font-size:14px;padding:2px 6px;" title="Remove">✕</button>
      </div>
    `).join('');
  }

  window.removeMember = async function(memberId, btn) {
    btn.disabled = true;
    const r = await apiTeam('POST', { action: 'remove-member', memberId });
    if (r?.ok) { btn.closest('div[style]').remove(); showToast('Member removed', 'success'); }
    else { btn.disabled = false; showToast('Failed to remove', 'error'); }
  };

  function renderScans(scans) {
    const feed = document.getElementById('team-scan-feed');
    if (!feed) return;
    if (!scans.length) {
      feed.innerHTML = '<div style="color:#475569;font-size:13px;text-align:center;padding:20px;">No team scan activity yet.</div>';
      return;
    }
    const colors = { Safe: '#22c55e', 'Low Risk': '#84cc16', Suspicious: '#f59e0b', 'High Risk': '#f97316', Critical: '#ef4444' };
    feed.innerHTML = scans.map(s => {
      const color = colors[s.verdict] || '#94a3b8';
      const domain = (() => { try { return new URL(s.url).hostname; } catch { return s.url.slice(0,30); } })();
      const time = new Date(s.created_at).toLocaleString();
      return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
        <span style="color:#94a3b8;flex-shrink:0;min-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.member_email}</span>
        <span style="color:#e2e8f0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${domain}</span>
        <span style="color:${color};font-weight:600;flex-shrink:0;">${s.verdict}</span>
        <span style="color:#475569;flex-shrink:0;">${s.score}/100</span>
        <span style="color:#334155;flex-shrink:0;font-size:11px;">${time}</span>
      </div>`;
    }).join('');

    // Update summary counts
    const dangerous  = scans.filter(s => s.score > 75).length;
    const suspicious = scans.filter(s => s.score > 25 && s.score <= 75).length;
    const safe       = scans.filter(s => s.score <= 25).length;
    document.getElementById('ts-dangerous').textContent  = dangerous;
    document.getElementById('ts-suspicious').textContent = suspicious;
    document.getElementById('ts-safe').textContent       = safe;
    document.getElementById('ts-total').textContent      = scans.length;
  }

  async function loadTeamDashboard() {
    const data = await apiTeam('GET', { action: 'get-team' });
    if (!data) return;

    if (!data.team) {
      authPrompt.style.display = 'none';
      createPanel.style.display = 'block';
      dashboard.style.display = 'none';
      _setTeamNameDefault(_currentUser);
      return;
    }

    authPrompt.style.display = 'none';
    createPanel.style.display = 'none';
    dashboard.style.display = 'block';

    const badge = document.getElementById('team-name-badge');
    if (badge) badge.textContent = data.team.name;

    renderMembers(data.members || []);

    const scansData = await apiTeam('GET', { action: 'team-scans' });
    renderScans(scansData?.scans || []);
  }

  // Show correct state based on auth
  document.addEventListener('luna:auth', (e) => {
    if (e.detail?.user) {
      loadTeamDashboard();
    } else {
      authPrompt.style.display = 'block';
      createPanel.style.display = 'none';
      dashboard.style.display = 'none';
    }
  });

  // Also load on page ready if already logged in
  setTimeout(() => {
    if (_currentUser) loadTeamDashboard();
  }, 1500);

  document.getElementById('team-name-input')?.addEventListener('input', (e) => {
    e.target.dataset.userEdited = e.target.value.trim() ? '1' : '0';
  });

  document.getElementById('team-create-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('team-name-input')?.value.trim();
    if (!name) { showToast('Enter a team name', 'error'); return; }
    const btn = document.getElementById('team-create-btn');
    btn.disabled = true; btn.textContent = 'Creating…';
    const r = await apiTeam('POST', { action: 'create-team', name });
    if (r?.team) {
      showToast('Team created!', 'success');
      loadTeamDashboard();
    } else {
      showToast(r?.error || 'Failed to create team', 'error');
    }
    btn.disabled = false; btn.textContent = 'Create Team';
  });

  document.getElementById('invite-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('invite-email-input')?.value.trim();
    const status = document.getElementById('invite-status');
    if (!email) return;
    const btn = document.getElementById('invite-btn');
    btn.disabled = true; btn.textContent = '…';
    status.textContent = 'Looking up account…';
    const r = await apiTeam('POST', { action: 'invite-member', email });
    if (r?.member) {
      status.textContent = '';
      document.getElementById('invite-email-input').value = '';
      showToast(`${email} added to team!`, 'success');
      loadTeamDashboard();
    } else {
      status.textContent = r?.error || 'No Luna account found for that email.';
      status.style.color = '#ef4444';
    }
    btn.disabled = false; btn.textContent = 'Invite';
  });

  document.getElementById('team-refresh-btn')?.addEventListener('click', loadTeamDashboard);
})();
