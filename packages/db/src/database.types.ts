
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_role": string | null,"id": number,"new_data": Json | null,"occurred_at": string,"old_data": Json | null,"row_id": string | null,"table_name": string,"vendor_id": string | null,"via_view_as": boolean,"wedding_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_role"?: string | null,"id"?: never,"new_data"?: Json | null,"occurred_at"?: string,"old_data"?: Json | null,"row_id"?: string | null,"table_name": string,"vendor_id"?: string | null,"via_view_as"?: boolean,"wedding_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_role"?: string | null,"id"?: never,"new_data"?: Json | null,"occurred_at"?: string,"old_data"?: Json | null,"row_id"?: string | null,"table_name"?: string,"vendor_id"?: string | null,"via_view_as"?: boolean,"wedding_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"budget_categories": {
                  Row: {
                    "created_at": string,"id": string,"key": string | null,"name": string,"planned_bps": number | null,"planned_minor": number | null,"sort_order": number,"updated_at": string,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"key"?: string | null,"name": string,"planned_bps"?: number | null,"planned_minor"?: number | null,"sort_order"?: number,"updated_at"?: string,"wedding_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"key"?: string | null,"name"?: string,"planned_bps"?: number | null,"planned_minor"?: number | null,"sort_order"?: number,"updated_at"?: string,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "budget_categories_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"budget_items": {
                  Row: {
                    "actual_minor": number | null,"category_id": string,"child_unit_minor": number | null,"contributor_id": string | null,"created_at": string,"created_by": string | null,"currency": string,"estimated_minor": number,"event_id": string | null,"id": string,"is_per_guest": boolean,"name": string,"notes": string | null,"sort_order": number,"unit_minor": number | null,"updated_at": string,"wedding_id": string,"wedding_vendor_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "actual_minor"?: number | null,"category_id": string,"child_unit_minor"?: number | null,"contributor_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency": string,"estimated_minor"?: number,"event_id"?: string | null,"id"?: string,"is_per_guest"?: boolean,"name": string,"notes"?: string | null,"sort_order"?: number,"unit_minor"?: number | null,"updated_at"?: string,"wedding_id": string,"wedding_vendor_id"?: string | null
                  }
                  Update: {
                    "actual_minor"?: number | null,"category_id"?: string,"child_unit_minor"?: number | null,"contributor_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"estimated_minor"?: number,"event_id"?: string | null,"id"?: string,"is_per_guest"?: boolean,"name"?: string,"notes"?: string | null,"sort_order"?: number,"unit_minor"?: number | null,"updated_at"?: string,"wedding_id"?: string,"wedding_vendor_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "budget_items_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "budget_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "budget_items_contributor_id_fkey"
      columns: ["contributor_id"]
isOneToOne: false
      referencedRelation: "contributors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "budget_items_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "budget_items_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "budget_items_wedding_vendor_fk"
      columns: ["wedding_vendor_id"]
isOneToOne: false
      referencedRelation: "wedding_vendors"
      referencedColumns: ["id"]
    }
                  ]
                },"consents": {
                  Row: {
                    "created_at": string,"granted": boolean,"id": string,"kind": string,"source": string | null,"subject_ref": string | null,"user_id": string | null,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"granted": boolean,"id"?: string,"kind": string,"source"?: string | null,"subject_ref"?: string | null,"user_id"?: string | null,"version": string
                  }
                  Update: {
                    "created_at"?: string,"granted"?: boolean,"id"?: string,"kind"?: string,"source"?: string | null,"subject_ref"?: string | null,"user_id"?: string | null,"version"?: string
                  }
                  Relationships: [
                    
                  ]
                },"contributors": {
                  Row: {
                    "created_at": string,"currency": string,"id": string,"name": string,"notes": string | null,"pledged_minor": number | null,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"currency": string,"id"?: string,"name": string,"notes"?: string | null,"pledged_minor"?: number | null,"wedding_id": string
                  }
                  Update: {
                    "created_at"?: string,"currency"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"pledged_minor"?: number | null,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "contributors_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"entitlement_overrides": {
                  Row: {
                    "created_at": string,"created_by": string | null,"expires_at": string | null,"id": string,"key": string,"value": NonNullable<Json>,"vendor_id": string | null,"wedding_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"expires_at"?: string | null,"id"?: string,"key": string,"value": NonNullable<Json>,"vendor_id"?: string | null,"wedding_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"expires_at"?: string | null,"id"?: string,"key"?: string,"value"?: NonNullable<Json>,"vendor_id"?: string | null,"wedding_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "entitlement_overrides_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "entitlement_overrides_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "created_at": string,"created_by": string | null,"dress_code": string | null,"ends_at": string | null,"id": string,"is_private": boolean,"kind": string,"name": string,"place_id": string | null,"rsvp_deadline": string | null,"sort_order": number,"starts_at": string | null,"timezone": string,"updated_at": string,"venue_label": string | null,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"dress_code"?: string | null,"ends_at"?: string | null,"id"?: string,"is_private"?: boolean,"kind": string,"name": string,"place_id"?: string | null,"rsvp_deadline"?: string | null,"sort_order"?: number,"starts_at"?: string | null,"timezone": string,"updated_at"?: string,"venue_label"?: string | null,"wedding_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"dress_code"?: string | null,"ends_at"?: string | null,"id"?: string,"is_private"?: boolean,"kind"?: string,"name"?: string,"place_id"?: string | null,"rsvp_deadline"?: string | null,"sort_order"?: number,"starts_at"?: string | null,"timezone"?: string,"updated_at"?: string,"venue_label"?: string | null,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"expense_payments": {
                  Row: {
                    "amount_minor": number,"budget_item_id": string,"contributor_id": string | null,"created_at": string,"created_by": string | null,"currency": string,"deleted_at": string | null,"id": string,"notes": string | null,"paid_on": string,"receipt_path": string | null,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_minor": number,"budget_item_id": string,"contributor_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency": string,"deleted_at"?: string | null,"id"?: string,"notes"?: string | null,"paid_on"?: string,"receipt_path"?: string | null,"wedding_id": string
                  }
                  Update: {
                    "amount_minor"?: number,"budget_item_id"?: string,"contributor_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"deleted_at"?: string | null,"id"?: string,"notes"?: string | null,"paid_on"?: string,"receipt_path"?: string | null,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "expense_payments_budget_item_id_fkey"
      columns: ["budget_item_id"]
isOneToOne: false
      referencedRelation: "budget_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "expense_payments_contributor_id_fkey"
      columns: ["contributor_id"]
isOneToOne: false
      referencedRelation: "contributors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "expense_payments_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"feature_flags": {
                  Row: {
                    "description": string | null,"enabled": boolean,"key": string,"rules": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"enabled"?: boolean,"key": string,"rules"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "description"?: string | null,"enabled"?: boolean,"key"?: string,"rules"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"guests": {
                  Row: {
                    "accessibility": string | null,"age_group": string,"allergies": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"dietary": (string)[],"email": string | null,"first_name": string,"household_id": string,"id": string,"is_unnamed_plus_one": boolean,"last_name": string | null,"list": string,"phone": string | null,"plus_one_allowed": boolean,"plus_one_of": string | null,"side": string,"sort_order": number,"tags": (string)[],"updated_at": string,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accessibility"?: string | null,"age_group"?: string,"allergies"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"dietary"?: (string)[],"email"?: string | null,"first_name": string,"household_id": string,"id"?: string,"is_unnamed_plus_one"?: boolean,"last_name"?: string | null,"list"?: string,"phone"?: string | null,"plus_one_allowed"?: boolean,"plus_one_of"?: string | null,"side"?: string,"sort_order"?: number,"tags"?: (string)[],"updated_at"?: string,"wedding_id": string
                  }
                  Update: {
                    "accessibility"?: string | null,"age_group"?: string,"allergies"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"dietary"?: (string)[],"email"?: string | null,"first_name"?: string,"household_id"?: string,"id"?: string,"is_unnamed_plus_one"?: boolean,"last_name"?: string | null,"list"?: string,"phone"?: string | null,"plus_one_allowed"?: boolean,"plus_one_of"?: string | null,"side"?: string,"sort_order"?: number,"tags"?: (string)[],"updated_at"?: string,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "guests_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "guests_plus_one_of_fkey"
      columns: ["plus_one_of"]
isOneToOne: false
      referencedRelation: "guests"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "guests_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"households": {
                  Row: {
                    "address": NonNullable<Json>,"created_at": string,"created_by": string | null,"deleted_at": string | null,"display_name": string,"id": string,"invite_code": string,"notes": string | null,"token_hash": string | null,"updated_at": string,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"display_name": string,"id"?: string,"invite_code"?: string,"notes"?: string | null,"token_hash"?: string | null,"updated_at"?: string,"wedding_id": string
                  }
                  Update: {
                    "address"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"display_name"?: string,"id"?: string,"invite_code"?: string,"notes"?: string | null,"token_hash"?: string | null,"updated_at"?: string,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "households_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"invitations": {
                  Row: {
                    "created_at": string,"event_id": string,"household_id": string,"sent_at": string | null,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"event_id": string,"household_id": string,"sent_at"?: string | null,"wedding_id": string
                  }
                  Update: {
                    "created_at"?: string,"event_id"?: string,"household_id"?: string,"sent_at"?: string | null,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitations_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"listings": {
                  Row: {
                    "base_location": unknown,"base_place_id": string | null,"capacity_max": number | null,"capacity_min": number | null,"category_id": string,"created_at": string,"currency": string,"description": string | null,"id": string,"is_sponsored": boolean,"price_from_minor": number | null,"price_to_minor": number | null,"published_at": string | null,"search": unknown,"service_radius_km": number | null,"status": string,"style_tags": (string)[],"summary": string | null,"title": string,"updated_at": string,"vendor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "base_location"?: unknown,"base_place_id"?: string | null,"capacity_max"?: number | null,"capacity_min"?: number | null,"category_id": string,"created_at"?: string,"currency": string,"description"?: string | null,"id"?: string,"is_sponsored"?: boolean,"price_from_minor"?: number | null,"price_to_minor"?: number | null,"published_at"?: string | null,"search"?: never,"service_radius_km"?: number | null,"status"?: string,"style_tags"?: (string)[],"summary"?: string | null,"title": string,"updated_at"?: string,"vendor_id": string
                  }
                  Update: {
                    "base_location"?: unknown,"base_place_id"?: string | null,"capacity_max"?: number | null,"capacity_min"?: number | null,"category_id"?: string,"created_at"?: string,"currency"?: string,"description"?: string | null,"id"?: string,"is_sponsored"?: boolean,"price_from_minor"?: number | null,"price_to_minor"?: number | null,"published_at"?: string | null,"search"?: never,"service_radius_km"?: number | null,"status"?: string,"style_tags"?: (string)[],"summary"?: string | null,"title"?: string,"updated_at"?: string,"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "listings_base_place_id_fkey"
      columns: ["base_place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listings_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "vendor_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listings_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["id"]
    }
                  ]
                },"meal_options": {
                  Row: {
                    "created_at": string,"description": string | null,"event_id": string,"for_children": boolean,"id": string,"name": string,"sort_order": number,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"event_id": string,"for_children"?: boolean,"id"?: string,"name": string,"sort_order"?: number,"wedding_id": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"event_id"?: string,"for_children"?: boolean,"id"?: string,"name"?: string,"sort_order"?: number,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meal_options_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meal_options_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"member_invites": {
                  Row: {
                    "accepted_at": string | null,"accepted_by": string | null,"created_at": string,"email": string | null,"expires_at": string,"id": string,"invited_by": string,"module_access": NonNullable<Json>,"phone": string | null,"relation": string,"revoked_at": string | null,"role": string,"token_hash": string,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"created_at"?: string,"email"?: string | null,"expires_at"?: string,"id"?: string,"invited_by"?: string,"module_access"?: NonNullable<Json>,"phone"?: string | null,"relation"?: string,"revoked_at"?: string | null,"role": string,"token_hash": string,"wedding_id": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"created_at"?: string,"email"?: string | null,"expires_at"?: string,"id"?: string,"invited_by"?: string,"module_access"?: NonNullable<Json>,"phone"?: string | null,"relation"?: string,"revoked_at"?: string | null,"role"?: string,"token_hash"?: string,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "member_invites_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"member_module_access": {
                  Row: {
                    "access": string,"member_id": string,"module": string,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "access": string,"member_id": string,"module": string,"wedding_id": string
                  }
                  Update: {
                    "access"?: string,"member_id"?: string,"module"?: string,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "member_module_access_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "wedding_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "member_module_access_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"places": {
                  Row: {
                    "country_code": string | null,"created_at": string,"formatted_address": string | null,"google_place_id": string | null,"id": string,"location": unknown,"name": string,"timezone": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "country_code"?: string | null,"created_at"?: string,"formatted_address"?: string | null,"google_place_id"?: string | null,"id"?: string,"location"?: unknown,"name": string,"timezone"?: string | null
                  }
                  Update: {
                    "country_code"?: string | null,"created_at"?: string,"formatted_address"?: string | null,"google_place_id"?: string | null,"id"?: string,"location"?: unknown,"name"?: string,"timezone"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"plan_entitlements": {
                  Row: {
                    "key": string,"plan_id": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "key": string,"plan_id": string,"value": NonNullable<Json>
                  }
                  Update: {
                    "key"?: string,"plan_id"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_entitlements_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
                  ]
                },"plans": {
                  Row: {
                    "audience": string,"created_at": string,"description": string | null,"id": string,"is_active": boolean,"is_default": boolean,"key": string,"name": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "audience": string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"is_default"?: boolean,"key": string,"name": string,"sort_order"?: number
                  }
                  Update: {
                    "audience"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"is_default"?: boolean,"key"?: string,"name"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"privacy_requests": {
                  Row: {
                    "created_at": string,"email": string | null,"id": string,"kind": string,"notes": string | null,"resolved_at": string | null,"status": string,"user_id": string | null,"wedding_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"id"?: string,"kind": string,"notes"?: string | null,"resolved_at"?: string | null,"status"?: string,"user_id"?: string | null,"wedding_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"id"?: string,"kind"?: string,"notes"?: string | null,"resolved_at"?: string | null,"status"?: string,"user_id"?: string | null,"wedding_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "privacy_requests_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_path": string | null,"created_at": string,"display_name": string | null,"id": string,"locale": string,"timezone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_path"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"locale"?: string,"timezone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "avatar_path"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"locale"?: string,"timezone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rsvp_questions": {
                  Row: {
                    "created_at": string,"event_id": string | null,"id": string,"kind": string,"options": NonNullable<Json>,"per_guest": boolean,"prompt": string,"required": boolean,"sort_order": number,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"event_id"?: string | null,"id"?: string,"kind"?: string,"options"?: NonNullable<Json>,"per_guest"?: boolean,"prompt": string,"required"?: boolean,"sort_order"?: number,"wedding_id": string
                  }
                  Update: {
                    "created_at"?: string,"event_id"?: string | null,"id"?: string,"kind"?: string,"options"?: NonNullable<Json>,"per_guest"?: boolean,"prompt"?: string,"required"?: boolean,"sort_order"?: number,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rsvp_questions_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rsvp_questions_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"rsvps": {
                  Row: {
                    "answers": NonNullable<Json>,"dietary_notes": string | null,"event_id": string,"guest_id": string,"meal_option_id": string | null,"responded_at": string | null,"song_request": string | null,"source": string,"status": string,"updated_at": string,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"dietary_notes"?: string | null,"event_id": string,"guest_id": string,"meal_option_id"?: string | null,"responded_at"?: string | null,"song_request"?: string | null,"source"?: string,"status"?: string,"updated_at"?: string,"wedding_id": string
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"dietary_notes"?: string | null,"event_id"?: string,"guest_id"?: string,"meal_option_id"?: string | null,"responded_at"?: string | null,"song_request"?: string | null,"source"?: string,"status"?: string,"updated_at"?: string,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rsvps_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rsvps_guest_id_fkey"
      columns: ["guest_id"]
isOneToOne: false
      referencedRelation: "guests"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rsvps_meal_option_id_fkey"
      columns: ["meal_option_id"]
isOneToOne: false
      referencedRelation: "meal_options"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rsvps_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"staff_roles": {
                  Row: {
                    "created_at": string,"granted_by": string | null,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"granted_by"?: string | null,"role": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"granted_by"?: string | null,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"task_assignees": {
                  Row: {
                    "member_id": string,"task_id": string,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "member_id": string,"task_id": string,"wedding_id": string
                  }
                  Update: {
                    "member_id"?: string,"task_id"?: string,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "task_assignees_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "wedding_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_assignees_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_assignees_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"task_templates": {
                  Row: {
                    "applies_when": NonNullable<Json>,"category": string,"created_at": string,"description": string | null,"id": string,"is_active": boolean,"key": string,"offset_days": number,"sort_order": number,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "applies_when"?: NonNullable<Json>,"category": string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"key": string,"offset_days": number,"sort_order"?: number,"title": string
                  }
                  Update: {
                    "applies_when"?: NonNullable<Json>,"category"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"key"?: string,"offset_days"?: number,"sort_order"?: number,"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tasks": {
                  Row: {
                    "budget_item_id": string | null,"category": string,"completed_at": string | null,"completed_by": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"due_date": string | null,"due_mode": string,"id": string,"notes": string | null,"offset_days": number | null,"parent_task_id": string | null,"sort_order": number,"status": string,"template_id": string | null,"title": string,"updated_at": string,"wedding_id": string,"wedding_vendor_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "budget_item_id"?: string | null,"category"?: string,"completed_at"?: string | null,"completed_by"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"due_date"?: string | null,"due_mode"?: string,"id"?: string,"notes"?: string | null,"offset_days"?: number | null,"parent_task_id"?: string | null,"sort_order"?: number,"status"?: string,"template_id"?: string | null,"title": string,"updated_at"?: string,"wedding_id": string,"wedding_vendor_id"?: string | null
                  }
                  Update: {
                    "budget_item_id"?: string | null,"category"?: string,"completed_at"?: string | null,"completed_by"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"due_date"?: string | null,"due_mode"?: string,"id"?: string,"notes"?: string | null,"offset_days"?: number | null,"parent_task_id"?: string | null,"sort_order"?: number,"status"?: string,"template_id"?: string | null,"title"?: string,"updated_at"?: string,"wedding_id"?: string,"wedding_vendor_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_budget_item_fk"
      columns: ["budget_item_id"]
isOneToOne: false
      referencedRelation: "budget_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_parent_task_id_fkey"
      columns: ["parent_task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "task_templates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_wedding_vendor_fk"
      columns: ["wedding_vendor_id"]
isOneToOne: false
      referencedRelation: "wedding_vendors"
      referencedColumns: ["id"]
    }
                  ]
                },"vendor_categories": {
                  Row: {
                    "created_at": string,"id": string,"is_active": boolean,"key": string,"name": string,"parent_id": string | null,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"key": string,"name": string,"parent_id"?: string | null,"sort_order"?: number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"key"?: string,"name"?: string,"parent_id"?: string | null,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "vendor_categories_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "vendor_categories"
      referencedColumns: ["id"]
    }
                  ]
                },"vendor_members": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"id": string,"role": string,"user_id": string,"vendor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"id"?: string,"role": string,"user_id": string,"vendor_id": string
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"id"?: string,"role"?: string,"user_id"?: string,"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vendor_members_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["id"]
    }
                  ]
                },"vendors": {
                  Row: {
                    "country_code": string,"created_at": string,"created_by": string | null,"currency": string,"email": string | null,"id": string,"name": string,"phone": string | null,"slug": string,"status": string,"tax_label": string | null,"tax_number": string | null,"tax_rate_bps": number | null,"updated_at": string,"verification_status": string,"website_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "country_code": string,"created_at"?: string,"created_by"?: string | null,"currency": string,"email"?: string | null,"id"?: string,"name": string,"phone"?: string | null,"slug": string,"status"?: string,"tax_label"?: string | null,"tax_number"?: string | null,"tax_rate_bps"?: number | null,"updated_at"?: string,"verification_status"?: string,"website_url"?: string | null
                  }
                  Update: {
                    "country_code"?: string,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"email"?: string | null,"id"?: string,"name"?: string,"phone"?: string | null,"slug"?: string,"status"?: string,"tax_label"?: string | null,"tax_number"?: string | null,"tax_rate_bps"?: number | null,"updated_at"?: string,"verification_status"?: string,"website_url"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"wedding_members": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"id": string,"invited_by": string | null,"relation": string,"role": string,"updated_at": string,"user_id": string,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"id"?: string,"invited_by"?: string | null,"relation"?: string,"role": string,"updated_at"?: string,"user_id": string,"wedding_id": string
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"id"?: string,"invited_by"?: string | null,"relation"?: string,"role"?: string,"updated_at"?: string,"user_id"?: string,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "wedding_members_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"wedding_vendors": {
                  Row: {
                    "agreed_total_minor": number | null,"category_id": string | null,"contact_name": string | null,"created_at": string,"created_by": string | null,"currency": string | null,"deleted_at": string | null,"email": string | null,"id": string,"is_shortlisted": boolean,"listing_id": string | null,"name": string,"notes": string | null,"phone": string | null,"stage": string,"updated_at": string,"website_url": string | null,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "agreed_total_minor"?: number | null,"category_id"?: string | null,"contact_name"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string | null,"deleted_at"?: string | null,"email"?: string | null,"id"?: string,"is_shortlisted"?: boolean,"listing_id"?: string | null,"name": string,"notes"?: string | null,"phone"?: string | null,"stage"?: string,"updated_at"?: string,"website_url"?: string | null,"wedding_id": string
                  }
                  Update: {
                    "agreed_total_minor"?: number | null,"category_id"?: string | null,"contact_name"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string | null,"deleted_at"?: string | null,"email"?: string | null,"id"?: string,"is_shortlisted"?: boolean,"listing_id"?: string | null,"name"?: string,"notes"?: string | null,"phone"?: string | null,"stage"?: string,"updated_at"?: string,"website_url"?: string | null,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "wedding_vendors_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "vendor_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "wedding_vendors_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "wedding_vendors_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"weddings": {
                  Row: {
                    "created_at": string,"created_by": string | null,"currency": string,"date_end": string | null,"date_mode": string,"date_start": string | null,"est_guest_count": number | null,"id": string,"locale": string,"location_label": string | null,"palette": NonNullable<Json>,"partner_a_name": string,"partner_b_name": string | null,"place_id": string | null,"priorities": (string)[],"slug": string | null,"status": string,"style_tags": (string)[],"timezone": string,"total_budget_minor": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"currency"?: string,"date_end"?: string | null,"date_mode"?: string,"date_start"?: string | null,"est_guest_count"?: number | null,"id"?: string,"locale"?: string,"location_label"?: string | null,"palette"?: NonNullable<Json>,"partner_a_name": string,"partner_b_name"?: string | null,"place_id"?: string | null,"priorities"?: (string)[],"slug"?: string | null,"status"?: string,"style_tags"?: (string)[],"timezone"?: string,"total_budget_minor"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"currency"?: string,"date_end"?: string | null,"date_mode"?: string,"date_start"?: string | null,"est_guest_count"?: number | null,"id"?: string,"locale"?: string,"location_label"?: string | null,"palette"?: NonNullable<Json>,"partner_a_name"?: string,"partner_b_name"?: string | null,"place_id"?: string | null,"priorities"?: (string)[],"slug"?: string | null,"status"?: string,"style_tags"?: (string)[],"timezone"?: string,"total_budget_minor"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "weddings_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_member_invite":
{ Args: { "p_token": string }; Returns: string
                           },
"create_vendor":
{ Args: { "p_country_code": string,"p_currency": string,"p_name": string,"p_slug": string }; Returns: string
                           },
"create_wedding":
{ Args: { "p_currency"?: string,"p_locale"?: string,"p_partner_a_name": string,"p_partner_b_name"?: string,"p_timezone"?: string }; Returns: string
                           },
"vendor_entitlement":
{ Args: { "p_key": string,"p_vendor_id": string }; Returns: Json
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
