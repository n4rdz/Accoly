function getNoteSubjectCodes() {
    if (window.AccolyStats) {
        return AccolyStats.SUBJECT_CATALOG.map(function (c) {
            return c.code;
        });
    }
    return ['FAR', 'AFAR', 'MS', 'AUD', 'RFBT', 'TAX'];
}

function noteSubjectLabel(code) {
    return window.AccolyStats ? AccolyStats.getSubjectLabel(code) : code;
}

function noteSubjectMatches(metaSubject, filterCode) {
    if (filterCode === 'all') return true;
    var norm = window.AccolyStats
        ? AccolyStats.normalizeSubjectCode(metaSubject || '')
        : metaSubject;
    return norm === filterCode;
}

var ManagerState = { subject: 'all', search: '', sort: 'recent' };
var NOTE_PDF_META = [];

function esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

function escAttr(s) {
    return (s || '').toString()
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

var PDF = {
    fileId: null, meta: null, doc: null, pages: {}, pageOrder: [], currentPage: 1, zoom: 1,
    tool: 'pen', color: '#1E3A8A', size: 6, opacity: 1, fontSize: 14, textStyle: { bold: false, italic: false, underline: false },
    eraserMode: 'pixel',
    drawing: null,
    erasing: null,   // tracks active pixel/stroke erase drag session
    selected: null,
    handPanning: null,
    annotations: { pages: {} },
    history: [],
    historyIndex: -1,
    autosaveTimer: null,
    dirty: false
};

document.addEventListener('DOMContentLoaded', function () {
    if (window.__authReady) {
        initNotesV2();
    } else {
        window.addEventListener('authReady', initNotesV2);
    }
});

function initNotesV2() {
    var user = Storage.getCurrentUser();
    if (!user) return; // auth.js already redirected
    if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    bindSubjectFilters();
    bindManagerEvents();
    bindPdfEditorEvents();
    bindBasicNoteModal();
    refreshPdfMetaList();
}

function refreshPdfMetaList() {
    var user = Storage.getCurrentUser();
    if (!user) return Promise.resolve();
    return SupabaseClient.getPdfMetaList(user.id)
        .then(function (list) {
            NOTE_PDF_META = list || [];
            renderPdfLibrary();
        })
        .catch(function () {
            NOTE_PDF_META = [];
            renderPdfLibrary();
        });
}

function bindSubjectFilters() {
    var container = document.getElementById('subjectFilters');
    container.innerHTML = '';
    var items = ['all'].concat(getNoteSubjectCodes());
    items.forEach(function (s, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-btn' + (idx === 0 ? ' active' : '');
        btn.dataset.subject = s;
        btn.textContent = s === 'all' ? 'All subjects' : noteSubjectLabel(s);
        if (s !== 'all') btn.title = noteSubjectLabel(s);
        btn.addEventListener('click', function () {
            ManagerState.subject = s;
            container.querySelectorAll('.filter-btn').forEach(function (x) { x.classList.toggle('active', x === btn); });
            renderPdfLibrary();
        });
        container.appendChild(btn);
    });
}

function bindManagerEvents() {
    var search = document.getElementById('pdfSearch');
    var sort = document.getElementById('pdfSort');
    var uploadBtn = document.getElementById('btnUploadPdf');
    var uploadInput = document.getElementById('pdfUploadInput');
    var dropZone = document.getElementById('pdfDropZone');

    if (search) {
        search.addEventListener('input', function () {
            ManagerState.search = search.value.trim().toLowerCase();
            renderPdfLibrary();
        });
    }
    if (sort) {
        sort.addEventListener('change', function () {
            ManagerState.sort = sort.value;
            renderPdfLibrary();
        });
    }
    if (uploadBtn && uploadInput) {
        uploadBtn.addEventListener('click', function () {
            uploadInput.value = '';
            uploadInput.click();
        });
        uploadInput.addEventListener('change', function () {
            var f = uploadInput.files && uploadInput.files[0];
            if (f) uploadPdf(f);
        });
    }

    if (dropZone) {
        ['dragenter', 'dragover'].forEach(function (evName) {
            dropZone.addEventListener(evName, function (e) {
                e.preventDefault();
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
                dropZone.classList.add('pdf-drop-zone--active');
            });
        });
        dropZone.addEventListener('dragleave', function (e) {
            var rel = e.relatedTarget;
            if (rel && dropZone.contains(rel)) return;
            dropZone.classList.remove('pdf-drop-zone--active');
        });
        dropZone.addEventListener('drop', function (e) {
            e.preventDefault();
            dropZone.classList.remove('pdf-drop-zone--active');
            var dt = e.dataTransfer;
            if (!dt || !dt.files || !dt.files.length) return;
            uploadPdf(dt.files[0]);
        });
    }
}

async function uploadPdf(file) {
    if (!file) { AccountifyUI.toast('Please select a file', 'error'); return; }
    if (!/\.pdf$/i.test(file.name || '') && file.type !== 'application/pdf') { AccountifyUI.toast('Please select a PDF file', 'warning'); return; }
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) { AccountifyUI.toast('PDF file too large (max 10MB)', 'warning'); return; }
    const fileName = (file.name || 'document.pdf').trim();
    if (!/^[a-zA-Z0-9\s\-_.()]+$/.test(fileName)) { AccountifyUI.toast('Invalid file name.', 'warning'); return; }
    var user = Storage.getCurrentUser();
    if (!user) { AccountifyUI.toast('Please login to upload files', 'error'); return; }
    try {
        var meta = await SupabaseClient.savePdfMeta({
            userId: user.id,
            name: fileName,
            subject: ManagerState.subject !== 'all' ? ManagerState.subject : 'FAR'
        });
        if (!meta) throw new Error('meta_save_failed');
        await SupabaseClient.savePdfBinary({ id: meta.id, userId: user.id, name: meta.name, blob: file });
        meta.thumbnail = await createPdfThumbnail(file);
        await SupabaseClient.savePdfMeta(meta);
        AccountifyUI.toast('PDF uploaded successfully', 'success');
        await refreshPdfMetaList();
        openPdfEditor(meta.id);
    } catch (error) {
        console.error('PDF upload error:', error);
        AccountifyUI.toast('Failed to upload PDF', 'error');
    }
}

function getFilteredMeta() {
    var list = NOTE_PDF_META.slice();
    if (ManagerState.subject !== 'all') {
        list = list.filter(function (m) {
            return noteSubjectMatches(m.subject, ManagerState.subject);
        });
    }
    if (ManagerState.search) list = list.filter(function (m) { return (m.name || '').toLowerCase().indexOf(ManagerState.search) !== -1; });
    list.sort(function (a, b) {
        if (ManagerState.sort === 'name') return (a.name || '').localeCompare(b.name || '');
        if (ManagerState.sort === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
    return list;
}

function renderPdfLibrary() {
    var list = getFilteredMeta();
    renderMetaSection(
        'recentFilesList',
        list.slice().sort(function (a, b) { return new Date(b.lastOpenedAt || 0) - new Date(a.lastOpenedAt || 0); }).slice(0, 24)
    );
}

function renderMetaSection(containerId, items) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (!items.length) {
        el.innerHTML =
            '<div class="empty-state">' +
            '<p>No PDFs yet.</p>' +
            '<p style="font-size:0.9rem;color:var(--text-secondary);margin-top:0.35rem;">Use <strong>Upload PDF</strong> or drag a file into the library area.</p>' +
            '</div>';
        return;
    }
    el.innerHTML = items.map(function (m) {
        const id = escAttr(m.id || '');
        const name = esc(m.name || 'Untitled.pdf');
        const thumbnail = m.thumbnail ? escAttr(m.thumbnail) : '';
        const createdDate = m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Unknown date';
        const updatedDate = m.updatedAt || m.createdAt;
        const editedDate = updatedDate ? new Date(updatedDate).toLocaleDateString() : createdDate;
        const isEdited = m.isEdited ? 'Edited' : 'Original';
        const annotationCount = m.annotationCount || 0;
        return '<article class="pdf-card">' +
            '<div class="pdf-thumb-wrap">' +
            (thumbnail ? '<img class="pdf-thumb-img" src="' + thumbnail + '" alt="preview" />' : '<div class="pdf-thumb-placeholder">PDF</div>') +
            '</div>' +
            '<div class="pdf-card-body"><h4>' + name + '</h4>' +
            '<p>' + createdDate + ' • edited ' + editedDate + '</p>' +
            '<div class="pdf-badges"><span class="type-pill">' + isEdited + '</span><span class="type-pill">Ann: ' + annotationCount + '</span></div></div>' +
            '<div class="pdf-card-actions">' +
            '<button class="btn btn-primary pdf-open" data-id="' + id + '">Open</button>' +
            '<button class="btn btn-outline pdf-rename" data-id="' + id + '">Rename</button>' +
            '<button class="btn btn-outline pdf-del" data-id="' + id + '">Delete</button>' +
            '</div></article>';
    }).join('');
    el.querySelectorAll('.pdf-open').forEach(function (b) { b.addEventListener('click', function () { openPdfEditor(b.dataset.id); }); });
    el.querySelectorAll('.pdf-rename').forEach(function (b) { b.addEventListener('click', function () { renamePdf(b.dataset.id); }); });
    el.querySelectorAll('.pdf-del').forEach(function (b) { b.addEventListener('click', function () { deletePdf(b.dataset.id); }); });
}

async function renamePdf(id) {
    var m = NOTE_PDF_META.find(function (x) { return x.id === id; });
    if (!m) return;
    var name = window.prompt('Rename PDF', m.name || '');
    if (!name) return;
    m.name = name.trim() || m.name;
    m.updatedAt = new Date().toISOString();
    await SupabaseClient.savePdfMeta(m);
    await refreshPdfMetaList();
}

async function deletePdf(id) {
    AccountifyUI.confirmDelete('Delete this PDF and all annotations?').then(async function (ok) {
        if (!ok) return;
        await SupabaseClient.deletePdfMeta(id);
        AccountifyUI.toast('PDF deleted', 'success');
        await refreshPdfMetaList();
    });
}

// -------- PDF Editor --------
function bindPdfEditorEvents() {
    var modal = document.getElementById('pdfEditorModal');
    document.getElementById('pdfEditorClose').addEventListener('click', closePdfEditor);
    document.getElementById('pdfCloseBtn').addEventListener('click', closePdfEditor);
    document.getElementById('pdfSaveBtn').addEventListener('click', forceSaveAnnotations);
    document.getElementById('pdfDeleteBtn').addEventListener('click', function () { if (PDF.fileId) deletePdf(PDF.fileId); closePdfEditor(); });
    modal.addEventListener('click', function (e) { if (e.target && e.target.id === 'pdfEditorModal') closePdfEditor(); });

    document.querySelectorAll('[data-pdftool]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('[data-pdftool]').forEach(function (x) { x.classList.remove('active'); });
            btn.classList.add('active');
            PDF.tool = btn.dataset.pdftool;
            applyPdfToolInteractivity();
            clearSelection();
        });
    });

    document.getElementById('pdfColor').addEventListener('input', function (e) { PDF.color = e.target.value; });
    document.getElementById('pdfSize').addEventListener('input', function (e) { PDF.size = parseInt(e.target.value, 10) || 6; });
    document.getElementById('pdfOpacity').addEventListener('input', function (e) { PDF.opacity = (parseInt(e.target.value, 10) || 100) / 100; });

    // ── FIX 1: Eraser mode toggle ──────────────────────────────────────────────
    // The original code only fired when clicking a child .eraser-mode-option.
    // We now listen on the whole toggle container and also handle direct button clicks.
    var eraserModeToggle = document.getElementById('eraserModeToggle');
    if (eraserModeToggle) {
        eraserModeToggle.addEventListener('click', function (e) {
            // Walk up from the actual click target to find the option element
            var opt = e.target.closest ? e.target.closest('.eraser-mode-option') : null;
            if (!opt && e.target.classList && e.target.classList.contains('eraser-mode-option')) opt = e.target;
            if (opt && opt.dataset && opt.dataset.mode) {
                setEraserMode(opt.dataset.mode);
            }
        });
    }
    // ──────────────────────────────────────────────────────────────────────────

    document.getElementById('pdfUndoBtn').addEventListener('click', undoPdf);
   
    document.getElementById('pdfClearBtn').addEventListener('click', function () {
    AccountifyUI.confirmDelete('Clear ALL annotations on every page?').then(function (ok) {
        if (!ok) return;
        clearAllPages();
    });
});
    document.getElementById('pdfZoomInBtn').addEventListener('click', function () { setZoom(PDF.zoom + 0.1); });
    document.getElementById('pdfZoomOutBtn').addEventListener('click', function () { setZoom(PDF.zoom - 0.1); });
    document.getElementById('pdfPrevPageBtn').addEventListener('click', function () { jumpToPage(Math.max(1, PDF.currentPage - 1)); });
    document.getElementById('pdfNextPageBtn').addEventListener('click', function () { jumpToPage(Math.min(PDF.pageOrder.length, PDF.currentPage + 1)); });
    document.getElementById('pdfPageInput').addEventListener('change', function (e) { jumpToPage(parseInt(e.target.value, 10) || 1); });

    document.addEventListener('keydown', function (e) {
        if (!PDF.fileId) return;
        if (!PDF.selected) return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (document.activeElement && document.activeElement.isContentEditable) return;
            e.preventDefault();
            deleteSelected();
        } else if (e.key === 'Escape') {
            clearSelection();
        }
    });
}

async function openPdfEditor(fileId) {
    if (!window.pdfjsLib) return AccountifyUI.toast('PDF.js failed to load', 'error');
    var user = Storage.getCurrentUser();
    var meta = NOTE_PDF_META.find(function (x) { return x.id === fileId; });
    if (!meta) {
        var list = await SupabaseClient.getPdfMetaList(user.id);
        NOTE_PDF_META = list || [];
        meta = NOTE_PDF_META.find(function (x) { return x.id === fileId; });
    }
    var binary = await SupabaseClient.getPdfBinary(fileId);
    if (!meta || !binary) return AccountifyUI.toast('PDF not found', 'error');
    PDF.fileId = fileId;
    PDF.meta = meta;
    PDF.zoom = 1;
    var ann = await SupabaseClient.getPdfAnnotationsV2(fileId);
    PDF.annotations = { pages: (ann && ann.pages) ? ann.pages : {} };
    PDF.pages = {};
    PDF.pageOrder = [];
    PDF.history = [];
    PDF.historyIndex = -1;
    document.getElementById('pdfViewerTitle').textContent = meta.name;
    document.getElementById('pdfEditorModal').classList.add('open');
    updateSaveStatus('Saved');
    var arr = await blobToUint8Array(binary.blob);
    PDF.doc = await pdfjsLib.getDocument({ data: arr }).promise;
    document.getElementById('pdfTotalPages').textContent = '/ ' + PDF.doc.numPages;
    await renderAllPages();
    applyPdfToolInteractivity();
    bindScrollSync();
    pushPdfHistory();
    meta.lastOpenedAt = new Date().toISOString();
    await SupabaseClient.savePdfMeta(meta);
    await refreshPdfMetaList();
}

function closePdfEditor() {
    clearTimeout(PDF.autosaveTimer);
    document.getElementById('pdfPagesRoot').innerHTML = '';
    document.getElementById('pdfThumbsPanel').innerHTML = '';
    document.getElementById('pdfEditorModal').classList.remove('open');
    PDF.fileId = null;
    PDF.doc = null;
}

async function renderAllPages() {
    var root = document.getElementById('pdfPagesRoot');
    var thumbs = document.getElementById('pdfThumbsPanel');
    root.innerHTML = '';
    thumbs.innerHTML = '';
    for (var p = 1; p <= PDF.doc.numPages; p++) {
        await renderOnePage(p, root, thumbs);
    }
    applyPdfToolInteractivity();
    jumpToPage(1);
}

async function renderOnePage(pageNum, root, thumbs) {
    var page = await PDF.doc.getPage(pageNum);
    var viewport = page.getViewport({ scale: PDF.zoom });
    var wrap = document.createElement('div');
    wrap.className = 'pdf-page-wrap';
    wrap.dataset.page = pageNum;
    wrap.style.width = Math.ceil(viewport.width) + 'px';
    wrap.style.height = Math.ceil(viewport.height) + 'px';
    var pdfCanvas = document.createElement('canvas');
    pdfCanvas.className = 'pdf-page-canvas';
    var drawCanvas = document.createElement('canvas');
    drawCanvas.className = 'pdf-draw-layer';
    var highCanvas = document.createElement('canvas');
    highCanvas.className = 'pdf-highlight-layer';
    highCanvas.style.zIndex = '4';
    var textLayer = document.createElement('div');
    textLayer.className = 'pdf-text-layer';
    var stickyLayer = document.createElement('div');
    stickyLayer.className = 'pdf-sticky-layer';
    setCanvasSize(pdfCanvas, viewport.width, viewport.height);
    setCanvasSize(drawCanvas, viewport.width, viewport.height);
    setCanvasSize(highCanvas, viewport.width, viewport.height);
    textLayer.style.width = viewport.width + 'px';
    textLayer.style.height = viewport.height + 'px';
    stickyLayer.style.width = viewport.width + 'px';
    stickyLayer.style.height = viewport.height + 'px';
    wrap.appendChild(pdfCanvas);
    wrap.appendChild(drawCanvas);
    wrap.appendChild(highCanvas);
    wrap.appendChild(textLayer);
    wrap.appendChild(stickyLayer);
    root.appendChild(wrap);
    await page.render({ canvasContext: pdfCanvas.getContext('2d'), viewport: viewport }).promise;

    var thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'pdf-thumb-item';
    thumb.dataset.page = pageNum;
    thumb.textContent = 'Page ' + pageNum;
    thumb.addEventListener('click', function () { jumpToPage(pageNum); });
    thumbs.appendChild(thumb);

    PDF.pages[pageNum] = { wrap: wrap, pdfCanvas: pdfCanvas, drawCanvas: drawCanvas, highCanvas: highCanvas, textLayer: textLayer, stickyLayer: stickyLayer, viewport: viewport };
    PDF.pageOrder.push(pageNum);
    bindPageInteraction(pageNum);
    renderPageAnnotations(pageNum);
}

function bindPageInteraction(pageNum) {
    var pageState = PDF.pages[pageNum];
    if (!pageState) return;
    [pageState.drawCanvas, pageState.highCanvas].forEach(function (canvas) {
        canvas.addEventListener('pointerdown', function (e) { onPointerDown(e, pageNum); });
        canvas.addEventListener('pointermove', function (e) { onPointerMove(e, pageNum); });
        canvas.addEventListener('pointerup', function (e) { onPointerUp(e, pageNum); });
        canvas.addEventListener('pointerleave', function (e) { onPointerUp(e, pageNum); });
    });
    pageState.stickyLayer.addEventListener('pointerdown', function (e) {
        if (PDF.tool !== 'sticky') return;
        if (e.target && e.target.closest && e.target.closest('.pdf-sticky-note')) return;
        createSticky(pageNum, e);
    });
}

function applyPdfToolInteractivity() {
    Object.keys(PDF.pages).forEach(function (k) {
        var p = PDF.pages[k];
        if (!p) return;
        var drawingTool = ['pen', 'pencil', 'highlighter', 'eraser'].indexOf(PDF.tool) !== -1;
        p.drawCanvas.style.pointerEvents = drawingTool ? 'auto' : 'none';
        p.highCanvas.style.pointerEvents = drawingTool ? 'auto' : 'none';
        p.textLayer.style.pointerEvents = 'none';
        p.stickyLayer.style.pointerEvents = PDF.tool === 'sticky' ? 'auto' : 'none';
    });
}

function onPointerDown(e, pageNum) {
    var canvas = (PDF.tool === 'highlighter') ? PDF.pages[pageNum].highCanvas : PDF.pages[pageNum].drawCanvas;
    var p = pointerOnCanvas(canvas, e);
    if (PDF.tool === 'eraser') {
        // Start erasing — track active erase session so pointermove continues erasing
        PDF.erasing = { page: pageNum };
        eraseAt(pageNum, p.x, p.y);
        return;
    }
    if (['pen', 'pencil', 'highlighter'].indexOf(PDF.tool) === -1) return;
    PDF.drawing = { page: pageNum, points: [p], tool: PDF.tool, color: PDF.color, size: PDF.size, opacity: PDF.opacity };
}

function onPointerMove(e, pageNum) {
    // Eraser drag
    if (PDF.erasing && PDF.erasing.page === pageNum && PDF.tool === 'eraser') {
        var eraseCanvas = PDF.pages[pageNum].drawCanvas;
        var ep = pointerOnCanvas(eraseCanvas, e);
        eraseAt(pageNum, ep.x, ep.y);
        return;
    }
    if (!PDF.drawing || PDF.drawing.page !== pageNum) return;
    var isHighlight = PDF.drawing.tool === 'highlighter';
    var canvas = isHighlight ? PDF.pages[pageNum].highCanvas : PDF.pages[pageNum].drawCanvas;
    var p = pointerOnCanvas(canvas, e);
    PDF.drawing.points.push(p);

    if (isHighlight) {
        // CRITICAL FIX: without clearing first, each pointermove re-draws the whole
        // stroke on top of itself, stacking alpha and turning any color solid/dark.
        // Clear the canvas each frame, redraw saved highlights, then the live stroke once.
        // Reset canvas by reassigning width — clears pixels AND context state reliably.
        // Then reapply DPR transform so coordinates stay in CSS-pixel space.
        var dpr = Math.max(1, window.devicePixelRatio || 1);
        var rawW = canvas.width;
        canvas.width = rawW;
        var hctx = canvas.getContext('2d');
        hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var saved = (PDF.annotations.pages[pageNum] && PDF.annotations.pages[pageNum].highlights) || [];
        saved.forEach(function (s) { drawStroke(hctx, s); });
        drawStroke(hctx, PDF.drawing);
    } else {
        drawStroke(canvas.getContext('2d'), PDF.drawing);
    }
}

function onPointerUp() {
    // End erase session
    if (PDF.erasing) {
        PDF.erasing = null;
        return;
    }
    if (!PDF.drawing) return;
    var pageNum = PDF.drawing.page;
    ensureAnnPage(pageNum);
    if (PDF.drawing.tool === 'highlighter') PDF.annotations.pages[pageNum].highlights.push(PDF.drawing);
    else PDF.annotations.pages[pageNum].strokes.push(PDF.drawing);
    PDF.drawing = null;
    pushPdfHistory();
    markDirty();
}

function ensureAnnPage(pageNum) {
    if (!PDF.annotations.pages[pageNum]) PDF.annotations.pages[pageNum] = { strokes: [], highlights: [], texts: [], stickies: [] };
}

function renderPageAnnotations(pageNum) {
    ensureAnnPage(pageNum);
    var ps = PDF.pages[pageNum];
    if (!ps) return; // guard against missing page state
    var ann = PDF.annotations.pages[pageNum];
    var dpr = Math.max(1, window.devicePixelRatio || 1);

    // Reassigning canvas.width is the most reliable way to clear a canvas:
    // it wipes ALL pixels AND resets the context state (including any stale transforms).
    // We then reapply the DPR transform so drawStroke coordinates stay in CSS-pixel space.
    var dctx = ps.drawCanvas.getContext('2d');
    var hctx = ps.highCanvas.getContext('2d');
    dctx.save();
    dctx.setTransform(1, 0, 0, 1, 0, 0);
    dctx.clearRect(0, 0, ps.drawCanvas.width, ps.drawCanvas.height);
    dctx.restore();
    hctx.save();
    hctx.setTransform(1, 0, 0, 1, 0, 0);
    hctx.clearRect(0, 0, ps.highCanvas.width, ps.highCanvas.height);
    hctx.restore();
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ann.strokes.forEach(function (s) { drawStroke(dctx, s); });
    ann.highlights.forEach(function (s) { drawStroke(hctx, s); });
    ps.textLayer.innerHTML = '';
    ps.stickyLayer.innerHTML = '';
    ann.texts.forEach(function (t) { mountTextBox(pageNum, t); });
    ann.stickies.forEach(function (s) { mountSticky(pageNum, s); });
}

// ── FIX 2: drawStroke — highlighter uses source-over + low opacity ─────────
// Root cause: canvas is transparent, so 'multiply' composite darkens to near-black.
// Fix: use 'source-over' with globalAlpha ~0.35 for a proper semi-transparent highlight.
// The "lightening on eraser click" was caused by applyPdfToolInteractivity() triggering
// a context state reset — now that each ctx.save/restore is isolated, this is gone too.
function drawStroke(ctx, stroke) {
    if (!stroke || !stroke.points || stroke.points.length < 1) return;
    ctx.save();

    if (stroke.tool === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = Math.max(2, stroke.size);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

    } else if (stroke.tool === 'pencil') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = Math.max(3, stroke.size);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Grainy texture: several low-opacity offset passes
        for (var offset = 0; offset < 3; offset++) {
            ctx.globalAlpha = 0.25 + Math.random() * 0.1;
            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x + (Math.random() - 0.5) * 0.8, stroke.points[0].y + (Math.random() - 0.5) * 0.8);
            for (var j = 1; j < stroke.points.length; j++) {
                ctx.lineTo(stroke.points[j].x + (Math.random() - 0.5) * 0.8, stroke.points[j].y + (Math.random() - 0.5) * 0.8);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 0.65;

    } else if (stroke.tool === 'highlighter') {
        // Convert the chosen color to a light pastel tint so text always shows through.
        // We extract RGB, mix it 30% with the original + 70% white, then draw at 0.55 opacity.
        // Result: blue → light blue wash, red → light pink wash, any color stays readable.
        var rgb = hexToRgb(stroke.color);
        // Lighten toward white: blend 25% original color + 75% white
        var lr = Math.round(rgb.r * 0.25 + 255 * 0.75);
        var lg = Math.round(rgb.g * 0.25 + 255 * 0.75);
        var lb = Math.round(rgb.b * 0.25 + 255 * 0.75);
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgb(' + lr + ',' + lg + ',' + lb + ')';
        ctx.globalAlpha = 0.75; // Semi-opaque so the tinted color shows but text reads through
        ctx.lineWidth = Math.max(18, Math.min(28, stroke.size * 3));
        ctx.lineJoin = 'square';
        ctx.lineCap = 'square';

    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.opacity || 1;
        ctx.lineWidth = Math.max(1, stroke.size);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (var i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
}
// ─────────────────────────────────────────────────────────────────────────────

function eraseAt(pageNum, x, y) {
    ensureAnnPage(pageNum);
    var ann = PDF.annotations.pages[pageNum];
    var ps = PDF.pages[pageNum];

    if (PDF.eraserMode === 'pixel') {
        var radius = Math.max(12, PDF.size * 2);
        var dctx = ps.drawCanvas.getContext('2d');
        var hctx = ps.highCanvas.getContext('2d');
        dctx.save();
        dctx.globalCompositeOperation = 'destination-out';
        dctx.beginPath();
        dctx.arc(x, y, radius, 0, Math.PI * 2);
        dctx.fill();
        dctx.restore();
        hctx.save();
        hctx.globalCompositeOperation = 'destination-out';
        hctx.beginPath();
        hctx.arc(x, y, radius, 0, Math.PI * 2);
        hctx.fill();
        hctx.restore();
        // Prune fully-erased strokes from memory too
        ann.strokes = ann.strokes.filter(function (s) { return !strokeNearPoint(s, x, y, radius); });
        ann.highlights = ann.highlights.filter(function (s) { return !strokeNearPoint(s, x, y, radius); });

    } else if (PDF.eraserMode === 'stroke') {
        var clickRadius = Math.max(20, PDF.size * 3);
        var closestStroke = null;
        var closestDistance = Infinity;
        function findClosest(strokes) {
            strokes.forEach(function (s) {
                if (strokeNearPoint(s, x, y, clickRadius)) {
                    var d = getMinDistanceToStroke(s, x, y);
                    if (d < closestDistance) { closestDistance = d; closestStroke = s; }
                }
            });
        }
        findClosest(ann.strokes);
        findClosest(ann.highlights);
        if (closestStroke) {
            var si = ann.strokes.indexOf(closestStroke);
            if (si !== -1) ann.strokes.splice(si, 1);
            var hi = ann.highlights.indexOf(closestStroke);
            if (hi !== -1) ann.highlights.splice(hi, 1);
        }
        renderPageAnnotations(pageNum);
    }

    pushPdfHistory();
    markDirty();
}

function getMinDistanceToStroke(stroke, x, y) {
    var min = Infinity;
    stroke.points.forEach(function (pt) {
        var d = Math.sqrt((pt.x - x) * (pt.x - x) + (pt.y - y) * (pt.y - y));
        if (d < min) min = d;
    });
    return min;
}

// ── FIX 1 continued: setEraserMode also updates CSS classes reliably ─────────
function setEraserMode(mode) {
    PDF.eraserMode = mode;
    document.querySelectorAll('.eraser-mode-option').forEach(function (opt) {
        var isActive = opt.dataset.mode === mode;
        opt.classList.toggle('active', isActive);
        // Inline style fallback so it works even without extra CSS rules
        opt.style.fontWeight = isActive ? '700' : '400';
        opt.style.background = isActive ? 'var(--primary, #1E3A8A)' : 'transparent';
        opt.style.color = isActive ? '#fff' : '';
        opt.style.borderRadius = isActive ? '4px' : '';
        opt.style.padding = isActive ? '2px 6px' : '';
    });
    var modeLabel = document.getElementById('eraserModeLabel');
    if (modeLabel) modeLabel.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
}
// ─────────────────────────────────────────────────────────────────────────────

function strokeNearPoint(stroke, x, y, r) {
    for (var i = 0; i < stroke.points.length; i++) {
        var p = stroke.points[i];
        var dx = p.x - x; var dy = p.y - y;
        if (dx * dx + dy * dy <= r * r) return true;
    }
    return false;
}

function mountTextBox(pageNum, item) {
    var layer = PDF.pages[pageNum].textLayer;
    var box = document.createElement('div');
    box.className = 'pdf-textbox';
    box.dataset.id = item.id;
    box.contentEditable = 'true';
    box.setAttribute('spellcheck', 'false');
    box.setAttribute('dir', 'ltr');
    box.style.direction = 'ltr';
    box.style.textAlign = 'left';
    box.style.unicodeBidi = 'bidi-override';
    box.style.whiteSpace = 'pre-wrap';
    box.style.left = item.x + 'px';
    box.style.top = item.y + 'px';
    box.style.width = item.w + 'px';
    box.style.minHeight = item.h + 'px';
    box.style.color = item.color;
    box.style.fontSize = item.fontSize + 'px';
    box.style.fontWeight = item.bold ? '700' : '400';
    box.style.fontStyle = item.italic ? 'italic' : 'normal';
    box.style.textDecoration = item.underline ? 'underline' : 'none';
    box.textContent = item.text || '';
    box.addEventListener('input', function () {
        var cleaned = (box.textContent || '').replace(/[\u200E\u200F\u202A-\u202E]/g, '');
        if (cleaned !== box.textContent) {
            var sel = window.getSelection && window.getSelection();
            box.textContent = cleaned;
            if (sel) { try { var r = document.createRange(); r.selectNodeContents(box); r.collapse(false); sel.removeAllRanges(); sel.addRange(r); } catch (e) { } }
        }
        item.text = cleaned;
        markDirty();
    });
    box.addEventListener('pointerdown', function (e) { if (PDF.tool === 'text') e.stopPropagation(); });
    box.addEventListener('focus', function () { if (PDF.tool === 'text') { selectAnno('text', pageNum, item.id); syncToolbarFromTextbox(item); } placeCaretAtStart(box); });
    makeDraggableBox(box, function (x, y) { item.x = x; item.y = y; markDirty(); }, function () { return PDF.tool === 'hand'; });
    attachDeleteChip(box, 'text', pageNum, item.id);
    layer.appendChild(box);
}

function placeCaretAtStart(el) {
    try { var sel = window.getSelection(); var range = document.createRange(); range.selectNodeContents(el); range.collapse(true); sel.removeAllRanges(); sel.addRange(range); } catch (e) { }
}

function getSelectedTextItem() {
    if (!PDF.selected || PDF.selected.type !== 'text') return null;
    ensureAnnPage(PDF.selected.page);
    var ann = PDF.annotations.pages[PDF.selected.page];
    return (ann.texts || []).find(function (t) { return t.id === PDF.selected.id; }) || null;
}

function syncToolbarFromTextbox(item) {
    if (!item) return;
    PDF.color = item.color || PDF.color;
    PDF.fontSize = item.fontSize || PDF.fontSize;
    PDF.textStyle.bold = !!item.bold;
    PDF.textStyle.italic = !!item.italic;
    PDF.textStyle.underline = !!item.underline;
    var c = document.getElementById('pdfColor'); if (c) c.value = PDF.color;
}

function createSticky(pageNum, ev) {
    var ps = PDF.pages[pageNum];
    var pt = pointerOnElement(ps.stickyLayer, ev);
    var item = { id: uid(), x: pt.x - 100, y: pt.y - 50, text: '', width: 200, height: 100 };
    ensureAnnPage(pageNum);
    PDF.annotations.pages[pageNum].stickies.push(item);
    mountSticky(pageNum, item);
    pushPdfHistory();
    markDirty();
}

function mountSticky(pageNum, item) {
    var layer = PDF.pages[pageNum].stickyLayer;
    var box = document.createElement('div');
    box.className = 'pdf-sticky-note';
    box.style.left = (item.x || 50) + 'px';
    box.style.top = (item.y || 50) + 'px';
    box.style.width = (item.width || 200) + 'px';
    box.style.height = (item.height || 100) + 'px';
    box.style.backgroundColor = '#FFFFE0';
    box.style.border = '1px solid #E6E6D0';
    box.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.1)';
    box.style.borderRadius = '2px';
    box.dataset.id = item.id;
    box.innerHTML =
        '<div class="sticky-head" style="background:#F7F7D0;border-bottom:1px solid #E6E6D0;padding:4px;display:flex;justify-content:space-between;align-items:center;">' +
        '<span style="font-size:10px;color:#666;cursor:move;">⋮⋮</span>' +
        '<button type="button" class="sticky-del" aria-label="Delete" style="background:none;border:none;color:#999;cursor:pointer;font-size:12px;padding:2px;">×</button>' +
        '</div>' +
        '<div class="sticky-content" contenteditable="true" style="padding:8px;font-family:Arial,sans-serif;font-size:12px;color:#333;outline:none;min-height:60px;overflow-y:auto;"></div>';
    var content = box.querySelector('.sticky-content');
    content.textContent = item.text || '';
    content.addEventListener('input', function () { item.text = content.textContent; markDirty(); });
    content.addEventListener('pointerdown', function (e) { if (PDF.tool === 'sticky') e.stopPropagation(); });
    box.querySelector('.sticky-del').addEventListener('click', function (e) {
        e.stopPropagation();
        selectAnno('sticky', pageNum, item.id);
        deleteSelected();
    });
    makeDraggableBox(box, function (x, y) { item.x = x; item.y = y; markDirty(); }, function () { return true; });
    makeResizableBox(box, function (w, h) { item.width = w; item.height = h; markDirty(); });
    attachDeleteChip(box, 'sticky', pageNum, item.id);
    layer.appendChild(box);
}

function clearCurrentPage() {
    ensureAnnPage(PDF.currentPage);
    PDF.annotations.pages[PDF.currentPage] = { strokes: [], highlights: [], texts: [], stickies: [] };

    // Explicitly clear both canvases using clearRect so it works at any zoom level
    // without needing to re-render the whole page first.
    var ps = PDF.pages[PDF.currentPage];
    if (ps) {
        var dpr = Math.max(1, window.devicePixelRatio || 1);
        var dctx = ps.drawCanvas.getContext('2d');
        var hctx = ps.highCanvas.getContext('2d');
        dctx.save();
        dctx.setTransform(1, 0, 0, 1, 0, 0); // identity — clears in physical pixels
        dctx.clearRect(0, 0, ps.drawCanvas.width, ps.drawCanvas.height);
        dctx.restore();
        hctx.save();
        hctx.setTransform(1, 0, 0, 1, 0, 0);
        hctx.clearRect(0, 0, ps.highCanvas.width, ps.highCanvas.height);
        hctx.restore();
        // Re-apply DPR transform so the context is ready for subsequent draws
        dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Clear DOM annotation layers too
        ps.textLayer.innerHTML = '';
        ps.stickyLayer.innerHTML = '';
    }

    pushPdfHistory();
    markDirty();
}

function clearSelection() {
    PDF.selected = null;
    document.querySelectorAll('.pdf-textbox, .pdf-sticky-note').forEach(function (el) {
        el.classList.remove('anno-selected');
        var chip = el.querySelector('.anno-del-chip'); if (chip) chip.hidden = true;
    });
}

function deleteSelected() {
    if (!PDF.selected) return;
    var pageNum = PDF.selected.page;
    ensureAnnPage(pageNum);
    var ann = PDF.annotations.pages[pageNum];
    if (PDF.selected.type === 'text') ann.texts = (ann.texts || []).filter(function (t) { return t.id !== PDF.selected.id; });
    else if (PDF.selected.type === 'sticky') ann.stickies = (ann.stickies || []).filter(function (s) { return s.id !== PDF.selected.id; });
    clearSelection();
    renderPageAnnotations(pageNum);
    pushPdfHistory();
    markDirty();
}

function attachDeleteChip(el, type, pageNum, id) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'anno-del-chip';
    chip.textContent = '×';
    chip.title = 'Delete';
    chip.hidden = true;
    chip.addEventListener('click', function (e) { e.stopPropagation(); selectAnno(type, pageNum, id); deleteSelected(); });
    el.appendChild(chip);
}

function pushPdfHistory() {
    var snapshot = JSON.stringify(PDF.annotations);
    PDF.history = PDF.history.slice(0, PDF.historyIndex + 1);
    PDF.history.push(snapshot);
    PDF.historyIndex += 1;
    document.getElementById('pdfUndoBtn').disabled = PDF.historyIndex <= 0;
    
}

function undoPdf() {
    if (PDF.historyIndex <= 0) return;
    PDF.historyIndex -= 1;
    PDF.annotations = JSON.parse(PDF.history[PDF.historyIndex]);
    PDF.pageOrder.forEach(renderPageAnnotations);
    markDirty();
}

function redoPdf() {
    if (PDF.historyIndex >= PDF.history.length - 1) return;
    PDF.historyIndex += 1;
    PDF.annotations = JSON.parse(PDF.history[PDF.historyIndex]);
    PDF.pageOrder.forEach(renderPageAnnotations);
    markDirty();
}

function markDirty() {
    PDF.dirty = true;
    updateSaveStatus('Saving...');
    clearTimeout(PDF.autosaveTimer);
    PDF.autosaveTimer = setTimeout(forceSaveAnnotations, 1400);
}

function updateSaveStatus(text) { var el = document.getElementById('pdfSaveStatus'); if (el) el.textContent = text; }

function annotationCount(payload) {
    var count = 0;
    Object.keys(payload.pages || {}).forEach(function (k) {
        var p = payload.pages[k];
        count += (p.strokes || []).length + (p.highlights || []).length + (p.texts || []).length + (p.stickies || []).length;
    });
    return count;
}

function forceSaveAnnotations() {
    if (!PDF.fileId) return;
    var user = Storage.getCurrentUser();
    if (!user) return;
    SupabaseClient.savePdfAnnotationsV2(PDF.fileId, PDF.annotations, user.id).then(function () {
        var meta = NOTE_PDF_META.find(function (x) { return x.id === PDF.fileId; });
        if (meta) {
            meta.updatedAt = new Date().toISOString();
            meta.isEdited = annotationCount(PDF.annotations) > 0;
            meta.annotationCount = annotationCount(PDF.annotations);
            return SupabaseClient.savePdfMeta(meta);
        }
    }).then(function () {
        PDF.dirty = false;
        updateSaveStatus('Saved');
        refreshPdfMetaList();
    }).catch(function () {
        updateSaveStatus('Save failed');
    });
}

function setZoom(next) {
    next = Math.max(0.6, Math.min(2.2, next));
    if (Math.abs(next - PDF.zoom) < 0.001) return;
    PDF.zoom = next;
    document.getElementById('pdfZoomLabel').textContent = Math.round(PDF.zoom * 100) + '%';
    renderAllPages();
}

function jumpToPage(pageNum) {
    pageNum = Math.max(1, Math.min(PDF.pageOrder.length || 1, pageNum));
    PDF.currentPage = pageNum;
    var wrap = PDF.pages[pageNum] && PDF.pages[pageNum].wrap;
    if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('pdfPageInput').value = pageNum;
    document.querySelectorAll('.pdf-thumb-item').forEach(function (x) { x.classList.toggle('active', parseInt(x.dataset.page, 10) === pageNum); });
}

function bindScrollSync() {
    var root = document.getElementById('pdfPagesRoot');
    if (!root) return;
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var p = parseInt(entry.target.dataset.page, 10) || 1;
                PDF.currentPage = p;
                document.getElementById('pdfPageInput').value = p;
                document.querySelectorAll('.pdf-thumb-item').forEach(function (x) { x.classList.toggle('active', parseInt(x.dataset.page, 10) === p); });
            }
        });
    }, { root: document.getElementById('pdfScrollWrap'), threshold: 0.5 });
    root.querySelectorAll('.pdf-page-wrap').forEach(function (el) { observer.observe(el); });
}

function setCanvasSize(canvas, w, h) {
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
}

function pointerOnCanvas(canvas, e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function pointerOnElement(el, e) { var r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function uid() { return Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8); }

// Converts #RRGGBB or #RGB hex to {r,g,b}. Falls back to blue if unparseable.
function hexToRgb(hex) {
    if (!hex) return { r: 30, g: 58, b: 138 };
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function makeDraggableBox(el, onMove, canDrag) {
    var dragging = null;
    el.addEventListener('pointerdown', function (e) {
        if (canDrag && !canDrag()) return;
        if (e.target.closest && (e.target.closest('.sticky-content') || e.target.closest('.sticky-del') || e.target.closest('.anno-del-chip'))) return;
        if (document.activeElement && document.activeElement.isContentEditable) return;
        dragging = { x: e.clientX - el.offsetLeft, y: e.clientY - el.offsetTop };
        el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var x = Math.max(0, e.clientX - dragging.x);
        var y = Math.max(0, e.clientY - dragging.y);
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        onMove(x, y);
    });
    el.addEventListener('pointerup', function () { dragging = null; });
}

function makeResizableBox(el, onResize) {
    var handle = document.createElement('div');
    handle.style.cssText = 'position:absolute;bottom:0;right:0;width:12px;height:12px;background:#ccc;cursor:nwse-resize;border-radius:0 0 2px 0;';
    el.appendChild(handle);
    var resizing = null;
    handle.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        resizing = { width: el.offsetWidth, height: el.offsetHeight, x: e.clientX, y: e.clientY };
        handle.setPointerCapture(e.pointerId);
    });
    document.addEventListener('pointermove', function (e) {
        if (!resizing) return;
        var w = Math.max(100, resizing.width + (e.clientX - resizing.x));
        var h = Math.max(60, resizing.height + (e.clientY - resizing.y));
        el.style.width = w + 'px';
        el.style.height = h + 'px';
        onResize(w, h);
    });
    document.addEventListener('pointerup', function () { resizing = null; });
}

async function createPdfThumbnail(blob) {
    try {
        var arr = await blobToUint8Array(blob);
        var doc = await pdfjsLib.getDocument({ data: arr }).promise;
        var page = await doc.getPage(1);
        var viewport = page.getViewport({ scale: 0.25 });
        var canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
        return canvas.toDataURL('image/png');
    } catch (e) { return ''; }
}

function blobToUint8Array(blob) {
    return new Promise(function (resolve, reject) {
        var fr = new FileReader();
        fr.onload = function () { resolve(new Uint8Array(fr.result)); };
        fr.onerror = function () { reject(fr.error); };
        fr.readAsArrayBuffer(blob);
    });
}

function bindBasicNoteModal() {
    var modal = document.getElementById('noteModal');
    document.getElementById('btnNewNote').addEventListener('click', function () { openSimpleNoteModal(null); });
    document.getElementById('noteModalClose').addEventListener('click', closeSimpleNoteModal);
    document.getElementById('noteCancelBtn').addEventListener('click', closeSimpleNoteModal);
    document.getElementById('noteSaveBtn').addEventListener('click', saveSimpleNoteModal);
    modal.addEventListener('click', function (e) { if (e.target && e.target.id === 'noteModal') closeSimpleNoteModal(); });
    var sel = document.getElementById('noteSubject');
    sel.innerHTML = getNoteSubjectCodes()
        .map(function (s) {
            return '<option value="' + escAttr(s) + '">' + esc(noteSubjectLabel(s)) + '</option>';
        })
        .join('');
}

function openSimpleNoteModal() { document.getElementById('noteTitle').value = ''; document.getElementById('noteContent').value = ''; document.getElementById('noteModal').classList.add('open'); }
function closeSimpleNoteModal() { document.getElementById('noteModal').classList.remove('open'); }
function saveSimpleNoteModal() {
    var user = Storage.getCurrentUser();
    SupabaseClient.saveNote({
        userId: user.id,
        title: (document.getElementById('noteTitle').value || 'Untitled').trim(),
        subject: document.getElementById('noteSubject').value,
        content: document.getElementById('noteContent').value || ''
    }).then(function (saved) {
        if (!saved) {
            AccountifyUI.toast('Could not save note', 'error');
            return;
        }
        AccountifyUI.toast('Note saved', 'success');
        closeSimpleNoteModal();
    });
}

function logout() {
    SupabaseClient.signOut().finally(function () {
        Storage.logout();
        window.location.replace('login.html');
    });
}    

function clearAllPages() {
    PDF.pageOrder.forEach(function (pageNum) {
        PDF.annotations.pages[pageNum] = { strokes: [], highlights: [], texts: [], stickies: [] };
        var ps = PDF.pages[pageNum];
        if (ps) {
            var dpr = Math.max(1, window.devicePixelRatio || 1);
            var dctx = ps.drawCanvas.getContext('2d');
            var hctx = ps.highCanvas.getContext('2d');
            dctx.save();
            dctx.setTransform(1, 0, 0, 1, 0, 0);
            dctx.clearRect(0, 0, ps.drawCanvas.width, ps.drawCanvas.height);
            dctx.restore();
            hctx.save();
            hctx.setTransform(1, 0, 0, 1, 0, 0);
            hctx.clearRect(0, 0, ps.highCanvas.width, ps.highCanvas.height);
            hctx.restore();
            dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ps.textLayer.innerHTML = '';
            ps.stickyLayer.innerHTML = '';
        }
    });
    pushPdfHistory();
    markDirty();
}