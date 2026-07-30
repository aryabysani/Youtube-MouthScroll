# Contributing to MouthScroll

Thanks for taking a look. Issues and pull requests are both welcome.

## Getting set up

No build step and no dependencies to install:

1. Clone the repo.
2. Go to `chrome://extensions`, turn on **Developer mode**, click
   **Load unpacked**, and select the repo folder.
3. Edit a file, then hit the **reload** ↻ button on the extension card.
   Content-script changes also need a page refresh.

`libs/face-api.min.js` and the four files in `models/` are committed on
purpose, so the extension works straight from a ZIP download. Only run
`node download_models.js` if you need to refresh them.

## Reporting a bug

Please include:

- What you were watching (Shorts, Reels, or a long YouTube video)
- Your Chrome version and operating system
- Anything logged to the console — open DevTools with F12 and look for
  `[MouthScroll]`

Gesture-detection problems are much easier to fix if you say what the numbers
in the overlay read (`MTH 0.42 · BRW 0.19 · THR 0.30`) when it misbehaves.

## Pull requests

- Match the style of the file you're editing. No linter or formatter is
  configured; two-space indent, and comments explain *why* rather than *what*.
- Keep it dependency-free. The extension deliberately ships no npm packages
  and loads nothing from a CDN — that's what keeps it auditable and private.
- Test on all three surfaces before submitting: Shorts, Reels, and a long
  YouTube video. Their gestures differ, and it's easy to fix one and break
  another.
- If you change the icons, run `node gen_icons_node.js` and commit the
  regenerated PNGs along with the generator.

## Things that would genuinely help

- Firefox support (the manifest and `chrome.*` calls need porting)
- Better gesture detection in low light
- More gestures, and a way to remap which gesture does what
- Reducing CPU use — detection currently runs at roughly 15 fps

## Privacy is a hard requirement

Camera frames must never leave the browser. Any change that adds a network
call, analytics, or remote logging will be declined.

## License

Contributions are accepted under the [MIT License](LICENSE).
