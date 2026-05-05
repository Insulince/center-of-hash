export interface CountryShare {
  country: string;
  share: number;
}

export interface Centroid {
  x: number;
  y: number;
  z: number;
}

export interface Snapshot {
  date: string;
  shares: CountryShare[];
  centroid: Centroid;
}
