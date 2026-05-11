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
      lookup_block_types: {
        Row: {
          key: string;
          name: string;
          category: string;
          is_system: boolean;
          required_assets: unknown;
          layout_options: unknown;
          default_config: unknown;
          default_content: unknown;
          display_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["lookup_block_types"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["lookup_block_types"]["Row"]>;
        Relationships: [];
      };
      lookup_templates: {
        Row: {
          key: string;
          name: string;
          description: string | null;
          default_blocks: unknown;
          recommended_tone: string | null;
          display_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["lookup_templates"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["lookup_templates"]["Row"]>;
        Relationships: [];
      };
      lookup_tone_presets: {
        Row: {
          key: string;
          name: string;
          description: string | null;
          preview: unknown;
          display_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["lookup_tone_presets"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["lookup_tone_presets"]["Row"]>;
        Relationships: [];
      };
      admins: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: string;
          password_hash: string;
          active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admins"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["admins"]["Row"]>;
        Relationships: [];
      };
      refresh_tokens: {
        Row: {
          jti: string;
          actor_type: string;
          actor_id: string;
          expires_at: string;
          revoked: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["refresh_tokens"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["refresh_tokens"]["Row"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          page_id: string;
          block_id: string | null;
          event_type: string;
          target: string | null;
          session_id: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          referrer: string | null;
          device: string | null;
          user_agent: string | null;
          country: string | null;
          ip_hash: string | null;
          ts: string;
        };
        Insert: Partial<Database["public"]["Tables"]["events"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
