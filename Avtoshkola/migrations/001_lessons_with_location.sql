-- ============================================================
-- Migration 001: Lessons table (full schema + location column)
-- Run this once in the Supabase SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS guards.
-- ============================================================

-- Ensure required enum types exist
DO $$ BEGIN
  CREATE TYPE lesson_type   AS ENUM ('theory', 'practice');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lesson_status AS ENUM ('scheduled', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create table (for fresh installations)
CREATE TABLE IF NOT EXISTS lessons (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID         NOT NULL REFERENCES students(id)    ON DELETE CASCADE,
  instructor_id     UUID         NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  vehicle_id        UUID                  REFERENCES vehicles(id)    ON DELETE SET NULL,
  type              lesson_type  NOT NULL,
  start_time        TIMESTAMPTZ  NOT NULL,
  end_time          TIMESTAMPTZ  NOT NULL,
  location          TEXT,
  status            lesson_status NOT NULL DEFAULT 'scheduled',
  instructor_notes  TEXT,
  grade             NUMERIC(3,1) CHECK (grade BETWEEN 2 AND 6),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Add location column if upgrading an existing installation
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS location TEXT;

-- Indexes for the most common queries
CREATE INDEX IF NOT EXISTS lessons_student_id_idx    ON lessons (student_id);
CREATE INDEX IF NOT EXISTS lessons_instructor_id_idx ON lessons (instructor_id);
CREATE INDEX IF NOT EXISTS lessons_start_time_idx    ON lessons (start_time);
CREATE INDEX IF NOT EXISTS lessons_status_idx        ON lessons (status);

-- Composite index used by the reminder cron (scheduled lessons for a date range)
CREATE INDEX IF NOT EXISTS lessons_reminder_idx
  ON lessons (start_time, status)
  WHERE status = 'scheduled';
