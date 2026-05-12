import { createClient } from '@/lib/supabase/server';

// Notes operations
export async function createNote(userId: string, subject: string, title: string, content: string, color: string = 'blue') {
  const supabase = await createClient();
  return supabase
    .from('notes')
    .insert([{ user_id: userId, subject, title, content, color }])
    .select();
}

export async function getNotes(userId: string, subject?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (subject) {
    query = query.eq('subject', subject);
  }

  return query;
}

export async function updateNote(noteId: string, userId: string, updates: any) {
  const supabase = await createClient();
  return supabase
    .from('notes')
    .update(updates)
    .eq('id', noteId)
    .eq('user_id', userId)
    .select();
}

export async function deleteNote(noteId: string, userId: string) {
  const supabase = await createClient();
  return supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);
}

// Profile operations
export async function getProfile(userId: string) {
  const supabase = await createClient();
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
}

export async function updateProfile(userId: string, updates: any) {
  const supabase = await createClient();
  return supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', userId)
    .select()
    .single();
}

// Quiz operations
export async function getQuizModules() {
  const supabase = await createClient();
  return supabase
    .from('quiz_modules')
    .select('*')
    .order('subject');
}

export async function getQuizQuestions(moduleId: string) {
  const supabase = await createClient();
  return supabase
    .from('quiz_questions')
    .select('*')
    .eq('module_id', moduleId);
}

export async function submitQuizAttempt(userId: string, moduleId: string, score: number, totalQuestions: number, timeSpent: number) {
  const supabase = await createClient();
  return supabase
    .from('quiz_attempts')
    .insert([{ user_id: userId, module_id: moduleId, score, total_questions: totalQuestions, time_spent: timeSpent }])
    .select();
}

export async function getUserQuizAttempts(userId: string) {
  const supabase = await createClient();
  return supabase
    .from('quiz_attempts')
    .select('*, quiz_modules(title, subject)')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });
}

// Library operations
export async function uploadLibraryFile(userId: string, fileName: string, fileUrl: string, fileSize: number, fileType: string, category: string, description: string) {
  const supabase = await createClient();
  return supabase
    .from('library_files')
    .insert([{ user_id: userId, file_name: fileName, file_url: fileUrl, file_size: fileSize, file_type: fileType, category, description }])
    .select();
}

export async function getLibraryFiles(userId: string, category?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('library_files')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  return query;
}

export async function deleteLibraryFile(fileId: string, userId: string) {
  const supabase = await createClient();
  return supabase
    .from('library_files')
    .delete()
    .eq('id', fileId)
    .eq('user_id', userId);
}

// Achievements operations
export async function getUserAchievements(userId: string) {
  const supabase = await createClient();
  return supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId);
}

export async function awardAchievement(userId: string, badgeName: string, badgeIcon: string, description: string) {
  const supabase = await createClient();
  return supabase
    .from('achievements')
    .insert([{ user_id: userId, badge_name: badgeName, badge_icon: badgeIcon, description }])
    .select();
}

// Leaderboard operations
export async function getLeaderboard(limit: number = 10) {
  const supabase = await createClient();
  return supabase
    .from('quiz_attempts')
    .select('user_id, profiles(full_name, student_id), total_quiz_score:score.sum()')
    .order('total_quiz_score', { ascending: false })
    .limit(limit);
}
