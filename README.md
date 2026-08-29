# $DESK — ApeOnDesk

Fan-made meme mashup of ApeOnFone ($FONE) and OTC Desks: the ape put the
phone down, found an old library computer, and now runs his own book.

## Deploy

No build step — plain HTML/CSS/JS.

1. Push this folder to a GitHub repo (drag-and-drop the files on github.com works fine).
2. Go to vercel.com → Add New Project → Import the repo → framework preset "Other" → Deploy.
3. Once the token is minted, fill in `CONFIG` at the top of `script.js` (CA, CHART_URL, BUY_URL, X_URL, TELEGRAM_URL) — the copy buttons, links and live DexScreener stats all wire themselves up automatically.
4. Update the `og:image` / `twitter:image` meta tags in `index.html` to an absolute URL once the site has a domain, so link previews on X/Telegram render the photo.
