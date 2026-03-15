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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alteration_tickets: {
        Row: {
          created_at: string
          customer_id: string
          description: string
          id: string
          images: string[] | null
          issue_type: string
          order_id: string
          resolution: string | null
          status: string
          tailor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description: string
          id?: string
          images?: string[] | null
          issue_type: string
          order_id: string
          resolution?: string | null
          status?: string
          tailor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          images?: string[] | null
          issue_type?: string
          order_id?: string
          resolution?: string | null
          status?: string
          tailor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alteration_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alteration_tickets_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailors"
            referencedColumns: ["id"]
          },
        ]
      }
      body_scan_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          gender: string
          height_cm: number
          id: string
          images: Json
          result: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          gender: string
          height_cm: number
          id?: string
          images: Json
          result?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          gender?: string
          height_cm?: number
          id?: string
          images?: Json
          result?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          customizations: Json | null
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customizations?: Json | null
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customizations?: Json | null
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_archives: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_loyalty: {
        Row: {
          available_points: number
          created_at: string
          current_tier_id: string | null
          id: string
          lifetime_points: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_points?: number
          created_at?: string
          current_tier_id?: string | null
          id?: string
          lifetime_points?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_points?: number
          created_at?: string
          current_tier_id?: string | null
          id?: string
          lifetime_points?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_loyalty_current_tier_id_fkey"
            columns: ["current_tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_measurements: {
        Row: {
          additional_measurements: Json | null
          chest: number | null
          created_at: string
          height: number | null
          hips: number | null
          id: string
          inseam: number | null
          measurement_name: string | null
          neck: number | null
          shoulder_width: number | null
          sleeve_length: number | null
          unit: string | null
          updated_at: string
          user_id: string
          waist: number | null
        }
        Insert: {
          additional_measurements?: Json | null
          chest?: number | null
          created_at?: string
          height?: number | null
          hips?: number | null
          id?: string
          inseam?: number | null
          measurement_name?: string | null
          neck?: number | null
          shoulder_width?: number | null
          sleeve_length?: number | null
          unit?: string | null
          updated_at?: string
          user_id: string
          waist?: number | null
        }
        Update: {
          additional_measurements?: Json | null
          chest?: number | null
          created_at?: string
          height?: number | null
          hips?: number | null
          id?: string
          inseam?: number | null
          measurement_name?: string | null
          neck?: number | null
          shoulder_width?: number | null
          sleeve_length?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
          waist?: number | null
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          min_tier_id: string | null
          name: string
          points_cost: number
          reward_type: string
          reward_value: number
          stock: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_tier_id?: string | null
          name: string
          points_cost: number
          reward_type: string
          reward_value: number
          stock?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_tier_id?: string | null
          name?: string
          points_cost?: number
          reward_type?: string
          reward_value?: number
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_min_tier_id_fkey"
            columns: ["min_tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          benefits: string[] | null
          created_at: string
          id: string
          min_points: number
          multiplier: number
          name: string
        }
        Insert: {
          benefits?: string[] | null
          created_at?: string
          id?: string
          min_points?: number
          multiplier?: number
          name: string
        }
        Update: {
          benefits?: string[] | null
          created_at?: string
          id?: string
          min_points?: number
          multiplier?: number
          name?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          alteration_ticket_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          sender_type: string
        }
        Insert: {
          alteration_ticket_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          sender_type: string
        }
        Update: {
          alteration_ticket_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_alteration_ticket_id_fkey"
            columns: ["alteration_ticket_id"]
            isOneToOne: false
            referencedRelation: "alteration_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_timeline: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_timeline_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string | null
          customer_id: string | null
          customizations: Json | null
          estimated_delivery: string | null
          id: string
          measurement_id: string | null
          notes: string | null
          order_number: string
          product_id: string | null
          shipping_address: Json | null
          status: string | null
          tailor_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          customizations?: Json | null
          estimated_delivery?: string | null
          id?: string
          measurement_id?: string | null
          notes?: string | null
          order_number: string
          product_id?: string | null
          shipping_address?: Json | null
          status?: string | null
          tailor_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          customizations?: Json | null
          estimated_delivery?: string | null
          id?: string
          measurement_id?: string | null
          notes?: string | null
          order_number?: string
          product_id?: string | null
          shipping_address?: Json | null
          status?: string | null
          tailor_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "customer_measurements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailors"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      product_comparisons: {
        Row: {
          created_at: string
          id: string
          product_ids: string[]
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_ids?: string[]
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_ids?: string[]
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_price_history: {
        Row: {
          changed_at: string
          id: string
          new_price: number
          old_price: number
          product_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_price: number
          old_price: number
          product_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_price?: number
          old_price?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          order_id: string
          product_id: string
          rating: number
          review_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          product_id: string
          rating: number
          review_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          product_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          category: string
          colors: string[] | null
          created_at: string
          currency: string | null
          description: string | null
          fabrics: string[] | null
          id: string
          images: string[] | null
          is_active: boolean | null
          name: string
          sizes: string[] | null
          tailor_id: string | null
          updated_at: string
        }
        Insert: {
          base_price: number
          category: string
          colors?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          fabrics?: string[] | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name: string
          sizes?: string[] | null
          tailor_id?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string
          colors?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          fabrics?: string[] | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name?: string
          sizes?: string[] | null
          tailor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailors"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          customer_id: string
          id: string
          order_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string
          refund_type: string
          status: string
          tailor_id: string
          tailor_notes: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          refund_type?: string
          status?: string
          tailor_id: string
          tailor_notes?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          refund_type?: string
          status?: string
          tailor_id?: string
          tailor_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailors"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          points_spent: number
          reward_id: string
          status: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          points_spent: number
          reward_id: string
          status?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          points_spent?: number
          reward_id?: string
          status?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_messages: {
        Row: {
          attachment_mime_type: string | null
          attachment_name: string | null
          attachment_path: string | null
          attachment_size: number | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          product_id: string | null
          receiver_id: string
          sender_id: string
          tailor_id: string
        }
        Insert: {
          attachment_mime_type?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          product_id?: string | null
          receiver_id: string
          sender_id: string
          tailor_id: string
        }
        Update: {
          attachment_mime_type?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          product_id?: string | null
          receiver_id?: string
          sender_id?: string
          tailor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_messages_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailors"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_wishlists: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          product_ids: string[]
          share_code: string
          title: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          product_ids: string[]
          share_code: string
          title?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          product_ids?: string[]
          share_code?: string
          title?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      shop_follows: {
        Row: {
          created_at: string
          id: string
          tailor_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tailor_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tailor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_follows_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailors"
            referencedColumns: ["id"]
          },
        ]
      }
      tailor_reviews: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          order_id: string
          rating: number
          review_text: string | null
          tailor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          rating: number
          review_text?: string | null
          tailor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          rating?: number
          review_text?: string | null
          tailor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tailor_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tailor_reviews_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailors"
            referencedColumns: ["id"]
          },
        ]
      }
      tailors: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          location: string | null
          logo_url: string | null
          rating: number | null
          social_links: Json | null
          specialties: string[] | null
          store_name: string
          store_slug: string
          total_reviews: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          rating?: number | null
          social_links?: Json | null
          specialties?: string[] | null
          store_name: string
          store_slug: string
          total_reviews?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          rating?: number | null
          social_links?: Json | null
          specialties?: string[] | null
          store_name?: string
          store_slug?: string
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          admin_level: number | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          admin_level?: number | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          admin_level?: number | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlist_notifications: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          id: string
          notify_on_restock: boolean | null
          notify_on_sale: boolean | null
          product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          notify_on_restock?: boolean | null
          notify_on_sale?: boolean | null
          product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          notify_on_restock?: boolean | null
          notify_on_sale?: boolean | null
          product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_first_admin: { Args: never; Returns: undefined }
      get_admin_level: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "tailor" | "customer"
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
      app_role: ["admin", "tailor", "customer"],
    },
  },
} as const
