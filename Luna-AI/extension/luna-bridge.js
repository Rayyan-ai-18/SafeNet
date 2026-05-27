// Luna AI Extension - Luna Website Bridge
// Runs only on meet-luna-ai.vercel.app
// Listens for proactive threat alerts from the extension background
// and triggers Luna's voice without the user having to say anything.

(function () {
  'use strict';

  // Build a natural-sounding proactive alert message
  function buildAlertMessage(score, verdict, domain, vulns) {
    const isDangerous = score >= 75;
    const opener = isDangerous
      ? ['Hey, heads up.', 'Okay, stop.', 'Look, I need to flag this.'][Math.floor(Math.random() * 3)]
      : ['Hey, just so you know.', 'Quick heads up.'][Math.floor(Math.random() * 2)];

    let body;
    if (vulns && vulns.length > 0) {
      body = `The site you just visited - ${domain} - is flagging as ${verdict}. ${vulns[0]}.`;
    } else {
      body = `The site you just visited - ${domain} - scored ${score} out of 100. That's ${verdict}.`;
    }

    const cta = isDangerous
      ? "I'd recommend leaving that tab open and letting me run a full scan."
      : "Might be worth a closer look.";

    return `${opener} ${body} ${cta}`;
  }

  // Listen for messages from background.js
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type !== 'LUNA_PROACTIVE_ALERT') return;

    const { score, verdict, domain, vulns } = msg;
    const message = buildAlertMessage(score, verdict, domain, vulns);

    // Store the alert so Luna's voice pipeline can pick it up
    // We dispatch a custom DOM event - script.js listens for this
    window.dispatchEvent(new CustomEvent('luna:proactive', {
      detail: { message, score, verdict, domain }
    }));
  });
})();
