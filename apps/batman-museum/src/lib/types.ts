export type MediaType = "comics" | "movies" | "tv" | "games";

export interface Era {
  slug: string;
  name: string;
  yearStart: number;
  yearEnd: number | null;
  blurb: string;
  accent: string;
  sort: number;
}

export interface Item {
  slug: string;
  eraSlug: string;
  title: string;
  mediaType: MediaType;
  releaseDate: string | null;
  yearDisplay: string;
  isMilestone: boolean;
  isExhibit: boolean;
  imageUrl: string | null;
  impact: string;
  story: string;
  funFacts: string[];
  sourceUrl: string | null;
  sort: number;
}

export interface TimelinePayload {
  eras: Era[];
  milestones: Item[];
}

export interface GalleryPayload {
  era: Era;
  exhibits: Item[];
}
