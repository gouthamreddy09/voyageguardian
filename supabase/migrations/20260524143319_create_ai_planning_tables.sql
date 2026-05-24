/*
  # Create AI Planning tables for multi-model chat system

  1. New Tables
    - `chat_messages` - Stores per-user chat history with model tracking
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_id` (text) - Groups messages by planning session
      - `role` (text) - 'user', 'assistant', or 'system'
      - `content` (text) - The message content
      - `model_used` (text) - Which AI model generated the response
      - `tokens_used` (integer) - Token count for cost tracking
      - `created_at` (timestamptz)

    - `ai_suggestions` - Stores AI-generated plan suggestions for accept/reject tracking
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_id` (text) - Links to chat session
      - `suggestion_type` (text) - Category of suggestion
      - `suggestion_text` (text) - The suggestion content
      - `context` (text) - What the suggestion was about
      - `model_used` (text) - Which AI model generated it
      - `accepted` (boolean, nullable) - null=pending, true=accepted, false=rejected
      - `created_at` (timestamptz)

    - `user_settings` - Stores per-user settings including encrypted API key
      - `id` (uuid, primary key)
      - `user_id` (uuid, unique, references auth.users)
      - `openai_api_key_encrypted` (text) - User's own OpenAI API key (encrypted client-side)
      - `preferred_model` (text) - Default model preference
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Users can only access their own data
    - Proper policies for SELECT, INSERT, UPDATE, DELETE
*/

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL DEFAULT '',
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  model_used text DEFAULT '',
  tokens_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_session
  ON chat_messages(user_id, session_id, created_at);

-- AI suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL DEFAULT '',
  suggestion_type text NOT NULL DEFAULT 'general',
  suggestion_text text NOT NULL,
  context text DEFAULT '',
  model_used text DEFAULT '',
  accepted boolean DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own suggestions"
  ON ai_suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suggestions"
  ON ai_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions"
  ON ai_suggestions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_session
  ON ai_suggestions(user_id, session_id);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  openai_api_key_encrypted text DEFAULT '',
  preferred_model text DEFAULT 'gpt-4o-mini',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
  ON user_settings(user_id);

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
