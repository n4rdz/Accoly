-- Align quiz_attempts + user_stats with docs/ static app (subject-based quizzes)
-- Run in Supabase SQL Editor after 001 / 003 / 004 migrations.

-- Docs app saves by subject (FAR, AFAR, …), not quiz_modules UUID
ALTER TABLE public.quiz_attempts ALTER COLUMN module_id DROP NOT NULL;

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS subject VARCHAR(100);
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS correct_answers INT DEFAULT 0;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20);
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS xp_earned INT DEFAULT 0;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS time_taken INT;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS accuracy_percentage NUMERIC(5,2);
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT true;

-- Backfill readable timestamps if only legacy columns exist
UPDATE public.quiz_attempts
SET created_at = COALESCE(created_at, completed_at, NOW())
WHERE created_at IS NULL;

UPDATE public.quiz_attempts
SET time_taken = COALESCE(time_taken, time_spent)
WHERE time_taken IS NULL AND time_spent IS NOT NULL;

-- user_stats columns used by docs client
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS accuracy_percentage NUMERIC DEFAULT 0;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS last_attempt_date TIMESTAMPTZ;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS best_score INT DEFAULT 0;

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_stats_upsert_own" ON public.user_stats;
CREATE POLICY "user_stats_upsert_own" ON public.user_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_stats_select_own" ON public.user_stats;
CREATE POLICY "user_stats_select_own" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Leaderboard reads all profiles; attempts are per-user
DROP POLICY IF EXISTS "quiz_attempts_insert_own" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_insert_own" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "quiz_attempts_select_own" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_select_own" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

-- Leaderboard + messages user picker need to read all students' rows (read-only)
DROP POLICY IF EXISTS "quiz_attempts_select_leaderboard" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_select_leaderboard" ON public.quiz_attempts
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "user_stats_select_leaderboard" ON public.user_stats;
CREATE POLICY "user_stats_select_leaderboard" ON public.user_stats
  FOR SELECT TO authenticated USING (true);
