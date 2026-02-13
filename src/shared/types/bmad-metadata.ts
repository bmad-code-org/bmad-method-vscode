// BMAD Metadata Types
// Represents installation metadata from _bmad/_config/manifest.yaml

export interface BmadModule {
  name: string;
  version: string;
  source: string;
}

export interface BmadMetadata {
  version: string;
  lastUpdated: string; // ISO date string
  modules: BmadModule[];
}
