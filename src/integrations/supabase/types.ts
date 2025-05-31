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
      saved_jobs: {
        Row: {
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
          posted_date: string | null
          salary: string | null
          source: string | null
          user_id: string
        }
        Insert: {
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
          posted_date?: string | null
          salary?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
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
          posted_date?: string | null
          salary?: string | null
          source?: string | null
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
