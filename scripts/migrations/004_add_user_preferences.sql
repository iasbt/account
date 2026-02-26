-- 1. Gallery Preferences (Extended User Settings)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  has_accepted_terms BOOLEAN DEFAULT FALSE,
  has_seen_onboarding BOOLEAN DEFAULT FALSE,
  category_order JSONB DEFAULT '[]'::jsonb,
  hidden_category_ids JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookup (though PK is indexed)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
