// ============================================
// STANDARDS LIBRARY
// ============================================

var STD_SUBJECTS = ['FAR', 'AFAR', 'MS', 'AUD', 'RFBT', 'TAX'];

function stdSubjectLabel(code) {
    return window.AccolyStats ? AccolyStats.getSubjectLabel(code) : code;
}

var stdState = {
    filterSubject: 'all',
    search: '',
    resources: []
};

document.addEventListener('DOMContentLoaded', function () {
    if (window.__authReady) {
        initStandards();
    } else {
        window.addEventListener('authReady', initStandards);
    }
});

function initStandards() {
    var user = Storage.getCurrentUser();
    if (!user) return; // auth.js already redirected

    initFilters();
    initSubjectSelect();
    initUploadUi(user);
    bindEvents();
    loadStandardsFromServer();
}

function loadStandardsFromServer() {
    SupabaseClient.getStandards()
        .then(function (list) {
            stdState.resources = list || [];
            renderStandards();
        })
        .catch(function () {
            stdState.resources = [];
            renderStandards();
        });
}

function initFilters() {
    var container = document.getElementById('stdSubjectFilters');
    var allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'filter-btn active';
    allBtn.dataset.subject = 'all';
    allBtn.textContent = 'All';
    container.appendChild(allBtn);

    STD_SUBJECTS.forEach(function (subj) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-btn';
        btn.dataset.subject = subj;
        btn.textContent = subj;
        btn.title = stdSubjectLabel(subj);
        container.appendChild(btn);
    });

    container.addEventListener('click', function (e) {
        var btn = e.target.closest('.filter-btn');
        if (!btn) return;
        stdState.filterSubject = btn.dataset.subject;
        container.querySelectorAll('.filter-btn').forEach(function (b) {
            b.classList.toggle('active', b === btn);
        });
        renderStandards();
    });
}

function initSubjectSelect() {
    var sel = document.getElementById('stdSubject');
    STD_SUBJECTS.forEach(function (subj) {
        var opt = document.createElement('option');
        opt.value = subj;
        opt.textContent = stdSubjectLabel(subj);
        sel.appendChild(opt);
    });
}

function checkStandardsUploadPermission(user) {
    if (!user) return Promise.resolve(false);
    if (user.allowStandardsUpload === true) return Promise.resolve(true);
    return SupabaseClient.getUserStats(user.id)
        .then(function (stats) {
            return !!(stats && stats.level >= 3);
        })
        .catch(function () {
            return Storage.canUpload(user);
        });
}

function initUploadUi(user) {
    checkStandardsUploadPermission(user).then(function (can) {
        var btn = document.getElementById('btnUploadStd');
        var hint = document.getElementById('uploadRestrictedHint');
        if (!btn || !hint) return;
        if (can) {
            btn.style.display = 'inline-block';
            hint.style.display = 'none';
        } else {
            btn.style.display = 'none';
            hint.style.display = 'inline-block';
        }
    });
}

function bindEvents() {
    document.getElementById('stdSearch').addEventListener('input', function (e) {
        stdState.search = (e.target.value || '').trim().toLowerCase();
        renderStandards();
    });

    document.getElementById('btnUploadStd').addEventListener('click', function () {
        var user = Storage.getCurrentUser();
        checkStandardsUploadPermission(user).then(function (can) {
            if (!can) {
                AccountifyUI.toast('Only Senior Reviewer (Level 3+) can upload.', 'error');
                return;
            }
            openStdModal();
        });
    });

    document.getElementById('stdModalClose').addEventListener('click', closeStdModal);
    document.getElementById('stdCancelBtn').addEventListener('click', closeStdModal);
    document.getElementById('stdModal').addEventListener('click', function (e) {
        if (e.target.id === 'stdModal') closeStdModal();
    });

    document.getElementById('stdType').addEventListener('change', syncStdFormFields);
    document.getElementById('stdSubmitBtn').addEventListener('click', submitStandard);

    syncStdFormFields();
}

function syncStdFormFields() {
    var t = document.getElementById('stdType').value;
    document.getElementById('stdLinkGroup').style.display = t === 'link' ? 'block' : 'none';
    document.getElementById('stdFileGroup').style.display = t === 'pdf' ? 'block' : 'none';
}

function openStdModal() {
    document.getElementById('stdTitle').value = '';
    document.getElementById('stdDesc').value = '';
    document.getElementById('stdSubject').value = STD_SUBJECTS[0];
    document.getElementById('stdType').value = 'link';
    document.getElementById('stdLink').value = '';
    document.getElementById('stdFile').value = '';
    syncStdFormFields();
    document.getElementById('stdModal').classList.add('open');
    document.getElementById('stdTitle').focus();
}

function closeStdModal() {
    document.getElementById('stdModal').classList.remove('open');
}

function getSortedStandards() {
    var list = (stdState.resources || []).slice();
    list.sort(function (a, b) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
}

function filterStandards(list) {
    if (stdState.filterSubject !== 'all') {
        list = list.filter(function (r) {
            var code = window.AccolyStats
                ? AccolyStats.normalizeSubjectCode(r.subject)
                : r.subject;
            return code === stdState.filterSubject;
        });
    }
    if (stdState.search) {
        list = list.filter(function (r) {
            var title = (r.title || '').toLowerCase();
            var desc = (r.description || '').toLowerCase();
            return title.indexOf(stdState.search) !== -1 || desc.indexOf(stdState.search) !== -1;
        });
    }
    return list;
}

function escapeHtml(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function resourceTypeLabel(r) {
    if (r.link) return 'Link';
    if (r.fileName || r.fileData) return 'PDF';
    return 'Text';
}

function renderStandards() {
    var container = document.getElementById('standardsContainer');
    var list = filterStandards(getSortedStandards());

    if (list.length === 0) {
        container.innerHTML =
            '<div class="empty-state">' +
            '<h3>No resources found</h3>' +
            '<p>Try another subject or search. Seniors can upload materials for everyone.</p>' +
            '</div>';
        return;
    }

    container.innerHTML = '';
    list.forEach(function (r) {
        var card = document.createElement('article');
        card.className = 'standard-card';

        var left = document.createElement('div');
        var type = resourceTypeLabel(r);
        left.innerHTML =
            '<span class="type-pill">' +
            escapeHtml(type) +
            '</span>' +
            '<span style="font-size:0.8rem;color:var(--text-secondary);">' +
            escapeHtml(
                (function () {
                    var code = window.AccolyStats
                        ? AccolyStats.normalizeSubjectCode(r.subject)
                        : r.subject || '';
                    return code ? stdSubjectLabel(code) : 'Uncategorized';
                })()
            ) +
            '</span>' +
            '<h4>' + escapeHtml(r.title || 'Untitled') + '</h4>' +
            '<p class="standard-card-meta">Added ' +
            new Date(r.createdAt).toLocaleString() +
            '</p>' +
            '<p class="standard-card-desc">' +
            escapeHtml(r.description || '') +
            '</p>';

        var actions = document.createElement('div');
        actions.className = 'standard-actions';

        if (r.link) {
            var openBtn = document.createElement('a');
            openBtn.className = 'btn btn-primary';
            openBtn.href = r.link;
            openBtn.target = '_blank';
            openBtn.rel = 'noopener noreferrer';
            openBtn.textContent = 'Open link';
            actions.appendChild(openBtn);
        }

        if (r.fileData && r.fileName) {
            var dl = document.createElement('button');
            dl.type = 'button';
            dl.className = 'btn btn-outline';
            dl.textContent = 'Download PDF';
            dl.addEventListener('click', function () {
                downloadDataUrl(r.fileName, r.fileData);
            });
            actions.appendChild(dl);
        }

        if (!r.link && !r.fileData && r.description) {
            var txt = document.createElement('span');
            txt.className = 'badge-restricted';
            txt.textContent = 'Summary only';
            actions.appendChild(txt);
        }

        var user = Storage.getCurrentUser();
        if (user && r.userId === user.id) {
            var del = document.createElement('button');
            del.type = 'button';
            del.className = 'btn btn-outline';
            del.style.borderColor = 'var(--danger)';
            del.style.color = 'var(--danger)';
            del.textContent = 'Delete';
            del.addEventListener('click', function () {
                AccountifyUI.confirmDelete('Remove this resource from the library?').then(function (ok) {
                    if (!ok) return;
                    SupabaseClient.deleteStandard(r.id).then(function () {
                        loadStandardsFromServer();
                        AccountifyUI.toast('Resource removed', 'success');
                    });
                });
            });
            actions.appendChild(del);
        }

        card.appendChild(left);
        card.appendChild(actions);
        container.appendChild(card);
    });
}

function downloadDataUrl(filename, dataUrl) {
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename || 'document.pdf';
    a.click();
    AccountifyUI.toast('Download started', 'success');
}

function submitStandard() {
    var user = Storage.getCurrentUser();
    checkStandardsUploadPermission(user).then(function (can) {
        if (!can) {
            AccountifyUI.toast('You do not have permission to upload.', 'error');
            return;
        }
        submitStandardAuthorized(user);
    });
}

function submitStandardAuthorized(user) {
    var title = (document.getElementById('stdTitle').value || '').trim();
    var description = (document.getElementById('stdDesc').value || '').trim();
    var subject = document.getElementById('stdSubject').value;
    var type = document.getElementById('stdType').value;

    if (!title) {
        AccountifyUI.toast('Please enter a title.', 'warning');
        return;
    }

    var payload = {
        userId: user.id,
        title: title,
        description: description,
        subject: subject,
        fileName: '',
        fileData: '',
        link: ''
    };

    if (type === 'link') {
        var link = (document.getElementById('stdLink').value || '').trim();
        if (!link) {
            AccountifyUI.toast('Please enter a URL.', 'warning');
            return;
        }
        payload.link = link;
    } else if (type === 'pdf') {
        var fileInput = document.getElementById('stdFile');
        var file = fileInput.files && fileInput.files[0];
        if (!file) {
            AccountifyUI.toast('Please choose a PDF file.', 'warning');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            AccountifyUI.toast('File too large (max 5MB).', 'error');
            return;
        }
        var reader = new FileReader();
        reader.onload = function () {
            payload.fileName = file.name || 'document.pdf';
            payload.fileData = reader.result;
            SupabaseClient.saveStandardResource(payload).then(function () {
                AccountifyUI.toast('Resource published', 'success');
                closeStdModal();
                loadStandardsFromServer();
            });
        };
        reader.onerror = function () {
            AccountifyUI.toast('Could not read file.', 'error');
        };
        reader.readAsDataURL(file);
        return;
    } else {
        if (!description) {
            AccountifyUI.toast('Add a text summary for this resource.', 'warning');
            return;
        }
    }

    SupabaseClient.saveStandardResource(payload).then(function () {
        AccountifyUI.toast('Resource published', 'success');
        closeStdModal();
        loadStandardsFromServer();
    });
}

function logout() {
    SupabaseClient.signOut().finally(function () {
        Storage.logout();
        window.location.replace('login.html');
    });
}