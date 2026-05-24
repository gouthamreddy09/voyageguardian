/*
  # Clean Database Schema Setup
  
  This migration safely sets up the complete database schema for the travel planning app.
  It removes any existing objects first, then creates everything fresh.
  
  ## Tables Created:
  1. **profiles** - User profile information
  2. **trips** - Main trip planning data  
  3. **days** - Individual days within trips
  4. **activities** - Activities for each day
  5. **saved_trips** - Saved trip itineraries
  
  ## Security:
  - Row Level Security enabled on all tables
  - Policies for authenticated users only
  - Proper foreign key relationships
*/

-- Drop existing objects in reverse dependency order
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
DROP TRIGGER IF EXISTS update_days_updated_at ON days;
DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
DROP TRIGGER IF EXISTS update_saved_trips_updated_at ON saved_trips;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS days CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS saved_trips CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create the updated_at trigger function
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trips table
CREATE TABLE trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  destination text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  description text,
  cover_image text,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own trips"
  ON trips
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
  ON trips
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON trips
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON trips
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_trips_user_id ON trips(user_id);

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create days table
CREATE TABLE days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, date)
);

ALTER TABLE days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own trip days"
  ON days
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM trips 
    WHERE trips.id = days.trip_id 
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert days for own trips"
  ON days
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM trips 
    WHERE trips.id = days.trip_id 
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can update days for own trips"
  ON days
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM trips 
    WHERE trips.id = days.trip_id 
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete days for own trips"
  ON days
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM trips 
    WHERE trips.id = days.trip_id 
    AND trips.user_id = auth.uid()
  ));

CREATE INDEX idx_days_trip_id ON days(trip_id);

CREATE TRIGGER update_days_updated_at
  BEFORE UPDATE ON days
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create activities table
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES days(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  location text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  category text NOT NULL CHECK (category IN ('attraction', 'restaurant', 'transportation', 'accommodation', 'other')),
  cost numeric(10,2),
  notes text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read activities for own trips"
  ON activities
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM days 
    JOIN trips ON trips.id = days.trip_id 
    WHERE days.id = activities.day_id 
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert activities for own trips"
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM days 
    JOIN trips ON trips.id = days.trip_id 
    WHERE days.id = activities.day_id 
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can update activities for own trips"
  ON activities
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM days 
    JOIN trips ON trips.id = days.trip_id 
    WHERE days.id = activities.day_id 
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete activities for own trips"
  ON activities
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM days 
    JOIN trips ON trips.id = days.trip_id 
    WHERE days.id = activities.day_id 
    AND trips.user_id = auth.uid()
  ));

CREATE INDEX idx_activities_day_id ON activities(day_id);
CREATE INDEX idx_activities_order ON activities(day_id, order_index);

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create saved_trips table
CREATE TABLE saved_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  destination text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  budget numeric DEFAULT 0,
  budget_currency text DEFAULT 'USD',
  travel_style text NOT NULL,
  travelers integer DEFAULT 1,
  interests jsonb DEFAULT '[]',
  itinerary jsonb DEFAULT '[]',
  total_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own trips"
  ON saved_trips
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
  ON saved_trips
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON saved_trips
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON saved_trips
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX saved_trips_user_id_idx ON saved_trips(user_id);
CREATE INDEX saved_trips_created_at_idx ON saved_trips(created_at DESC);

CREATE TRIGGER update_saved_trips_updated_at
  BEFORE UPDATE ON saved_trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();