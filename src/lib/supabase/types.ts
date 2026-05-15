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
          /** v2: essential_info — 페이지 레벨 필수 정보 (resolve-essential.ts 참조) */
          essential_info: Record<string, unknown>;
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
          /** v2: 사용 중단 시점. NULL 아니면 신규 페이지 default_blocks 에서 제외. */
          deprecated_at: string | null;
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
          /** v2: 사장님 Step 0 "추가 가능" 목록 */
          recommended_optional_blocks: unknown;
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
      clients: {
        Row: {
          id: string;
          phone: string | null;
          kakao_id: string | null;
          email: string | null;
          business_name: string | null;
          business_type: string | null;
          signup_date: string;
          status: string;
          payment_status: string;
          invoice_number: string | null;
          invoiced_at: string | null;
          paid_at: string | null;
          payment_amount: number | null;
          created_at: string;
          updated_at: string;
          notes: string | null;
          password_hash: string | null;
          must_change_password: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Relationships: [];
      };
      work_tasks: {
        Row: {
          id: string;
          page_id: string;
          status: string;
          assignee_id: string | null;
          notes: string | null;
          ai_generated_at: string | null;
          reviewed_at: string | null;
          preview_sent_at: string | null;
          completed_at: string | null;
          /** v2: 사장님 "이대로 발행" 1탭 시점 */
          client_approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["work_tasks"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["work_tasks"]["Row"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          client_id: string;
          page_id: string | null;
          period_start: string;
          period_end: string;
          data_snapshot: Record<string, unknown>;
          ai_insight: string | null;
          pdf_url: string | null;
          status: string;
          sent_at: string | null;
          sent_via: string | null;
          sent_to: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reports"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["reports"]["Row"]>;
        Relationships: [];
      };
      qr_codes: {
        Row: {
          id: string;
          page_id: string;
          channel_name: string;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          target_url: string;
          image_url: string;
          svg_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["qr_codes"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["qr_codes"]["Row"]>;
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          page_id: string;
          block_id: string | null;
          category: string;
          url: string;
          meta: Record<string, unknown>;
          uploaded_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["assets"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["assets"]["Row"]>;
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
      change_requests: {
        Row: {
          id: string;
          page_id: string;
          request_type: string;
          description: string;
          status: string;
          quoted_cost: number | null;
          quoted_at: string | null;
          completed_at: string | null;
          notes: string | null;
          submitted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["change_requests"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["change_requests"]["Row"]>;
        Relationships: [];
      };
      rate_limits: {
        Row: {
          id: number;
          key: string;
          hit_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["rate_limits"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["rate_limits"]["Row"]>;
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          business_name: string;
          phone: string;
          message: string;
          status: string;
          created_at: string;
          handled_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["inquiries"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["inquiries"]["Row"]>;
        Relationships: [];
      };
      sms_verifications: {
        Row: {
          id: string;
          phone: string;
          code_hash: string;
          expires_at: string;
          attempts: number;
          consumed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sms_verifications"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["sms_verifications"]["Row"]>;
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
