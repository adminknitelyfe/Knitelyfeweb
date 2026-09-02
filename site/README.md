# Knite Lyfe — Website

9 pages sharing one stylesheet and one script. No build step, no dependencies —
the pages are plain HTML and the browser loads `assets/styles.css` and
`assets/app.js` directly.

## Where the CSS lives

- `assets/styles.css` — the shared base: design tokens, nav, buttons, sections,
  footer, brand marks, audio player, responsive rules. Edit this once and every
  page changes.
- A small `<style>` block inside a page — rules only that page uses (the Knite
  Exchange disclosure split, the ID card mockup, the Campus packaging tiles, the
  Features lead block). Pages that need none don't have one.

**Order matters.** Each page emits its `<style>` block *after* the `<link>` to
`assets/styles.css`, because page rules are meant to override the base. If you
move that `<link>`, keep it above the `<style>`.

## IMPORTANT — keep the assets/ and img/ folders
CSS, JavaScript and brand artwork now live alongside the HTML, so `assets/` and
`img/` must stay in the same place as the pages. Download the ZIP and unzip the
whole thing — a single HTML file on its own will render unstyled.

    knitelyfe-site/
      index.html … contact.html
      assets/
        styles.css    shared base stylesheet — edit once, all pages update
        app.js        shared script — nav, scroll reveal, form handling
      img/
        helmet.png    logo mark
        lockup.png    full logo lockup
        mascot.png    the Knite character
      audio/
        SCRIPT.md     timed 3-minute recording script
        README.txt    where to put the finished mp3

## Just want to look at it?
Unzip the folder, then double-click index.html.

## Run it on localhost (recommended)
Opening files directly with file:// works, but some browsers block audio
playback that way. A local server behaves exactly like the real site.

Open a terminal **inside the unzipped folder** and run whichever you have:

    python -m http.server 8000        # Python 3 (already on most machines)
    npx serve                          # Node
    php -S localhost:8000              # PHP

Then open http://localhost:8000 in your browser.
Press Ctrl+C in the terminal to stop it.

VS Code alternative: install the "Live Server" extension, right-click
index.html, choose "Open with Live Server". It auto-reloads on save.

## Pages

- `index.html` — home
- `knite-exchange.html` — Knite ID and Knite Exchange
- `how-it-works.html` — the four-step walkthrough
- `features.html` — full feature list, led by identity
- `knite-campus.html` — Knite Lyfe Campus, for universities
- `about.html` — about, plus the AI audio overview
- `perspective.html` — the long-form essay
- `safety.html` — safety, privacy and the limits of the product
- `contact.html` — contact and waitlist

Flat filenames rather than folders, so relative links never break.

## Publish it (free, ~2 minutes)
1. Go to app.netlify.com/drop
2. Drag this entire folder onto the page
3. You get a live URL immediately
4. Point knitelyfe.com's DNS at it in Netlify's domain settings

## Before you launch — checklist

1. **Swap the illustrations for photography when you have it.** Every image slot
   currently holds original SVG scene artwork so the site looks finished today.
   Each one still carries a hidden `<span>` describing the photograph it was
   standing in for. To replace one, delete the `<svg>…</svg>` and drop in:
   `<img src="img/yourphoto.jpg" alt="describe it" loading="lazy">`
   Keep the described subject — the surrounding copy assumes that image.
   The illustrations are yours; there is no licensing issue with shipping as-is.

2. **Wire the forms.** They currently show a message telling people to email instead.
   Easiest: add `netlify` to each `<form>` tag, or use Formspree.

3. **Write Privacy Policy and Terms.** Footer links point at safety.html as a placeholder.
   Both must exist before any app release.

4. **Audio — already installed, with a disclosure.**
   `audio/knite-lyfe-story.mp3` (3:26) is live on the About page.

   It is an AI-generated audio overview. The original recording was framed as an
   interview with a reporter named "Alex Carter" of "Podunio" — **neither exists**.
   That framing has been removed and replaced with a visible notice that the
   voices are AI-generated and this is not press coverage.

   **Do not restore the fake reporter or outlet.** A company selling verified
   identity cannot be caught fabricating media coverage; it is the single fastest
   way to lose a university procurement conversation or an investor. The audio is
   perfectly usable — it just has to be labelled honestly.

   The essay the audio is based on is published at `perspective.html`, which gives
   the recording proper context and adds real long-form content for search.

   `audio/SCRIPT.md` remains as an alternative — a timed 3-minute script in your
   own voice, if you ever want to replace the AI version.

5. **Record the 3-minute audio story (optional).** `audio/SCRIPT.md` is a timed script
   (405 spoken words, ~2:48 plus marked pauses = 3:00). Record it, export as
   `audio/knite-lyfe-story.mp3`, and the player on the About page picks it up
   automatically. Until then the player shows a "coming soon" state rather than
   a broken control, and the full transcript is already on the page.

   Record it in your own voice. A founder-led safety company telling a personal
   story is the one piece of content a synthetic voice actively damages.
   Recording notes are at the bottom of SCRIPT.md.

5. **Add analytics** if you want them — nothing is tracking visitors right now.

## How the brand marks are used

- **Helmet mark** — the premium mark. Nav, footer, and a very large low-opacity
  watermark behind the homepage hero. Used on dark, adult-facing pages.
- **Full mascot** — appears once, on the "Preparation, not paranoia" block on
  About. A chibi character undercuts a premium safety pitch if it is everywhere;
  it earns its place where warmth is the right note.
- **Photography carries the product, not the character.** The knight belongs in
  the logo, iconography and UI accents. The scene photography is ordinary people
  in ordinary places, so the product reads as real safety technology.

## Deliberate content decisions

- **No fabricated proof.** No testimonials, user counts, university logos, press
  mentions, awards or security certifications — none exist yet.
- **Pre-release framing throughout.** "In development", "planned for 2027." Features
  outside the first release (drink awareness, AI-assisted safety) are labelled as such.
- **No unsupported security claims.** Safety page says "designed with privacy in mind,"
  never "bank-level encryption." One FAQ states plainly there are no certifications yet.
- **Outcome, not mechanism.** No architecture, alert logic, verification workflow,
  geofencing method, risk scoring, vendors or roadmap detail anywhere on the site.
- **Explicit limitation notice** on Safety and Contact: not an emergency service,
  cannot guarantee safety.

## About Knite ID and verification — read before publishing

Identity is now the top of the product hierarchy, and it is the claim most likely
to get the company into trouble if it is overstated.

- **Nothing is built.** No QR, no links, no exchange tokens, no NFC, no
  verification vendor. Every claim on `knite-exchange.html` is written as
  intended or planned, and it must stay that way until something ships.
- **"Verification does not mean safe"** appears on both `knite-exchange.html` and
  `safety.html`. Do not remove it. Verification can establish that a person is
  real and not anonymous; it cannot establish character or intent, and a safety
  product that blurs that line is a liability.
- **No in-app messaging.** The product deliberately does not build an inbox. An
  exchange can instead carry a social handle or a username-based platform, so a
  conversation can happen without anyone giving out a phone number.
- **The founder's name appears nowhere**, including in mockups. The example
  Knite ID uses a placeholder name.

Before any verification feature ships you will need, at minimum: a verification
vendor, a claims model for selective disclosure, token expiry and revocation, and
a privacy policy that describes what is held and for how long.
