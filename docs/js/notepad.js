// v2
// ============================================
// DIGITAL NOTEPAD — Canvas drawing
// ============================================

var NP = {
    bgCanvas: null,
    bgCtx: null,
    canvas: null,
    ctx: null,
    tool: 'pencil',
    color: '#1E3A8A',
    brushSize: 12,
    bgType: 'white',
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    history: [],
    historyStep: -1,
    maxHistory: 28,
    currentEntryId: null,
    currentSubject: 'FAR'
};

var _notepadInitialized = false;

document.addEventListener('DOMContentLoaded', function () {
    if (window.__authReady) {
        initNotepad();
    } else {
        window.addEventListener('authReady', initNotepad, { once: true });
    }
});

function initNotepad() {
    if (_notepadInitialized) return;
    var user = Storage.getCurrentUser();
    if (!user) return;

    NP.canvas = document.getElementById('drawingCanvas');
    NP.bgCanvas = document.getElementById('bgCanvas');
    if (!NP.canvas || !NP.bgCanvas) return;

    _notepadInitialized = true;
    NP.ctx = NP.canvas.getContext('2d');
    NP.bgCtx = NP.bgCanvas.getContext('2d');

    initCanvasSurface();
    bindToolbars();
    bindNotepadExtras();
    bindCanvasEvents();
    renderSavedList();

    window.addEventListener('resize', scheduleResizeCanvas);
    scheduleResizeCanvas();
    updateUndoRedoButtons();
}

function scheduleResizeCanvas() {
    requestAnimationFrame(resizeCanvasDisplay);
}

/** Keeps backing store at 800×440; scales display via CSS. */
function resizeCanvasDisplay() {
    var wrap = NP.canvas.parentElement;
    if (!wrap) return;
    var maxW = Math.min(wrap.clientWidth - 32, 920);
    var h = Math.round(maxW * (440 / 800));
    NP.canvas.style.width = maxW + 'px';
    NP.canvas.style.height = h + 'px';
    if (NP.bgCanvas) {
        NP.bgCanvas.style.width = maxW + 'px';
        NP.bgCanvas.style.height = h + 'px';
    }
}

function initCanvasSurface() {
    drawBackground(NP.bgType);
    NP.ctx.clearRect(0, 0, NP.canvas.width, NP.canvas.height);
    resetHistoryWithCurrent();
}

function resetHistoryWithCurrent() {
    NP.history = [];
    NP.historyStep = -1;
    pushHistory();
}

function pushHistory() {
    var ctx = NP.ctx;
    var w = NP.canvas.width;
    var h = NP.canvas.height;
    var data = ctx.getImageData(0, 0, w, h);
    NP.history = NP.history.slice(0, NP.historyStep + 1);
    NP.history.push(data);
    NP.historyStep += 1;
    while (NP.history.length > NP.maxHistory) {
        NP.history.shift();
        NP.historyStep -= 1;
    }
    updateUndoRedoButtons();
}

function undo() {
    if (NP.historyStep <= 0) return;
    NP.historyStep -= 1;
    NP.ctx.putImageData(NP.history[NP.historyStep], 0, 0);
    updateUndoRedoButtons();
}

function redo() {
    if (NP.historyStep >= NP.history.length - 1) return;
    NP.historyStep += 1;
    NP.ctx.putImageData(NP.history[NP.historyStep], 0, 0);
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    var u = document.getElementById('btnUndo');
    var r = document.getElementById('btnRedo');
    if (u) u.disabled = NP.historyStep <= 0;
    if (r) r.disabled = NP.historyStep >= NP.history.length - 1;
}

function bindToolbars() {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.tool-btn[data-tool]').forEach(function (b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            NP.tool = btn.getAttribute('data-tool');
        });
    });

    document.querySelectorAll('.color-swatch').forEach(function (sw) {
        sw.addEventListener('click', function () {
            document.querySelectorAll('.color-swatch').forEach(function (s) {
                s.classList.remove('active');
            });
            sw.classList.add('active');
            NP.color = sw.getAttribute('data-color');
            var free = document.getElementById('freeColor');
            if (free) free.value = NP.color;
        });
    });

    var freeColor = document.getElementById('freeColor');
    if (freeColor) {
        freeColor.addEventListener('input', function () {
            NP.color = freeColor.value || '#1E3A8A';
            document.querySelectorAll('.color-swatch').forEach(function (s) {
                s.classList.toggle('active', s.getAttribute('data-color') === NP.color);
            });
        });
    }

    document.getElementById('brushSize').addEventListener('input', function (e) {
        NP.brushSize = parseInt(e.target.value, 10) || 12;
    });

    var bgSel = document.getElementById('bgSelect');
    if (bgSel) {
        bgSel.addEventListener('change', function () {
            NP.bgType = bgSel.value || 'white';
            drawBackground(NP.bgType);
        });
    }

    document.getElementById('btnUndo').addEventListener('click', undo);
    document.getElementById('btnRedo').addEventListener('click', redo);

    document.getElementById('btnNewPage').addEventListener('click', function () {
        if (
            !window.confirm(
                'Start a new blank canvas? Save your drawing first if you need to keep it. Continue?'
            )
        ) {
            return;
        }
        NP.currentEntryId = null;
        initCanvasSurface();
        document.querySelectorAll('.saved-item').forEach(function (el) {
            el.classList.remove('active');
        });
        AccountifyUI.toast('New canvas ready', 'success');
    });

    document.getElementById('btnClear').addEventListener('click', function () {
        AccountifyUI.confirmDelete('Clear the drawing layer?').then(function (ok) {
            if (!ok) return;
            NP.ctx.clearRect(0, 0, NP.canvas.width, NP.canvas.height);
            pushHistory();
            AccountifyUI.toast('Canvas cleared', 'success');
        });
    });

    document.getElementById('btnSaveDrawing').addEventListener('click', saveDrawing);
    document.getElementById('btnExportPng').addEventListener('click', exportPng);
}

function populateNotepadSubjectSelect() {
    var subSel = document.getElementById('notepadSubjectSelect');
    if (!subSel) return;
    if (window.AccolyStats) {
        subSel.innerHTML = AccolyStats.getSubjectOptions()
            .map(function (o) {
                return '<option value="' + o.value + '">' + o.label + '</option>';
            })
            .join('');
    } else {
        subSel.innerHTML =
            '<option value="FAR">FAR</option><option value="AFAR">AFAR</option>' +
            '<option value="MS">MS</option><option value="AUD">AUD</option>' +
            '<option value="RFBT">RFBT</option><option value="TAX">TAX</option>';
    }
    if (!subSel.querySelector('option[value="' + NP.currentSubject + '"]')) {
        NP.currentSubject = 'FAR';
    }
    subSel.value = NP.currentSubject || 'FAR';
}

function bindNotepadExtras() {
    populateNotepadSubjectSelect();
    var subSel = document.getElementById('notepadSubjectSelect');
    if (subSel) {
        subSel.addEventListener('change', function () {
            NP.currentSubject = subSel.value || 'FAR';
            NP.currentEntryId = null;
            document.querySelectorAll('.saved-item').forEach(function (el) {
                el.classList.remove('active');
            });
            renderSavedList();
        });
    }

    var upInput = document.getElementById('notepadUploadInput');
    var upBtn = document.getElementById('btnUploadNotepad');
    if (upBtn && upInput) {
        upBtn.addEventListener('click', function () {
            upInput.value = '';
            upInput.click();
        });
        upInput.addEventListener('change', function () {
            var f = upInput.files && upInput.files[0];
            if (!f) return;
            if (!/^image\//.test(f.type)) {
                AccountifyUI.toast('Please choose an image file', 'warning');
                return;
            }
            var url = URL.createObjectURL(f);
            var img = new Image();
            img.onload = function () {
                try {
                    NP.ctx.drawImage(img, 0, 0, NP.canvas.width, NP.canvas.height);
                    pushHistory();
                    AccountifyUI.toast('Image placed on canvas', 'success');
                } finally {
                    URL.revokeObjectURL(url);
                }
            };
            img.onerror = function () {
                URL.revokeObjectURL(url);
                AccountifyUI.toast('Could not load image', 'error');
            };
            img.src = url;
        });
    }

    var fsBtn = document.getElementById('btnNotepadFullscreen');
    if (fsBtn) {
        fsBtn.addEventListener('click', function () {
            var shell = document.getElementById('notepadShell');
            if (shell) shell.classList.toggle('notepad-shell--fullscreen');
            document.body.classList.toggle('notepad-fullscreen-canvas');
            fsBtn.textContent = document.body.classList.contains('notepad-fullscreen-canvas') ? 'Exit full' : 'Full canvas';
            scheduleResizeCanvas();
        });
    }
}

function applyToolStyle() {
    var ctx = NP.ctx;
    var size = NP.brushSize;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    if (NP.tool === 'eraser') {
        // Erase only on drawing layer; background stays intact on bgCanvas.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = Math.max(8, size * 1.4 + 4);
        return;
    }

    ctx.globalCompositeOperation = 'source-over';
    if (NP.tool === 'highlighter') {
        ctx.globalAlpha = 0.32;
        ctx.lineCap = 'butt';
        ctx.lineWidth = Math.max(14, size * 2.2 + 6);
        ctx.strokeStyle = hexToRgba(NP.color, 0.45);
    } else if (NP.tool === 'pen') {
        ctx.globalAlpha = 1;
        ctx.lineWidth = Math.max(2, size * 0.75 + 1.5);
        ctx.strokeStyle = NP.color;
    } else {
        // Pencil: softer, slightly transparent, subtle blur
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = Math.max(1, size * 0.55);
        ctx.strokeStyle = NP.color;
        ctx.shadowBlur = 1.5;
        ctx.shadowColor = hexToRgba(NP.color, 0.35);
    }
}

function hexToRgba(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

function getPointer(e) {
    var rect = NP.canvas.getBoundingClientRect();
    var scaleX = NP.canvas.width / rect.width;
    var scaleY = NP.canvas.height / rect.height;
    var cx = e.clientX;
    var cy = e.clientY;
    if (e.touches && e.touches[0]) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
    }
    return {
        x: (cx - rect.left) * scaleX,
        y: (cy - rect.top) * scaleY
    };
}

function bindCanvasEvents() {
    var c = NP.canvas;

    c.addEventListener('mousedown', startDraw);
    c.addEventListener('mousemove', draw);
    c.addEventListener('mouseup', endDraw);
    c.addEventListener('mouseleave', endDraw);

    c.addEventListener('touchstart', function (e) {
        e.preventDefault();
        startDraw(e);
    });
    c.addEventListener('touchmove', function (e) {
        e.preventDefault();
        draw(e);
    });
    c.addEventListener('touchend', function (e) {
        e.preventDefault();
        endDraw(e);
    });
}

function startDraw(e) {
    if (e.button !== undefined && e.button !== 0) return;
    NP.isDrawing = true;
    var p = getPointer(e);
    NP.lastX = p.x;
    NP.lastY = p.y;
    applyToolStyle();
    var ctx = NP.ctx;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.01, p.y);
    ctx.stroke();
}

function draw(e) {
    if (!NP.isDrawing) return;
    var p = getPointer(e);
    applyToolStyle();
    var ctx = NP.ctx;
    ctx.beginPath();
    ctx.moveTo(NP.lastX, NP.lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    NP.lastX = p.x;
    NP.lastY = p.y;
}

function endDraw() {
    if (!NP.isDrawing) return;
    NP.isDrawing = false;
    NP.ctx.globalAlpha = 1;
    NP.ctx.globalCompositeOperation = 'source-over';
    NP.ctx.shadowBlur = 0;
    NP.ctx.shadowColor = 'transparent';
    pushHistory();
}

/** Solid white base + selected background + drawing (no transparent checkerboard in PNG). */
function compositeCanvasToDataURL() {
    var w = NP.canvas.width;
    var h = NP.canvas.height;
    var tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    var tctx = tmp.getContext('2d');
    tctx.fillStyle = '#ffffff';
    tctx.fillRect(0, 0, w, h);
    if (NP.bgCanvas) tctx.drawImage(NP.bgCanvas, 0, 0);
    tctx.drawImage(NP.canvas, 0, 0);
    return tmp.toDataURL('image/png');
}

function saveDrawing() {
    var user = Storage.getCurrentUser();
    if (!user) {
        AccountifyUI.toast('Please login to save drawings', 'error');
        return;
    }
    
    try {
        var imageData = compositeCanvasToDataURL();
        var drawDataUrl = '';
        try {
            drawDataUrl = NP.canvas.toDataURL('image/png');
        } catch (e) {
            console.error('Canvas toDataURL error:', e);
            drawDataUrl = '';
        }
        
        // Validate canvas data
        if (!imageData || imageData.length < 100) {
            AccountifyUI.toast('Cannot save empty drawing', 'warning');
            return;
        }
        
        var payload = {
            userId: user.id,
            imageData: imageData,
            previewDataUrl: imageData,
            drawDataUrl: drawDataUrl,
            bgType: NP.bgType,
            subject: NP.currentSubject || 'FAR'
        };
        
        if (NP.currentEntryId) payload.id = NP.currentEntryId;

        SupabaseClient.saveNotepadEntry(payload)
            .then(function (saved) {
                if (!saved) {
                    AccountifyUI.toast('Failed to save drawing', 'error');
                    return;
                }
                NP.currentEntryId = saved.id;
                AccountifyUI.toast('Drawing saved successfully', 'success');
                renderSavedList();
            })
            .catch(function (error) {
                console.error('Save drawing error:', error);
                AccountifyUI.toast('Failed to save drawing', 'error');
            });
    } catch (error) {
        console.error('Save drawing error:', error);
        AccountifyUI.toast('Failed to save drawing', 'error');
    }
}

function exportPng() {
    try {
        var url = compositeCanvasToDataURL();
        if (!url || url.length < 100) {
            AccountifyUI.toast('Cannot export empty drawing', 'warning');
            return;
        }
        
        var a = document.createElement('a');
        a.href = url;
        a.download = 'accountify-notepad-' + Date.now() + '.png';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        AccountifyUI.toast('PNG downloaded successfully', 'success');
    } catch (error) {
        console.error('Export error:', error);
        AccountifyUI.toast('Failed to export PNG', 'error');
    }
}

function renderSavedList() {
    var user = Storage.getCurrentUser();
    if (!NP.currentSubject) { 
        var _sel = document.getElementById('notepadSubjectSelect'); 
        NP.currentSubject = (_sel && _sel.value) || 'AUD'; 
    }
    var sub = NP.currentSubject;
    var container = document.getElementById('savedList');
    if (!container || !user) return;

    container.innerHTML = '<p style="font-size:0.85rem;color:var(--text-secondary);margin:0;">Loading...</p>';

    // Check if Supabase client is available
    if (!window.SupabaseClient) {
        console.error('[Notepad] SupabaseClient not available');
        container.innerHTML = '<p style="font-size:0.85rem;color:var(--text-secondary);margin:0;">Service unavailable.</p>';
        return;
    }

    // Try to fetch from Supabase directly
    try {
        var supabase = window.supabase;
        if (!supabase || !supabase.from) {
            container.innerHTML = '<p style="font-size:0.85rem;color:var(--text-secondary);margin:0;">Database error.</p>';
            return;
        }

        supabase
            .from('notepad_canvases')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .then(function (result) {
                var entries = result.data || [];
                
                if (result.error) {
                    console.error('[Notepad] Query error:', result.error);
                    container.innerHTML = '<p style="font-size:0.85rem;color:var(--text-secondary);margin:0;">Failed to load. Check console.</p>';
                    return;
                }

                var normalizeCode = function (code) {
                    try {
                        if (window.AccolyStats && typeof AccolyStats.normalizeSubjectCode === 'function') {
                            return AccolyStats.normalizeSubjectCode(code);
                        }
                    } catch (_) {}
                    return (code || 'AUD').toUpperCase().trim();
                };

                var normalizedSub = normalizeCode(sub);
                var list = (entries || []).filter(function (e) {
                    return normalizeCode(e.subject) === normalizedSub;
                }).sort(function (a, b) {
                    var timeA = new Date(a.createdAt || a.created_at).getTime();
                    var timeB = new Date(b.createdAt || b.created_at).getTime();
                    return timeB - timeA;
                });

                if (list.length === 0) {
                    container.innerHTML = '<p style="font-size:0.85rem;color:var(--text-secondary);margin:0;">No saved pages yet.</p>';
                    return;
                }

                container.innerHTML = '';
                list.forEach(function (entry) {
                    appendSavedListItem(container, entry);
                });
            })
            .catch(function (err) {
                console.error('[Notepad] Error loading canvases:', err);
                container.innerHTML = '<p style="font-size:0.85rem;color:var(--text-secondary);margin:0;">Error: ' + (err.message || 'Unknown error') + '</p>';
            });
    } catch (err) {
        console.error('[Notepad] Exception:', err);
        container.innerHTML = '<p style="font-size:0.85rem;color:var(--text-secondary);margin:0;">Exception: ' + err.message + '</p>';
    }
}

function appendSavedListItem(container, entry) {
    var div = document.createElement('div');
    div.className = 'saved-item' + (entry.id === NP.currentEntryId ? ' active' : '');
    div.dataset.id = entry.id;

    var img = document.createElement('img');
    img.className = 'saved-thumb';
    img.src = entry.previewDataUrl || entry.imageData || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60"><rect fill="%23f0f0f0" width="100" height="60"/></svg>';
    img.alt = 'Saved drawing';

    var small = document.createElement('small');
    var dateStr = entry.createdAt || entry.created_at;
    small.textContent = new Date(dateStr).toLocaleString();

    var row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '0.35rem';
    row.style.marginTop = '0.35rem';

    var loadBtn = document.createElement('button');
    loadBtn.type = 'button';
    loadBtn.className = 'btn btn-outline';
    loadBtn.style.flex = '1';
    loadBtn.style.padding = '0.25rem';
    loadBtn.style.fontSize = '0.75rem';
    loadBtn.textContent = 'Load';

    var delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn btn-outline';
    delBtn.style.padding = '0.25rem';
    delBtn.style.fontSize = '0.75rem';
    delBtn.textContent = 'Del';

    loadBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        loadEntry(entry);
    });

    delBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (confirm('Delete this saved page?')) {
            window.supabase
                .from('notepad_canvases')
                .delete()
                .eq('id', entry.id)
                .then(function () {
                    if (NP.currentEntryId === entry.id) NP.currentEntryId = null;
                    renderSavedList();
                });
        }
    });

    div.appendChild(img);
    div.appendChild(small);
    row.appendChild(loadBtn);
    row.appendChild(delBtn);
    div.appendChild(row);

    div.addEventListener('click', function () {
        loadEntry(entry);
    });

    container.appendChild(div);
}

function loadEntry(entry) {
    if (!entry || !entry.imageData) {
        console.error('Invalid entry:', entry);
        return;
    }
    
    var img = new Image();
    img.onload = function () {
        NP.ctx.clearRect(0, 0, NP.canvas.width, NP.canvas.height);
        NP.ctx.drawImage(img, 0, 0);
        NP.currentEntryId = entry.id;
        NP.currentSubject = entry.subject;
        resetHistoryWithCurrent();
        renderSavedList();
    };
    img.src = entry.imageData;
}

function logout() {
    SupabaseClient.signOut().finally(function () {
        Storage.logout();
        window.location.replace('login.html');
    });
}

function drawBackground(type) {
    if (!NP.bgCtx || !NP.bgCanvas) return;
    var ctx = NP.bgCtx;
    var w = NP.bgCanvas.width;
    var h = NP.bgCanvas.height;

    // Always draw a white base layer behind backgrounds.
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (type === 'grid') {
        ctx.save();
        ctx.strokeStyle = 'rgba(30, 58, 138, 0.10)';
        ctx.lineWidth = 1;
        var step = 28;
        for (var x = 0; x <= w; x += step) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, h);
            ctx.stroke();
        }
        for (var y = 0; y <= h; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(w, y + 0.5);
            ctx.stroke();
        }
        // thicker major lines
        ctx.strokeStyle = 'rgba(30, 58, 138, 0.16)';
        var major = step * 5;
        for (var mx = 0; mx <= w; mx += major) {
            ctx.beginPath();
            ctx.moveTo(mx + 0.5, 0);
            ctx.lineTo(mx + 0.5, h);
            ctx.stroke();
        }
        for (var my = 0; my <= h; my += major) {
            ctx.beginPath();
            ctx.moveTo(0, my + 0.5);
            ctx.lineTo(w, my + 0.5);
            ctx.stroke();
        }
        ctx.restore();
    } else if (type === 'canvas') {
        // light "paper" tone + subtle texture dots
        ctx.save();
        ctx.fillStyle = 'rgb(252, 248, 240)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
        for (var i = 0; i < 900; i++) {
            var px = Math.random() * w;
            var py = Math.random() * h;
            ctx.fillRect(px, py, 1, 1);
        }
        ctx.restore();
    }
}