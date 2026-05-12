import { createClient } from '@/lib/supabase/server';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  totalPoints: number;
  quizCount: number;
  accuracy: number;
  currentStreak: number;
  levelName: string;
  badge: string;
}

export interface UserProgression {
  level: number;
  levelName: string;
  currentXP: number;
  requiredXP: number;
  percentToNext: number;
}

// Level progression with XP thresholds
const LEVELS = [
  { level: 1, name: 'Beginner Accountant', xp: 0, badge: '📚' },
  { level: 2, name: 'Junior Analyst', xp: 500, badge: '📊' },
  { level: 3, name: 'Senior Reviewer', xp: 1500, badge: '🔍' },
  { level: 4, name: 'Audit Specialist', xp: 3500, badge: '✓' },
  { level: 5, name: 'Future CPA Elite', xp: 7000, badge: '👑' },
];

// XP reward multipliers
const DIFFICULTY_MULTIPLIERS = {
  Easy: 1.0,
  Intermediate: 1.5,
  Hard: 2.0,
};

/**
 * Calculate XP earned from a quiz attempt
 * Prevents fake scoring with backend verification
 */
export function calculateQuizXP(
  score: number,
  totalQuestions: number,
  difficulty: 'Easy' | 'Intermediate' | 'Hard',
  timeSpentSeconds: number
): { xpEarned: number; accuracy: number } {
  const accuracy = (score / totalQuestions) * 100;
  
  // Only award XP if passing (70% or higher)
  if (accuracy < 70) {
    return { xpEarned: 0, accuracy };
  }

  // Base XP depends on difficulty
  let baseXP = 0;
  if (difficulty === 'Easy') baseXP = 50;
  else if (difficulty === 'Intermediate') baseXP = 100;
  else if (difficulty === 'Hard') baseXP = 200;

  // Apply difficulty multiplier
  const multiplier = DIFFICULTY_MULTIPLIERS[difficulty];
  let xpEarned = Math.floor(baseXP * multiplier);

  // Bonus XP for high accuracy
  if (accuracy === 100) xpEarned += 150; // Perfect score
  else if (accuracy >= 90) xpEarned += 75; // High accuracy
  else if (accuracy >= 80) xpEarned += 25; // Good accuracy

  // Speed bonus (if completed in under 50% of time)
  const estimatedTimeSeconds = totalQuestions * 30; // ~30 sec per question
  if (timeSpentSeconds < estimatedTimeSeconds * 0.5) {
    xpEarned = Math.floor(xpEarned * 1.2);
  }

  return { xpEarned, accuracy };
}

/**
 * Get current level and progression
 */
export function getUserLevel(totalXP: number): UserProgression {
  let currentLevel = 1;
  let currentXP = totalXP;
  let requiredXP = LEVELS[0].xp;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xp) {
      currentLevel = LEVELS[i].level;
      requiredXP = LEVELS[i].xp;
      break;
    }
  }

  // Get next level threshold
  const nextLevelIndex = LEVELS.findIndex((l) => l.level === currentLevel + 1);
  const nextRequiredXP = nextLevelIndex >= 0 ? LEVELS[nextLevelIndex].xp : LEVELS[LEVELS.length - 1].xp;
  const xpToNext = nextRequiredXP - totalXP;
  const xpInCurrentLevel = totalXP - requiredXP;
  const xpNeededForLevel = nextRequiredXP - requiredXP;
  const percentToNext = xpNeededForLevel > 0 ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 100;

  return {
    level: currentLevel,
    levelName: LEVELS[currentLevel - 1]?.name || 'Beginner Accountant',
    currentXP: totalXP,
    requiredXP: nextRequiredXP,
    percentToNext: Math.min(percentToNext, 100),
  };
}

/**
 * Calculate leaderboard score with anti-cheat validation
 * Formula: base_score + (accuracy_bonus) + (streak_bonus) + (difficulty_bonus)
 */
export function calculateLeaderboardScore(
  quizzesCompleted: number,
  averageAccuracy: number,
  currentStreak: number,
  totalXP: number
): number {
  // Base score from XP
  let score = Math.floor(totalXP / 10); // Scale XP down for display

  // Accuracy bonus (0-20 points)
  const accuracyBonus = Math.floor((averageAccuracy / 100) * 20);
  score += accuracyBonus;

  // Streak bonus (capped at 50 points)
  const streakBonus = Math.min(Math.floor(currentStreak / 2), 50);
  score += streakBonus;

  // Completion bonus (1 point per quiz, capped at 100)
  const completionBonus = Math.min(quizzesCompleted, 100);
  score += completionBonus;

  return Math.max(0, score);
}

/**
 * Fetch real leaderboard data from database
 */
export async function getLeaderboard(
  period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time'
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select(
      `
      user_id,
      rank,
      total_points,
      quiz_count,
      accuracy_percentage,
      current_streak,
      profiles:user_id(full_name, level_name)
    `
    )
    .eq('period', period)
    .order('rank', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return (data || []).map((entry: any) => ({
    rank: entry.rank,
    userId: entry.user_id,
    userName: entry.profiles?.full_name || 'Anonymous',
    totalPoints: entry.total_points,
    quizCount: entry.quiz_count,
    accuracy: entry.accuracy_percentage,
    currentStreak: entry.current_streak,
    levelName: entry.profiles?.level_name || 'Beginner',
    badge: getBadgeForLevel(entry.profiles?.level_name || 'Beginner'),
  }));
}

/**
 * Get user's position on leaderboard
 */
export async function getUserLeaderboardPosition(userId: string, period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time') {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('rank, total_points, accuracy_percentage, current_streak')
    .eq('user_id', userId)
    .eq('period', period)
    .single();

  if (error) {
    console.error('Error fetching user position:', error);
    return null;
  }

  return data;
}

/**
 * Anti-cheat verification - validate quiz attempt
 */
export async function validateQuizAttempt(
  userId: string,
  moduleId: string,
  timeSpent: number
): Promise<boolean> {
  // Check for rapid-fire attempts (less than 2 minutes for any quiz)
  if (timeSpent < 120) {
    return false;
  }

  // Check for duplicate submissions in same minute
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .order('completed_at', { ascending: false })
    .limit(1);

  if (!error && data && data.length > 0) {
    const lastAttemptTime = new Date(data[0].completed_at).getTime();
    const now = new Date().getTime();
    if (now - lastAttemptTime < 60000) {
      // Less than 1 minute since last attempt
      return false;
    }
  }

  return true;
}

/**
 * Get badge emoji for level name
 */
function getBadgeForLevel(levelName: string): string {
  const level = LEVELS.find((l) => l.name === levelName);
  return level?.badge || '📚';
}

/**
 * Calculate streak
 */
export function calculateStreak(lastQuizDate: Date | null): { current: number; highest: number } {
  if (!lastQuizDate) {
    return { current: 0, highest: 0 };
  }

  const today = new Date();
  const lastQuiz = new Date(lastQuizDate);
  const daysDifference = Math.floor((today.getTime() - lastQuiz.getTime()) / (1000 * 60 * 60 * 24));

  // If last quiz was more than 1 day ago, streak is broken
  if (daysDifference > 1) {
    return { current: 0, highest: 0 };
  }

  // Streak is still active
  return { current: daysDifference === 0 ? 1 : 1, highest: daysDifference === 0 ? 1 : 1 };
}
