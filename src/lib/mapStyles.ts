import type { StyleSpecification } from "maplibre-gl";
import { isDarkPalette, osm } from "@versatiles/style";

/**
 * Map looks. Six are the original quick picks (OpenFreeMap and Sentinel-2 imagery); the other
 * 24 are VersaTiles palettes — the common looks of the big web maps, rebuilt on free
 * OpenStreetMap tiles with no API key. All are free to use with attribution.
 */
export interface MapLook {
  id: string;
  title: string;
  /** pale base map: pointers are drawn inverted */
  bright: boolean;
  /** text burned into the video */
  credit: string;
  /** land, water, road: drawn as a placeholder until the thumbnail is ready */
  swatch: [string, string, string];
  style: () => string | StyleSpecification;
}

const OSM = "© OpenStreetMap contributors";

const satellite: StyleSpecification = {
  version: 8,
  sources: {
    sat: {
      type: "raster",
      tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg"],
      tileSize: 256,
      maxzoom: 14,
      attribution:
        '<a href="https://s2maps.eu" target="_blank" rel="noopener">Sentinel-2 cloudless</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2016)',
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#0e2230" } },
    { id: "sat", type: "raster", source: "sat" },
  ],
};

const ofm = (id: string, title: string, bright: boolean, swatch: MapLook["swatch"]): MapLook => ({
  id,
  title,
  bright,
  swatch,
  credit: `${OSM}, OpenMapTiles, OpenFreeMap`,
  style: () => `https://tiles.openfreemap.org/styles/${id}`,
});

type Palette = (typeof osm.palettes)[number];
const vt = (palette: Palette, title: string, swatch: MapLook["swatch"]): MapLook => {
  let built: StyleSpecification | null = null;
  return {
    id: `vt-${palette}`,
    title,
    bright: !isDarkPalette(palette),
    swatch,
    credit: `${OSM}, VersaTiles`,
    style: () => (built ??= osm({ theme: palette }) as unknown as StyleSpecification),
  };
};

export const MAP_LOOKS: MapLook[] = [
  ofm("liberty", "Road atlas", true, ["#f8f4f0", "#a0c8f0", "#e9ac77"]),
  ofm("dark", "Dark", false, ["#1b1b1b", "#0b0b0b", "#3a3a3a"]),
  ofm("fiord", "Fiord blue", false, ["#45516e", "#38435c", "#7a8aa6"]),
  ofm("positron", "Light", true, ["#f2f2f0", "#cfd8dc", "#b9b9b9"]),
  ofm("bright", "Bright streets", true, ["#f8f4f0", "#a0c8f0", "#fdbf6f"]),
  {
    id: "satellite",
    title: "Satellite",
    bright: false,
    swatch: ["#3e5a3a", "#16324a", "#a39572"],
    credit: "Sentinel-2 cloudless by EOX (Copernicus data 2016)",
    style: () => satellite,
  },
  vt("googol", "Google Maps style", ["#f5f3ef", "#aadaff", "#ffe08a"]),
  vt("macbob", "Apple Maps style", ["#f4f1ea", "#9ed0f2", "#ffffff"]),
  vt("bingo", "Bing Maps style", ["#f2efe9", "#a8cff0", "#f7c86f"]),
  vt("classic", "Classic OpenStreetMap", ["#f2efe9", "#aad3df", "#f7c38a"]),
  vt("colorful", "Colorful", ["#f8f4ed", "#bedeff", "#ffcc88"]),
  vt("colorful-dark", "Colorful night", ["#1d2128", "#14243a", "#6b5a3a"]),
  vt("natural", "Natural terrain", ["#e8ecd8", "#b5d0e6", "#f0d9a0"]),
  vt("natural-dark", "Natural night", ["#1e2420", "#142230", "#5a5236"]),
  vt("muted", "Muted", ["#efefeb", "#cdd9e3", "#e2d8c4"]),
  vt("muted-dark", "Muted dark", ["#232323", "#1b2630", "#4a4436"]),
  vt("gray", "Grey", ["#ececec", "#d2d2d2", "#ffffff"]),
  vt("gray-dark", "Charcoal", ["#2a2a2a", "#1c1c1c", "#4c4c4c"]),
  vt("toner", "Toner, black and white", ["#ffffff", "#000000", "#000000"]),
  vt("toner-dark", "Toner, inverted", ["#000000", "#ffffff", "#ffffff"]),
  vt("positrino", "Positron style", ["#fafaf8", "#d4dadc", "#e0e0e0"]),
  vt("positrino-dark", "Dark Matter style", ["#121212", "#1c1c1c", "#3c3c3c"]),
  vt("protocol", "Protomaps light", ["#e9e9e5", "#c6d6e0", "#ffffff"]),
  vt("protocol-dark", "Protomaps dark", ["#1f1f1f", "#2b3540", "#4a4a4a"]),
  vt("protostar", "Protostar", ["#f0eee6", "#b9d4e8", "#f1c27d"]),
  vt("protostar-dark", "Protostar night", ["#20232a", "#18283a", "#6a5734"]),
  vt("protozoa", "Protozoa pastel", ["#f3efe2", "#c1dbe8", "#f4d6a7"]),
  vt("fnord", "Midnight blue", ["#10203a", "#0a1628", "#2e4a78"]),
  vt("freedom", "Freedom", ["#f4f2ec", "#b4d4f0", "#f5b85b"]),
  vt("mactaylor", "Soft atlas", ["#f6f3ec", "#b9dbf1", "#fbe2a6"]),
];

export const QUICK_LOOKS = MAP_LOOKS.slice(0, 6).map((l) => l.id);

export function lookById(id: string): MapLook {
  return MAP_LOOKS.find((l) => l.id === id) ?? MAP_LOOKS[0];
}
