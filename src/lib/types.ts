export type LngLat = [number, number];

/** Id of a map look in `MAP_LOOKS` (lib/mapStyles.ts). */
export type ThemeId = string;
export type TransportId = "car" | "motorcycle" | "bicycle" | "walk" | "bus" | "train" | "boat" | "plane" | "balloon" | "airship" | "arrow";
export type LineStyle = "solid" | "dashed" | "dotted";
export type SymbolKind = "badge" | "arrow" | "dot" | "none";
export type SignStyle = "plate" | "tag" | "pin" | "flag" | "caption" | "photo";
export type Aspect = "16:9" | "9:16" | "1:1" | "4:5";
export type Resolution = 1080 | 1440 | 2160;
export type Fps = 24 | 25 | 30 | 60;
export type Corner = "tl" | "tr" | "bl" | "br";
export type StartMarker = "none" | "cross";
export type FinishMarker = "none" | "cross" | "flag";

/** Marks on the route itself: where it starts and ends, and what each leg travelled by. */
export interface Markers {
  start: StartMarker;
  finish: FinishMarker;
  /** the finish mark is there from the start, instead of popping up when the line arrives */
  finishFromStart: boolean;
  /** a round transport icon in the middle of each leg, popping up when the leg is done */
  legIcons: boolean;
}

export interface SavedView {
  center: LngLat;
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface RoutePoint {
  at: LngLat;
  /** A new leg starts at this point, travelling by this transport. */
  transport?: TransportId;
  /** Seconds the line stops here. */
  pause?: number;
  /** Seconds the leg that starts at this point takes to draw (unset = share of the travel time). */
  legSeconds?: number;
  /** Keep a hard corner here even when the route is smoothed. */
  sharp?: boolean;
}

export interface Route {
  kind: "drawn" | "gpx";
  points: RoutePoint[];
  smooth: boolean;
  /** Transport of the first leg. */
  startTransport: TransportId;
}

export interface TransportStyle {
  /** a hex colour, or "auto" to follow the map (lib/colors.ts) */
  color: string;
  width: number;
  line: LineStyle;
  symbol: SymbolKind;
  /** null = same as the line */
  symbolColor: string | null;
}

export interface Sign {
  id: string;
  at: LngLat;
  style: SignStyle;
  text: string;
  /** data: URL, photo signs only */
  photo?: string;
  show: "always" | "passed";
  /** Seconds the line stops when it reaches this sign. */
  pause: number;
}

export interface Scene {
  id: string;
  name: string;
  route: Route;
  look: {
    theme: ThemeId;
    terrain: boolean;
    /** How raised terrain is drawn: hill shading, or thin height curves only. */
    terrainStyle: "shading" | "contours";
    placeNames: boolean;
    outline: boolean;
    showAhead: boolean;
    symbolScale: number;
    transports: Record<TransportId, TransportStyle>;
    compass: { on: boolean; corner: Corner; style: "needle" | "rose"; size: number };
    markers: Markers;
  };
  signs: Sign[];
  signScale: number;
  camera: {
    mode: "follow" | "fixed" | "glide";
    zoom: number;
    pitch: number;
    up: "north" | "travel";
    lookAhead: 0 | 0.15 | 0.3;
    steadiness: "tight" | "smooth" | "very";
    openWide: boolean;
    closeWide: boolean;
    fixedView: SavedView | null;
    startView: SavedView | null;
    endView: SavedView | null;
  };
  timing: { duration: number; easing: "steady" | "ease" };
  /** Where the editing map was last looking. */
  view: SavedView | null;
}

export interface Project {
  id: string;
  version: 2;
  name: string;
  createdAt: number;
  updatedAt: number;
  scenes: Scene[];
  output: {
    aspect: Aspect;
    resolution: Resolution;
    fps: Fps;
    holdStart: number;
    holdEnd: number;
    credit: boolean;
    joinScenes: boolean;
  };
}

export const ASPECTS: Record<Aspect, { ratio: number; label: string }> = {
  "16:9": { ratio: 16 / 9, label: "16:9 Landscape" },
  "9:16": { ratio: 9 / 16, label: "9:16 Story" },
  "1:1": { ratio: 1, label: "1:1 Square" },
  "4:5": { ratio: 4 / 5, label: "4:5 Portrait" },
};

export const RESOLUTIONS: { value: Resolution; label: string }[] = [
  { value: 1080, label: "1080p" },
  { value: 1440, label: "2K" },
  { value: 2160, label: "4K" },
];

/** Output pixel size; the short side equals the chosen resolution. Always even. */
export function outputSize(aspect: Aspect, res: Resolution): { width: number; height: number } {
  const r = ASPECTS[aspect].ratio;
  const even = (n: number) => Math.round(n / 2) * 2;
  return r >= 1 ? { width: even(res * r), height: res } : { width: res, height: even(res / r) };
}

export const uid = () =>
  (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

import { TRANSPORTS, TRANSPORT_IDS } from "./transports";

export function defaultTransportStyles(): Record<TransportId, TransportStyle> {
  return Object.fromEntries(
    TRANSPORT_IDS.map((id) => {
      const t = TRANSPORTS[id];
      return [id, { color: "auto", width: 6, line: t.line, symbol: "badge", symbolColor: null } satisfies TransportStyle];
    }),
  ) as Record<TransportId, TransportStyle>;
}

export function defaultMarkers(): Markers {
  return { start: "none", finish: "none", finishFromStart: false, legIcons: false };
}

export function newScene(name = "Scene 1", lookFrom?: Scene): Scene {
  return {
    id: uid(),
    name,
    route: { kind: "drawn", points: [], smooth: true, startTransport: "car" },
    look: lookFrom
      ? structuredClone(lookFrom.look)
      : {
          theme: "liberty",
          terrain: false,
          terrainStyle: "shading",
          placeNames: true,
          outline: true,
          showAhead: true,
          symbolScale: 1,
          transports: defaultTransportStyles(),
          compass: { on: false, corner: "tr", style: "needle", size: 1 },
          markers: defaultMarkers(),
        },
    signs: [],
    signScale: lookFrom?.signScale ?? 1,
    camera: lookFrom
      ? { ...structuredClone(lookFrom.camera), fixedView: null, startView: null, endView: null }
      : {
          mode: "follow",
          zoom: 9,
          pitch: 30,
          up: "travel",
          lookAhead: 0.15,
          steadiness: "smooth",
          openWide: true,
          closeWide: false,
          fixedView: null,
          startView: null,
          endView: null,
        },
    timing: { duration: 12, easing: "ease" },
    view: lookFrom?.view ?? null,
  };
}

export function newProject(name = "Untitled trip"): Project {
  const now = Date.now();
  return {
    id: uid(),
    version: 2,
    name,
    createdAt: now,
    updatedAt: now,
    scenes: [newScene()],
    output: { aspect: "16:9", resolution: 1080, fps: 30, holdStart: 1, holdEnd: 1.5, credit: true, joinScenes: false },
  };
}

/** A short drive and ferry through the Stockholm archipelago, used for the demo. */
export function demoProject(): Project {
  const p = newProject("Stockholm to Sandhamn");
  const s = p.scenes[0];
  s.route.points = (
    [
      [18.0717, 59.3247],
      [18.1105, 59.3205],
      [18.1702, 59.3343],
      [18.2525, 59.3395],
      [18.3271, 59.3602],
      [18.4122, 59.3533],
      [18.5045, 59.3721],
      [18.6338, 59.3699],
      [18.7581, 59.3866],
      [18.8705, 59.3846],
      [18.9112, 59.2876],
    ] as LngLat[]
  ).map((at) => ({ at }));
  s.route.points[6].transport = "boat";
  s.signs.push({ id: uid(), at: [18.0717, 59.3247], style: "plate", text: "Stockholm", show: "always", pause: 0 });
  s.signs.push({ id: uid(), at: [18.9112, 59.2876], style: "flag", text: "Sandhamn", show: "passed", pause: 0 });
  return p;
}

// ---------- coercion and migration ----------

function coerceScene(raw: Partial<Scene>, i: number): Scene {
  const base = newScene(`Scene ${i + 1}`);
  const look = { ...base.look, ...raw.look };
  look.transports = { ...base.look.transports };
  for (const id of TRANSPORT_IDS) {
    const t = { ...base.look.transports[id], ...raw.look?.transports?.[id] };
    // Colours left at the old built-in default now follow the map instead.
    if (t.color && t.color.toUpperCase() === TRANSPORTS[id].color.toUpperCase()) t.color = "auto";
    look.transports[id] = t;
  }
  look.compass = { ...base.look.compass, ...raw.look?.compass };
  look.markers = { ...defaultMarkers(), ...raw.look?.markers };
  return {
    ...base,
    ...raw,
    id: raw.id ?? base.id,
    route: { ...base.route, ...raw.route, points: (raw.route?.points ?? []).filter((p) => Array.isArray(p?.at)) },
    look,
    signs: (raw.signs ?? []).map((s) => ({ ...s, id: s.id ?? uid() })),
    camera: { ...base.camera, ...raw.camera },
    timing: { ...base.timing, ...raw.timing },
  };
}

interface V1Project {
  version: 1;
  name: string;
  route: { points: LngLat[]; kind: "drawn" | "gpx"; smooth: boolean };
  style: { theme: ThemeId; terrain: boolean; lineColor: string; lineWidth: number; symbol: "arrow" | "dot" | "none"; showAhead: boolean };
  camera: Partial<Scene["camera"]>;
  timing: { duration: number; holdStart: number; holdEnd: number; easing: "steady" | "ease" };
  output: { aspect: Aspect; resolution: number; fps: Fps; credit: boolean };
}

function fromV1(v: V1Project): Project {
  const p = newProject(v.name || "Untitled trip");
  const s = p.scenes[0];
  s.route = { kind: v.route.kind, smooth: v.route.smooth, points: v.route.points.map((at) => ({ at })), startTransport: "car" };
  s.look.theme = v.style.theme;
  s.look.terrain = v.style.terrain;
  s.look.showAhead = v.style.showAhead;
  s.look.transports.car = { ...s.look.transports.car, color: v.style.lineColor, width: v.style.lineWidth, symbol: v.style.symbol };
  s.camera = { ...s.camera, ...v.camera, openWide: false, closeWide: false, startView: null, endView: null };
  s.timing = { duration: v.timing.duration, easing: v.timing.easing };
  p.output = {
    ...p.output,
    aspect: v.output.aspect,
    fps: v.output.fps,
    credit: v.output.credit,
    holdStart: v.timing.holdStart,
    holdEnd: v.timing.holdEnd,
    resolution: v.output.resolution >= 2160 ? 2160 : 1080,
  };
  return p;
}

/** Accepts a v2 project, a v1 project, or a project file wrapper. Throws on anything else. */
export function coerceProject(raw: unknown): Project {
  const notOurs = new Error("This file isn't a Voyager Earth project.");
  if (!raw || typeof raw !== "object") throw notOurs;
  let r = raw as Record<string, unknown>;
  // "fardvag" is the format name from before the rename; those files still open.
  if ((r.format === "voyager-earth" || r.format === "fardvag") && r.project) r = r.project as Record<string, unknown>;
  if (r.version === 1 && r.route) return fromV1(r as unknown as V1Project);
  if (r.version !== 2 || !Array.isArray(r.scenes) || !r.scenes.length) throw notOurs;
  const base = newProject();
  const p = r as unknown as Project;
  return {
    ...base,
    ...p,
    id: typeof p.id === "string" ? p.id : base.id,
    scenes: p.scenes.map((s, i) => coerceScene(s, i)),
    output: { ...base.output, ...p.output },
  };
}
