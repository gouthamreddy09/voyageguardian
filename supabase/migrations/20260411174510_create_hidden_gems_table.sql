/*
  # Create hidden_gems table for user-submitted hidden gems

  1. New Tables
    - `hidden_gems`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Name of the place
      - `location` (text) - Full location string e.g. "Chefchaouen, Morocco"
      - `country` (text) - Country name
      - `region` (text) - Continent/region for filtering
      - `description` (text) - User's description of the place
      - `why_hidden` (text) - Why this place is a hidden gem
      - `best_for` (jsonb) - Array of interest tags
      - `best_time` (text) - Best time to visit
      - `avg_budget` (text) - Average daily budget
      - `image_url` (text) - Optional image URL
      - `status` (text) - pending/approved for moderation
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `hidden_gems` table
    - Authenticated users can insert their own gems
    - Authenticated users can read approved gems and their own pending gems
    - Authenticated users can update/delete their own gems
*/

CREATE TABLE IF NOT EXISTS hidden_gems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text NOT NULL,
  country text NOT NULL,
  region text NOT NULL DEFAULT 'Other',
  description text NOT NULL,
  why_hidden text NOT NULL DEFAULT '',
  best_for jsonb DEFAULT '[]',
  best_time text DEFAULT '',
  avg_budget text DEFAULT '',
  image_url text DEFAULT '',
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hidden_gems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read approved gems or own gems"
  ON hidden_gems
  FOR SELECT
  TO authenticated
  USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Anyone can read approved gems"
  ON hidden_gems
  FOR SELECT
  TO anon
  USING (status = 'approved');

CREATE POLICY "Authenticated users can insert own gems"
  ON hidden_gems
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gems"
  ON hidden_gems
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own gems"
  ON hidden_gems
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_hidden_gems_user_id ON hidden_gems(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_gems_status ON hidden_gems(status);
CREATE INDEX IF NOT EXISTS idx_hidden_gems_region ON hidden_gems(region);

CREATE TRIGGER update_hidden_gems_updated_at
  BEFORE UPDATE ON hidden_gems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
