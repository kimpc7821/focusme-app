/**
 * Supabase 자동생성 타입 placeholder.
 * 마이그레이션 실행 후 다음 명령으로 실제 타입 생성:
 *   npx supabase gen types typescript --project-id xxx > src/lib/supabase/types.ts
 *
 * 그 전까지는 narrow Database 타입으로 동작 (any 회피용).
 */
export type Database = {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string;
          client_id: string;
          slug: string;
          template_type: string;
          status: string;
          brand_color: string | null;
          tone_key: string | null;
          published_at: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pages"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["pages"]["Row"]>;
        Relationships: [];
      };
      blocks: {
        Row: {
          id: string;
          page_id: string;
          block_type: string;
          sort_order: number;
          is_enabled: boolean;
          is_system: boolean;
          config: Record<string, unknown>;
          content: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["blocks"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["blocks"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
