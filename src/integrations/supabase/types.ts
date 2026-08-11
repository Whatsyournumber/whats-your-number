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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      imported_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          currency: string
          description: string | null
          excluded: boolean
          id: string
          merchant: string
          statement_id: string
          subcategory: string | null
          tx_date: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          excluded?: boolean
          id?: string
          merchant?: string
          statement_id: string
          subcategory?: string | null
          tx_date?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          excluded?: boolean
          id?: string
          merchant?: string
          statement_id?: string
          subcategory?: string | null
          tx_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imported_transactions_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "statements"
            referencedColumns: ["id"]
          },
        ]
      }
      life_goals: {
        Row: {
          cost: number
          created_at: string
          emoji: string
          id: string
          kind: string
          monthly: number
          name: string
          note: string | null
          position: number
          saved: number
          target_year: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          emoji?: string
          id?: string
          kind?: string
          monthly?: number
          name: string
          note?: string | null
          position?: number
          saved?: number
          target_year?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          emoji?: string
          id?: string
          kind?: string
          monthly?: number
          name?: string
          note?: string | null
          position?: number
          saved?: number
          target_year?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_profiles: {
        Row: {
          age: number | null
          assets_bank: number | null
          assets_cash: number | null
          assets_crypto: number | null
          assets_etf: number | null
          assets_property: number | null
          assets_retirement: number | null
          assets_stocks: number | null
          children: string | null
          city: string | null
          completed: boolean
          completed_at: string | null
          country: string | null
          country_code: string | null
          created_at: string
          currency: string | null
          current_step: number
          desired_retirement_income: number | null
          expected_return: number | null
          fixed_education: number
          fixed_housing: number
          fixed_insurance: number
          fixed_other: number
          fixed_savings: number
          fixed_subscriptions: number
          fixed_transport: number
          fixed_utilities: number
          full_name: string | null
          goal: string | null
          housing: string | null
          id: string
          income_bonus: number | null
          income_other: number | null
          income_rent: number | null
          income_salary: number | null
          liabilities: number | null
          lifestyle: string | null
          marital_status: string | null
          monthly_expenses: number | null
          monthly_savings: number | null
          plans_children: string | null
          priority: string | null
          retire_age: number | null
          risk_profile: string | null
          timezone: string | null
          travel_frequency: string | null
          updated_at: string
          user_id: string
          withdrawal_rate: number
        }
        Insert: {
          age?: number | null
          assets_bank?: number | null
          assets_cash?: number | null
          assets_crypto?: number | null
          assets_etf?: number | null
          assets_property?: number | null
          assets_retirement?: number | null
          assets_stocks?: number | null
          children?: string | null
          city?: string | null
          completed?: boolean
          completed_at?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string | null
          current_step?: number
          desired_retirement_income?: number | null
          expected_return?: number | null
          fixed_education?: number
          fixed_housing?: number
          fixed_insurance?: number
          fixed_other?: number
          fixed_savings?: number
          fixed_subscriptions?: number
          fixed_transport?: number
          fixed_utilities?: number
          full_name?: string | null
          goal?: string | null
          housing?: string | null
          id?: string
          income_bonus?: number | null
          income_other?: number | null
          income_rent?: number | null
          income_salary?: number | null
          liabilities?: number | null
          lifestyle?: string | null
          marital_status?: string | null
          monthly_expenses?: number | null
          monthly_savings?: number | null
          plans_children?: string | null
          priority?: string | null
          retire_age?: number | null
          risk_profile?: string | null
          timezone?: string | null
          travel_frequency?: string | null
          updated_at?: string
          user_id: string
          withdrawal_rate?: number
        }
        Update: {
          age?: number | null
          assets_bank?: number | null
          assets_cash?: number | null
          assets_crypto?: number | null
          assets_etf?: number | null
          assets_property?: number | null
          assets_retirement?: number | null
          assets_stocks?: number | null
          children?: string | null
          city?: string | null
          completed?: boolean
          completed_at?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string | null
          current_step?: number
          desired_retirement_income?: number | null
          expected_return?: number | null
          fixed_education?: number
          fixed_housing?: number
          fixed_insurance?: number
          fixed_other?: number
          fixed_savings?: number
          fixed_subscriptions?: number
          fixed_transport?: number
          fixed_utilities?: number
          full_name?: string | null
          goal?: string | null
          housing?: string | null
          id?: string
          income_bonus?: number | null
          income_other?: number | null
          income_rent?: number | null
          income_salary?: number | null
          liabilities?: number | null
          lifestyle?: string | null
          marital_status?: string | null
          monthly_expenses?: number | null
          monthly_savings?: number | null
          plans_children?: string | null
          priority?: string | null
          retire_age?: number | null
          risk_profile?: string | null
          timezone?: string | null
          travel_frequency?: string | null
          updated_at?: string
          user_id?: string
          withdrawal_rate?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      statements: {
        Row: {
          created_at: string
          error_message: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          status: string
          storage_path: string
          summary: string | null
          transactions_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_name: string
          file_size?: number
          file_type: string
          id?: string
          status?: string
          storage_path: string
          summary?: string | null
          transactions_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          status?: string
          storage_path?: string
          summary?: string | null
          transactions_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          access_product_id: string | null
          access_until: string | null
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_product_id?: string | null
          access_until?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_product_id?: string | null
          access_until?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
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
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
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
      app_role: ["super_admin", "admin", "user"],
    },
  },
} as const
