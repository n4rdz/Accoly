// ============================================
// SUPABASE CLIENT — singleton wrapper
// ============================================
const SUPABASE_URL = 'https://ftfgguwgtccqemwlutmv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TsCJhb7DQcebE70q7dG2WA_S5aWD_ut';

const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        storageKey: 'accoly-auth',
        storage: window.localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// Expose raw client globally so auth.js can use onAuthStateChange
window._sb = _sb;

/** Remove invalid/expired Supabase session from localStorage. */
function clearSupabaseAuthStorage() {
    try {
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && (k === 'accoly-auth' || k.indexOf('sb-') === 0)) keys.push(k);
        }
        keys.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { /* ignore */ }
}

function isInvalidRefreshTokenError(err) {
    if (!err) return false;
    var code = err.code || err.error_code || '';
    var msg = (err.message || '').toLowerCase();
    return code === 'refresh_token_not_found' ||
        msg.indexOf('refresh token') !== -1 ||
        msg.indexOf('invalid refresh') !== -1;
}

window.clearSupabaseAuthStorage = clearSupabaseAuthStorage;
window.isInvalidRefreshTokenError = isInvalidRefreshTokenError;

function _calculateLevel(totalXP) {
    if (totalXP < 500) return 1;
    if (totalXP < 1500) return 2;
    if (totalXP < 3500) return 3;
    if (totalXP < 7000) return 4;
    return 5;
}

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
        try {
            await _sb.auth.signOut({ scope: 'global' });
        } catch (e) { /* ignore */ }
        clearSupabaseAuthStorage();
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
        var row = {};
        if (updates.fullName !== undefined) row.full_name = updates.fullName;
        if (updates.role !== undefined) row.role = updates.role;
        if (updates.subscriptionStatus !== undefined) row.subscription_status = updates.subscriptionStatus;
        if (updates.subscriptionDate !== undefined) row.subscription_date = updates.subscriptionDate;
        if (Object.keys(row).length === 0) return true;
        const { error } = await _sb.from('profiles').update(row).eq('id', userId);
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
        const row = {
            user_id: attempt.userId,
            subject: attempt.subject || '',
            difficulty: attempt.difficulty || '',
            score: attempt.score || 0,
            correct_answers: attempt.correctAnswers || 0,
            total_questions: attempt.totalQuestions || 0,
            xp_earned: attempt.xpEarned || 0,
            created_at: new Date().toISOString()
        };
        if (attempt.timeTaken != null) row.time_taken = attempt.timeTaken;
        const { data, error } = await _sb.from('quiz_attempts').insert(row).select().single();
        if (error || !data) return null;
        return data;
    },

    getQuizAttempts: async function (userId) {
        const { data, error } = await _sb.from('quiz_attempts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (a) {
            return {
                id: a.id,
                userId: a.user_id,
                subject: a.subject,
                difficulty: a.difficulty,
                score: a.score,
                correctAnswers: a.correct_answers,
                totalQuestions: a.total_questions,
                xpEarned: a.xp_earned,
                timeTaken: a.time_taken || a.time_spent || 0,
                timestamp: a.created_at
            };
        });
    },

    syncUserStatsFromAttempts: async function (userId) {
        const attempts = await SupabaseClient.getQuizAttempts(userId);
        if (!window.AccolyStats) return false;
        const stats = AccolyStats.buildUserStatsFromAttempts(attempts);
        return SupabaseClient.saveUserStats(userId, stats);
    },

    // ── User stats ───────────────────────────────────────────────────────────

    getUserStats: async function (userId) {
        const { data, error } = await _sb.from('user_stats').select('*').eq('user_id', userId).single();
        if (error || !data) return { totalQuizzes: 0, totalXP: 0, accuracyPercentage: 0, currentStreak: 0, bestScore: 0, level: 1, lastAttemptDate: null };
        return {
            totalQuizzes: data.total_quizzes || 0,
            totalXP: data.total_xp || 0,
            accuracyPercentage: data.accuracy_percentage != null ? data.accuracy_percentage : (data.average_accuracy || 0),
            currentStreak: data.current_streak || 0,
            bestScore: data.best_score || 0,
            level: data.level || _calculateLevel(data.total_xp || 0),
            lastAttemptDate: data.last_attempt_date || null
        };
    },

    saveUserStats: async function (userId, stats) {
        const row = {
            user_id: userId,
            total_quizzes: stats.totalQuizzes,
            total_xp: stats.totalXP,
            accuracy_percentage: stats.accuracyPercentage,
            average_accuracy: stats.accuracyPercentage,
            current_streak: stats.currentStreak,
            best_score: stats.bestScore,
            level: stats.level,
            last_attempt_date: stats.lastAttemptDate
        };
        const { error } = await _sb.from('user_stats').upsert(row);
        return !error;
    },

    // ── Posts ────────────────────────────────────────────────────────────────

    getPosts: async function () {
        const { data, error } = await _sb.from('posts').select('*').order('created_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (p) {
            var rx = p.reactions || { like: [], love: [], laugh: [], helpful: [], dislike: [] };
            ['like', 'love', 'laugh', 'helpful', 'dislike'].forEach(function (k) {
                if (!Array.isArray(rx[k])) rx[k] = [];
            });
            return {
                id: p.id, userId: p.user_id, userName: p.user_name, content: p.content,
                type: p.type, tags: p.tags || [], reactions: rx,
                comments: p.comments || [], createdAt: p.created_at, updatedAt: p.updated_at,
                isAnonymous: !!(p.is_anonymous || (p.user_name === 'Anonymous' && p.user_id && p.user_id !== 'system'))
            };
        });
    },

    getLibraryFiles: async function (userId) {
        const { data, error } = await _sb.from('library_files').select('*').eq('user_id', userId).order('uploaded_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (f) {
            return {
                id: f.id,
                userId: f.user_id,
                fileName: f.file_name,
                fileUrl: f.file_url,
                fileSize: f.file_size,
                fileType: f.file_type,
                category: f.category,
                description: f.description,
                uploadedAt: f.uploaded_at
            };
        });
    },

    savePost: async function (post) {
        const row = {
            user_id: post.userId, user_name: post.userName, content: post.content,
            type: post.type || 'Discussion', tags: post.tags || [],
            reactions: post.reactions || { like: [], love: [], laugh: [], helpful: [], dislike: [] },
            comments: post.comments || [], updated_at: new Date().toISOString()
        };
        if (post.isAnonymous) row.is_anonymous = true;
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

    getUnreadNotificationCount: async function (userId) {
        const items = await SupabaseClient.getNotifications(userId);
        return items.filter(function (n) {
            return !n.read;
        }).length;
    },

    // ── Notepad ───────────────────────────────────────────────────────────────

    getNotepadEntries: async function (userId) {
        const { data, error } = await _sb.from('notepad_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (e) {
            return {
                id: e.id,
                userId: e.user_id,
                subject: e.subject || 'General',
                imageData: e.image_data,
                previewDataUrl: e.preview_data_url,
                drawDataUrl: e.draw_data_url,
                bgType: e.bg_type || 'white',
                createdAt: e.created_at
            };
        });
    },

    saveNotepadEntry: async function (entry) {
        const row = {
            user_id: entry.userId,
            subject: entry.subject || 'General',
            image_data: entry.imageData || '',
            preview_data_url: entry.previewDataUrl || entry.imageData || '',
            draw_data_url: entry.drawDataUrl || '',
            bg_type: entry.bgType || 'white'
        };
        if (entry.id) row.id = entry.id;
        const { data, error } = await _sb.from('notepad_entries').upsert(row).select().single();
        if (error || !data) return null;
        return {
            id: data.id,
            userId: data.user_id,
            subject: data.subject,
            imageData: data.image_data,
            previewDataUrl: data.preview_data_url,
            drawDataUrl: data.draw_data_url,
            bgType: data.bg_type,
            createdAt: data.created_at
        };
    },

    deleteNotepadEntry: async function (entryId) {
        const { error } = await _sb.from('notepad_entries').delete().eq('id', entryId);
        return !error;
    },

    // ── Standards library ─────────────────────────────────────────────────────

    getStandards: async function () {
        const { data, error } = await _sb.from('standards').select('*').order('created_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (r) {
            return {
                id: r.id,
                userId: r.user_id,
                title: r.title,
                description: r.description || '',
                subject: r.subject || 'General',
                link: r.link || '',
                fileName: r.file_name || '',
                fileUrl: r.file_url || '',
                fileData: r.file_data || '',
                createdAt: r.created_at
            };
        });
    },

    saveStandardResource: async function (resource) {
        const row = {
            user_id: resource.userId,
            title: resource.title,
            description: resource.description || '',
            subject: resource.subject || 'General',
            link: resource.link || '',
            file_name: resource.fileName || '',
            file_url: resource.fileUrl || '',
            file_data: resource.fileData || ''
        };
        if (resource.id) row.id = resource.id;
        const { data, error } = await _sb.from('standards').upsert(row).select().single();
        if (error || !data) return null;
        return {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            description: data.description,
            subject: data.subject,
            link: data.link,
            fileName: data.file_name,
            fileUrl: data.file_url,
            fileData: data.file_data,
            createdAt: data.created_at
        };
    },

    deleteStandard: async function (id) {
        const { error } = await _sb.from('standards').delete().eq('id', id);
        return !error;
    },

    // ── Groups ────────────────────────────────────────────────────────────────

    getGroups: async function () {
        const { data, error } = await _sb.from('groups').select('*').order('created_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (g) {
            return {
                id: g.id,
                name: g.name,
                subject: g.subject || 'General',
                createdBy: g.created_by,
                memberIds: Array.isArray(g.member_ids) ? g.member_ids : [],
                createdAt: g.created_at
            };
        });
    },

    saveGroup: async function (group) {
        const row = {
            name: group.name,
            subject: group.subject || 'General',
            created_by: group.createdBy,
            member_ids: group.memberIds || []
        };
        const { data, error } = await _sb.from('groups').insert(row).select().single();
        if (error || !data) return null;
        return {
            id: data.id,
            name: data.name,
            subject: data.subject,
            createdBy: data.created_by,
            memberIds: data.member_ids || [],
            createdAt: data.created_at
        };
    },

    addMemberToGroup: async function (groupId, userId) {
        const { data: group, error: fetchErr } = await _sb.from('groups').select('member_ids').eq('id', groupId).single();
        if (fetchErr || !group) return false;
        var members = Array.isArray(group.member_ids) ? group.member_ids.slice() : [];
        if (members.indexOf(userId) !== -1) return true;
        members.push(userId);
        const { error } = await _sb.from('groups').update({ member_ids: members }).eq('id', groupId);
        return !error;
    },

    getGroupMessages: async function (groupId) {
        const { data, error } = await _sb.from('group_messages').select('*').eq('group_id', groupId).order('created_at', { ascending: true });
        if (error || !data) return [];
        return data.map(function (m) {
            return {
                id: m.id,
                groupId: m.group_id,
                fromUserId: m.from_user_id,
                body: m.body,
                createdAt: m.created_at
            };
        });
    },

    saveGroupMessage: async function (msg) {
        const { data, error } = await _sb.from('group_messages').insert({
            group_id: msg.groupId,
            from_user_id: msg.fromUserId,
            body: msg.body,
            created_at: new Date().toISOString()
        }).select().single();
        if (error || !data) return null;
        return {
            id: data.id,
            groupId: data.group_id,
            fromUserId: data.from_user_id,
            body: data.body,
            createdAt: data.created_at
        };
    },

    // ── Flashcard daily progress ──────────────────────────────────────────────

    getFlashDailyProgress: async function (userId, subject, dateKey) {
        const { data, error } = await _sb.from('flashcard_daily').select('*')
            .eq('user_id', userId).eq('subject', subject).eq('date_key', dateKey).maybeSingle();
        if (error || !data) return { reviewed: 0, correct: 0, incorrect: 0 };
        return {
            reviewed: data.reviewed || 0,
            correct: data.correct || 0,
            incorrect: data.incorrect || 0
        };
    },

    recordFlashReview: async function (userId, subject, dateKey, correct) {
        const current = await SupabaseClient.getFlashDailyProgress(userId, subject, dateKey);
        const row = {
            user_id: userId,
            subject: subject,
            date_key: dateKey,
            reviewed: (current.reviewed || 0) + 1,
            correct: (current.correct || 0) + (correct ? 1 : 0),
            incorrect: (current.incorrect || 0) + (correct ? 0 : 1)
        };
        const { error } = await _sb.from('flashcard_daily').upsert(row);
        return !error;
    },

    resetFlashDaily: async function (userId, subject, dateKey) {
        const { error } = await _sb.from('flashcard_daily').upsert({
            user_id: userId,
            subject: subject,
            date_key: dateKey,
            reviewed: 0,
            correct: 0,
            incorrect: 0
        });
        return !error;
    },

    // ── Note PDFs (metadata + storage) ────────────────────────────────────────

    getPdfMetaList: async function (userId) {
        const { data, error } = await _sb.from('note_pdfs').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (m) {
            return {
                id: m.id,
                userId: m.user_id,
                name: m.name,
                subject: m.subject || 'General',
                createdAt: m.created_at,
                updatedAt: m.updated_at,
                lastOpenedAt: m.last_opened_at,
                sourceId: m.source_id,
                favorite: !!m.favorite,
                thumbnail: m.thumbnail || '',
                annotationCount: m.annotation_count || 0,
                isEdited: !!m.is_edited,
                storagePath: m.storage_path
            };
        });
    },

    savePdfMeta: async function (meta) {
        const now = new Date().toISOString();
        const row = {
            user_id: meta.userId,
            name: meta.name || 'Untitled.pdf',
            subject: meta.subject || 'General',
            storage_path: meta.storagePath || (meta.userId + '/' + meta.id + '.pdf'),
            thumbnail: meta.thumbnail || '',
            favorite: !!meta.favorite,
            annotation_count: typeof meta.annotationCount === 'number' ? meta.annotationCount : 0,
            is_edited: !!meta.isEdited,
            last_opened_at: meta.lastOpenedAt || null,
            source_id: meta.sourceId || null,
            updated_at: meta.updatedAt || now
        };
        if (meta.id) row.id = meta.id;
        if (!meta.id) row.created_at = meta.createdAt || now;
        const { data, error } = await _sb.from('note_pdfs').upsert(row).select().single();
        if (error || !data) return null;
        return {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            subject: data.subject,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            lastOpenedAt: data.last_opened_at,
            sourceId: data.source_id,
            favorite: !!data.favorite,
            thumbnail: data.thumbnail || '',
            annotationCount: data.annotation_count || 0,
            isEdited: !!data.is_edited,
            storagePath: data.storage_path
        };
    },

    deletePdfMeta: async function (fileId) {
        const { data: meta } = await _sb.from('note_pdfs').select('storage_path').eq('id', fileId).maybeSingle();
        if (meta && meta.storage_path) {
            await _sb.storage.from('note-pdfs').remove([meta.storage_path]);
        }
        await _sb.from('pdf_annotations').delete().eq('file_id', fileId);
        const { error } = await _sb.from('note_pdfs').delete().eq('id', fileId);
        return !error;
    },

    savePdfBinary: async function (entry) {
        const path = entry.userId + '/' + entry.id + '.pdf';
        const { error } = await _sb.storage.from('note-pdfs').upload(path, entry.blob, {
            upsert: true,
            contentType: entry.blob.type || 'application/pdf'
        });
        if (error) return null;
        return path;
    },

    getPdfBinary: async function (id) {
        const { data: meta, error: metaErr } = await _sb.from('note_pdfs').select('id, user_id, name, storage_path').eq('id', id).single();
        if (metaErr || !meta) return null;
        const { data: blob, error } = await _sb.storage.from('note-pdfs').download(meta.storage_path);
        if (error || !blob) return null;
        return {
            id: meta.id,
            userId: meta.user_id,
            name: meta.name,
            blob: blob
        };
    },

    deletePdfBinary: async function (id) {
        return SupabaseClient.deletePdfMeta(id);
    },

    getPdfAnnotationsV2: async function (fileId) {
        const { data, error } = await _sb.from('pdf_annotations').select('pages, updated_at').eq('file_id', fileId).maybeSingle();
        if (error || !data) return { pages: {}, updatedAt: null };
        return { pages: data.pages || {}, updatedAt: data.updated_at || null };
    },

    savePdfAnnotationsV2: async function (fileId, payload, userId) {
        const row = {
            file_id: fileId,
            user_id: userId,
            pages: payload && payload.pages ? payload.pages : {},
            updated_at: new Date().toISOString()
        };
        const { error } = await _sb.from('pdf_annotations').upsert(row);
        return !error;
    },

    deletePdfAnnotationsV2: async function (fileId) {
        const { error } = await _sb.from('pdf_annotations').delete().eq('file_id', fileId);
        return !error;
    },

    // ── Accoly standalone PDF annotations ───────────────────────────────────

    getAccolyAnnotations: async function (userId, pdfName) {
        const { data, error } = await _sb.from('accoly_annotations').select('annotations')
            .eq('user_id', userId).eq('pdf_name', pdfName).maybeSingle();
        if (error || !data) return {};
        return data.annotations || {};
    },

    saveAccolyAnnotations: async function (userId, pdfName, annotations) {
        const { error } = await _sb.from('accoly_annotations').upsert({
            user_id: userId,
            pdf_name: pdfName,
            annotations: annotations || {},
            saved_at: new Date().toISOString()
        });
        return !error;
    }
};