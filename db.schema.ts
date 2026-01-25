/**
 * Database Schema Documentation
 * Generated from Supabase/Lovable Cloud
 * 
 * This file documents the complete database structure including:
 * - Table definitions with columns and types
 * - Foreign key relationships
 * - Row Level Security (RLS) policies
 */

// =============================================================================
// ENUMS & TYPES
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SpaceType = 'property' | 'event_space';
export type SpaceStatus = 'active' | 'draft' | 'published' | 'archived';
export type AmenityStatus = 'provided' | 'not_provided' | 'unknown';
export type ProcessingStatus = 'uploaded' | 'processing' | 'completed' | 'error';
export type ObservationSeverity = 'low' | 'medium' | 'high' | 'critical';

// =============================================================================
// TABLE: profiles
// =============================================================================

export interface Profile {
  id: string;                    // uuid, PK, default: gen_random_uuid()
  user_id: string;               // uuid, NOT NULL, references auth.users
  full_name: string | null;      // text
  company_name: string | null;   // text
  avatar_url: string | null;     // text
  created_at: string;            // timestamptz, default: now()
  updated_at: string;            // timestamptz, default: now()
}

/**
 * RLS Policies for profiles:
 * - SELECT: Users can view their own profile (auth.uid() = user_id)
 * - INSERT: Users can insert their own profile (auth.uid() = user_id)
 * - UPDATE: Users can update their own profile (auth.uid() = user_id)
 * - DELETE: Not allowed
 */

// =============================================================================
// TABLE: contact
// =============================================================================

export interface Contact {
  id: string;                    // uuid, PK, default: gen_random_uuid()
  user_id: string | null;        // uuid, references auth.users
  name: string | null;           // text
  email: string | null;          // text
  phone: string | null;          // text
  company: string | null;        // text
  role: string | null;           // text
  metadata: Json | null;         // jsonb, default: '{}'
  created_at: string | null;     // timestamptz, default: now()
  updated_at: string | null;     // timestamptz, default: now()
}

/**
 * RLS Policies for contact:
 * - SELECT: Users can view their own contacts (auth.uid() = user_id)
 * - INSERT: Users can insert their own contacts (auth.uid() = user_id)
 * - UPDATE: Users can update their own contacts (auth.uid() = user_id)
 * - DELETE: Users can delete their own contacts (auth.uid() = user_id)
 */

// =============================================================================
// TABLE: space
// =============================================================================

export interface Space {
  id: string;                    // uuid, PK, default: gen_random_uuid()
  user_id: string | null;        // uuid, references auth.users
  contact_id: string | null;     // uuid, FK -> contact.id
  name: string;                  // text, NOT NULL
  address: string | null;        // text
  description: string | null;    // text
  space_type: SpaceType;         // text, NOT NULL, default: 'property'
  status: string | null;         // text, default: 'active'
  metadata: Json | null;         // jsonb, default: '{}'
  created_at: string | null;     // timestamptz, default: now()
  updated_at: string | null;     // timestamptz, default: now()
}

/**
 * Foreign Keys:
 * - contact_id -> contact.id
 * 
 * RLS Policies for space:
 * - SELECT: Anyone can view all spaces (true)
 * - INSERT: Users can insert their own spaces (auth.uid() = user_id)
 * - UPDATE: Users can update their own spaces (auth.uid() = user_id)
 * - DELETE: Users can delete their own spaces (auth.uid() = user_id)
 */

// =============================================================================
// TABLE: room
// =============================================================================

export interface Room {
  id: string;                    // uuid, PK, default: gen_random_uuid()
  space_id: string;              // uuid, NOT NULL, FK -> space.id
  name: string;                  // text, NOT NULL
  room_type: string | null;      // text
  capacity: number | null;       // integer
  area_sqm: number | null;       // numeric
  floor_number: number | null;   // integer
  metadata: Json | null;         // jsonb, default: '{}'
  created_at: string | null;     // timestamptz, default: now()
  updated_at: string | null;     // timestamptz, default: now()
}

/**
 * Foreign Keys:
 * - space_id -> space.id
 * 
 * RLS Policies for room:
 * - SELECT: Anyone can view rooms (true)
 * - INSERT: Users can insert rooms to their spaces (space.user_id = auth.uid())
 * - UPDATE: Users can update rooms of their spaces (space.user_id = auth.uid())
 * - DELETE: Users can delete rooms of their spaces (space.user_id = auth.uid())
 */

// =============================================================================
// TABLE: observation
// =============================================================================

export interface Observation {
  id: string;                    // uuid, PK, default: gen_random_uuid()
  space_id: string;              // uuid, NOT NULL, FK -> space.id
  room_id: string | null;        // uuid, FK -> room.id
  label: string;                 // text, NOT NULL
  details: string;               // text, NOT NULL
  category: string | null;       // text
  severity: string | null;       // text (low, medium, high, critical)
  metadata: Json | null;         // jsonb, default: '{}'
  created_at: string | null;     // timestamptz, default: now()
}

/**
 * Foreign Keys:
 * - space_id -> space.id
 * - room_id -> room.id
 * 
 * RLS Policies for observation:
 * - SELECT: Anyone can view observations (true)
 * - INSERT: Users can insert observations to their spaces (space.user_id = auth.uid())
 * - UPDATE: Users can update observations of their spaces (space.user_id = auth.uid())
 * - DELETE: Users can delete observations of their spaces (space.user_id = auth.uid())
 */

// =============================================================================
// TABLE: space_document
// =============================================================================

export interface SpaceDocument {
  id: string;                           // uuid, PK, default: gen_random_uuid()
  space_id: string;                     // uuid, NOT NULL, FK -> space.id
  room_id: string | null;               // uuid, FK -> room.id
  file_name: string;                    // text, NOT NULL
  file_type: string;                    // text, NOT NULL
  file_size: number | null;             // bigint
  mime_type: string | null;             // text
  storage_url: string;                  // text, NOT NULL
  storage_path: string | null;          // text
  thumbnail_url: string | null;         // text
  processing_status: string | null;     // text, default: 'uploaded'
  extracted_data: Json | null;          // jsonb
  is_floorplan_related_doc: boolean | null; // boolean, default: false
  metadata: Json | null;                // jsonb, default: '{}'
  created_at: string | null;            // timestamptz, default: now()
}

/**
 * Foreign Keys:
 * - space_id -> space.id
 * - room_id -> room.id
 * 
 * RLS Policies for space_document:
 * - SELECT: Anyone can view space documents (true)
 * - INSERT: Users can insert documents to their spaces (space.user_id = auth.uid())
 * - UPDATE: Users can update documents of their spaces (space.user_id = auth.uid())
 * - DELETE: Users can delete documents of their spaces (space.user_id = auth.uid())
 */

// =============================================================================
// TABLE: space_image
// =============================================================================

export interface SpaceImage {
  id: string;                    // uuid, PK, default: gen_random_uuid()
  space_id: string;              // uuid, NOT NULL, FK -> space.id
  storage_url: string;           // text, NOT NULL
  storage_path: string | null;   // text
  file_name: string | null;      // text
  display_order: number | null;  // integer, default: 0
  is_primary: boolean | null;    // boolean, default: false
  created_at: string | null;     // timestamptz, default: now()
}

/**
 * Foreign Keys:
 * - space_id -> space.id
 * 
 * RLS Policies for space_image:
 * - SELECT: Anyone can view space images (true)
 * - INSERT: Users can insert images to their spaces (space.user_id = auth.uid())
 * - UPDATE: Users can update images of their spaces (space.user_id = auth.uid())
 * - DELETE: Users can delete images of their spaces (space.user_id = auth.uid())
 */

// =============================================================================
// TABLE: space_amenity
// =============================================================================

export interface SpaceAmenity {
  id: string;                    // uuid, PK, default: gen_random_uuid()
  space_id: string;              // uuid, NOT NULL, FK -> space.id
  amenity_id: string;            // text, NOT NULL
  category: string;              // text, NOT NULL
  name: string;                  // text, NOT NULL
  status: AmenityStatus;         // text, NOT NULL, default: 'unknown'
  required: boolean | null;      // boolean, default: false
  image_url: string | null;      // text
  image_path: string | null;     // text
  created_at: string | null;     // timestamptz, default: now()
  updated_at: string | null;     // timestamptz, default: now()
}

/**
 * Foreign Keys:
 * - space_id -> space.id
 * 
 * RLS Policies for space_amenity:
 * - SELECT: Anyone can view space amenities (true)
 * - INSERT: Users can insert amenities to their spaces (space.user_id = auth.uid())
 * - UPDATE: Users can update amenities of their spaces (space.user_id = auth.uid())
 * - DELETE: Users can delete amenities of their spaces (space.user_id = auth.uid())
 */

// =============================================================================
// DATABASE FUNCTIONS
// =============================================================================

/**
 * Function: update_updated_at_column()
 * Language: plpgsql
 * 
 * Automatically updates the updated_at column to now() on row updates.
 * Used as a trigger on tables with updated_at columns.
 */

// =============================================================================
// STORAGE BUCKETS
// =============================================================================

/**
 * Bucket: property-documents
 * Is Public: Yes
 * 
 * Stores all uploaded files including:
 * - Property/space images
 * - Documents (PDFs, etc.)
 * - Amenity verification photos
 * - Floor plan related documents
 */

// =============================================================================
// ENTITY RELATIONSHIP DIAGRAM
// =============================================================================

/**
 * ```
 * ┌─────────────┐
 * │  profiles   │
 * │─────────────│
 * │ user_id ────┼──────────────────┐
 * └─────────────┘                  │
 *                                  │ (auth.users)
 * ┌─────────────┐                  │
 * │   contact   │                  │
 * │─────────────│                  │
 * │ user_id ────┼──────────────────┤
 * │ id ─────────┼──┐               │
 * └─────────────┘  │               │
 *                  │               │
 * ┌─────────────┐  │               │
 * │    space    │  │               │
 * │─────────────│  │               │
 * │ user_id ────┼──┼───────────────┘
 * │ contact_id ─┼──┘
 * │ id ─────────┼──┬───────────────────────────────┐
 * └─────────────┘  │                               │
 *                  │                               │
 *    ┌─────────────┼─────────────┬─────────────┬───┴───────────┐
 *    │             │             │             │               │
 *    ▼             ▼             ▼             ▼               ▼
 * ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐
 * │   room   │ │ observ-  │ │ space_doc- │ │ space_     │ │ space_      │
 * │          │ │ ation    │ │ ument      │ │ image      │ │ amenity     │
 * │──────────│ │──────────│ │────────────│ │────────────│ │─────────────│
 * │ space_id │ │ space_id │ │ space_id   │ │ space_id   │ │ space_id    │
 * │ id ──────┼┐│ room_id ─┼┐│ room_id ───┼┐└────────────┘ └─────────────┘
 * └──────────┘│└──────────┘│└────────────┘│
 *             │            │              │
 *             └────────────┴──────────────┘
 * ```
 */

// =============================================================================
// INSERT/UPDATE TYPES (for Supabase client usage)
// =============================================================================

export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SpaceInsert = Omit<Space, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RoomInsert = Omit<Room, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ObservationInsert = Omit<Observation, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type SpaceDocumentInsert = Omit<SpaceDocument, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type SpaceImageInsert = Omit<SpaceImage, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type SpaceAmenityInsert = Omit<SpaceAmenity, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
