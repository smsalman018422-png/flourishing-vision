export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_avatar_url: string | null
          author_name: string | null
          author_role: string | null
          category: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean
          published: boolean
          published_at: string | null
          read_time_minutes: number | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_name?: string | null
          author_role?: string | null
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          published?: boolean
          published_at?: string | null
          read_time_minutes?: number | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string | null
          author_role?: string | null
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          published?: boolean
          published_at?: string | null
          read_time_minutes?: number | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_memberships: {
        Row: {
          client_id: string
          created_at: string
          end_date: string
          id: string
          plan_id: string
          start_date: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date: string
          id?: string
          plan_id: string
          start_date?: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string
          id?: string
          plan_id?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notifications: {
        Row: {
          body: string | null
          client_id: string
          created_at: string
          id: string
          is_read: boolean
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          client_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          type?: string
        }
        Update: {
          body?: string | null
          client_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      client_profiles: {
        Row: {
          account_manager_name: string | null
          account_manager_whatsapp: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          account_manager_name?: string | null
          account_manager_whatsapp?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          account_manager_name?: string | null
          account_manager_whatsapp?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      client_projects: {
        Row: {
          assigned_team_ids: string[]
          client_id: string
          created_at: string
          deliverables: Json
          description: string | null
          end_date: string | null
          id: string
          name: string
          notes: string | null
          progress: number
          service_type: string | null
          start_date: string | null
          status: string
        }
        Insert: {
          assigned_team_ids?: string[]
          client_id: string
          created_at?: string
          deliverables?: Json
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          progress?: number
          service_type?: string | null
          start_date?: string | null
          status?: string
        }
        Update: {
          assigned_team_ids?: string[]
          client_id?: string
          created_at?: string
          deliverables?: Json
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          progress?: number
          service_type?: string | null
          start_date?: string | null
          status?: string
        }
        Relationships: []
      }
      client_reports: {
        Row: {
          ai_summary: string | null
          client_id: string
          created_at: string
          file_path: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_published: boolean
          is_read: boolean
          metrics: Json
          period_end: string | null
          period_start: string | null
          project_id: string | null
          report_type: string
          report_url: string | null
          summary: string | null
          title: string
          week_end: string | null
          week_start: string | null
        }
        Insert: {
          ai_summary?: string | null
          client_id: string
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          is_read?: boolean
          metrics?: Json
          period_end?: string | null
          period_start?: string | null
          project_id?: string | null
          report_type?: string
          report_url?: string | null
          summary?: string | null
          title: string
          week_end?: string | null
          week_start?: string | null
        }
        Update: {
          ai_summary?: string | null
          client_id?: string
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          is_read?: boolean
          metrics?: Json
          period_end?: string | null
          period_start?: string | null
          project_id?: string | null
          report_type?: string
          report_url?: string | null
          summary?: string | null
          title?: string
          week_end?: string | null
          week_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tickets: {
        Row: {
          client_id: string
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          budget: string | null
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          service: string | null
          status: Database["public"]["Enums"]["contact_status"]
        }
        Insert: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          service?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
        }
        Update: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          service?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          created_at: string
          currency: string
          features: Json
          id: string
          is_visible: boolean
          name: string
          price_monthly: number
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          is_visible?: boolean
          name: string
          price_monthly?: number
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          is_visible?: boolean
          name?: string
          price_monthly?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      portfolio: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          category: string
          challenge: string | null
          client_name: string
          cover_image_url: string | null
          created_at: string
          gallery_images: string[]
          growth_pct: number | null
          id: string
          is_featured: boolean
          is_visible: boolean
          project_title: string
          results: string | null
          revenue_label: string | null
          roi_pct: number | null
          service_type: string | null
          slug: string | null
          solution: string | null
          sort_order: number
          testimonial_author: string | null
          testimonial_quote: string | null
          testimonial_role: string | null
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          category: string
          challenge?: string | null
          client_name: string
          cover_image_url?: string | null
          created_at?: string
          gallery_images?: string[]
          growth_pct?: number | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          project_title: string
          results?: string | null
          revenue_label?: string | null
          roi_pct?: number | null
          service_type?: string | null
          slug?: string | null
          solution?: string | null
          sort_order?: number
          testimonial_author?: string | null
          testimonial_quote?: string | null
          testimonial_role?: string | null
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          category?: string
          challenge?: string | null
          client_name?: string
          cover_image_url?: string | null
          created_at?: string
          gallery_images?: string[]
          growth_pct?: number | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          project_title?: string
          results?: string | null
          revenue_label?: string | null
          roi_pct?: number | null
          service_type?: string | null
          slug?: string | null
          solution?: string | null
          sort_order?: number
          testimonial_author?: string | null
          testimonial_quote?: string | null
          testimonial_role?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          features: string[]
          icon_name: string
          id: string
          is_visible: boolean
          long_description: string | null
          order_index: number
          packages: Json
          process: Json
          service_type: string | null
          short_description: string
          slug: string
          starts_at_price: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: string[]
          icon_name?: string
          id?: string
          is_visible?: boolean
          long_description?: string | null
          order_index?: number
          packages?: Json
          process?: Json
          service_type?: string | null
          short_description: string
          slug: string
          starts_at_price?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: string[]
          icon_name?: string
          id?: string
          is_visible?: boolean
          long_description?: string | null
          order_index?: number
          packages?: Json
          process?: Json
          service_type?: string | null
          short_description?: string
          slug?: string
          starts_at_price?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          category: string
          created_at: string
          id: string
          is_founder: boolean
          is_visible: boolean
          linkedin_url: string | null
          name: string
          photo_url: string | null
          role: string
          skills: string[] | null
          sort_order: number
        }
        Insert: {
          bio?: string | null
          category: string
          created_at?: string
          id?: string
          is_founder?: boolean
          is_visible?: boolean
          linkedin_url?: string | null
          name: string
          photo_url?: string | null
          role: string
          skills?: string[] | null
          sort_order?: number
        }
        Update: {
          bio?: string | null
          category?: string
          created_at?: string
          id?: string
          is_founder?: boolean
          is_visible?: boolean
          linkedin_url?: string | null
          name?: string
          photo_url?: string | null
          role?: string
          skills?: string[] | null
          sort_order?: number
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string
          company: string
          created_at: string
          id: string
          photo_url: string | null
          quote: string
          rating: number
          sort_order: number
          video_thumbnail_url: string | null
          video_url: string | null
        }
        Insert: {
          author_name: string
          author_role: string
          company: string
          created_at?: string
          id?: string
          photo_url?: string | null
          quote: string
          rating?: number
          sort_order?: number
          video_thumbnail_url?: string | null
          video_url?: string | null
        }
        Update: {
          author_name?: string
          author_role?: string
          company?: string
          created_at?: string
          id?: string
          photo_url?: string | null
          quote?: string
          rating?: number
          sort_order?: number
          video_thumbnail_url?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "client"
      contact_status: "new" | "contacted" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "client"],
      contact_status: ["new", "contacted", "closed"],
    },
  },
} as const
