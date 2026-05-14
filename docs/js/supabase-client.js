// ============================================
// SUPABASE CLIENT — singleton wrapper
// ============================================
const SUPABASE_URL = 'https://ftfgguwgtccqemwlutmv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TsCJhb7DQcebE70q7dG2WA_S5aWD_ut';

// Create client without using window.localStorage so auth state is not persisted to localStorage.
// Sessions should be handled server-side (cookies) or kept in-memory in the app.
const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

// Expose raw client globally so auth.js can use onAuthStateChange
window._sb = _sb;

const SupabaseClient = {

    // ── Auth ────────────────────────────────────────────────────────────────

    signUp: async function (email, password, fullName) {
        const { data, error } = await _sb.auth.signUp({
            email: email,
            password: password,
            options: { data: { full_name: fullName } }
        });
        if (error) return { session: null, error };

        if (data.user) {
            await _sb.from('profiles').upsert({
                id: data.user.id,
                full_name: fullName,
                email: email,
                role: 'basic',
                subscription_status: 'free',
                created_at: new Date().toISOString()
            });
        }
        return { session: data.session, error: null };
    },

    signIn: async function (email, password) {
        const { data, error } = await _sb.auth.signInWithPassword({ email, password });
        if (error) return { session: null, error };
        return { session: data.session, error: null };
    },

    signOut: async function () {
        await _sb.auth.signOut();
    },

    getSession: async function () {
        const { data } = await _sb.auth.getSession();
        return data.session || null;
    },

    getCurrentUserId: async function () {
        const session = await SupabaseClient.getSession();
        return session ? session.user.id : null;
    },

    // ── Profiles ────────────────────────────────────────────────────────────

    getProfile: async function (userId) {
        const { data, error } = await _sb.from('profiles').select('*').eq('id', userId).single();
        if (error || !data) return null;
        return {
            id: data.id,
            fullName: data.full_name || 'Student',
            email: data.email || '',
            role: data.role || 'basic',
            subscriptionStatus: data.subscription_status || 'free',
            subscriptionDate: data.subscription_date || null,
            createdAt: data.created_at || new Date().toISOString(),
            password: ''
        };
    },

    updateProfile: async function (userId, updates) {
        const { error } = await _sb.from('profiles').update({
            full_name: updates.fullName,
            role: updates.role,
            subscription_status: updates.subscriptionStatus,
            subscription_date: updates.subscriptionDate
        }).eq('id', userId);
        return !error;
    },

    getAllUsers: async function () {
        const { data, error } = await _sb.from('profiles').select('id, full_name, email, role, subscription_status, created_at');
        if (error || !data) return [];
        return data.map(function (d) {
            return {
                id: d.id,
                fullName: d.full_name || 'Student',
                email: d.email || '',
                role: d.role || 'basic',
                subscriptionStatus: d.subscription_status || 'free',
                createdAt: d.created_at
            };
        });
    },

    // ── Notes ───────────────────────────────────────────────────────────────

    getNotes: async function (userId) {
        const { data, error } = await _sb.from('notes').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (n) {
            return { id: n.id, userId: n.user_id, title: n.title, subject: n.subject, content: n.content, createdAt: n.created_at, updatedAt: n.updated_at };
        });
    },

    saveNote: async function (note) {
        const row = { user_id: note.userId, title: note.title || 'Untitled', subject: note.subject || 'General', content: note.content || '', updated_at: new Date().toISOString() };
        if (note.id && !note.id.startsWith('new')) row.id = note.id;
        const { data, error } = await _sb.from('notes').upsert(row).select().single();
        if (error || !data) return null;
        return { id: data.id, userId: data.user_id, title: data.title, subject: data.subject, content: data.content, createdAt: data.created_at, updatedAt: data.updated_at };
    },

    deleteNote: async function (noteId) {
        const { error } = await _sb.from('notes').delete().eq('id', noteId);
        return !error;
    },

    // ── Quiz attempts ────────────────────────────────────────────────────────

    saveQuizAttempt: async function (attempt) {
        const { data, error } = await _sb.from('quiz_attempts').insert({
            user_id: attempt.userId,
            subject: attempt.subject || '',
            difficulty: attempt.difficulty || '',
            score: attempt.score || 0,
            correct_answers: attempt.correctAnswers || 0,
            total_questions: attempt.totalQuestions || 0,
            xp_earned: attempt.xpEarned || 0,
            created_at: new Date().toISOString()
        }).select().single();
        if (error || !data) return null;
        return data;
    },

    getQuizAttempts: async function (userId) {
        const { data, error } = await _sb.from('quiz_attempts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (a) {
            return { id: a.id, userId: a.user_id, subject: a.subject, difficulty: a.difficulty, score: a.score, correctAnswers: a.correct_answers, totalQuestions: a.total_questions, xpEarned: a.xp_earned, timestamp: a.created_at };
        });
    },

    // ── User stats ───────────────────────────────────────────────────────────

    getUserStats: async function (userId) {
        const { data, error } = await _sb.from('user_stats').select('*').eq('user_id', userId).single();
        if (error || !data) return { totalQuizzes: 0, totalXP: 0, accuracyPercentage: 0, currentStreak: 0, bestScore: 0, level: 1, lastAttemptDate: null };
        return { totalQuizzes: data.total_quizzes, totalXP: data.total_xp, accuracyPercentage: data.accuracy_percentage, currentStreak: data.current_streak, bestScore: data.best_score, level: data.level, lastAttemptDate: data.last_attempt_date };
    },

    saveUserStats: async function (userId, stats) {
        const { error } = await _sb.from('user_stats').upsert({
            user_id: userId,
            total_quizzes: stats.totalQuizzes,
            total_xp: stats.totalXP,
            accuracy_percentage: stats.accuracyPercentage,
            current_streak: stats.currentStreak,
            best_score: stats.bestScore,
            level: stats.level,
            last_attempt_date: stats.lastAttemptDate
        });
        return !error;
    },

    // ── Posts ────────────────────────────────────────────────────────────────

    getPosts: async function () {
        const { data, error } = await _sb.from('posts').select('*').order('created_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (p) {
            return {
                id: p.id, userId: p.user_id, userName: p.user_name, content: p.content,
                type: p.type, tags: p.tags || [], reactions: p.reactions || { like: [], love: [], laugh: [], helpful: [] },
                comments: p.comments || [], createdAt: p.created_at, updatedAt: p.updated_at
            };
        });
    },

    savePost: async function (post) {
        const row = {
            user_id: post.userId, user_name: post.userName, content: post.content,
            type: post.type || 'Discussion', tags: post.tags || [],
            reactions: post.reactions || { like: [], love: [], laugh: [], helpful: [] },
            comments: post.comments || [], updated_at: new Date().toISOString()
        };
        if (post.id) row.id = post.id;
        const { data, error } = await _sb.from('posts').upsert(row).select().single();
        if (error || !data) return null;
        return data;
    },

    // Update only reactions — any logged-in user can call this
    updateReactions: async function (postId, reactions) {
        const { data, error } = await _sb.from('posts')
            .update({ reactions: reactions, updated_at: new Date().toISOString() })
            .eq('id', postId)
            .select().single();
        if (error || !data) return null;
        return data;
    },

    // Update only comments — any logged-in user can call this
    updateComments: async function (postId, comments) {
        const { data, error } = await _sb.from('posts')
            .update({ comments: comments, updated_at: new Date().toISOString() })
            .eq('id', postId)
            .select().single();
        if (error || !data) return null;
        return data;
    },

    deletePost: async function (postId) {
        const { error } = await _sb.from('posts').delete().eq('id', postId);
        return !error;
    },

    // ── Messages ─────────────────────────────────────────────────────────────

    getMessages: async function (userA, userB) {
        const { data, error } = await _sb.from('messages').select('*')
            .or(`and(from_user_id.eq.${userA},to_user_id.eq.${userB}),and(from_user_id.eq.${userB},to_user_id.eq.${userA})`)
            .order('created_at', { ascending: true });
        if (error || !data) return [];
        return data.map(function (m) {
            return { id: m.id, fromUserId: m.from_user_id, toUserId: m.to_user_id, body: m.body, createdAt: m.created_at };
        });
    },

    saveMessage: async function (msg) {
        const { data, error } = await _sb.from('messages').insert({
            from_user_id: msg.fromUserId, to_user_id: msg.toUserId,
            body: msg.body, created_at: new Date().toISOString()
        }).select().single();
        if (error || !data) return null;
        return { id: data.id, fromUserId: data.from_user_id, toUserId: data.to_user_id, body: data.body, createdAt: data.created_at };
    },

    // ── Flashcards ────────────────────────────────────────────────────────────

    getFlashcards: async function (userId) {
        const { data, error } = await _sb.from('flashcards').select('*').or(`user_id.eq.${userId},user_id.eq.seed`);
        if (error || !data) return [];
        return data.map(function (c) {
            return { id: c.id, userId: c.user_id, subject: c.subject, question: c.question, answer: c.answer, confusionCount: c.confusion_count || 0, createdAt: c.created_at };
        });
    },

    saveFlashcard: async function (card) {
        const row = { user_id: card.userId, subject: card.subject, question: card.question, answer: card.answer, confusion_count: card.confusionCount || 0 };
        if (card.id) row.id = card.id;
        const { data, error } = await _sb.from('flashcards').upsert(row).select().single();
        if (error || !data) return null;
        return { id: data.id, userId: data.user_id, subject: data.subject, question: data.question, answer: data.answer, confusionCount: data.confusion_count, createdAt: data.created_at };
    },

    // ── Notifications ─────────────────────────────────────────────────────────

    getNotifications: async function (userId) {
        const { data, error } = await _sb.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (n) {
            return { id: n.id, userId: n.user_id, message: n.message, date: n.created_at, read: n.read };
        });
    },

    addNotification: async function (entry) {
        const { data, error } = await _sb.from('notifications').insert({
            user_id: entry.userId, message: entry.message, read: false, created_at: new Date().toISOString()
        }).select().single();
        if (error || !data) return null;
        return { id: data.id, userId: data.user_id, message: data.message, date: data.created_at, read: data.read };
    },

    markAllNotificationsRead: async function (userId) {
        await _sb.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    },

    // ── Leaderboard ──────────────────────────────────────────────────────────

    getLeaderboard: async function (limit = 100) {
        const { data, error } = await _sb.from('leaderboard').select('*').order('total_xp', { ascending: false }).limit(limit);
        if (error || !data) return [];
        return data.map(function (entry) {
            return {
                rank: entry.rank,
                userId: entry.user_id,
                userName: entry.user_name,
                totalXP: entry.total_xp,
                level: entry.level,
                totalQuizzes: entry.total_quizzes,
                accuracy: entry.accuracy_percentage
            };
        });
    },

    updateLeaderboard: async function (userId, userName, stats) {
        const { error } = await _sb.from('leaderboard').upsert({
            user_id: userId,
            user_name: userName,
            total_xp: stats.totalXP || 0,
            level: stats.level || 1,
            total_quizzes: stats.totalQuizzes || 0,
            accuracy_percentage: stats.accuracyPercentage || 0
        }).eq('user_id', userId);
        return !error;
    },

    // ── Quizzes ──────────────────────────────────────────────────────────────

    getQuizzes: async function (subject = null, difficulty = null) {
        let query = _sb.from('quizzes').select('*');
        if (subject) query = query.eq('subject', subject);
        if (difficulty) query = query.eq('difficulty', difficulty);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (q) {
            return {
                id: q.id,
                subject: q.subject,
                difficulty: q.difficulty,
                title: q.title,
                description: q.description,
                questions: q.questions || [],
                timeLimit: q.time_limit,
                xpReward: q.xp_reward,
                createdAt: q.created_at
            };
        });
    },

    getQuizById: async function (quizId) {
        const { data, error } = await _sb.from('quizzes').select('*').eq('id', quizId).single();
        if (error || !data) return null;
        return {
            id: data.id,
            subject: data.subject,
            difficulty: data.difficulty,
            title: data.title,
            description: data.description,
            questions: data.questions || [],
            timeLimit: data.time_limit,
            xpReward: data.xp_reward,
            createdAt: data.created_at
        };
    },

    saveQuiz: async function (quiz) {
        const row = {
            subject: quiz.subject,
            difficulty: quiz.difficulty,
            title: quiz.title,
            description: quiz.description || '',
            questions: quiz.questions || [],
            time_limit: quiz.timeLimit || 0,
            xp_reward: quiz.xpReward || 10,
            created_at: new Date().toISOString()
        };
        if (quiz.id) row.id = quiz.id;
        const { data, error } = await _sb.from('quizzes').upsert(row).select().single();
        if (error || !data) return null;
        return {
            id: data.id,
            subject: data.subject,
            difficulty: data.difficulty,
            title: data.title,
            description: data.description,
            questions: data.questions,
            timeLimit: data.time_limit,
            xpReward: data.xp_reward,
            createdAt: data.created_at
        };
    },

    deleteQuiz: async function (quizId) {
        const { error } = await _sb.from('quizzes').delete().eq('id', quizId);
        return !error;
    }
};