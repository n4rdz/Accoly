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
        const now = new Date().toISOString();
        const score = typeof attempt.score === 'number' ? attempt.score : 0;
        const timeTaken = attempt.timeTaken != null ? attempt.timeTaken : null;
        var accuracyPct = score;
        if (window.AccolyStats && typeof AccolyStats.computeAttemptAccuracy === 'function') {
            accuracyPct = AccolyStats.computeAttemptAccuracy({
                score: score,
                totalQuestions: attempt.totalQuestions || 10,
                timeTaken: timeTaken || 0
            });
        }
        const row = {
            user_id: attempt.userId,
            subject: attempt.subject || '',
            difficulty: attempt.difficulty || '',
            score: score,
            correct_answers: attempt.correctAnswers || 0,
            total_questions: attempt.totalQuestions || 0,
            xp_earned: attempt.xpEarned || 0,
            accuracy_percentage: accuracyPct,
            is_valid: true,
            created_at: now,
            completed_at: now
        };
        if (timeTaken != null) {
            row.time_taken = timeTaken;
            row.time_spent = timeTaken;
        }
        var result = await _sb.from('quiz_attempts').insert(row).select().single();
        if (result.error) {
            var legacyRow = {
                user_id: attempt.userId,
                score: score,
                total_questions: attempt.totalQuestions || 0,
                time_spent: timeTaken,
                completed_at: now
            };
            if (attempt.moduleId) legacyRow.module_id = attempt.moduleId;
            result = await _sb.from('quiz_attempts').insert(legacyRow).select().single();
        }
        if (result.error) {
            console.error('[Accoly] saveQuizAttempt failed:', result.error.message, result.error.details || '', result.error.hint || '', result.error.code || '');
            return { error: result.error };
        }
        if (!result.data) return null;
        return result.data;
    },

    getQuizAttempts: async function (userId) {
        const { data, error } = await _sb.from('quiz_attempts').select('*').eq('user_id', userId);
        if (error) {
            console.error('[Accoly] getQuizAttempts failed:', error.message);
            return [];
        }
        if (!data) return [];
        var sorted = data.slice().sort(function (a, b) {
            var ta = new Date(a.created_at || a.completed_at || 0).getTime();
            var tb = new Date(b.created_at || b.completed_at || 0).getTime();
            return tb - ta;
        });
        return sorted.map(function (a) {
            return {
                id: a.id,
                userId: a.user_id,
                subject: a.subject,
                difficulty: a.difficulty,
                score: a.score,
                correctAnswers: a.correct_answers,
                totalQuestions: a.total_questions,
                xpEarned: a.xp_earned || 0,
                timeTaken: a.time_taken || a.time_spent || 0,
                timestamp: a.created_at || a.completed_at
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
        const { data, error } = await _sb.from('user_stats').select('*').eq('user_id', userId).maybeSingle();
        if (error || !data) return { totalQuizzes: 0, totalXP: 0, accuracyPercentage: 0, currentStreak: 0, bestScore: 0, level: 1, lastAttemptDate: null };
        return {
            totalQuizzes: data.total_quizzes || 0,
            totalXP: data.total_xp || 0,
            accuracyPercentage: data.accuracy_percentage != null ? data.accuracy_percentage : (data.average_accuracy || 0),
            currentStreak: data.current_streak || 0,
            bestScore: data.best_score || 0,
            level: data.level || Storage.calculateLevel(data.total_xp || 0),
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
        if (!meta.id) {
            meta.id = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : 'pdf-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
        }
        const storagePath = meta.storagePath || (meta.userId + '/' + meta.id + '.pdf');
        const row = {
            id: meta.id,
            user_id: meta.userId,
            name: meta.name || 'Untitled.pdf',
            subject: meta.subject || 'General',
            storage_path: storagePath,
            thumbnail: meta.thumbnail || '',
            favorite: !!meta.favorite,
            annotation_count: typeof meta.annotationCount === 'number' ? meta.annotationCount : 0,
            is_edited: !!meta.isEdited,
            last_opened_at: meta.lastOpenedAt || null,
            source_id: meta.sourceId || null,
            updated_at: meta.updatedAt || now
        };
        if (!meta.createdAt) row.created_at = now;
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
        await _sb.from('note_pdfs').update({ storage_path: path }).eq('id', entry.id);
        return path;
    },

    getPdfBinary: async function (id) {
        const { data: meta, error: metaErr } = await _sb.from('note_pdfs').select('id, user_id, name, storage_path').eq('id', id).single();
        if (metaErr || !meta) return null;
        const storagePath = meta.storage_path || (meta.user_id + '/' + meta.id + '.pdf');
        const { data: blob, error } = await _sb.storage.from('note-pdfs').download(storagePath);
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

    // ── Notepad ───────────────────────────────────────────────────────────────

    getNotepadEntries: async function (userId) {
        const { data, error } = await _sb.from('notepad_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (e) {
            return {
                id: e.id,
                userId: e.user_id,
                subject: e.subject || 'FAR',
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
            user_id:         entry.userId,
            subject:         entry.subject  || 'FAR',
            image_data:      entry.imageData      || null,
            preview_data_url: entry.previewDataUrl || null,
            draw_data_url:   entry.drawDataUrl    || null,
            bg_type:         entry.bgType         || 'white'
        };
        if (entry.id) {
            // Update existing entry
            const { data, error } = await _sb.from('notepad_entries').update(row).eq('id', entry.id).select().single();
            if (error || !data) return null;
            return { id: data.id, ...entry };
        } else {
            // Insert new entry
            const { data, error } = await _sb.from('notepad_entries').insert(row).select().single();
            if (error || !data) return null;
            return { id: data.id, ...entry };
        }
    },

    // ── Flashcard daily progress ─────────────────────────────────────────────

    getFlashDailyProgress: async function (userId, subject, dateKey) {
        const { data, error } = await _sb.from('flashcard_daily')
            .select('*')
            .eq('user_id', userId)
            .eq('subject', subject)
            .eq('date_key', dateKey)
            .maybeSingle();
        if (error || !data) return { reviewed: 0, correct: 0, incorrect: 0 };
        return { reviewed: data.reviewed || 0, correct: data.correct || 0, incorrect: data.incorrect || 0 };
    },

    saveFlashDailyProgress: async function (userId, subject, dateKey, progress) {
        const { error } = await _sb.from('flashcard_daily').upsert({
            user_id: userId,
            subject: subject,
            date_key: dateKey,
            reviewed: progress.reviewed || 0,
            correct: progress.correct || 0,
            incorrect: progress.incorrect || 0
        });
        return !error;
    },

    deleteNotepadEntry: async function (id) {
        const { error } = await _sb.from('notepad_entries').delete().eq('id', id);
        return !error;
    },

    // ── Groups (messages) ─────────────────────────────────────────────────────

    getGroupsForUser: async function (userId) {
        const { data, error } = await _sb.from('groups').select('*').contains('member_ids', [userId]).order('created_at', { ascending: false });
        if (error || !data) return [];
        return data.map(function (g) {
            return {
                id: g.id,
                name: g.name,
                subject: g.subject || 'FAR',
                createdBy: g.created_by,
                memberIds: Array.isArray(g.member_ids) ? g.member_ids : [],
                createdAt: g.created_at
            };
        });
    },

    saveGroup: async function (group) {
        const row = {
            name: group.name,
            subject: group.subject || 'FAR',
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
        const { data: group, error: fetchErr } = await _sb.from('groups').select('member_ids, created_by').eq('id', groupId).single();
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
    }
};

// Expose globally
window.SupabaseClient = SupabaseClient;