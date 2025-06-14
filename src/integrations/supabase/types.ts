export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_key_health: {
        Row: {
          consecutive_failures: number | null
          created_at: string
          id: string
          key_name: string
          last_failure: string | null
          last_success: string | null
          rate_limited_until: string | null
          success_rate: number | null
          total_requests_today: number | null
          updated_at: string
        }
        Insert: {
          consecutive_failures?: number | null
          created_at?: string
          id?: string
          key_name: string
          last_failure?: string | null
          last_success?: string | null
          rate_limited_until?: string | null
          success_rate?: number | null
          total_requests_today?: number | null
          updated_at?: string
        }
        Update: {
          consecutive_failures?: number | null
          created_at?: string
          id?: string
          key_name?: string
          last_failure?: string | null
          last_success?: string | null
          rate_limited_until?: string | null
          success_rate?: number | null
          total_requests_today?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cached_job_searches: {
        Row: {
          api_key_used: string | null
          cached_at: string
          expires_at: string
          id: string
          request_duration_ms: number | null
          result_count: number | null
          results: Json
          search_params: Json
          search_params_hash: string
          search_source: string | null
        }
        Insert: {
          api_key_used?: string | null
          cached_at?: string
          expires_at?: string
          id?: string
          request_duration_ms?: number | null
          result_count?: number | null
          results: Json
          search_params: Json
          search_params_hash: string
          search_source?: string | null
        }
        Update: {
          api_key_used?: string | null
          cached_at?: string
          expires_at?: string
          id?: string
          request_duration_ms?: number | null
          result_count?: number | null
          results?: Json
          search_params?: Json
          search_params_hash?: string
          search_source?: string | null
        }
        Relationships: []
      }
      job_match_scores: {
        Row: {
          breakdown: Json | null
          calculated_at: string
          education_score: number | null
          experience_score: number | null
          id: string
          job_id: string
          overall_score: number
          requirements_score: number | null
          resume_id: string
          skills_score: number | null
          user_id: string
        }
        Insert: {
          breakdown?: Json | null
          calculated_at?: string
          education_score?: number | null
          experience_score?: number | null
          id?: string
          job_id: string
          overall_score: number
          requirements_score?: number | null
          resume_id: string
          skills_score?: number | null
          user_id: string
        }
        Update: {
          breakdown?: Json | null
          calculated_at?: string
          education_score?: number | null
          experience_score?: number | null
          id?: string
          job_id?: string
          overall_score?: number
          requirements_score?: number | null
          resume_id?: string
          skills_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_match_scores_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "user_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      last_successful_search: {
        Row: {
          cached_at: string
          id: string
          result_count: number
          search_params: Json
          search_results: Json
        }
        Insert: {
          cached_at?: string
          id?: string
          result_count?: number
          search_params: Json
          search_results: Json
        }
        Update: {
          cached_at?: string
          id?: string
          result_count?: number
          search_params?: Json
          search_results?: Json
        }
        Relationships: []
      }
      pending_reviews: {
        Row: {
          apply_link: string | null
          company: string
          description: string | null
          found_at: string
          id: string
          is_reviewed: boolean | null
          job_id: string
          job_title: string
          job_type: string | null
          location: string | null
          posted_date: string | null
          salary: string | null
          search_config_id: string | null
          source: string
          source_type: string
          user_id: string
        }
        Insert: {
          apply_link?: string | null
          company: string
          description?: string | null
          found_at?: string
          id?: string
          is_reviewed?: boolean | null
          job_id: string
          job_title: string
          job_type?: string | null
          location?: string | null
          posted_date?: string | null
          salary?: string | null
          search_config_id?: string | null
          source: string
          source_type: string
          user_id: string
        }
        Update: {
          apply_link?: string | null
          company?: string
          description?: string | null
          found_at?: string
          id?: string
          is_reviewed?: boolean | null
          job_id?: string
          job_title?: string
          job_type?: string | null
          location?: string | null
          posted_date?: string | null
          salary?: string | null
          search_config_id?: string | null
          source?: string
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_reviews_search_config_id_fkey"
            columns: ["search_config_id"]
            isOneToOne: false
            referencedRelation: "search_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          application_status: string | null
          apply_link: string | null
          company: string
          created_at: string
          description: string | null
          fit_rating: number | null
          id: string
          job_id: string
          job_title: string
          job_type: string | null
          location: string | null
          personal_notes: string | null
          posted_date: string | null
          salary: string | null
          source: string | null
          source_type: string | null
          user_id: string
        }
        Insert: {
          application_status?: string | null
          apply_link?: string | null
          company: string
          created_at?: string
          description?: string | null
          fit_rating?: number | null
          id?: string
          job_id: string
          job_title: string
          job_type?: string | null
          location?: string | null
          personal_notes?: string | null
          posted_date?: string | null
          salary?: string | null
          source?: string | null
          source_type?: string | null
          user_id: string
        }
        Update: {
          application_status?: string | null
          apply_link?: string | null
          company?: string
          created_at?: string
          description?: string | null
          fit_rating?: number | null
          id?: string
          job_id?: string
          job_title?: string
          job_type?: string | null
          location?: string | null
          personal_notes?: string | null
          posted_date?: string | null
          salary?: string | null
          source?: string | null
          source_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      search_configs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          keywords: string | null
          last_run_at: string | null
          location: string | null
          name: string
          next_run_at: string | null
          query: string
          remote_only: boolean | null
          schedule_frequency: string | null
          search_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          keywords?: string | null
          last_run_at?: string | null
          location?: string | null
          name: string
          next_run_at?: string | null
          query: string
          remote_only?: boolean | null
          schedule_frequency?: string | null
          search_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          keywords?: string | null
          last_run_at?: string | null
          location?: string | null
          name?: string
          next_run_at?: string | null
          query?: string
          remote_only?: boolean | null
          schedule_frequency?: string | null
          search_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_email_preferences: {
        Row: {
          created_at: string
          daily_digest: boolean | null
          high_priority_alerts: boolean | null
          id: string
          immediate_alerts: boolean | null
          updated_at: string
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          created_at?: string
          daily_digest?: boolean | null
          high_priority_alerts?: boolean | null
          id?: string
          immediate_alerts?: boolean | null
          updated_at?: string
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          created_at?: string
          daily_digest?: boolean | null
          high_priority_alerts?: boolean | null
          id?: string
          immediate_alerts?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      user_resumes: {
        Row: {
          content_type: string | null
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_active: boolean | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          content_type?: string | null
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          content_type?: string | null
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      xray_search_configs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          next_run_at: string | null
          query: string
          schedule_frequency: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          query: string
          schedule_frequency?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          query?: string
          schedule_frequency?: string
          user_id?: string
        }
        Relationships: []
      }
      xray_search_results: {
        Row: {
          apply_link: string | null
          company: string
          config_id: string
          description: string | null
          found_at: string
          id: string
          job_id: string
          job_title: string
          job_type: string | null
          location: string | null
          posted_date: string | null
          salary: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          apply_link?: string | null
          company: string
          config_id: string
          description?: string | null
          found_at?: string
          id?: string
          job_id: string
          job_title: string
          job_type?: string | null
          location?: string | null
          posted_date?: string | null
          salary?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          apply_link?: string | null
          company?: string
          config_id?: string
          description?: string | null
          found_at?: string
          id?: string
          job_id?: string
          job_title?: string
          job_type?: string | null
          location?: string | null
          posted_date?: string | null
          salary?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xray_search_results_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "xray_search_configs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_last_successful_search: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
