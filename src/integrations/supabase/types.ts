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
          author_name: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
