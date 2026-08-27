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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          code: string
          created_at: string
          id: string
          landing_path: string | null
          referrer: string | null
        }
        Insert: {
          affiliate_id: string
          code: string
          created_at?: string
          id?: string
          landing_path?: string | null
          referrer?: string | null
        }
        Update: {
          affiliate_id?: string
          code?: string
          created_at?: string
          id?: string
          landing_path?: string | null
          referrer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          base_amount: number
          commission_amount: number
          commission_rate: number
          created_at: string
          currency: string
          environment: string
          id: string
          paddle_subscription_id: string | null
          paid_at: string | null
          period_start: string | null
          product_id: string
          referral_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          affiliate_id: string
          base_amount?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          paddle_subscription_id?: string | null
          paid_at?: string | null
          period_start?: string | null
          product_id: string
          referral_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          affiliate_id?: string
          base_amount?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          paddle_subscription_id?: string | null
          paid_at?: string | null
          period_start?: string | null
          product_id?: string
          referral_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          code: string
          converted_at: string | null
          created_at: string
          id: string
          product_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_id: string
          code: string
          converted_at?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_id?: string
          code?: string
          converted_at?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          code: string
          commission_rate: number
          created_at: string
          display_name: string | null
          id: string
          payout_email: string | null
          payout_notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          commission_rate?: number
          created_at?: string
          display_name?: string | null
          id?: string
          payout_email?: string | null
          payout_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          commission_rate?: number
          created_at?: string
          display_name?: string | null
          id?: string
          payout_email?: string | null
          payout_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_page_views: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          id: string
          lang: string
          referrer: string | null
          session_id: string | null
          slug: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          lang?: string
          referrer?: string | null
          session_id?: string | null
          slug: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          lang?: string
          referrer?: string | null
          session_id?: string | null
          slug?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          cost_basis: number
          created_at: string
          expected_return: number
          id: string
          kind: string
          label: string
          linked_liability: number
          manual_value: number
          monthly_contribution: number
          monthly_income: number
          note: string | null
          position: number
          probability: number
          quantity: number
          target_year: number | null
          ticker: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_basis?: number
          created_at?: string
          expected_return?: number
          id?: string
          kind?: string
          label?: string
          linked_liability?: number
          manual_value?: number
          monthly_contribution?: number
          monthly_income?: number
          note?: string | null
          position?: number
          probability?: number
          quantity?: number
          target_year?: number | null
          ticker?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_basis?: number
          created_at?: string
          expected_return?: number
          id?: string
          kind?: string
          label?: string
          linked_liability?: number
          manual_value?: number
          monthly_contribution?: number
          monthly_income?: number
          note?: string | null
          position?: number
          probability?: number
          quantity?: number
          target_year?: number | null
          ticker?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      kid_future_funds: {
        Row: {
          created_at: string
          current_balance: number
          expected_return: number
          goal: string
          id: string
          initial_balance: number
          member_id: string
          monthly_contribution: number
          target_age: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_balance?: number
          expected_return?: number
          goal?: string
          id?: string
          initial_balance?: number
          member_id: string
          monthly_contribution?: number
          target_age?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          expected_return?: number
          goal?: string
          id?: string
          initial_balance?: number
          member_id?: string
          monthly_contribution?: number
          target_age?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_future_funds_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "kid_members"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_holdings: {
        Row: {
          created_at: string
          emoji: string
          growth: number
          id: string
          member_id: string
          name: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          emoji?: string
          growth?: number
          id?: string
          member_id: string
          name: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          emoji?: string
          growth?: number
          id?: string
          member_id?: string
          name?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kid_holdings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "kid_members"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_members: {
        Row: {
          age: number
          allowance_amount: number
          allowance_frequency: string
          avatar: string
          base_currency: string
          created_at: string
          currency: string
          id: string
          name: string
          onboarded: boolean
          role: string
          split_grow: number
          split_save: number
          split_spend: number
          streak: number
          subtitle: string | null
          theme: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          age?: number
          allowance_amount?: number
          allowance_frequency?: string
          avatar?: string
          base_currency?: string
          created_at?: string
          currency?: string
          id?: string
          name: string
          onboarded?: boolean
          role?: string
          split_grow?: number
          split_save?: number
          split_spend?: number
          streak?: number
          subtitle?: string | null
          theme?: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          age?: number
          allowance_amount?: number
          allowance_frequency?: string
          avatar?: string
          base_currency?: string
          created_at?: string
          currency?: string
          id?: string
          name?: string
          onboarded?: boolean
          role?: string
          split_grow?: number
          split_save?: number
          split_spend?: number
          streak?: number
          subtitle?: string | null
          theme?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      kid_movements: {
        Row: {
          amount: number
          created_at: string
          id: string
          label: string
          member_id: string
          occurred_at: string
          pocket: string
          source: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          label: string
          member_id: string
          occurred_at?: string
          pocket?: string
          source?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          label?: string
          member_id?: string
          occurred_at?: string
          pocket?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_movements_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "kid_members"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_profiles: {
        Row: {
          avatar: string
          birth_year: number | null
          created_at: string
          currency: string
          expected_return: number
          goal: string | null
          goal_amount: number
          id: string
          monthly_contribution: number
          name: string
          onboarding_completed: boolean
          parent_id: string
          starting_capital: number
          updated_at: string
        }
        Insert: {
          avatar?: string
          birth_year?: number | null
          created_at?: string
          currency?: string
          expected_return?: number
          goal?: string | null
          goal_amount?: number
          id?: string
          monthly_contribution?: number
          name: string
          onboarding_completed?: boolean
          parent_id: string
          starting_capital?: number
          updated_at?: string
        }
        Update: {
          avatar?: string
          birth_year?: number | null
          created_at?: string
          currency?: string
          expected_return?: number
          goal?: string | null
          goal_amount?: number
          id?: string
          monthly_contribution?: number
          name?: string
          onboarding_completed?: boolean
          parent_id?: string
          starting_capital?: number
          updated_at?: string
        }
        Relationships: []
      }
      kid_tasks: {
        Row: {
          approved_at: string | null
          completed_at: string | null
          created_at: string
          emoji: string
          frequency: string
          id: string
          member_id: string
          reward: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string
          emoji?: string
          frequency?: string
          id?: string
          member_id: string
          reward?: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string
          emoji?: string
          frequency?: string
          id?: string
          member_id?: string
          reward?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_tasks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "kid_members"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_wishes: {
        Row: {
          achieved: boolean
          created_at: string
          emoji: string
          id: string
          member_id: string
          price: number
          saved: number
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved?: boolean
          created_at?: string
          emoji?: string
          id?: string
          member_id: string
          price?: number
          saved?: number
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved?: boolean
          created_at?: string
          emoji?: string
          id?: string
          member_id?: string
          price?: number
          saved?: number
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_wishes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "kid_members"
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
      linkedin_connection: {
        Row: {
          access_token: string | null
          connected_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          oauth_state: string | null
          oauth_state_at: string | null
          org_name: string | null
          org_urn: string | null
          refresh_expires_at: string | null
          refresh_token: string | null
          scope: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          connected_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          oauth_state?: string | null
          oauth_state_at?: string | null
          org_name?: string | null
          org_urn?: string | null
          refresh_expires_at?: string | null
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          connected_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          oauth_state?: string | null
          oauth_state_at?: string | null
          org_name?: string | null
          org_urn?: string | null
          refresh_expires_at?: string | null
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      linkedin_posts: {
        Row: {
          commentary: string | null
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          lang: string
          post_url: string | null
          post_urn: string | null
          slug: string
          status: string
        }
        Insert: {
          commentary?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          lang?: string
          post_url?: string | null
          post_urn?: string | null
          slug: string
          status?: string
        }
        Update: {
          commentary?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          lang?: string
          post_url?: string | null
          post_urn?: string | null
          slug?: string
          status?: string
        }
        Relationships: []
      }
      net_worth_snapshots: {
        Row: {
          assets: number
          breakdown: Json
          created_at: string
          currency: string
          id: string
          liabilities: number
          net_worth: number
          taken_on: string
          user_id: string
        }
        Insert: {
          assets?: number
          breakdown?: Json
          created_at?: string
          currency?: string
          id?: string
          liabilities?: number
          net_worth?: number
          taken_on?: string
          user_id: string
        }
        Update: {
          assets?: number
          breakdown?: Json
          created_at?: string
          currency?: string
          id?: string
          liabilities?: number
          net_worth?: number
          taken_on?: string
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
          business_target: number
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
          down_payment_pct: number | null
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
          goal_note: string | null
          home_price: number | null
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
          mortgage_balance: number | null
          mortgage_rate: number | null
          mortgage_term: number | null
          plans_children: string | null
          priority: string | null
          retire_age: number | null
          retirement_monthly_contribution: number
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
          business_target?: number
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
          down_payment_pct?: number | null
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
          goal_note?: string | null
          home_price?: number | null
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
          mortgage_balance?: number | null
          mortgage_rate?: number | null
          mortgage_term?: number | null
          plans_children?: string | null
          priority?: string | null
          retire_age?: number | null
          retirement_monthly_contribution?: number
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
          business_target?: number
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
          down_payment_pct?: number | null
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
          goal_note?: string | null
          home_price?: number | null
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
          mortgage_balance?: number | null
          mortgage_rate?: number | null
          mortgage_term?: number | null
          plans_children?: string | null
          priority?: string | null
          retire_age?: number | null
          retirement_monthly_contribution?: number
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
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          duration_days: number
          expires_at: string | null
          id: string
          max_uses: number
          note: string | null
          product_id: string
          updated_at: string
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          duration_days?: number
          expires_at?: string | null
          id?: string
          max_uses?: number
          note?: string | null
          product_id?: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          duration_days?: number
          expires_at?: string | null
          id?: string
          max_uses?: number
          note?: string | null
          product_id?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          code: string
          created_at: string
          environment: string
          granted_until: string
          id: string
          promo_code_id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          environment?: string
          granted_until: string
          id?: string
          promo_code_id: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          environment?: string
          granted_until?: string
          id?: string
          promo_code_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
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
      redeem_promo_code: {
        Args: { _code: string; _environment: string; _user_id: string }
        Returns: Json
      }
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
