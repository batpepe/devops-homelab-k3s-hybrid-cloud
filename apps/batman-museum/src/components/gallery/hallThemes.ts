// Per-era hall theming. Presentation lives in code (typed, versioned with the
// renderer); the DB keeps supplying the per-era accent color. DEFAULT_THEME is
// the pre-theming hall verbatim, so unknown future slugs render exactly the
// old look.

export const HALL_W = 11;
export const HALL_H = 6;
export const BAY = 5.2;

export type PropVariant =
  | "none"
  | "deco-arches"
  | "chrome-orbs"
  | "concrete-pillars"
  | "steel-panels"
  | "toon-frames"
  | "projector-cones"
  | "neon-strips";

export interface HallTheme {
  bg: string;
  wall: { color: string; ceiling: string; farWall: string; normalScale: number };
  floor: { color: string; metalness: number; mirror: number; roughness: number };
  trim: {
    girder: string;
    truss: string;
    stripCore: string;
    stripEmissive: string;
    stripIntensity: number;
    screenEmissive: string;
    screenIntensity: number;
  };
  light: {
    ambient: string;
    ambientIntensity: number;
    hemiSky: string;
    hemiGround: string;
    hemiIntensity: number;
    rimA: string;
    rimAIntensity: number;
    rimB: string;
    rimBIntensity: number;
    fill: string;
    batKey: string;
    exhibitSpot: string;
  };
  fog: { color: string; density: number };
  sparkle: string;
  props: { variant: PropVariant; perBay: 1 | 2 };
}

export const DEFAULT_THEME: HallTheme = {
  bg: "#04060a",
  wall: { color: "#14161b", ceiling: "#05070c", farWall: "#0b0f15", normalScale: 0.7 },
  floor: { color: "#070809", metalness: 0.75, mirror: 0.5, roughness: 0.82 },
  trim: {
    girder: "#3a4250",
    truss: "#2a3038",
    stripCore: "#0a2a33",
    stripEmissive: "#58d5f0",
    stripIntensity: 1.7,
    screenEmissive: "#58d5f0",
    screenIntensity: 0.7
  },
  light: {
    ambient: "#6f86a8",
    ambientIntensity: 0.34,
    hemiSky: "#33506e",
    hemiGround: "#04060a",
    hemiIntensity: 0.35,
    rimA: "#3fa9d6",
    rimAIntensity: 55,
    rimB: "#3a6ea0",
    rimBIntensity: 40,
    fill: "#3fa9d6",
    batKey: "#58d5f0",
    exhibitSpot: "#ffe6b8"
  },
  fog: { color: "#06090f", density: 0.034 },
  sparkle: "#cfe0f5",
  props: { variant: "none", perBay: 2 }
};

export const HALL_THEMES: Record<string, HallTheme> = {
  // Warm brass and art-deco stone: the age the legend was cast in.
  "golden-age": {
    bg: "#070604",
    wall: { color: "#1a1712", ceiling: "#0a0806", farWall: "#12100a", normalScale: 0.8 },
    floor: { color: "#0a0805", metalness: 0.7, mirror: 0.45, roughness: 0.85 },
    trim: {
      girder: "#6b5426",
      truss: "#4a3a1c",
      stripCore: "#2a2008",
      stripEmissive: "#d4a017",
      stripIntensity: 1.5,
      screenEmissive: "#d4a017",
      screenIntensity: 0.55
    },
    light: {
      ambient: "#a8905f",
      ambientIntensity: 0.4,
      hemiSky: "#6e5a33",
      hemiGround: "#0a0806",
      hemiIntensity: 0.34,
      rimA: "#c9a24a",
      rimAIntensity: 50,
      rimB: "#8a6d2f",
      rimBIntensity: 35,
      fill: "#c9a24a",
      batKey: "#d4a017",
      exhibitSpot: "#ffe2a8"
    },
    fog: { color: "#0a0806", density: 0.032 },
    sparkle: "#f0deb0",
    props: { variant: "deco-arches", perBay: 2 }
  },
  // Polished chrome and space-age optimism.
  "silver-age": {
    bg: "#05070b",
    wall: { color: "#171b22", ceiling: "#06080d", farWall: "#0d1218", normalScale: 0.5 },
    floor: { color: "#08090c", metalness: 0.85, mirror: 0.6, roughness: 0.7 },
    trim: {
      girder: "#8a95a5",
      truss: "#5a6572",
      stripCore: "#10202c",
      stripEmissive: "#9fb4c7",
      stripIntensity: 1.6,
      screenEmissive: "#9fb4c7",
      screenIntensity: 0.6
    },
    light: {
      ambient: "#8fa5bd",
      ambientIntensity: 0.42,
      hemiSky: "#4a637f",
      hemiGround: "#06080d",
      hemiIntensity: 0.4,
      rimA: "#a8c0d8",
      rimAIntensity: 60,
      rimB: "#7590ab",
      rimBIntensity: 40,
      fill: "#a8c0d8",
      batKey: "#cfe2f5",
      exhibitSpot: "#eaf2ff"
    },
    fog: { color: "#070b12", density: 0.03 },
    sparkle: "#dfe9f5",
    props: { variant: "chrome-orbs", perBay: 2 }
  },
  // Gritty concrete and rust: the street-level decade.
  "bronze-age": {
    bg: "#080604",
    wall: { color: "#1b1410", ceiling: "#0a0705", farWall: "#120c08", normalScale: 1.0 },
    floor: { color: "#0b0705", metalness: 0.55, mirror: 0.3, roughness: 0.95 },
    trim: {
      girder: "#4f3a28",
      truss: "#3a2a1c",
      stripCore: "#241408",
      stripEmissive: "#b87333",
      stripIntensity: 1.4,
      screenEmissive: "#b87333",
      screenIntensity: 0.5
    },
    light: {
      ambient: "#8a6a4a",
      ambientIntensity: 0.34,
      hemiSky: "#5f4630",
      hemiGround: "#0a0705",
      hemiIntensity: 0.32,
      rimA: "#b87333",
      rimAIntensity: 45,
      rimB: "#7a4a20",
      rimBIntensity: 32,
      fill: "#a06030",
      batKey: "#d08a4a",
      exhibitSpot: "#ffd9a0"
    },
    fog: { color: "#0a0705", density: 0.04 },
    sparkle: "#d9c0a0",
    props: { variant: "concrete-pillars", perBay: 2 }
  },
  // Dark steel with a red edge: the deconstruction years.
  "modern-age": {
    bg: "#05060a",
    wall: { color: "#101318", ceiling: "#05070b", farWall: "#0b0e13", normalScale: 0.6 },
    floor: { color: "#060708", metalness: 0.8, mirror: 0.55, roughness: 0.78 },
    trim: {
      girder: "#2e333c",
      truss: "#23272e",
      stripCore: "#260a08",
      stripEmissive: "#c0392b",
      stripIntensity: 1.8,
      screenEmissive: "#c0392b",
      screenIntensity: 0.6
    },
    light: {
      ambient: "#7a8698",
      ambientIntensity: 0.3,
      hemiSky: "#3a4656",
      hemiGround: "#05070b",
      hemiIntensity: 0.32,
      rimA: "#8ea0b8",
      rimAIntensity: 50,
      rimB: "#c0392b",
      rimBIntensity: 26,
      fill: "#90a2ba",
      batKey: "#e05a4a",
      exhibitSpot: "#ffe6c8"
    },
    fog: { color: "#07090d", density: 0.034 },
    sparkle: "#cdd5e5",
    props: { variant: "steel-panels", perBay: 2 }
  },
  // Flat shapes on a deco night sky, straight out of the animated series.
  animated: {
    bg: "#0b0714",
    wall: { color: "#191223", ceiling: "#0b0714", farWall: "#120c1c", normalScale: 0.15 },
    floor: { color: "#0a0712", metalness: 0.6, mirror: 0.4, roughness: 0.85 },
    trim: {
      girder: "#3f2b55",
      truss: "#2e2040",
      stripCore: "#2a0f14",
      stripEmissive: "#e74c3c",
      stripIntensity: 1.7,
      screenEmissive: "#e74c3c",
      screenIntensity: 0.55
    },
    light: {
      ambient: "#9a86b8",
      ambientIntensity: 0.5,
      hemiSky: "#5a4680",
      hemiGround: "#0b0714",
      hemiIntensity: 0.4,
      rimA: "#8a5ac0",
      rimAIntensity: 40,
      rimB: "#e74c3c",
      rimBIntensity: 26,
      fill: "#8a5ac0",
      batKey: "#f06a5a",
      exhibitSpot: "#ffd9b8"
    },
    fog: { color: "#0d0916", density: 0.028 },
    sparkle: "#e8c8f0",
    props: { variant: "toon-frames", perBay: 2 }
  },
  // Projector beams cutting through a dark screening room.
  cinematic: {
    bg: "#04070c",
    wall: { color: "#0e1319", ceiling: "#05070b", farWall: "#0a0f16", normalScale: 0.6 },
    floor: { color: "#05070a", metalness: 0.8, mirror: 0.6, roughness: 0.75 },
    trim: {
      girder: "#333c48",
      truss: "#262d38",
      stripCore: "#0a1a2c",
      stripEmissive: "#4aa3ff",
      stripIntensity: 1.6,
      screenEmissive: "#4aa3ff",
      screenIntensity: 0.6
    },
    light: {
      ambient: "#7a90b0",
      ambientIntensity: 0.3,
      hemiSky: "#3a5578",
      hemiGround: "#05070b",
      hemiIntensity: 0.34,
      rimA: "#4aa3ff",
      rimAIntensity: 55,
      rimB: "#2f6cb0",
      rimBIntensity: 36,
      fill: "#4aa3ff",
      batKey: "#7ac0ff",
      exhibitSpot: "#fff0d0"
    },
    fog: { color: "#060a12", density: 0.036 },
    sparkle: "#cfe4ff",
    props: { variant: "projector-cones", perBay: 1 }
  },
  // Neon arcade green: the playable Gotham.
  games: {
    bg: "#050906",
    wall: { color: "#0e150f", ceiling: "#060a06", farWall: "#0a120b", normalScale: 0.6 },
    floor: { color: "#060a06", metalness: 0.8, mirror: 0.55, roughness: 0.75 },
    trim: {
      girder: "#2c3a30",
      truss: "#212c24",
      stripCore: "#0a2412",
      stripEmissive: "#39d353",
      stripIntensity: 2.1,
      screenEmissive: "#39d353",
      screenIntensity: 0.6
    },
    light: {
      ambient: "#7aa88a",
      ambientIntensity: 0.34,
      hemiSky: "#3a6648",
      hemiGround: "#060a06",
      hemiIntensity: 0.35,
      rimA: "#39d353",
      rimAIntensity: 45,
      rimB: "#2a8a4a",
      rimBIntensity: 32,
      fill: "#39d353",
      batKey: "#5af07a",
      exhibitSpot: "#f0ffd8"
    },
    fog: { color: "#071008", density: 0.034 },
    sparkle: "#b8f0c8",
    props: { variant: "neon-strips", perBay: 2 }
  }
};

export const themeFor = (slug: string): HallTheme => HALL_THEMES[slug] ?? DEFAULT_THEME;
