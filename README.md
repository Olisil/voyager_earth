# Voyager Earth

Animated route maps for travel films, as a page on nassau.se. Draw a route or drop in a GPX
file, switch transport per leg, add signs and photos, pick a camera move, and render an MP4 in
the browser. No backend, no accounts: projects live in the browser (IndexedDB) and can be
downloaded as `.voyager.json` files (older `.fardvag.json` files still open).

## Run locally

    npm install
    npm run dev        # http://localhost:5173

Node 22+. Rendering needs WebCodecs H.264: current Chrome or Edge on desktop is the reference.

## Deploy as a page under nassau.se (Webflow Cloud)

Plain Vite + React, which Webflow Cloud builds directly (`webflow.json` pins `vite`). Don't set
`base` in `vite.config.ts`; Webflow Cloud sets it from the mount path. Routing is hash based
(`#/`, `#/p/<id>`), so any mount path works without rewrites.

1. Push this folder to GitHub (contents at the repository root).
2. nassau.se site settings > Webflow Cloud > create a project from the repository, mount path
   e.g. `/voyager-earth`.
3. Publish the site once. Every push to the branch redeploys.

## Design system

`src/styles.css` uses the exact Webflow variables of nassau.se (names and values from the
site's "Base" collection): `--color--*` light values, `--dark--*` dark values, `--space--*`,
`--size--*`, `--stroke--*`, `--radius--*`, `--headings`, `--persist-*`. As on the site, the class
`dark-mode` on `<html>` swaps them, and the choice is shared with the rest of nassau.se through
`localStorage["dark-mode"]` (dark by default). Fonts are the site's own (Neugrotypeface,
Raleway variable) from the Webflow CDN, with a bundled Raleway as fallback for local development.

The header is the site's floating navigation plate: the Voyager Earth logo and a breadcrumb on
the left; on the right "Apps home", "Buy me a coffee" and the site's `toggle_wrap` theme toggle.
The plate is always dark, so its controls keep their dark-mode colours in light mode too.

- **Buy me a coffee** is the button from nassau.se/apps (Button Secondary with the Buy Me a
  Coffee logo, signal green with the coffee in Signal On). A click opens the same support panel
  as on the Apps page (`lib/support.ts` and the `.nx-bmc` styles are copied from the page's
  custom code); with a modifier key the link opens buymeacoffee.com/nassau in a new tab. Below
  1000 px wide the button shows the cup only.
- **Apps home** is a nav link like the site's main navigation (`.nav-text-link`: Raleway 600,
  16 px, bright text, signal green on hover) and goes to `/apps` on the same site. On phones it
  reads "Apps".
- The **project menu** (download or duplicate) is the icon button left of the video shape
  select in the step bar.

Components follow the "Nassau New" Figma design system:

| Figma component | Used for | Class |
| --- | --- | --- |
| Button / Primary | Next step, Render video, Download MP4, Create project, Play | `.btn.btn-primary` |
| Button / Secondary | Open a project file, New scene | `.btn.btn-secondary` |
| Button / Secondary (Apps page) | Buy me a coffee, in the header | `.bmc-button` |
| Nav link (site navigation) | Apps home, in the header | `.nav-text-link` |
| Button Tool / Secondary | Detailed controls: Undo, Reverse, Use this view, Duplicate | `.btn` |
| Button Tool / Primary | Chosen option in segmented controls, active tool, chosen transport | `.segmented .on` |
| Nav link | The current step | `.step.on` |
| Pill | Counts and meta | `.pill` |
| Text field | Text inputs | `.input` |
| Theme toggle | Light/dark switch | `.toggle_wrap` |

Glass (bg/glass + 20 px blur) for the header and floating map tools; 350 ms ease on colour and
border. Deviations: Button Tool / Primary keeps bright text in light mode (dark text on Dim Grey
fails contrast), and on/off switches, which the system doesn't define, borrow the Theme
toggle's shape.

To keep tokens in sync when the site changes, update the block at the top of `styles.css`, or
export them with Webflow DevLink.

## Code map

- `lib/types.ts`: project format (scenes, legs, pauses, signs), defaults, upgrades v1 files
- `lib/model.ts`: geometry per leg (great-circle flights, date line, smoothing with sharp
  corners) and the timeline (speed per transport, pauses, sign times)
- `lib/camera.ts`: fixed, start-to-end glide, follow; open/close on the whole route
- `lib/mapScene.ts`: MapLibre themes and per-leg line layers
- `lib/overlay.ts`: tip symbol, start and finish marks, transport icons on the legs, signs, compass, credit on a canvas, shared by preview and export
- `lib/exporter.ts`: renders one or all scenes and encodes MP4; pauses while the tab is hidden
- `lib/db.ts`: IndexedDB projects and project files
- `lib/geocode.ts`: place search (Photon / OpenStreetMap)
- `lib/support.ts`: the Buy me a coffee support panel (same as on nassau.se/apps)
- `components/HeaderNav.tsx`: Buy me a coffee and Apps home, shared by both headers

## Data sources and licences

OpenFreeMap vector tiles (© OpenStreetMap contributors, OpenMapTiles); AWS terrain tiles
(Mapzen); EOX Sentinel-2 cloudless 2016 for satellite (CC BY 4.0, fair-use tile service);
Photon by Komoot for search. The export burns in a map credit by default.

## Map pointers

With the "Icon" symbol, the tip of the line is a top-down pointer (`lib/topdown.ts`): plane,
balloon, airship, train and foot from the Figma assets, plus car, bus, motorcycle, bicycle and
boat drawn in the same style. The train is a locomotive with two wagons that follow the line;
walking leaves left and right footprints, spaced a stride apart and turned slightly outwards,
that fade out. Pointers are inverted on bright maps.
The round side-view icons in menus and lists are always white on black.

Terrain can be shaded or drawn as height curves (thin grey contour lines generated in the
browser by maplibre-contour from the same terrain tiles).

Panels over the map can be dragged by their grip (double-click the grip to put one back).
Ctrl+Z / ⌘Z undoes route edits, Ctrl+Shift+Z / ⌘⇧Z or Ctrl+Y redoes.

## Map looks

`lib/mapStyles.ts` lists 30 looks: five OpenFreeMap styles, Sentinel-2 imagery, and 24 VersaTiles
palettes (Google-, Apple- and Bing-like looks, toner, positron, dark matter and more) built in the
browser with `@versatiles/style` on free OpenStreetMap tiles. "More map looks" opens a draggable
picker whose previews are rendered one at a time, around the current map view.

## Not yet built

More map themes, your own map image or symbol, photo at the tip, zoom per
transport, preview playing all scenes in a row.

## Start, finish and legs (Look step)

Optional marks on the route: a cross at the start; a cross or a waving chequered flag at the
finish (popping up when the line arrives, or shown from the start); and the round side-view
transport icon from the menus in the middle of each leg, popping up as soon as that leg is done.
They follow the symbol size, and the crosses take the colour of the line.
