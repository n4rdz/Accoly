// ============================================
// LOCAL STORAGE MANAGEMENT
// ============================================

const Storage = {
    // Simple password hashing for client-side (in production, use server-side hashing)
    hashPassword: async function(password) {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + 'accoly-salt-2026');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        // Fallback for browsers without crypto.subtle
        return btoa(password + 'accoly-salt-2026').replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
    },

    verifyPassword: async function(password, hashedPassword) {
        const hashed = await this.hashPassword(password);
        return hashed === hashedPassword;
    },

    normalizeUserRecord: function (user) {
        var u = user && typeof user === 'object' ? Object.assign({}, user) : {};
        delete u.studentId;
        delete u.student_id;
        delete u.schoolId;
        u.id = u.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8));
        u.fullName = u.fullName || u.name || 'Student';
        u.email = (u.email || '').toLowerCase().trim();
        u.password = u.password || '';
        u.role = u.role || 'basic';
        u.createdAt = u.createdAt || new Date().toISOString();
        return u;
    },

    sanitizeUsers: function () {
        var users = JSON.parse(localStorage.getItem('users') || '[]');
        if (!Array.isArray(users)) users = [];
        users = users.map(function (u) { return Storage.normalizeUserRecord(u); });
        localStorage.setItem('users', JSON.stringify(users));
        var current = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (current) {
            current = Storage.normalizeUserRecord(current);
            localStorage.setItem('currentUser', JSON.stringify(current));
        }
    },
    // --------------------------------------------
    // PDF IndexedDB + metadata helpers (Notes v2)
    // --------------------------------------------
    pdfDbName: 'accolyPdfDB',
    pdfDbVersion: 1,

    openPdfDb: function () {
        return new Promise(function (resolve, reject) {
            var req = indexedDB.open(Storage.pdfDbName, Storage.pdfDbVersion);
            req.onupgradeneeded = function (ev) {
                var db = ev.target.result;
                if (!db.objectStoreNames.contains('pdfFiles')) {
                    db.createObjectStore('pdfFiles', { keyPath: 'id' });
                }
            };
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { reject(req.error || new Error('PDF DB open failed')); };
        });
    },

    getPdfMetaList: function (userId) {
        var list = JSON.parse(localStorage.getItem('notePdfMetaV2') || '[]');
        if (!Array.isArray(list)) list = [];
        if (userId) {
            list = list.filter(function (x) { return x && x.userId === userId; });
        }
        return list;
    },

    savePdfMeta: function (meta) {
        var list = JSON.parse(localStorage.getItem('notePdfMetaV2') || '[]');
        if (!Array.isArray(list)) list = [];
        var now = new Date().toISOString();
        var record = {
            id: meta.id || Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
            userId: meta.userId,
            name: meta.name || 'Untitled.pdf',
            subject: meta.subject || 'General',
            createdAt: meta.createdAt || now,
            updatedAt: meta.updatedAt || now,
            lastOpenedAt: meta.lastOpenedAt || null,
            sourceId: meta.sourceId || null,
            favorite: !!meta.favorite,
            thumbnail: meta.thumbnail || '',
            annotationCount: typeof meta.annotationCount === 'number' ? meta.annotationCount : 0,
            isEdited: !!meta.isEdited
        };
        var idx = list.findIndex(function (x) { return x && x.id === record.id; });
        if (idx > -1) list[idx] = record;
        else list.push(record);
        localStorage.setItem('notePdfMetaV2', JSON.stringify(list));
        return record;
    },

    deletePdfMeta: function (fileId) {
        var list = JSON.parse(localStorage.getItem('notePdfMetaV2') || '[]');
        if (!Array.isArray(list)) list = [];
        list = list.filter(function (x) { return x && x.id !== fileId; });
        localStorage.setItem('notePdfMetaV2', JSON.stringify(list));
    },

    getPdfAnnotationsV2: function (fileId) {
        var map = JSON.parse(localStorage.getItem('pdfAnnotationsV2') || '{}');
        if (!map || typeof map !== 'object') map = {};
        return map[fileId] || { pages: {}, updatedAt: null };
    },

    savePdfAnnotationsV2: function (fileId, payload) {
        var map = JSON.parse(localStorage.getItem('pdfAnnotationsV2') || '{}');
        if (!map || typeof map !== 'object') map = {};
        map[fileId] = {
            pages: payload && payload.pages ? payload.pages : {},
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('pdfAnnotationsV2', JSON.stringify(map));
        return map[fileId];
    },

    deletePdfAnnotationsV2: function (fileId) {
        var map = JSON.parse(localStorage.getItem('pdfAnnotationsV2') || '{}');
        if (!map || typeof map !== 'object') map = {};
        delete map[fileId];
        localStorage.setItem('pdfAnnotationsV2', JSON.stringify(map));
    },

    savePdfBinary: async function (entry) {
        var db = await Storage.openPdfDb();
        return new Promise(function (resolve, reject) {
            var tx = db.transaction('pdfFiles', 'readwrite');
            var store = tx.objectStore('pdfFiles');
            var req = store.put({
                id: entry.id,
                userId: entry.userId,
                name: entry.name,
                blob: entry.blob,
                createdAt: entry.createdAt || new Date().toISOString()
            });
            req.onsuccess = function () { resolve(true); };
            req.onerror = function () { reject(req.error || new Error('Save PDF failed')); };
        });
    },

    getPdfBinary: async function (id) {
        var db = await Storage.openPdfDb();
        return new Promise(function (resolve, reject) {
            var tx = db.transaction('pdfFiles', 'readonly');
            var store = tx.objectStore('pdfFiles');
            var req = store.get(id);
            req.onsuccess = function () { resolve(req.result || null); };
            req.onerror = function () { reject(req.error || new Error('Read PDF failed')); };
        });
    },

    deletePdfBinary: async function (id) {
        var db = await Storage.openPdfDb();
        return new Promise(function (resolve, reject) {
            var tx = db.transaction('pdfFiles', 'readwrite');
            var store = tx.objectStore('pdfFiles');
            var req = store.delete(id);
            req.onsuccess = function () { resolve(true); };
            req.onerror = function () { reject(req.error || new Error('Delete PDF failed')); };
        });
    },
    // Users
    saveUser: function(user) {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(this.normalizeUserRecord(user));
        localStorage.setItem('users', JSON.stringify(users));
    },

    updateUser: function (user) {
        var users = JSON.parse(localStorage.getItem('users') || '[]');
        user = this.normalizeUserRecord(user);
        var idx = users.findIndex(function (u) { return u.id === user.id; });
        if (idx > -1) {
            users[idx] = user;
        } else {
            users.push(user);
        }
        localStorage.setItem('users', JSON.stringify(users));
        return user;
    },

    getUserByEmail: function(email) {
        this.sanitizeUsers();
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(u => u.email === String(email || '').toLowerCase().trim());
    },

    getCurrentUser: function() {
        this.sanitizeUsers();
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    },

    setCurrentUser: function(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    },

    logout: function() {
        localStorage.removeItem('currentUser');
    },

    // Messages: { id, fromUserId, toUserId, body, createdAt }
    getMessages: function () {
        return JSON.parse(localStorage.getItem('messages') || '[]');
    },

    saveMessage: function (msg) {
        var list = JSON.parse(localStorage.getItem('messages') || '[]');
        var record = {
            id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
            fromUserId: msg.fromUserId,
            toUserId: msg.toUserId,
            body: msg.body,
            createdAt: msg.createdAt || new Date().toISOString()
        };
        list.push(record);
        localStorage.setItem('messages', JSON.stringify(list));
        return record;
    },

    getConversation: function (userA, userB) {
        return this.getMessages()
            .filter(function (m) {
                return (
                    (m.fromUserId === userA && m.toUserId === userB) ||
                    (m.fromUserId === userB && m.toUserId === userA)
                );
            })
            .sort(function (a, b) {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });
    },

    // Groups: { id, name, subject, createdBy, memberIds[], createdAt }
    getGroups: function () {
        return JSON.parse(localStorage.getItem('groups') || '[]');
    },

    saveGroup: function (group) {
        var list = JSON.parse(localStorage.getItem('groups') || '[]');
        var record = {
            id: group.id || Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
            name: group.name,
            subject: group.subject || '',
            createdBy: group.createdBy,
            memberIds: Array.isArray(group.memberIds) ? group.memberIds.slice() : [],
            createdAt: group.createdAt || new Date().toISOString()
        };
        var idx = list.findIndex(function (g) { return g.id === record.id; });
        if (idx > -1) list[idx] = record;
        else list.push(record);
        localStorage.setItem('groups', JSON.stringify(list));
        return record;
    },

    addMemberToGroup: function (groupId, userId) {
        var list = JSON.parse(localStorage.getItem('groups') || '[]');
        var g = list.find(function (x) { return x.id === groupId; });
        if (!g) return false;
        g.memberIds = Array.isArray(g.memberIds) ? g.memberIds : [];
        if (g.memberIds.indexOf(userId) === -1) g.memberIds.push(userId);
        localStorage.setItem('groups', JSON.stringify(list));
        return true;
    },

    // Group messages: { id, groupId, fromUserId, body, createdAt }
    getGroupMessages: function () {
        return JSON.parse(localStorage.getItem('groupMessages') || '[]');
    },

    saveGroupMessage: function (msg) {
        var list = JSON.parse(localStorage.getItem('groupMessages') || '[]');
        var record = {
            id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
            groupId: msg.groupId,
            fromUserId: msg.fromUserId,
            body: msg.body,
            createdAt: msg.createdAt || new Date().toISOString()
        };
        list.push(record);
        localStorage.setItem('groupMessages', JSON.stringify(list));
        return record;
    },

    getGroupConversation: function (groupId) {
        return this.getGroupMessages()
            .filter(function (m) { return m.groupId === groupId; })
            .sort(function (a, b) { return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); });
    },

    // Quiz Data
    saveQuizAttempt: function(attempt) {
        let attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
        attempt.id = Date.now().toString();
        attempt.timestamp = new Date().toISOString();
        attempts.push(attempt);
        localStorage.setItem('quizAttempts', JSON.stringify(attempts));
        
        // Update user stats
        this.updateUserStats(attempt);
        return attempt;
    },

    getQuizAttempts: function(userId = null) {
        let attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
        if (userId) {
            return attempts.filter(a => a.userId === userId);
        }
        return attempts;
    },

    // Notes
    saveNote: function(note) {
        let notes = JSON.parse(localStorage.getItem('notes') || '[]');
        note.id = note.id || Date.now().toString();
        note.createdAt = note.createdAt || new Date().toISOString();
        note.updatedAt = new Date().toISOString();
        
        const index = notes.findIndex(n => n.id === note.id);
        if (index > -1) {
            notes[index] = note;
        } else {
            notes.push(note);
        }
        localStorage.setItem('notes', JSON.stringify(notes));
        return note;
    },

    getNotes: function(userId = null) {
        let notes = JSON.parse(localStorage.getItem('notes') || '[]');
        if (userId) {
            return notes.filter(n => n.userId === userId);
        }
        return notes;
    },

    deleteNote: function(noteId) {
        let notes = JSON.parse(localStorage.getItem('notes') || '[]');
        notes = notes.filter(n => n.id !== noteId);
        localStorage.setItem('notes', JSON.stringify(notes));
    },

    // User Stats
    updateUserStats: function(quizAttempt) {
        const user = this.getCurrentUser();
        if (!user) return;

        let stats = JSON.parse(localStorage.getItem('userStats') || '{}');
        if (!stats[user.id]) {
            stats[user.id] = {
                totalQuizzes: 0,
                totalXP: 0,
                accuracyPercentage: 0,
                currentStreak: 0,
                bestScore: 0,
                level: 1,
                lastAttemptDate: null
            };
        }

        const userStats = stats[user.id];
        
        // Calculate XP
        const xpEarned = this.calculateXP(quizAttempt);
        userStats.totalXP += xpEarned;
        userStats.totalQuizzes += 1;
        
        // Update accuracy
        const allAttempts = this.getQuizAttempts(user.id);
        const totalCorrect = allAttempts.reduce((sum, a) => sum + a.correctAnswers, 0);
        const totalQuestions = allAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);
        userStats.accuracyPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        
        // Update best score
        const score = quizAttempt.score;
        if (score > userStats.bestScore) {
            userStats.bestScore = score;
        }

        // Update level
        userStats.level = this.calculateLevel(userStats.totalXP);
        
        // Update streak
        userStats.lastAttemptDate = new Date().toDateString();
        
        localStorage.setItem('userStats', JSON.stringify(stats));
    },

    getUserStats: function(userId) {
        let stats = JSON.parse(localStorage.getItem('userStats') || '{}');
        return stats[userId] || {
            totalQuizzes: 0,
            totalXP: 0,
            accuracyPercentage: 0,
            currentStreak: 0,
            bestScore: 0,
            level: 1,
            lastAttemptDate: null
        };
    },

    calculateXP: function(quizAttempt) {
        let baseXP = 0;
        
        // Base XP by difficulty
        if (quizAttempt.difficulty === 'Easy') baseXP = 50;
        if (quizAttempt.difficulty === 'Medium' || quizAttempt.difficulty === 'Intermediate') baseXP = 100;
        if (quizAttempt.difficulty === 'Hard') baseXP = 200;
        if (quizAttempt.difficulty === 'Elite' || quizAttempt.difficulty === 'Super Hard') baseXP = 300;

        // Bonus for accuracy
        const accuracy = (quizAttempt.correctAnswers / quizAttempt.totalQuestions) * 100;
        if (accuracy === 100) baseXP += 150;
        else if (accuracy >= 90) baseXP += 75;
        else if (accuracy >= 80) baseXP += 25;
        else if (accuracy < 70) return 0; // No XP for failing

        return Math.round(baseXP);
    },

    calculateLevel: function(totalXP) {
        if (totalXP < 500) return 1;
        if (totalXP < 1500) return 2;
        if (totalXP < 3500) return 3;
        if (totalXP < 7000) return 4;
        return 5;
    },

    getLevelName: function(level) {
        const names = {
            1: 'Beginner Accountant',
            2: 'Junior Analyst',
            3: 'Senior Reviewer',
            4: 'Audit Specialist',
            5: 'CPA Elite'
        };
        return names[level] || 'Student';
    },

    // Notepad (saved canvas images per user)
    getNotepadEntries: function(userId = null) {
        let entries = JSON.parse(localStorage.getItem('notepadData') || '[]');
        if (userId) {
            return entries.filter(e => e.userId === userId);
        }
        return entries;
    },

    saveNotepadEntry: function(entry) {
        let entries = JSON.parse(localStorage.getItem('notepadData') || '[]');
        entry.id = entry.id || Date.now().toString();
        entry.createdAt = entry.createdAt || new Date().toISOString();
        const index = entries.findIndex(e => e.id === entry.id);
        if (index > -1) {
            entries[index] = entry;
        } else {
            entries.push(entry);
        }
        localStorage.setItem('notepadData', JSON.stringify(entries));
        return entry;
    },

    deleteNotepadEntry: function(entryId) {
        let entries = JSON.parse(localStorage.getItem('notepadData') || '[]');
        entries = entries.filter(e => e.id !== entryId);
        localStorage.setItem('notepadData', JSON.stringify(entries));
    },

    // Standards library (shared resources)
    getStandards: function() {
        return JSON.parse(localStorage.getItem('standards') || '[]');
    },

    saveStandardResource: function(resource) {
        let list = JSON.parse(localStorage.getItem('standards') || '[]');
        resource.id = resource.id || Date.now().toString();
        resource.createdAt = resource.createdAt || new Date().toISOString();
        const index = list.findIndex(r => r.id === resource.id);
        if (index > -1) {
            list[index] = resource;
        } else {
            list.push(resource);
        }
        localStorage.setItem('standards', JSON.stringify(list));
        return resource;
    },

    deleteStandard: function(id) {
        let list = JSON.parse(localStorage.getItem('standards') || '[]');
        list = list.filter(r => r.id !== id);
        localStorage.setItem('standards', JSON.stringify(list));
    },

    /** Senior Reviewer (level 3+) or explicit profile flag may upload standards */
    canUpload: function(user) {
        if (!user) return false;
        if (user.allowStandardsUpload === true) return true;
        const stats = this.getUserStats(user.id);
        return stats.level >= 3;
    },

    // Notifications: { id, userId, message, date (ISO), read }
    getNotificationsForUser: function(userId) {
        let list = JSON.parse(localStorage.getItem('notifications') || '[]');
        return list
            .filter(function(n) { return n.userId === userId; })
            .sort(function(a, b) {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
    },

    addNotification: function(entry) {
        let list = JSON.parse(localStorage.getItem('notifications') || '[]');
        const n = {
            id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 9),
            userId: entry.userId,
            message: entry.message,
            date: entry.date || new Date().toISOString(),
            read: false
        };
        list.push(n);
        localStorage.setItem('notifications', JSON.stringify(list));
        return n;
    },

    markAllNotificationsRead: function(userId) {
        let list = JSON.parse(localStorage.getItem('notifications') || '[]');
        let changed = false;
        list.forEach(function(n) {
            if (n.userId === userId && !n.read) {
                n.read = true;
                changed = true;
            }
        });
        if (changed) {
            localStorage.setItem('notifications', JSON.stringify(list));
        }
    },

    getUnreadNotificationCount: function(userId) {
        return this.getNotificationsForUser(userId).filter(function(n) {
            return !n.read;
        }).length;
    },

    // Community posts: { id, userId, type, content, tags[], reactions, createdAt, attachment }
    getPosts: function () {
        var list = JSON.parse(localStorage.getItem('posts') || '[]');
        if (!Array.isArray(list)) list = [];
        return list
            .map(function (p) { return Storage.normalizePost(p); })
            .sort(function (a, b) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    },

    savePost: function (post) {
        var list = JSON.parse(localStorage.getItem('posts') || '[]');
        if (!Array.isArray(list)) list = [];
        post = Storage.normalizePost(post);
        var index = list.findIndex(function (p) { return p && p.id === post.id; });
        if (index > -1) list[index] = post;
        else list.push(post);
        localStorage.setItem('posts', JSON.stringify(list));
        return post;
    },

    deletePost: function (postId) {
        var list = JSON.parse(localStorage.getItem('posts') || '[]');
        list = list.filter(function (p) { return p.id !== postId; });
        localStorage.setItem('posts', JSON.stringify(list));
    },

    /**
     * Community V2 normalizer.
     *
     * Target shape:
     * {
     *   id, userId, userName, content, type, tags:[],
     *   reactions: { like:[], love:[], laugh:[], helpful:[] },
     *   comments: [{id,userId,userName,content,createdAt}],
     *   createdAt, updatedAt?
     * }
     */
    normalizePost: function (post) {
        var p = post && typeof post === 'object' ? post : {};
        p.id = p.id || Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8);
        p.createdAt = p.createdAt || new Date().toISOString();
        p.updatedAt = p.updatedAt || p.createdAt;
        p.content = p.content || '';
        p.type = p.type || 'Discussion';
        p.tags = Array.isArray(p.tags) ? p.tags.filter(Boolean) : [];

        // Back-compat: older post shape used attachment / anonymous / { like, dislike, emojis:{} }
        // We keep unknown keys, but normalize reactions/comments for Community V2.
        var rx = p.reactions || {};
        var v2 = { like: [], love: [], laugh: [], helpful: [], dislike: [] };
        // If already V2 arrays, keep.
        ['like', 'love', 'laugh', 'helpful', 'dislike'].forEach(function (k) {
            if (Array.isArray(rx[k])) v2[k] = rx[k].filter(Boolean);
        });
        // If legacy numeric counts exist, preserve them as "legacy tokens" so totals don't drop.
        if (typeof rx.like === 'number') {
            for (var i = 0; i < rx.like; i++) v2.like.push('legacy-like-' + i);
        }
        if (typeof rx.dislike === 'number') {
            for (var j = 0; j < rx.dislike; j++) v2.dislike.push('legacy-dislike-' + j);
        }
        if (rx.emojis && typeof rx.emojis === 'object') {
            // Map old emoji counts into closest V2 reaction buckets.
            Object.keys(rx.emojis).forEach(function (emoji) {
                var count = rx.emojis[emoji] || 0;
                var bucket = 'like';
                if (emoji === '💡') bucket = 'helpful';
                else if (emoji === '🔥' || emoji === '👏') bucket = 'love';
                else if (emoji === '🤝') bucket = 'like';
                else bucket = 'laugh';
                for (var k = 0; k < count; k++) v2[bucket].push('legacy-emoji-' + emoji + '-' + k);
            });
        }
        p.reactions = v2;
        p.isAnonymous = !!(p.isAnonymous || p.anonymous);

        // Comments
        if (!Array.isArray(p.comments)) p.comments = [];
        p.comments = p.comments
            .filter(function (c) { return c && typeof c === 'object'; })
            .map(function (c) {
                return {
                    id: c.id || Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
                    userId: c.userId || '',
                    userName: c.userName || c.user || c.name || 'Student',
                    content: (c.content || '').toString(),
                    createdAt: c.createdAt || new Date().toISOString()
                };
            });

        // Ensure userName exists (used for display even if user later changes name)
        if (!p.userName) {
            var users = JSON.parse(localStorage.getItem('users') || '[]');
            var found = Array.isArray(users) ? users.find(function (u) { return u && u.id === p.userId; }) : null;
            p.userName = (found && (found.fullName || found.name)) || p.userName || 'Student';
        }

        return p;
    },

    // PDFs: { id, userId, fileName, dataUrl, createdAt }
    getNotePdfs: function (userId) {
        var list = JSON.parse(localStorage.getItem('notePdfs') || '[]');
        if (!Array.isArray(list)) list = [];
        if (userId) return list.filter(function (p) { return p.userId === userId; });
        return list;
    },

    saveNotePdf: function (pdf) {
        var list = JSON.parse(localStorage.getItem('notePdfs') || '[]');
        if (!Array.isArray(list)) list = [];
        var record = {
            id: pdf.id || Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
            userId: pdf.userId,
            fileName: pdf.fileName || 'document.pdf',
            dataUrl: pdf.dataUrl,
            createdAt: pdf.createdAt || new Date().toISOString()
        };
        var idx = list.findIndex(function (x) { return x && x.id === record.id; });
        if (idx > -1) list[idx] = record;
        else list.push(record);
        localStorage.setItem('notePdfs', JSON.stringify(list));
        return record;
    },

    deleteNotePdf: function (pdfId) {
        var list = JSON.parse(localStorage.getItem('notePdfs') || '[]');
        if (!Array.isArray(list)) list = [];
        list = list.filter(function (p) { return p && p.id !== pdfId; });
        localStorage.setItem('notePdfs', JSON.stringify(list));
        // Also remove annotations
        var ann = JSON.parse(localStorage.getItem('pdfAnnotations') || '[]');
        if (!Array.isArray(ann)) ann = [];
        ann = ann.filter(function (a) { return a && a.pdfId !== pdfId; });
        localStorage.setItem('pdfAnnotations', JSON.stringify(ann));
    },

    // PDF annotations: { id, userId, pdfId, overlayDataUrl, stickyNotes:[], updatedAt, createdAt }
    getPdfAnnotation: function (userId, pdfId) {
        var list = JSON.parse(localStorage.getItem('pdfAnnotations') || '[]');
        if (!Array.isArray(list)) list = [];
        return list.find(function (a) { return a && a.userId === userId && a.pdfId === pdfId; }) || null;
    },

    savePdfAnnotation: function (ann) {
        var list = JSON.parse(localStorage.getItem('pdfAnnotations') || '[]');
        if (!Array.isArray(list)) list = [];
        var record = {
            id: ann.id || Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
            userId: ann.userId,
            pdfId: ann.pdfId,
            overlayDataUrl: ann.overlayDataUrl || '',
            stickyNotes: Array.isArray(ann.stickyNotes) ? ann.stickyNotes : [],
            createdAt: ann.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        var idx = list.findIndex(function (x) { return x && x.id === record.id; });
        if (idx > -1) list[idx] = record;
        else list.push(record);
        localStorage.setItem('pdfAnnotations', JSON.stringify(list));
        return record;
    },

    // Flashcards with performance optimization
    getFlashcards: function () {
        try {
            var data = localStorage.getItem('flashcards');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error parsing flashcards:', error);
            return [];
        }
    },

    getFlashcardsBySubject: function (subject) {
        var user = this.getCurrentUser();
        var cards = this.getFlashcards().filter(function (c) {
            return c.subject === subject && (c.userId === user.id || c.userId === 'seed');
        });
        return cards;
    },

    saveFlashcard: function (card) {
        var list = JSON.parse(localStorage.getItem('flashcards') || '[]');
        card.id = card.id || Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8);
        card.createdAt = card.createdAt || new Date().toISOString();
        card.confusionCount = card.confusionCount || 0;
        var idx = list.findIndex(function (x) { return x.id === card.id; });
        if (idx > -1) list[idx] = card;
        else list.push(card);
        localStorage.setItem('flashcards', JSON.stringify(list));
        return card;
    },

    getFlashDailyProgress: function (userId, subject, dateKey) {
        var data = JSON.parse(localStorage.getItem('flashcardDaily') || '{}');
        var key = userId + '|' + subject + '|' + dateKey;
        if (!data[key]) data[key] = { reviewed: 0, correct: 0, incorrect: 0 };
        return data[key];
    },

    recordFlashReview: function (userId, subject, dateKey, correct) {
        var data = JSON.parse(localStorage.getItem('flashcardDaily') || '{}');
        var key = userId + '|' + subject + '|' + dateKey;
        if (!data[key]) data[key] = { reviewed: 0, correct: 0, incorrect: 0 };
        data[key].reviewed += 1;
        if (correct) data[key].correct += 1;
        else data[key].incorrect += 1;
        localStorage.setItem('flashcardDaily', JSON.stringify(data));
    },

    resetFlashDaily: function (userId, subject, dateKey) {
        var data = JSON.parse(localStorage.getItem('flashcardDaily') || '{}');
        var key = userId + '|' + subject + '|' + dateKey;
        data[key] = { reviewed: 0, correct: 0, incorrect: 0 };
        localStorage.setItem('flashcardDaily', JSON.stringify(data));
    }
};

/** Standalone helper for permission checks (Standards upload). */
function canUpload(user) {
    return Storage.canUpload(user);
}
