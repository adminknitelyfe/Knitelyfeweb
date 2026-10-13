# Putting the full site back

The site is currently a holding page. Everything else was moved to
`_site-full/`, not deleted, and is tracked in git.

## Restore

```bash
git mv _site-full/*.html site/
git mv _site-full/img/scenes site/img/scenes
git mv _site-full/audio/*.md _site-full/audio/*.txt site/audio/
git checkout HEAD~1 -- site/index.html
npx wrangler deploy
```

The fourth line is the one to get right: `site/index.html` is now the
holding page, and the real homepage is the previous version of that file.
`git log --oneline -- site/index.html` shows the history if you need a
specific one.

Then put back what the trim removed:

- `site/privacy.html` and `site/terms.html` had their nav and footer cut
  down to avoid dead links. Restore them with
  `git checkout <commit-before-maintenance> -- site/privacy.html site/terms.html`
- `index.html` carries `<meta name="robots" content="noindex,nofollow">`.
  That is deliberate for a holding page and **must come off** when the real
  site returns, or search engines will keep ignoring it.

## What stayed live

- The waitlist form, still posting to `/api/waitlist`
- The audio overview
- Privacy Policy and Terms — kept because the form collects names and
  email addresses, so taking them down while still collecting data would
  be worse than pointless
- `og-cover.png`, so shared links still show a card

## What came down

The eight product pages, all scene photography, and `audio/SCRIPT.md`,
which was publicly readable and is exactly the sort of thing the holding
page is meant to take out of view.

## Still exposed

Taking pages off the website does **not** take them off GitHub. The
repository is public, so every page, every image and every commit message
describing the product remains readable by anyone at
`github.com/adminknitelyfe/Knitelyfeweb` — including the full history,
which no amount of deleting from `site/` will change.

If the point of the holding page is to keep ideas out of view, the
repository has to be made private. Settings → General → Danger Zone →
Change repository visibility.
