-- Enhanced Leaderboard & Progression System
-- Real data-based rankings and XP tracking

-- Add XP and progression tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_xp INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_level INT DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level_name VARCHAR(50) DEFAULT 'Beginner Accountant';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accuracy_percentage NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_quizzes_completed INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS highest_streak INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_quiz_date TIMESTAMP;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Enhanced quiz_attempts table with anti-cheat measures
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS answers_json JSONB;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20);
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT true;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) UNIQUE;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500);
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS accuracy_percentage NUMERIC(5,2);
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS xp_earned INT DEFAULT 0;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS difficulty_multiplier NUMERIC(3,2) DEFAULT 1.0;

-- Create user_progression table for detailed tracking
CREATE TABLE IF NOT EXISTS public.user_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INT NOT NULL,
  level_name VARCHAR(50) NOT NULL,
  xp_current INT DEFAULT 0,
  xp_required INT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, level)
);

-- Create leaderboard_snapshot for different time periods
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
  rank INT,
  total_points INT,
  quiz_count INT,
  accuracy_percentage NUMERIC(5,2),
  current_streak INT,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, period)
);

-- Create user_stats materialized view for performance
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_quizzes INT DEFAULT 0,
  total_xp INT DEFAULT 0,
  average_accuracy NUMERIC(5,2) DEFAULT 0,
  best_score INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  all_time_rank INT,
  weekly_rank INT,
  monthly_rank INT,
  daily_rank INT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Level progression thresholds
CREATE TABLE IF NOT EXISTS public.level_thresholds (
  level INT PRIMARY KEY,
  level_name VARCHAR(50) NOT NULL,
  xp_required INT NOT NULL,
  description TEXT,
  badge_icon VARCHAR(50)
);

-- Insert level data
INSERT INTO public.level_thresholds (level, level_name, xp_required, description, badge_icon)
VALUES
  (1, 'Beginner Accountant', 0, 'Just starting your accounting journey', '📚'),
  (2, 'Junior Analyst', 500, 'Basic accounting concepts mastered', '📊'),
  (3, 'Senior Reviewer', 1500, 'Strong foundation in most subjects', '🔍'),
  (4, 'Audit Specialist', 3500, 'Advanced knowledge in auditing and control', '✓'),
  (5, 'Future CPA Elite', 7000, 'Exceptional understanding of all subjects', '👑')
ON CONFLICT (level) DO NOTHING;

-- XP Reward Table
CREATE TABLE IF NOT EXISTS public.xp_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_type VARCHAR(50) NOT NULL,
  xp_value INT NOT NULL,
  description TEXT
);

-- Insert XP reward data
INSERT INTO public.xp_rewards (reward_type, xp_value, description)
VALUES
  ('quiz_easy_pass', 50, 'Pass an Easy difficulty quiz'),
  ('quiz_medium_pass', 100, 'Pass a Medium difficulty quiz'),
  ('quiz_hard_pass', 200, 'Pass a Hard difficulty quiz'),
  ('perfect_score', 150, 'Score 100% on a quiz'),
  ('high_accuracy', 75, 'Score 90%+ on a quiz'),
  ('streak_bonus_7', 100, '7-day study streak'),
  ('streak_bonus_14', 250, '14-day study streak'),
  ('streak_bonus_30', 500, '30-day study streak'),
  ('subject_completion', 300, 'Complete all quizzes in a subject')
ON CONFLICT (reward_type) DO NOTHING;

-- Create function to calculate XP and update progression
CREATE OR REPLACE FUNCTION public.calculate_quiz_xp(
  p_score INT,
  p_total_questions INT,
  p_difficulty VARCHAR(20),
  p_time_spent INT
)
RETURNS TABLE (
  xp_earned INT,
  bonus_xp INT,
  accuracy NUMERIC,
  multiplier NUMERIC
) AS $$
DECLARE
  v_accuracy NUMERIC;
  v_multiplier NUMERIC;
  v_base_xp INT;
  v_bonus_xp INT;
BEGIN
  -- Calculate accuracy percentage
  v_accuracy := ROUND((p_score::NUMERIC / p_total_questions::NUMERIC) * 100, 2);
  
  -- Calculate difficulty multiplier
  v_multiplier := CASE 
    WHEN p_difficulty = 'Easy' THEN 1.0
    WHEN p_difficulty = 'Intermediate' THEN 1.5
    WHEN p_difficulty = 'Hard' THEN 2.0
    ELSE 1.0
  END;
  
  -- Base XP depends on difficulty and score
  v_base_xp := CASE 
    WHEN p_difficulty = 'Easy' AND v_accuracy >= 70 THEN 50
    WHEN p_difficulty = 'Intermediate' AND v_accuracy >= 70 THEN 100
    WHEN p_difficulty = 'Hard' AND v_accuracy >= 70 THEN 200
    ELSE 0
  END;
  
  -- Bonus XP for high accuracy
  v_bonus_xp := CASE
    WHEN v_accuracy = 100 THEN 150
    WHEN v_accuracy >= 90 THEN 75
    WHEN v_accuracy >= 80 THEN 25
    ELSE 0
  END;
  
  RETURN QUERY SELECT 
    ROUND(v_base_xp * v_multiplier)::INT,
    v_bonus_xp,
    v_accuracy,
    v_multiplier;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user stats after quiz completion
CREATE OR REPLACE FUNCTION public.update_user_stats_after_quiz()
RETURNS TRIGGER AS $$
DECLARE
  v_total_quizzes INT;
  v_avg_accuracy NUMERIC;
  v_streak INT;
BEGIN
  -- Update user stats
  UPDATE public.user_stats
  SET
    total_quizzes = (SELECT COUNT(*) FROM public.quiz_attempts WHERE user_id = NEW.user_id AND is_valid),
    total_xp = (SELECT COALESCE(SUM(xp_earned), 0) FROM public.quiz_attempts WHERE user_id = NEW.user_id AND is_valid),
    average_accuracy = (SELECT AVG(accuracy_percentage) FROM public.quiz_attempts WHERE user_id = NEW.user_id AND is_valid),
    best_score = (SELECT MAX(score) FROM public.quiz_attempts WHERE user_id = NEW.user_id AND is_valid),
    last_updated = NOW()
  WHERE user_id = NEW.user_id;
  
  -- Also update profiles
  UPDATE public.profiles
  SET
    total_xp = (SELECT COALESCE(SUM(xp_earned), 0) FROM public.quiz_attempts WHERE user_id = NEW.user_id AND is_valid),
    total_quizzes_completed = (SELECT COUNT(*) FROM public.quiz_attempts WHERE user_id = NEW.user_id AND is_valid),
    accuracy_percentage = (SELECT AVG(accuracy_percentage) FROM public.quiz_attempts WHERE user_id = NEW.user_id AND is_valid),
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stats update
DROP TRIGGER IF EXISTS update_stats_after_quiz ON public.quiz_attempts;
CREATE TRIGGER update_stats_after_quiz
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW
  WHEN (NEW.is_valid = true)
  EXECUTE FUNCTION public.update_user_stats_after_quiz();

-- Enable RLS on new tables
ALTER TABLE public.user_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own progression" ON public.user_progression FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "All can view leaderboard entries" ON public.leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "All can view user stats" ON public.user_stats FOR SELECT USING (true);

-- Create function to initialize user stats on signup
CREATE OR REPLACE FUNCTION public.initialize_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_progression (user_id, level, level_name, xp_current, xp_required)
  VALUES (NEW.id, 1, 'Beginner Accountant', 0, 500)
  ON CONFLICT (user_id, level) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stats initialization
DROP TRIGGER IF EXISTS init_stats_on_profile_create ON public.profiles;
CREATE TRIGGER init_stats_on_profile_create
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_stats();
