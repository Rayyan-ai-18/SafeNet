# SafeNet SA, Native App Enforcement Architecture

Foundational plan for the native mobile app: the layer that actually *enforces*
content blocking and anti-circumvention (block porn + dark web, stop VPN/Tor,
defeat incognito, prevent uninstall). The website cannot do any of this; the app
is the real product. This document is the fact base + recommended architecture
that a formal implementation spec will be built from.

## Anchoring decisions (already made, do not relitigate)

- The React PWA cannot enforce anything. The native app is the real product.
- South Africa is Android-dominant (Android ~83 to 85%+, iOS ~15 to 16%). **Android is
  the flagship; iOS is best-effort.**
- Three enforcement layers: (1) a universal on-device DNS/VPN content filter
  (works on cellular + wifi); (2) Android Device Owner hard enforcement; (3) iOS
  Family Controls best-effort.
- Parent goals: block porn + dark web, block VPN-app installs, block Tor, defeat
  incognito, prevent uninstall of the app.
- **Privacy rule (load-bearing):** the existing promise "content never leaves the
  device" must hold. We resolve the tension in Section 6: filter on-device, do not
  log domain history, send parents only categorized aggregates.

---

## 1. DNS-based content filtering, end to end

### 1.1 Two fundamental architectures

**(A) Point the device at a remote filtering resolver.** Change system DNS (or
Android "Private DNS" = DNS-over-TLS hostname) to a filtering resolver (Cloudflare
`1.1.1.3`, NextDNS, CleanBrowsing, AdGuard DNS). The resolver blocks server-side.
Zero on-device logic. **Fatal weakness without Device Owner:** the child flips
Private DNS back to Off in ~10 seconds and the filter is gone. It also means a
third party sees every domain (the privacy problem).

**(B) A local always-on VPN that filters on-device.** The app registers as a VPN
(Android `VpnService`, iOS `NEVPNManager` / `NEDNSProxyProvider` /
`NEPacketTunnelProvider`). No remote VPN server. The TUN interface hands the app
all egress; DNS queries are matched locally against a blocklist; blocked names get
a sinkhole answer, allowed ones forward to an upstream resolver. This is how
AdGuard for Android, Blokada, RethinkDNS, DNS66 work. **This is the right
architecture for SafeNet:** (i) identical on cellular + wifi, (ii) the blocking
decision stays on-device so domain history need never leave the phone, (iii)
combined with Device Owner always-on lockdown it cannot be turned off.

**Ship the hybrid:** local VPN does on-device blocklist matching, then forwards
allowed queries over encrypted DNS (DoT/DoH) to an upstream SafeNet controls, so
we get a managed malware/phishing feed while keeping the *decision* local.

### 1.2 Cloudflare 1.1.1.1 for Families, confirmed facts

| Resolver | Filtering |
|---|---|
| `1.1.1.1` / `1.0.0.1` | Unfiltered (privacy, no blocking) |
| `1.1.1.2` / `1.0.0.2` | Malware only |
| `1.1.1.3` / `1.0.0.3` | Malware + adult content |

Plus IPv6 equivalents. **There is no `1.1.1.4` through `1.1.1.9`** — only `.1`, `.2`,
`.3` exist. Blocked domains resolve to `0.0.0.0`. Cloudflare's adult category is
coarse (no per-category control, no parent-visible logging, no allow/deny lists),
so it is a good *free fallback upstream*, not a product.

### 1.3 How NextDNS / AdGuard DNS / CleanBrowsing do family filtering

- **NextDNS** — configurable cloud resolver: per-profile blocklists, category
  toggles (Porn, Gambling, Dating, Piracy), SafeSearch + YouTube Restricted,
  parent-visible logging. Speaks DoH/DoT/DoQ + plain DNS. Closest functional
  template for SafeNet's paid tier.
- **AdGuard DNS** — cloud "Family protection" servers (force SafeSearch, block
  adult/malware) plus the on-device VPN-filter model SafeNet's MVP mirrors.
- **CleanBrowsing** — three free resolvers (Security, Adult, Family); Family also
  blocks mixed/proxy/VPN and forces SafeSearch. Publishes a strong guide on
  preventing DoH/DoT/VPN bypass.

### 1.4 Encrypted DNS (DoH/DoT) is the #1 bypass, and how to defeat it

A browser/app doing its own DoH (Firefox, Chrome "Secure DNS") tunnels resolution
to `cloudflare-dns.com` / `dns.google` / `dns.quad9.net` over 443, invisible to a
network filter. On Android, the system Private DNS setting can itself point at an
arbitrary DoT resolver (without Device Owner).

Mitigations, strongest last:
1. **Own all egress with the local VPN** — the TUN captures all packets, so even an
   app's own DoH 443 traffic goes through SafeNet's tunnel; match SNI/destination
   IP against the known DoH-provider list and drop it, forcing fallback to system
   DNS we control.
2. **Mozilla canary domain** — return NXDOMAIN for `use-application-dns.net`;
   Firefox then auto-disables DoH.
3. **Block DoH-resolver hostnames + IPs** — `dns.google`, `cloudflare-dns.com`,
   `dns.quad9.net`, plus `8.8.8.8`, `8.8.4.4`, `1.1.1.1`, `1.0.0.1`, `9.9.9.9`.
   HaGeZi's `doh-vpn-proxy-bypass` wildcard list is purpose-built for this.
4. **Device Owner: lock Private DNS** — the only *complete* fix; requires Device
   Owner (Section 2).

### 1.5 Blocklist categories and best open sources

The dominant maintained project is **HaGeZi** (updated daily):
- `doh-vpn-proxy-bypass` — encrypted DNS + VPN + Tor + proxy domains.
- NSFW / pornography wildcard list.
- Multi PRO / Threat Intelligence Feeds — malware, phishing, scam (~385k entries).

Others: **StevenBlack/hosts** (base + porn/gambling/social extensions), **OISD**
(low false-positive general), **CleanBrowsing/Sinfonietta** porn lists. For a paid,
low-false-positive commercial malware feed, **Spamhaus RPZ** is the standard.

**Top ~15 categories a family firewall should block:**
1. Pornography / adult
2. Dark-web gateways & Tor (`.onion` resolvers, bridges/relays, Tor update domains)
3. Web-based proxies / "unblocker" sites (CroxyProxy, hide.me web proxy)
4. Commercial VPN provider domains (Nord, Express, Proton, Surfshark, Turbo/Thunder)
5. Encrypted-DNS (DoH/DoT) resolver domains + the canary domain
6. Malware / C2
7. Phishing, **SA-weighted**: fake SASSA, SARS, Capitec/FNB/Absa/Nedbank/Standard,
   eWallet (reuse `linkRisk.js` brand intelligence)
8. Scam / fraud (sextortion, "free airtime/data", investment/crypto scams)
9. Grooming-risk anonymous-chat & Omegle-style random-cam sites
10. Gambling / online betting
11. Drugs / dark-market vendors
12. Self-harm / pro-suicide / pro-ED
13. Piracy / torrent index (also a malware vector)
14. Cryptojacking / coin-miners
15. Newly-registered / parked + DGA domains (high scam correlation)

Plus **SafeSearch / YouTube Restricted** via DNS rewrites
(`forcesafesearch.google.com`, `restrict.youtube.com`): a must-ship behaviour.

---

## 2. Android Device Owner, what it unlocks

Device Owner (a `DeviceAdminReceiver` with full `DevicePolicyManager` authority
over the whole device) is the difference between advisory and enforced:

- **Force always-on VPN, lockdown** — `setAlwaysOnVpnPackage(admin, pkg,
  lockdownEnabled=true)`. Persists across reboot; with lockdown + empty allowlist,
  only system apps bypass, so all child traffic must traverse SafeNet's filter.
  This is the keystone that makes Section 1 unbypassable.
- **Block installs / hide / suspend apps** — `setUninstallBlocked`,
  `setApplicationHidden`, `setPackagesSuspended`, install allow/block policy.
- **Disable sideloading** — `DISALLOW_INSTALL_UNKNOWN_SOURCES`, `DISALLOW_INSTALL_APPS`.
- **Un-uninstallable admin app** — Device Owner cannot be removed by the user
  without `clearDeviceOwnerApp` or factory reset. Satisfies "prevent uninstall."
- **Lock Private DNS / global settings** — closes the DoH/DoT hole from 1.4.
- **Disable Safe Mode** — `DISALLOW_SAFE_BOOT` (Safe Mode disables third-party apps
  incl. the VPN/DPC, a classic bypass).
- **Protect factory reset** — `DISALLOW_FACTORY_RESET` + Factory Reset Protection /
  Enterprise FRP locks the device to an authorized account after a reset.
- **Block new users / work profiles** — `DISALLOW_ADD_USER`,
  `DISALLOW_ADD_MANAGED_PROFILE` (stops the "second user with no filter" trick).
- **Kiosk / lock-task** — `setLockTaskPackages` for the strictest young-child device.

**Provisioning (the hard part / the cost).** Device Owner can normally only be set
on a device with no existing accounts, so it nearly always needs a **factory reset
first**. Methods: QR-code enrollment (6 taps on the welcome screen, scan SafeNet's
QR), `afw#setup` token, or zero-touch (reseller auto-provision). UX reality: for a
phone a child already uses this means back up, factory reset, re-set-up: a real
adoption tax. Product implication: ship a guided in-app reset wizard, position
Device Owner as the premium "Hard Lock" tier (often for a new/handed-down phone),
and keep the no-reset local-VPN filter as the default for everyone.

---

## 3. iOS reality, Family Controls (best-effort)

Three frameworks: **FamilyControls** (auth + privacy-preserving app/category
picker), **ManagedSettings** (shield apps, web filter, prevent removal, lock
settings), **DeviceActivity** (schedule restrictions/monitors).

**Can do:** shield/block selected apps and categories; Apple's on-device web-content
filter (clean Safari, allow/deny lists); usage reports; prevent removal of selected
apps. Apple never exposes which apps/sites to the developer (opaque tokens), so iOS
is inherently more limited and more Apple-mediated.

**Cannot do / why a determined teen wins:**
- The user can revoke the app's Screen Time authorization at any time. Even MDM
  cannot lock the per-app authorization toggle. The real lever is Apple's own
  Screen Time passcode on a Family-Sharing child account, partly outside a 3rd party app.
- Tokens can be silently re-issued after OS/app updates, invalidating stored blocks.
- The DeviceActivityMonitor extension has a ~6 MB memory limit; fragile.
- No true always-on VPN lockdown for a consumer app; `NEDNSProxyProvider` can filter
  DNS but the user can disable the VPN/profile unless the device is MDM-supervised.
- Full lock requires Supervision/MDM (Apple Configurator or MDM, device supervised),
  realistic only for a parent-owned, set-up-from-scratch device.

**Honest gap:** on Android Device Owner, SafeNet is unbypassable and un-uninstallable.
On consumer iOS, controls are defeatable by a teen who toggles Screen Time access or
deletes the profile, unless MDM-supervised. Market iOS as "best-effort guidance +
porn/web filtering + alerts," never "hard lock." Apple entitlements need approval:
factor lead time.

---

## 4. Anti-circumvention threat model (Red Hat to White Hat)

| # | Bypass | Android Device Owner mitigation | iOS residual risk |
|---|---|---|---|
| 1 | Install commercial VPN app | Block/uninstall-block known VPN packages; `DISALLOW_INSTALL_APPS`; always-on VPN lockdown; block VPN domains | High unless MDM-supervised |
| 2 | Install/sideload Tor Browser | Block Tor package + sideloading; block Tor bridge/relay/update domains; lockdown VPN | High on unsupervised iOS |
| 3 | Sideload an APK | `DISALLOW_INSTALL_UNKNOWN_SOURCES` disables sideloading | N/A (no general sideload) |
| 4 | Browser DoH / "Secure DNS" | VPN owns egress: block DoH SNIs/IPs; canary domain; lock Private DNS | Medium, browser DoH works |
| 5 | Change Private DNS to custom DoT | Device Owner locks Private DNS mode/host | N/A same form; DNS proxy user-disablable |
| 6 | Second user / work profile | `DISALLOW_ADD_USER`, `DISALLOW_ADD_MANAGED_PROFILE` | iPhone has no multi-user, low |
| 7 | Boot into Safe Mode | `DISALLOW_SAFE_BOOT` | No Safe Mode, N/A |
| 8 | Factory reset | `DISALLOW_FACTORY_RESET` + FRP locks to authorized account | High; supervised + Activation Lock mitigates |
| 9 | Uninstall SafeNet app | Device Owner un-uninstallable | High on unsupervised iOS |
| 10 | Airplane-mode / drop VPN | Always-on lockdown fails closed (no traffic when VPN down) | Medium, VPN/profile toggleable |
| 11 | Web-based proxy site | DNS-block proxy domains; SNI-block | Works if filter active; user can disable |
| 12 | Incognito / private browsing | DNS filtering is incognito-agnostic; SafeSearch forced via DNS | Same while filter active |
| 13 | Use a different device | Not solvable on the child's device; mitigate via parent education + future SafeNet public resolver / home router | Same, out of scope |
| 14 | Change device clock | Lock date/time auto via Device Owner | Partly mitigated by Screen Time |
| 15 | Disable/clear device admin | Cannot be deactivated by user when Device Owner | High, no equivalent lock without supervision |

**Takeaways:** (a) the local always-on VPN in lockdown is the linchpin (forces all
traffic, defeats incognito, fails closed); (b) only Device Owner closes the last-mile
holes (Private DNS lock, Safe Mode, factory reset, uninstall, sideload); (c) iOS
cannot be made unbypassable without MDM supervision: say so; (d) "another device"
(#13) is unsolvable on-device and is where a free SafeNet public resolver + home
story (Phase 4) eventually matters.

---

## 5. Competitive landscape

| Product | Enforces | Platform strength | Pricing (USD) | Gap SafeNet exploits |
|---|---|---|---|---|
| NextDNS | Cloud DNS filtering, categories, SafeSearch, logging | Cross-platform DNS; weak lock | Free <=300k/mo; Pro ~$20/yr | No hard Android lock, no SA scam intel, technical setup |
| Bark | AI message/content scanning + alerts, web filter | US-centric alerting | ~$14/mo or $99/yr | Cloud message scanning is POPIA-hostile for SA minors |
| Qustodio | Web filter, app block, time, location | Mature, broad, free tier | Free; $54.95 to $99.95/yr | No Device-Owner lock; no SA languages; pricier |
| Canopy | On-device real-time porn/image filtering | Strong privacy, porn blocking | Premium | Narrow; no VPN/Tor/anti-circumvention; no SA localization |
| Aura | Filtering + screen time + predator/bully alerts + ID theft | All-in-one US bundle | Premium bundle | US identity bundle irrelevant to SA; no Android hard-lock |
| Google Family Link | App approval, screen time, Chrome filter, location | Free, deep Android | Free | 13+ can attempt removal; clock/reboot/reset bypasses; no porn-grade DNS, no anti-VPN/Tor |
| Apple Screen Time | App limits, content/web, install limits | Native iOS, free | Free | iOS-only; defeatable without supervision |
| Mobicip | Web filter, screen time, location, app/site block | Cross-platform, cheap | $2.99 to $7.99/mo | No Device-Owner lock, no SA localization |

**SafeNet's defensible wedge:** (1) 11 official SA languages in UI + alerts; (2)
SASSA/SARS/bank scam + grooming intelligence in the blocklist and `linkRisk.js`,
which no global competitor localizes; (3) Android Device Owner depth (true
unbypassable lock) suited to SA's Android-heavy landscape; (4) a free DNS-filter
tier as top-of-funnel; (5) POPIA-by-architecture (on-device) vs cloud-scanning
incumbents like Bark.

---

## 6. Legal, POPIA / RICA, and the data-processor problem

**Core tension:** a resolver/filter that sees every domain a *minor* visits is
processing a child's personal information, and SafeNet would be the responsible
party. This collides with "content never leaves the device" unless architected
carefully.

**POPIA, children's data is special.** Section 34 prohibits processing a child's
personal information; section 35 lifts it where there is prior consent of a
*competent person* (the parent/guardian). Consent must be voluntary, specific,
informed. Obligations:
- Lawful basis = explicit parental consent at setup, granular (filter on-device vs
  log domains vs send alerts).
- Minimality (section 10): collect only what is adequate, relevant, not excessive. A
  full browsing log of a minor is almost certainly excessive. Default to no logging.
- Browsing history can reveal special-category data (health, orientation, religion):
  extra reason to minimize and keep evaluation on-device.
- Short retention, purpose limitation, security if anything is stored.

**RICA, interception vs filtering.** RICA bars interception/monitoring unless an
exception applies (prior written consent; being a party). DNS *filtering* (block/allow
a domain) is arguably not interception of content: a routing decision, lower risk.
*Logging/recording* what a child visits leans toward interception/monitoring and
triggers consent. Cleanest posture: rely on parent (competent person) consent at
install; filtering-only is the safe default; get a legal opinion before any content
capture.

**Competitors:** Bark = cloud message scanning (high exposure); Canopy = on-device,
no message collection (sidesteps it). SafeNet should follow the Canopy/on-device
posture.

**Recommended SafeNet data posture (design rule):**
1. Filter on-device; the decision never leaves the phone.
2. Do not log domain history by default. No per-domain log persisted or transmitted.
   This keeps the existing privacy promise intact.
3. Send the parent only minimal, aggregate signals: counts and *categories* of
   blocks ("12 adult-site attempts this week") and high-severity safety events
   (categorized, not raw URLs), only with explicit consent.
4. Upstream resolver runs log-free / no-PII, or use Cloudflare's no-log family
   resolver as fallback.
5. Consent UX: parent-as-competent-person, granular toggles, plain-language POPIA
   notice (we already have Privacy/POPIA pages). Align with the Information Regulator.

---

## 7. Unit economics

DNS volume: a child generates roughly 150k to 300k DNS queries/month (Cloudflare
Gateway plans ~150k/seat/mo; NextDNS free cap 300k/mo).

Three ways to run the filter, by cost:
1. **On-device only (recommended MVP).** Local VPN matches an on-device blocklist;
   allowed queries go to free `1.1.1.3`. **Marginal DNS cost per user ~ R0.** Only
   cost is shipping/refreshing the blocklist (a few MB from CDN). This is what makes
   a free firewall tier sustainable.
2. **Self-host an upstream (Unbound/Knot + RPZ).** Needed only for a no-log SA-tuned
   resolver. A 2 to 3 node HA cluster (~R3,000 to R8,000/mo all-in, + Spamhaus RPZ if
   licensed) serves tens of thousands of users; per-user cost falls toward a few rand
   per user per year at scale. No per-query fee.
3. **SaaS resolver (NextDNS ~$20/user/yr, Cloudflare Gateway $7/user/mo).** Too
   expensive to give away; only a paid B2B/school option.

**Monetization map:**
- **Free tier:** on-device DNS filter (porn + dark-web + VPN-domain + SA-scam).
  Near-zero marginal cost; top-of-funnel + trust + mission.
- **Paid "Hard Lock" tier (Device Owner):** charge for enforcement + management:
  provisioning, anti-circumvention guarantees, multi-child dashboards, per-child
  policies, scheduling, and safety alerts. This is what parents cannot get free from
  Family Link, so it is where willingness-to-pay sits.
- **Indicative SA pricing:** free firewall; paid family plan in the R49 to R99/month
  band (vs Bark ~R250+/mo equivalent). With a cost base of a few rand/user/year,
  paid-tier margins are very high; the free tier is a sustainable loss-leader.

---

## 8. Recommended phased architecture & roadmap

**Phase 0, Foundations (now).** Reuse `src/lib/linkRisk.js` brand intelligence
(SASSA/SARS/banks) as the seed SA scam blocklist. Build the blocklist pipeline:
ingest HaGeZi (`nsfw`, `doh-vpn-proxy-bypass`, threat feeds) + StevenBlack porn + a
SafeNet-curated SA-scam list; compile to a compact on-device format; CDN-distribute
with daily refresh. Lock the data posture (on-device, no domain logging, categorized
alerts only) and the parental-consent UX *before* writing enforcement code.

**Phase 1, MVP: on-device DNS filter, Android (no reset).** Ship the local always-on
`VpnService` that matches DNS on-device against porn / dark-web / VPN-domain /
SA-scam lists, forwards allowed queries to a free upstream (`1.1.1.3`), forces
SafeSearch/YouTube-Restricted via DNS rewrites, defeats incognito, and blocks DoH
SNIs/IPs + the canary domain. **This is the free tier**, installable without a
factory reset. Honest framing: a determined teen can still toggle the VPN off.

**Phase 2, Device Owner hard enforcement (Android, premium).** Add the DPC + QR
enrollment guided reset wizard. On Device-Owner devices:
`setAlwaysOnVpnPackage(lockdown=true)`, lock Private DNS, `DISALLOW_SAFE_BOOT`,
`DISALLOW_FACTORY_RESET` + FRP, `DISALLOW_INSTALL_UNKNOWN_SOURCES`, block/uninstall-
block VPN & Tor packages, `DISALLOW_ADD_USER/MANAGED_PROFILE`, make SafeNet
un-uninstallable. Converts the filter from soft to unbypassable: the core paid value.
Add multi-child dashboard + categorized safety alerts.

**Phase 3, iOS best-effort.** FamilyControls/ManagedSettings/DeviceActivity: app/
category shields, Apple web-content filter, optional `NEDNSProxyProvider`. Market
honestly as best-effort + alerts. Pursue Apple entitlements early.

**Phase 4, SafeNet DNS as a free public resolver + home story.** Stand up self-hosted
Unbound/Knot + RPZ no-log resolver(s); publish a free SA-tuned public filtering
resolver (the "1.1.1.3 for South Africa") + a home-router / second-device guide.
Addresses bypass #13, creates a national-scale brand asset + B2B/school upsell.

**Sequencing logic:** Phase 1 gets reach (free, no friction, ~R0 cost), Phase 2
captures revenue (the unbypassable lock Family Link cannot match), Phase 3 covers
the iOS minority honestly, Phase 4 turns the filter into national infrastructure.

---

## Next step

This is the research + recommended architecture. The next step is a formal
implementation spec (via the brainstorming -> writing-plans flow) for **Phase 1**:
the on-device `VpnService` DNS filter + blocklist pipeline + consent UX, which is the
shippable MVP wedge.

Sources for every load-bearing claim (Cloudflare docs, Android/Apple developer docs,
Microsoft Learn, HaGeZi repo, POPIA/RICA primary texts, competitor reviews) were
collected during research and are available in the session transcript.
