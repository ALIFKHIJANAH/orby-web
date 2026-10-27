# orby-web

The marketing site for [Orby](https://github.com/ALIFKHIJANAH/orby), a Dynamic Island for AI coding agents.
Live at **https://orby.buildwithalif.web.id** (Cloudflare Pages project `orby`).

Vite + React 19 + TypeScript, `motion` for animation, Lenis for smooth scrolling. Design source:
`~/Documents/Orby.pen` (frames *Orby Website - Desktop* / *Mobile* and their light variants).

## Run

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
```

## Deploy

```sh
npm run build
npx wrangler pages deploy dist --project-name orby --branch main
```

The Download buttons point at `/download`, a Pages Function (`functions/download.ts`) that streams
`Orby-latest.dmg` from the R2 bucket `orby-releases` (binding `RELEASES` in `wrangler.toml`).
Shipping a new app version doesn't touch this site: `scripts/release.sh X.Y.Z` in the app repo
uploads the DMG there (via `scripts/publish-download.sh`).

`/download` only exists on Cloudflare; `npm run dev` serves the SPA there instead.

## How it's put together

- **`src/orb/`** is the mascot. `pose.ts` is a line-for-line port of `OrbPose` in
  `Sources/Orby/UI/AgentOrb.swift`: every phase (ready, thinking, working, compacting, needs you,
  done, error, dozing) and all 11 tool props, same numbers and timing, drawn with Canvas 2D.
  `Orb.tsx` renders one orb; `clock.ts` runs a single `requestAnimationFrame` loop for every orb on
  the page and each orb only subscribes while it is on screen.
- **Hero** (`sections/Hero.tsx`) is a pinned, scroll-driven story: the notch walks Orby through a
  session (thinking → read/search/edit/test → approval card → done). The reasoning line types as you
  scroll; the approval card answers to Y / N or a click.
- **Approvals** is a live queue of requests you can allow or deny with the keyboard.
- **Agents**: hover an agent and it acts out a tool while its neighbours turn to look.
- **Sounds** plays the app's real 8-bit cues with Web Audio (`lib/sound.ts`, from `SoundPlayer.swift`).
- **Theme**: Graphite (dark) and Paper (light), switched with a View Transition reveal from the
  toggle. The hardware (bezel, notch, app panels) stays black in both, via `.dark-surface`.
- **Reduced motion** is respected everywhere: orbs keep their colors and blinks but stop moving,
  Lenis is off, and the theme switch is instant.

Screenshots in `public/shots/` come from `docs/screenshots/cropped/` in the app repo.
