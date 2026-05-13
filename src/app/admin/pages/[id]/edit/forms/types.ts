export interface AssetRef {
  id: string;
  url: string;
  category: string;
}

export interface BlockFormProps {
  config: Record<string, unknown>;
  content: Record<string, unknown>;
  onConfig: (next: Record<string, unknown>) => void;
  onContent: (next: Record<string, unknown>) => void;
  assets: AssetRef[];
}
