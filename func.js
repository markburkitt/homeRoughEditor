//init
WALLS = [];
OBJDATA = [];
ROOM = [];
HISTORY = [];
window.wallSize = 10;
window.partitionSize = 6;
let drag = 'off';
let action = 0;
let magnetic = 0;
let construc = 0;
let Rcirclebinder = 8;
let mode = 'select_mode';
let modeOption;
let linElement = $('#lin');
taille_w = linElement.width();
taille_h = linElement.height();
let offset = linElement.offset();
// Debug: log initial floorplan image (background) width, height, and offset (x,y)
try {
    const bgEl = (typeof document !== 'undefined') ? document.getElementById('backgroundImage') : null;
    if (bgEl) {
        const parseNum = (v, d=0) => { const n = parseFloat(v); return isFinite(n) ? n : d; };
        const fw = parseNum(bgEl.getAttribute('width'));
        const fh = parseNum(bgEl.getAttribute('height'));
        const fx = parseNum(bgEl.getAttribute('x'));
        const fy = parseNum(bgEl.getAttribute('y'));
        console.info('[init] floorplan image', { width: fw, height: fh, offset: { x: fx, y: fy } });
    }
} catch (_) {}
grid = 20;
showRib = true;
showArea = true;
meter = 160;
grid_snap = 'off';
colorbackground = "#ffffff";
colorline = "#fff";
colorroom = "#f0daaf";
colorWall = "#666";
pox = 0;
poy = 0;
segment = 0;
xpath = 0;
ypath = 0;
let width_viewbox = 1100; // Fixed SVG coordinate system width
let height_viewbox = 700;  // Fixed SVG coordinate system height
let ratio_viewbox = height_viewbox / width_viewbox;
let originX_viewbox = 0;
let originY_viewbox = 0;
let zoom = 9;
let factor = 1;

// **************************************************************************
// *****************   LOAD / SAVE LOCALSTORAGE      ************************
// **************************************************************************

function initHistory(boot = false) {
    HISTORY.index = 0;
    // Preserve existing history across sessions to allow restoring background image metrics.
    // Do not clear here; new plan initializers below will explicitly clear when appropriate.
    // if (!boot && localStorage.getItem('history')) localStorage.removeItem('history');
    if (localStorage.getItem('history') && boot === "recovery") {
        let historyTemp = JSON.parse(localStorage.getItem('history'));
        HISTORY = historyTemp;
        HISTORY.index = historyTemp.length; // Set index to end of loaded history
        load(historyTemp.length - 1, "boot");
        save("boot");
    }
    if (boot === "newSquare") {
        if (localStorage.getItem('history')) localStorage.removeItem('history');
        HISTORY.push({
            "objData": [],
            "wallData": [{
                "thick": 20,
                "start": { "x": 540, "y": 194 },
                "end": { "x": 540, "y": 734 },
                "type": "normal",
                "parent": 3,
                "child": 1,
                "angle": 1.5707963267948966,
                "equations": { "up": { "A": "v", "B": 550 }, "down": { "A": "v", "B": 530 }, "base": { "A": "v", "B": 540 } },
                "coords": [{ "x": 550, "y": 204 }, { "x": 530, "y": 184 }, { "x": 530, "y": 744 }, { "x": 550, "y": 724 }],
                "graph": { "0": {}, "context": {}, "length": 1 }
            }, {
                "thick": 20,
                "start": { "x": 540, "y": 734 },
                "end": { "x": 1080, "y": 734 },
                "type": "normal",
                "parent": 0,
                "child": 2,
                "angle": 0,
                "equations": { "up": { "A": "h", "B": 724 }, "down": { "A": "h", "B": 744 }, "base": { "A": "h", "B": 734 } },
                "coords": [{ "x": 550, "y": 724 }, { "x": 530, "y": 744 }, { "x": 1090, "y": 744 }, { "x": 1070, "y": 724 }],
                "graph": { "0": {}, "context": {}, "length": 1 }
            }, {
                "thick": 20,
                "start": { "x": 1080, "y": 734 },
                "end": { "x": 1080, "y": 194 },
                "type": "normal",
                "parent": 1,
                "child": 3,
                "angle": -1.5707963267948966,
                "equations": {
                    "up": { "A": "v", "B": 1070 },
                    "down": { "A": "v", "B": 1090 },
                    "base": { "A": "v", "B": 1080 }
                },
                "coords": [{ "x": 1070, "y": 724 }, { "x": 1090, "y": 744 }, { "x": 1090, "y": 184 }, { "x": 1070, "y": 204 }],
                "graph": { "0": {}, "context": {}, "length": 1 }
            }, {
                "thick": 20,
                "start": { "x": 1080, "y": 194 },
                "end": { "x": 540, "y": 194 },
                "type": "normal",
                "parent": 2,
                "child": 0,
                "angle": 3.141592653589793,
                "equations": { "up": { "A": "h", "B": 204 }, "down": { "A": "h", "B": 184 }, "base": { "A": "h", "B": 194 } },
                "coords": [{ "x": 1070, "y": 204 }, { "x": 1090, "y": 184 }, { "x": 530, "y": 184 }, { "x": 550, "y": 204 }],
                "graph": { "0": {}, "context": {}, "length": 1 }
            }],
            "roomData": [{
                "coords": [{ "x": 540, "y": 734 }, { "x": 1080, "y": 734 }, { "x": 1080, "y": 194 }, {
                    "x": 540,
                    "y": 194
                }, { "x": 540, "y": 734 }],
                "coordsOutside": [{ "x": 1090, "y": 744 }, { "x": 1090, "y": 184 }, { "x": 530, "y": 184 }, {
                    "x": 530,
                    "y": 744
                }, { "x": 1090, "y": 744 }],
                "coordsInside": [{ "x": 1070, "y": 724 }, { "x": 1070, "y": 204 }, { "x": 550, "y": 204 }, {
                    "x": 550,
                    "y": 724
                }, { "x": 1070, "y": 724 }],
                "inside": [],
                "way": ["0", "2", "3", "1", "0"],
                "area": 270400,
                "surface": "",
                "name": "",
                "color": "gradientWhite",
                "showSurface": true,
                "action": "add"
            }]
        });
        HISTORY[0] = JSON.stringify(HISTORY[0]);
        localStorage.setItem('history', JSON.stringify(HISTORY));
        load(0);
        save();
    }
    if (boot === "newL") {
        if (localStorage.getItem('history')) localStorage.removeItem('history');
        HISTORY.push({
            "objData": [],
            "wallData": [{
                "thick": 20,
                "start": { "x": 447, "y": 458 },
                "end": { "x": 447, "y": 744 },
                "type": "normal",
                "parent": 5,
                "child": 1,
                "angle": 1.5707963267948966,
                "equations": { "up": { "A": "v", "B": 457 }, "down": { "A": "v", "B": 437 }, "base": { "A": "v", "B": 447 } },
                "coords": [{ "x": 457, "y": 468 }, { "x": 437, "y": 448 }, { "x": 437, "y": 754 }, { "x": 457, "y": 734 }],
                "graph": { "0": {}, "context": {}, "length": 1 }
            }, {
                "thick": 20,
                "start": { "x": 447, "y": 744 },
                "end": { "x": 1347, "y": 744 },
                "type": "normal",
                "parent": 0,
                "child": 2,
                "angle": 0,
                "equations": { "up": { "A": "h", "B": 734 }, "down": { "A": "h", "B": 754 }, "base": { "A": "h", "B": 744 } },
                "coords": [{ "x": 457, "y": 734 }, { "x": 437, "y": 754 }, { "x": 1357, "y": 754 }, { "x": 1337, "y": 734 }],
                "graph": { "0": {}, "context": {}, "length": 1 }
            }, {
                "thick": 20,
                "start": { "x": 1347, "y": 744 },
                "end": { "x": 1347, "y": 144 },
                "type": "normal",
                "parent": 1,
                "child": 3,
                "angle": -1.5707963267948966,
                "equations": {
                    "up": { "A": "v", "B": 1337 },
                    "down": { "A": "v", "B": 1357 },
                    "base": { "A": "v", "B": 1347 }
                },
                "coords": [{ "x": 1337, "y": 734 }, { "x": 1357, "y": 754 }, { "x": 1357, "y": 134 }, { "x": 1337, "y": 154 }],
                "graph": { "0": {}, "context": {}, "length": 1 }
            }, {
                "thick": 20,
                "start": { "x": 1347, "y": 144 },
                "end": { "x": 1020, "y": 144 },
                "type": "normal",
                "parent": 2,
                "child": 4,
                "angle": 3.141592653589793,
                "equations": { "up": { "A": "h", "B": 154 }, "down": { "A": "h", "B": 134 }, "base": { "A": "h", "B": 144 } },
                "coords": [{ "x": 1337, "y": 154 }, { "x": 1357, "y": 134 }, { "x": 1010, "y": 134 }, { "x": 1030, "y": 154 }],
                "graph": { "0": {}, "context": {}, "length": 1 }
            }, {
                "thick": 20,
                "start": { "x": 1020, "y": 144 },
                "end": { "x": 1020, "y": 458 },
                "type": "normal",
                "parent": 3,
                "child": 5,
                "angle": 1.5707963267948966,
                "equations": {
                    "up": { "A": "v", "B": 1030 },
                    "down": { "A": "v", "B": 1010 },
                    "base": { "A": "v", "B": 1020 }
                },
                "coords": [{ "x": 1030, "y": 154 }, { "x": 1010, "y": 134 }, { "x": 1010, "y": 448 }, { "x": 1030, "y": 468 }],
                "graph": { "0": {}, "context": {}, "length": 1 }
            }, {
                "thick": 20,
                "start": { "x": 1020, "y": 458 },
                "end": { "x": 447, "y": 458 },
                "type": "normal",
                "parent": 4,
                "child": 0,
                "angle": 3.141592653589793,
                "equations": { "up": { "A": "h", "B": 468 }, "down": { "A": "h", "B": 448 }, "base": { "A": "h", "B": 458 } },
                "coords": [{ "x": 1030, "y": 468 }, { "x": 1010, "y": 448 }, { "x": 437, "y": 448 }, { "x": 457, "y": 468 }],
                "graph": { "0": {}, "context": {}, "length": 1 }
            }],
            "roomData": [{
                "coords": [{ "x": 447, "y": 744 }, { "x": 1347, "y": 744 }, { "x": 1347, "y": 144 }, {
                    "x": 1020,
                    "y": 144
                }, { "x": 1020, "y": 458 }, { "x": 447, "y": 458 }, { "x": 447, "y": 744 }],
                "coordsOutside": [{ "x": 1357, "y": 754 }, { "x": 1357, "y": 134 }, { "x": 1010, "y": 134 }, {
                    "x": 1010,
                    "y": 448
                }, { "x": 437, "y": 448 }, { "x": 437, "y": 754 }, { "x": 1357, "y": 754 }],
                "coordsInside": [{ "x": 1337, "y": 734 }, { "x": 1337, "y": 154 }, { "x": 1030, "y": 154 }, {
                    "x": 1030,
                    "y": 468
                }, { "x": 457, "y": 468 }, { "x": 457, "y": 734 }, { "x": 1337, "y": 734 }],
                "inside": [],
                "way": ["0", "2", "3", "4", "5", "1", "0"],
                "area": 330478,
                "surface": "",
                "name": "",
                "color": "gradientWhite",
                "showSurface": true,
                "action": "add"
            }]
        });
        HISTORY[0] = JSON.stringify(HISTORY[0]);
        localStorage.setItem('history', JSON.stringify(HISTORY));
        load(0);
        save();
    }
}

document.getElementById('redo').addEventListener("click", function () {
    if (HISTORY.index < HISTORY.length) {
        load(HISTORY.index);
        HISTORY.index++;
        $('#undo').removeClass('disabled');
        if (HISTORY.index === HISTORY.length) {
            $('#redo').addClass('disabled');
        }
    }
});

document.getElementById('undo').addEventListener("click", function () {
    if (HISTORY.index > 0) {
        $('#undo').removeClass('disabled');
        if (HISTORY.index - 1 > 0) {
            HISTORY.index--;
            load(HISTORY.index - 1);
            $('#redo').removeClass('disabled');
        }
    }
    if (HISTORY.index === 1) $('#undo').addClass('disabled');
});

function save(boot = false) {
    // Only clear history on explicit boolean true; avoid clearing when called with strings like "boot"
    if (boot === true) localStorage.removeItem('history');
    // If background image sizing is in progress, defer save to avoid capturing default geometry
    try {
        if (typeof window !== 'undefined' && window.__bgSizing) {
            if (typeof console !== 'undefined' && console.debug) {
                console.debug('[save] deferred: background image sizing in progress');
            }
            setTimeout(function(){ try { save(boot); } catch(_){} }, 50);
            return false;
        }
    } catch(_) {}
    // FOR CYCLIC OBJ INTO LOCALSTORAGE !!!
    for (let k in WALLS) {
        if (WALLS[k].child != null) {
            WALLS[k].child = WALLS.indexOf(WALLS[k].child);
        }
        if (WALLS[k].parent != null) {
            WALLS[k].parent = WALLS.indexOf(WALLS[k].parent);
        }
    }
    // Gather background image state if present; if element is absent, carry over from previous snapshot to avoid reset
    const __bgImgEl = (typeof document !== 'undefined') ? document.getElementById('backgroundImage') : null;
    // Read previous snapshot (if any) to preserve background image when not present in DOM
    let __prevSnap = null;
    try { if (HISTORY && HISTORY.length > 0) { __prevSnap = JSON.parse(HISTORY[HISTORY.length - 1]); } } catch(_) {}
    // Fallback: read from localStorage history if in-memory HISTORY is empty or unparsable
    if (!__prevSnap) {
        try {
            const __ls = localStorage.getItem('history');
            if (__ls) {
                const __arr = JSON.parse(__ls);
                if (Array.isArray(__arr) && __arr.length > 0) {
                    __prevSnap = JSON.parse(__arr[__arr.length - 1]);
                }
            }
        } catch(_) {}
    }

    const backgroundImage = (__bgImgEl) ? (function(el){
        const parseNum = (v, d=0) => { const n = parseFloat(v); return isFinite(n) ? n : d; };
        const x = parseNum(el.getAttribute('x'), 0);
        const y = parseNum(el.getAttribute('y'), 0);
        const width = parseNum(el.getAttribute('width'), 0);
        const height = parseNum(el.getAttribute('height'), 0);
        let opacity = parseNum(el.getAttribute('opacity'), 1);
        if (!isFinite(opacity) || opacity <= 0) opacity = 1;
        const href = el.getAttribute('href') || el.getAttribute('xlink:href') || '';
        // Try to attach fileName from currentBackgroundImage reference if available
        let fileName = null;
        try { if (window.currentBackgroundImage && window.currentBackgroundImage.fileName) fileName = window.currentBackgroundImage.fileName; } catch(_) {}
        const snapshot = { x, y, width, height, opacity, href, fileName };
        try { if (typeof console !== 'undefined' && console.debug) console.debug('[save] backgroundImage snapshot', snapshot); } catch(_) {}
        return snapshot;
    })(__bgImgEl) : (__prevSnap && __prevSnap.backgroundImage ? __prevSnap.backgroundImage : null);

    const snapshot = { objData: OBJDATA, wallData: WALLS, roomData: ROOM, furnitureData: getFurnitureData(), cameraData: getCameraData(), lightData: getLightData(), backgroundImage };

    // If caller requests suppression and we'd drop background image (DOM missing) while previous snapshot has one, skip pushing
    try {
        if (typeof window !== 'undefined' && window.__suppressSaveIfNoBg) {
            const hasDomBg = !!__bgImgEl;
            const hadPrevBg = !!(__prevSnap && __prevSnap.backgroundImage);
            if (!hasDomBg && hadPrevBg) {
                if (typeof console !== 'undefined' && console.debug) {
                    console.debug('[save] suppressed: no DOM backgroundImage while previous snapshot had one');
                }
                // Clear the suppression flag for subsequent saves
                window.__suppressSaveIfNoBg = false;
                return false;
            }
            // Clear flag if we proceed
            window.__suppressSaveIfNoBg = false;
        }
    } catch(_) {}

    if (JSON.stringify(snapshot) === HISTORY[HISTORY.length - 1]) {
        for (let k in WALLS) {
            if (WALLS[k].child != null) {
                WALLS[k].child = WALLS[WALLS[k].child];
            }
            if (WALLS[k].parent != null) {
                WALLS[k].parent = WALLS[WALLS[k].parent];
            }
        }
        return false;
    }

    if (HISTORY.index < HISTORY.length) {
        HISTORY.splice(HISTORY.index, (HISTORY.length - HISTORY.index));
        $('#redo').addClass('disabled');
    }
    HISTORY.push(JSON.stringify(snapshot));
    
    // Manage history size to prevent localStorage quota exceeded
    const MAX_HISTORY_SIZE = 50; // Limit to 50 snapshots
    if (HISTORY.length > MAX_HISTORY_SIZE) {
        const removeCount = HISTORY.length - MAX_HISTORY_SIZE;
        HISTORY.splice(0, removeCount);
        HISTORY.index = Math.max(0, (HISTORY.index || 0) - removeCount);
    }
    
    try {
        localStorage.setItem('history', JSON.stringify(HISTORY));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded, clearing old history');
            // Keep only the last 10 snapshots
            HISTORY = HISTORY.slice(-10);
            HISTORY.index = Math.min((HISTORY.index || 0), HISTORY.length - 1);
            try {
                localStorage.setItem('history', JSON.stringify(HISTORY));
            } catch (e2) {
                console.error('Failed to save even reduced history:', e2);
                // Clear history entirely as last resort
                HISTORY = [];
                HISTORY.index = 0;
                localStorage.removeItem('history');
            }
        } else {
            throw e;
        }
    }
    
    // Ensure HISTORY.index is always a valid number before incrementing
    if (typeof HISTORY.index !== 'number' || isNaN(HISTORY.index)) {
        HISTORY.index = HISTORY.length - 1;
    }
    HISTORY.index++;
    // Log when state is saved to history along with current floorplan image metrics
    try {
        const bgEl = (typeof document !== 'undefined') ? document.getElementById('backgroundImage') : null;
        if (bgEl) {
            const parseNum = (v, d=0) => { const n = parseFloat(v); return isFinite(n) ? n : d; };
            const fw = parseNum(bgEl.getAttribute('width'));
            const fh = parseNum(bgEl.getAttribute('height'));
            const fx = parseNum(bgEl.getAttribute('x'));
            const fy = parseNum(bgEl.getAttribute('y'));
            console.info('[save] snapshot pushed', { historyIndex: HISTORY.index, width: fw, height: fh, offset: { x: fx, y: fy } });
        } else if (backgroundImage) {
            console.info('[save] snapshot pushed', { historyIndex: HISTORY.index, width: backgroundImage.width, height: backgroundImage.height, offset: { x: backgroundImage.x, y: backgroundImage.y }, note: 'carried over previous backgroundImage' });
        } else {
            console.info('[save] snapshot pushed', { historyIndex: HISTORY.index, note: 'no backgroundImage' });
        }
    } catch (_) {}
    if (HISTORY.index > 1) $('#undo').removeClass('disabled');
    for (let k in WALLS) {
        if (WALLS[k].child != null) {
            WALLS[k].child = WALLS[WALLS[k].child];
        }
        if (WALLS[k].parent != null) {
            WALLS[k].parent = WALLS[WALLS[k].parent];
        }
    }
    return true;
}

function load(index = HISTORY.index, boot = false) {
    if (HISTORY.length === 0 && !boot) return false;
    for (let k in OBJDATA) {
        OBJDATA[k].graph.remove();
    }
    OBJDATA = [];
    let historyTemp = [];
    historyTemp = JSON.parse(localStorage.getItem('history'));
    historyTemp = JSON.parse(historyTemp[index]);

    for (let k in historyTemp.objData) {
        let OO = historyTemp.objData[k];
        // if (OO.family === 'energy') OO.family = 'byObject';
        let obj = new editor.obj2D(OO.family, OO.class, OO.type, {
            x: OO.x,
            y: OO.y
        }, OO.angle, OO.angleSign, OO.size, OO.hinge = 'normal', OO.thick, OO.value);
        obj.limit = OO.limit;
        OBJDATA.push(obj);
        $('#boxcarpentry').append(OBJDATA[OBJDATA.length - 1].graph);
        obj.update();
    }
    WALLS = historyTemp.wallData;
    for (let k in WALLS) {
        if (WALLS[k].child != null) {
            WALLS[k].child = WALLS[WALLS[k].child];
        }
        if (WALLS[k].parent != null) {
            WALLS[k].parent = WALLS[WALLS[k].parent];
        }
    }
    ROOM = historyTemp.roomData;
    // Load furniture data if it exists
    if (historyTemp.furnitureData) {
        loadSavedFurnitureData(historyTemp.furnitureData);
    }
    // Load camera data if it exists
    if (historyTemp.cameraData) {
        loadSavedCameraData(historyTemp.cameraData);
    }
    // Load light data if it exists
    if (historyTemp.lightData) {
        loadSavedLightData(historyTemp.lightData);
    }
    // Restore background image properties if present and an image exists in DOM
    try {
        if (historyTemp.backgroundImage) {
            const bgEl = (typeof document !== 'undefined') ? document.getElementById('backgroundImage') : null;
            if (bgEl) {
                // Only restore if it's the same image as saved (match href)
                const currentHref = bgEl.getAttribute('href') || bgEl.getAttribute('xlink:href') || '';
                const savedHref = historyTemp.backgroundImage.href || '';
                try { if (console && console.debug) console.debug('[load] backgroundImage found', { currentHref, savedHref, props: historyTemp.backgroundImage }); } catch(_) {}
                if (savedHref && currentHref && currentHref === savedHref) {
                    try { if (console && console.debug) console.debug('[load] applying saved backgroundImage props'); } catch(_) {}
                    if (typeof adjustBackgroundImage === 'function') {
                        adjustBackgroundImage(historyTemp.backgroundImage);
                    } else {
                        const props = historyTemp.backgroundImage;
                        if (props.x !== undefined) bgEl.setAttribute('x', props.x);
                        if (props.y !== undefined) bgEl.setAttribute('y', props.y);
                        if (props.width !== undefined) bgEl.setAttribute('width', props.width);
                        if (props.height !== undefined) bgEl.setAttribute('height', props.height);
                        if (props.opacity !== undefined) bgEl.setAttribute('opacity', props.opacity);
                    }
                } else {
                    try { if (console && console.debug) console.debug('[load] skipping apply: href mismatch or missing'); } catch(_) {}
                }
            } else {
                try { if (console && console.debug) console.debug('[load] no #backgroundImage element to restore to'); } catch(_) {}
            }
        }
    } catch (e) {
        console.warn('Error restoring background image properties:', e);
    }

    // Update UI: filename display and Floorplan mode button based on background image presence
    try {
        const bgEl = (typeof document !== 'undefined') ? document.getElementById('backgroundImage') : null;
        const nameEl = (typeof document !== 'undefined') ? document.getElementById('floorplan_filename') : null;
        const btn = (typeof document !== 'undefined') ? document.getElementById('floorplan_mode_btn') : null;
        if (bgEl) {
            // Enable button and show saved filename if available
            if (btn) btn.disabled = false;
            if (nameEl) {
                const savedName = (historyTemp.backgroundImage && historyTemp.backgroundImage.fileName) ? historyTemp.backgroundImage.fileName : '';
                nameEl.textContent = savedName;
            }
        } else {
            // No background image element yet: show last used filename if available but keep button disabled
            if (nameEl) {
                const savedName = (historyTemp.backgroundImage && historyTemp.backgroundImage.fileName) ? historyTemp.backgroundImage.fileName : '';
                nameEl.textContent = savedName;
            }
            if (btn) {
                btn.disabled = true;
                btn.innerText = 'Floorplan mode';
            }
            if (window.__floorplanMode && typeof exitFloorplanMode === 'function') {
                exitFloorplanMode();
            }
        }
    } catch(_) {}
    editor.architect(WALLS);
    // Reapply floorplan opacity after wall rebuild
    if (typeof applyFloorplanOpacity === 'function') applyFloorplanOpacity();
    editor.showScaleBox();
    rib();

    // Ensure we default to select mode after loading a snapshot
    try {
        if (typeof $ !== 'undefined') {
            $('#boxinfo').html('Mode "select"');
            // Clear any lingering binders
            if (typeof binder !== 'undefined') {
                try { if (binder.graph) $(binder.graph).remove(); else if (binder.remove) binder.remove(); } catch (e) {}
                $('#boxbind').empty();
                binder = undefined;
            }
            // Update buttons UI without triggering a save (avoid fonc_button which calls save())
            if (typeof raz_button === 'function') raz_button();
            $('#select_mode').removeClass('btn-default').addClass('btn-success');
        }
        mode = 'select_mode';
    } catch(_) {}
    
    // Center the restored layout in view
    if (typeof centerFloorplanView === 'function') {
        try { centerFloorplanView(100); } catch (e) { /* noop */ }
    }
}

// Initialize SVG with fixed viewBox dimensions
$('svg').each(function () {
    $(this)[0].setAttribute('viewBox', originX_viewbox + ' ' + originY_viewbox + ' ' + width_viewbox + ' ' + height_viewbox)
});

// Update coordinate transformation factor
factor = width_viewbox / taille_w;

// Add window resize handler to update coordinate transformation
window.addEventListener('resize', function (event) {
  // Update the pixel dimensions for coordinate calculations
  taille_w = $('#lin').width();
  taille_h = $('#lin').height();
  // Recalculate the factor for coordinate transformation
  factor = width_viewbox / taille_w;
  // Update offset for mouse coordinate calculations
  offset = $('#lin').offset();
  // Keep the viewBox coordinates unchanged to maintain the design coordinate system
});

// **************************************************************************
// *****************   FUNCTIONS ON BUTTON click     ************************
// **************************************************************************

document.getElementById('report_mode').addEventListener("click", function () {
    if (typeof (globalArea) === "undefined") return false;
    mode = "report_mode";
    $('#panel').hide();
    $('#reportTools').show(200)
    document.getElementById('reportTotalSurface').innerHTML = "Total surface : <b>" + (globalArea / 3600).toFixed(1) + "</b> m²";
    $('#reportTotalSurface').show(1000);
    document.getElementById('reportNumberSurface').innerHTML = "Number of rooms : <b>" + ROOM.length + "</b>";
    $('#reportNumberSurface').show(1000);
    let number = 1;
    let reportRoom = '<div class="row">\n';
    for (let k in ROOM) {
        let nameRoom = "Room n°" + number + " <small>(sans nom)</small>";
        if (ROOM[k].name != "") nameRoom = ROOM[k].name;
        reportRoom += '<div class="col-md-6"><p>' + nameRoom + '</p></div>\n';
        reportRoom += '<div class="col-md-6"><p>Surface : <b>' + ((ROOM[k].area) / 3600).toFixed(2) + '</b> m²</p></div>\n';
        number++;
    }
    reportRoom += '</div><hr/>\n';
    reportRoom += '<div>\n';
    let switchNumber = 0;
    let plugNumber = 0;
    let lampNumber = 0;
    for (let k in OBJDATA) {
        if (OBJDATA[k].class === 'energy') {
            if (OBJDATA[k].type === 'switch' || OBJDATA[k].type === 'doubleSwitch' || OBJDATA[k].type === 'dimmer') switchNumber++;
            if (OBJDATA[k].type === 'plug' || OBJDATA[k].type === 'plug20' || OBJDATA[k].type === 'plug32') plugNumber++;
            if (OBJDATA[k].type === 'wallLight' || OBJDATA[k].type === 'roofLight') lampNumber++;
        }
    }
    reportRoom += '<p>Switch number : ' + switchNumber + '</p>';
    reportRoom += '<p>Electric outlet number : ' + plugNumber + '</p>';
    reportRoom += '<p>Light point number : ' + lampNumber + '</p>';
    reportRoom += '</div>';
    reportRoom += '<div>\n';
    reportRoom += '<h2>Energy distribution per room</h2>\n';
    number = 1;
    reportRoom += '<div class="row">\n';
    reportRoom += '<div class="col-md-4"><p>Label</p></div>\n';
    reportRoom += '<div class="col-md-2"><small>Swi.</small></div>\n';
    reportRoom += '<div class="col-md-2"><small>Elec. out.</small></div>\n';
    reportRoom += '<div class="col-md-2"><small>Light.</small></div>\n';
    reportRoom += '<div class="col-md-2"><small>Watts Max</small></div>\n';
    reportRoom += '</div>';

    let roomEnergy = [];
    for (let k in ROOM) {
        reportRoom += '<div class="row">\n';
        let nameRoom = "Room n°" + number + " <small>(no name)</small>";
        if (ROOM[k].name != "") nameRoom = ROOM[k].name;
        reportRoom += '<div class="col-md-4"><p>' + nameRoom + '</p></div>\n';
        switchNumber = 0;
        plugNumber = 0;
        let plug20 = 0;
        let plug32 = 0;
        lampNumber = 0;
        let wattMax = 0;
        let plug = false;
        for (let i in OBJDATA) {
            if (OBJDATA[i].class === 'energy') {
                if (OBJDATA[i].type === 'switch' || OBJDATA[i].type === 'doubleSwitch' || OBJDATA[i].type === 'dimmer') {
                    if (roomTarget = editor.rayCastingRoom(OBJDATA[i])) {
                        if (isObjectsEquals(ROOM[k], roomTarget)) switchNumber++;
                    }
                }
                if (OBJDATA[i].type === 'plug' || OBJDATA[i].type === 'plug20' || OBJDATA[i].type === 'plug32') {
                    if (roomTarget = editor.rayCastingRoom(OBJDATA[i])) {
                        if (isObjectsEquals(ROOM[k], roomTarget)) {
                            plugNumber++;
                            if (OBJDATA[i].type === 'plug' && !plug) {
                                wattMax += 3520;
                                plug = true;
                            }
                            if (OBJDATA[i].type === 'plug20') {
                                wattMax += 4400;
                                plug20++;
                            }
                            if (OBJDATA[i].type === 'plug32') {
                                wattMax += 7040;
                                plug32++;
                            }
                        }
                    }
                }
                if (OBJDATA[i].type === 'wallLight' || OBJDATA[i].type === 'roofLight') {
                    if (roomTarget = editor.rayCastingRoom(OBJDATA[i])) {
                        if (isObjectsEquals(ROOM[k], roomTarget)) {
                            lampNumber++;
                            wattMax += 100;
                        }
                    }
                }
            }
        }
        roomEnergy.push({
            switch: switchNumber,
            plug: plugNumber,
            plug20: plug20,
            plug32: plug32,
            light: lampNumber
        });
        reportRoom += '<div class="col-md-2"><b>' + switchNumber + '</b></div>\n';
        reportRoom += '<div class="col-md-2"><b>' + plugNumber + '</b></div>\n';
        reportRoom += '<div class="col-md-2"><b>' + lampNumber + '</b></div>\n';
        reportRoom += '<div class="col-md-2"><b>' + wattMax + '</b></div>\n';
        number++;
        reportRoom += '</div>';
    }
    reportRoom += '<hr/><h2>Standard details NF C 15-100</h2>\n';
    number = 1;

    for (let k in ROOM) {
        reportRoom += '<div class="row">\n';
        let nfc = true;
        let nameRoom = "Room n°" + number + " <small>(no name)</small>";
        if (ROOM[k].name != "") nameRoom = ROOM[k].name;
        reportRoom += '<div class="col-md-4"><p>' + nameRoom + '</p></div>\n';
        if (ROOM[k].name === "") {
            reportRoom +=
                '<div class="col-md-8"><p><i class="fa fa-ban" aria-hidden="true" style="color:red"></i> The room has no label, Home Rough Editor cannot provide you with information.</p></div>\n';
        } else {
            if (ROOM[k].name === "Salon") {
                for (let g in ROOM) {
                    if (ROOM[g].name === "Salle à manger") {
                        roomEnergy[k].light += roomEnergy[g].light;
                        roomEnergy[k].plug += roomEnergy[g].plug;
                        roomEnergy[k].switch += roomEnergy[g].switch;
                    }
                }
                reportRoom += '<div class="col-md-8">';
                if (roomEnergy[k].light === 0) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>1 controlled light point</b> <small>(actually ' +
                        roomEnergy[k].light + ')</small>.</p>\n';
                    nfc = false;
                }
                if (roomEnergy[k].plug < 5) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>5 power outlets</b> <small>(actually ' +
                        roomEnergy[k].plug + ')</small>.</p>\n';
                    nfc = false;
                }
                if (nfc) reportRoom += '<i class="fa fa-check" aria-hidden="true" style="color:green"></i>';
                reportRoom += '</div>';
            }
            if (ROOM[k].name === "Salle à manger") {
                reportRoom +=
                    '<div class="col-md-8"><p><i class="fa fa-info" aria-hidden="true" style="color:blue"></i> This room is linked to the <b>living room / living room</b> according to the standard.</p></div>\n';
            }
            if (ROOM[k].name.substr(0, 7) === "Chambre") {
                reportRoom += '<div class="col-md-8">';
                if (roomEnergy[k].light === 0) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>1 controlled light point</b> <small>(actually ' +
                        roomEnergy[k].light + ')</small>.</p>\n';
                    nfc = false;
                }
                if (roomEnergy[k].plug < 3) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>3 power outlets</b> <small>(actually ' +
                        roomEnergy[k].plug + ')</small>.</p>\n';
                    nfc = false;
                }
                if (nfc) reportRoom += '<i class="fa fa-check" aria-hidden="true" style="color:green"></i>';
                reportRoom += '</div>';
            }
            if (ROOM[k].name === "SdB") {
                reportRoom += '<div class="col-md-8">';
                if (roomEnergy[k].light === 0) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>1 light point</b> <small>(actually ' +
                        roomEnergy[k].light + ')</small>.</p>\n';
                    nfc = false;
                }
                if (roomEnergy[k].plug < 2) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>2 power outlets</b> <small>(actually ' +
                        roomEnergy[k].plug + ')</small>.</p>\n';
                    nfc = false;
                }
                if (roomEnergy[k].switch === 0) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>1 switch</b> <small>(actually ' +
                        roomEnergy[k].switch + ')</small>.</p>\n';
                    nfc = false;
                }
                if (nfc) reportRoom += '<i class="fa fa-check" aria-hidden="true" style="color:green"></i>';
                reportRoom += '</div>';
            }
            if (ROOM[k].name === "Couloir") {
                reportRoom += '<div class="col-md-8">';
                if (roomEnergy[k].light === 0) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>1 controlled light point</b> <small>(actually ' +
                        roomEnergy[k].light + ')</small>.</p>\n';
                    nfc = false;
                }
                if (roomEnergy[k].plug < 1) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>1 power outlet</b> <small>(actually ' +
                        roomEnergy[k].plug + ')</small>.</p>\n';
                    nfc = false;
                }
                if (nfc) reportRoom += '<i class="fa fa-check" aria-hidden="true" style="color:green"></i>';
                reportRoom += '</div>';
            }
            if (ROOM[k].name === "Toilette") {
                reportRoom += '<div class="col-md-8">';
                if (roomEnergy[k].light === 0) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>1 light point</b>. <small>(actually ' +
                        roomEnergy[k].light + ')</small>.</p>\n';
                    nfc = false;
                }
                if (nfc) reportRoom += '<i class="fa fa-check" aria-hidden="true" style="color:green"></i>';
                reportRoom += '</div>';
            }
            if (ROOM[k].name === "Cuisine") {
                reportRoom += '<div class="col-md-8">';
                if (roomEnergy[k].light === 0) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>1 controlled light point</b> <small>(actually ' +
                        roomEnergy[k].light + ')</small>.</p>\n';
                    nfc = false;
                }
                if (roomEnergy[k].plug < 6) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>6 power outlets</b> <small>(actually ' +
                        roomEnergy[k].plug + ')</small>.</p>\n';
                    nfc = false;
                }
                if (roomEnergy[k].plug32 === 0) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>1 32A power outlet</b> <small>(actually ' +
                        roomEnergy[k].plug32 + ')</small>.</p>\n';
                    nfc = false;
                }
                if (roomEnergy[k].plug20 < 2) {
                    reportRoom +=
                        '<p><i class="fa fa-exclamation-triangle" style="color:orange" aria-hidden="true"></i> This room must have at least <b>2 20A power outlets</b> <small>(actually ' +
                        roomEnergy[k].plug20 + ')</small>.</p>\n';
                    nfc = false;
                }
                if (nfc) reportRoom += '<i class="fa fa-check" aria-hidden="true" style="color:green"></i>';
                reportRoom += '</div>';
            }
        }
        number++;
        reportRoom += '</div>';
    }

    document.getElementById('reportRooms').innerHTML = reportRoom;
    $('#reportRooms').show(1000);



});

// Global variable to store current floorplan opacity
window.currentFloorplanOpacity = 1.0;

// Function to update floorplan opacity
function updateFloorplanOpacity(value) {
    const opacity = parseFloat(value);
    const opacityPercent = Math.round(opacity * 100);
    
    // Store the current opacity globally
    window.currentFloorplanOpacity = opacity;
    
    // Update the display value
    document.getElementById('floorplanOpacityValue').textContent = opacityPercent + '%';
    
    // Apply the opacity
    applyFloorplanOpacity(opacity);
    
    // Save the state
    if (typeof save === 'function') save();
}

// Function to apply floorplan opacity to all elements
function applyFloorplanOpacity(opacity = null) {
    if (opacity === null) opacity = window.currentFloorplanOpacity || 1.0;
    
    // Update opacity of all walls - target the actual SVG elements
    const wallLines = document.querySelectorAll('#lin line');
    wallLines.forEach(line => {
        // Skip background and measurement lines
        if (!line.getAttribute('data-bg') && !line.getAttribute('data-measurement')) {
            line.setAttribute('opacity', opacity);
        }
    });
    
    // Update opacity of all wall paths
    const wallPaths = document.querySelectorAll('#lin path');
    wallPaths.forEach(path => {
        // Skip room floors and background elements
        if (!path.getAttribute('data-room') && !path.getAttribute('data-bg') && !path.getAttribute('data-measurement')) {
            path.setAttribute('opacity', opacity);
        }
    });
    
    // Update opacity of all room floors
    const floors = document.querySelectorAll('#lin polygon');
    floors.forEach(floor => {
        floor.setAttribute('opacity', opacity);
    });
    
    // Update opacity of wall groups if they exist
    const wallGroups = document.querySelectorAll('#lin g[data-wall]');
    wallGroups.forEach(group => {
        group.setAttribute('opacity', opacity);
    });
}

document.getElementById('wallWidth').addEventListener("input", function () {
    let sliderValue = this.value;
    binder.wall.thick = sliderValue;
    binder.wall.type = "normal";
    editor.architect(WALLS);
    let objWall = editor.objFromWall(binder.wall); // LIST OBJ ON EDGE
    for (let w = 0; w < objWall.length; w++) {
        objWall[w].thick = sliderValue;
        objWall[w].update();
    }
    rib();
    document.getElementById("wallWidthVal").textContent = sliderValue;
    
    // Reapply floorplan opacity after wall rebuild
    applyFloorplanOpacity();
});

document.getElementById("bboxTrash").addEventListener("click", function () {
    binder.obj.graph.remove();
    binder.graph.remove();
    OBJDATA.splice(OBJDATA.indexOf(binder.obj), 1);
    $('#objBoundingBox').hide(100);
    $('#panel').show(200);
    fonc_button('select_mode');
    $('#boxinfo').html('Deleted object');
    delete binder;
    rib();
});

document.getElementById("bboxStepsAdd").addEventListener("click", function () {
    let newValue = document.getElementById("bboxStepsVal").textContent;
    if (newValue < 15) {
        newValue++;
        binder.obj.value = newValue;
        binder.obj.update();
        document.getElementById("bboxStepsVal").textContent = newValue;
    }
});

document.getElementById("bboxStepsMinus").addEventListener("click", function () {
    let newValue = document.getElementById("bboxStepsVal").textContent;
    if (newValue > 2) {
        newValue--;
        binder.obj.value = newValue;
        binder.obj.update();
        document.getElementById("bboxStepsVal").textContent = newValue;
    }
});

document.getElementById('bboxWidth').addEventListener("input", function () {
    let sliderValue = this.value;
    let objTarget = binder.obj;
    objTarget.size = (sliderValue / 100) * meter;
    objTarget.update();
    binder.size = (sliderValue / 100) * meter;
    binder.update();
    document.getElementById("bboxWidthVal").textContent = sliderValue;
});

document.getElementById('bboxHeight').addEventListener("input", function () {
    let sliderValue = this.value;
    let objTarget = binder.obj;
    objTarget.thick = (sliderValue / 100) * meter;
    objTarget.update();
    binder.thick = (sliderValue / 100) * meter;
    binder.update();
    document.getElementById("bboxHeightVal").textContent = sliderValue;
});

document.getElementById('bboxRotation').addEventListener("input", function () {
    let sliderValue = this.value;
    let objTarget = binder.obj;
    objTarget.angle = sliderValue;
    objTarget.update();
    binder.angle = sliderValue;
    binder.update();
    document.getElementById("bboxRotationVal").textContent = sliderValue;
});

document.getElementById('doorWindowWidth').addEventListener("input", function () {
    let sliderValue = this.value;
    let objTarget = binder.obj;
    let wallBind = editor.rayCastingWalls(objTarget, WALLS);
    if (wallBind.length > 1) {
        wallBind = wallBind[wallBind.length - 1];
    }
    let limits = limitObj(wallBind.equations.base, sliderValue, objTarget);
    if (qSVG.btwn(limits[1].x, wallBind.start.x, wallBind.end.x) && qSVG.btwn(limits[1].y, wallBind.start.y, wallBind.end.y) &&
        qSVG.btwn(limits[0].x, wallBind.start.x, wallBind.end.x) && qSVG.btwn(limits[0].y, wallBind.start.y, wallBind.end.y)) {
        objTarget.size = sliderValue;
        objTarget.limit = limits;
        objTarget.update();
        binder.size = sliderValue;
        binder.limit = limits;
        binder.update();
        document.getElementById("doorWindowWidthVal").textContent = sliderValue;
    }
    inWallRib(wallBind);
});

document.getElementById("objToolsHinge").addEventListener("click", function () {
    let objTarget = binder.obj;
    let hingeStatus = objTarget.hinge; // normal - reverse
    if (hingeStatus === 'normal') {
        objTarget.hinge = 'reverse';
    } else objTarget.hinge = 'normal';
    objTarget.update();
});

window.addEventListener("load", function () {
    document.getElementById('panel').style.transform = "translateX(200px)";
    document.getElementById('panel').addEventListener("transitionend", function () {
        document.getElementById('moveBox').style.transform = "translateX(-165px)";
        document.getElementById('zoomBox').style.transform = "translateX(-165px)";
    });
    if (!localStorage.getItem('history')) {
        $('#recover').html("<p>Select a plan type.");
    }
    const myModal = new bootstrap.Modal($('#myModal'))
    myModal.show();
});

document.getElementById('sizePolice').addEventListener("input", function () {
    document.getElementById('labelBox').style.fontSize = this.value + 'px';
});

$('#textToLayer').on('hidden.bs.modal', function (e) {
    fonc_button('select_mode');
    action = 0;
    let textToMake = document.getElementById('labelBox').textContent;
    if (textToMake != "" && textToMake != "Your text") {
        binder = new editor.obj2D("free", "text", document.getElementById('labelBox').style.color, snap, 0, 0, 0, "normal", 0, {
            text: textToMake,
            size: document.getElementById('sizePolice').value
        });
        binder.update();
        OBJDATA.push(binder);
        binder.graph.remove();
        $('#boxText').append(OBJDATA[OBJDATA.length - 1].graph);
        OBJDATA[OBJDATA.length - 1].update();
        delete binder;
        $('#boxinfo').html('Added text');
        save();
    } else {
        $('#boxinfo').html('Selection mode');
    }
    document.getElementById('labelBox').textContent = "Your text";
    document.getElementById('labelBox').style.color = "#333333";
    document.getElementById('labelBox').style.fontSize = "15px";
    document.getElementById('sizePolice').value = 15;
});

if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
        value: function (searchElement, fromIndex) {
            if (this === null) {
                throw new TypeError('"this" is null or not defined');
            }

            let o = Object(this);
            let len = o.length >>> 0;
            if (len === 0) {
                return false;
            }
            let n = fromIndex | 0;
            let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            while (k < len) {
                if (o[k] === searchElement) {
                    return true;
                }
                k++;
            }
            return false;
        }
    });
}

function isObjectsEquals(a, b, message = false) {
    if (message) console.log(message)
    let isOK = true;
    for (let prop in a) {
        if (a[prop] !== b[prop]) {
            isOK = false;
            break;
        }
    }
    return isOK;
};

function throttle(callback, delay) {
    let last;
    let timer;
    return function () {
        let context = this;
        let now = +new Date();
        let args = arguments;
        if (last && now < last + delay) {
            // le délai n'est pas écoulé on reset le timer
            clearTimeout(timer);
            timer = setTimeout(function () {
                last = now;
                callback.apply(context, args);
            }, delay);
        } else {
            last = now;
            callback.apply(context, args);
        }
    };
}

linElement.mousewheel(throttle(function (event) {
    event.preventDefault();
    if (event.deltaY > 0) {
        zoom_maker('zoomin', 200);
    } else {
        zoom_maker('zoomout', 200);
    }
}, 100));

document.getElementById("showRib").addEventListener("click", function () {
    if (document.getElementById("showRib").checked) {
        $('#boxScale').show(200);
        $('#boxRib').show(200);
        showRib = true;
    } else {
        $('#boxScale').hide(100);
        $('#boxRib').hide(100);
        showRib = false;
    }
});

document.getElementById("showArea").addEventListener("click", function () {
    if (document.getElementById("showArea").checked) {
        $('#boxArea').show(200);
    } else {
        $('#boxArea').hide(100);
    }
});

document.getElementById("showLayerRoom").addEventListener("click", function () {
    if (document.getElementById("showLayerRoom").checked) {
        $('#boxRoom').show(200);
    } else {
        $('#boxRoom').hide(100);
    }
});

document.getElementById("showLayerEnergy").addEventListener("click", function () {
    if (document.getElementById("showLayerEnergy").checked) {
        $('#boxEnergy').show(200);
    } else {
        $('#boxEnergy').hide(100);
    }
});

document.getElementById("showLayerBackground").addEventListener("click", function () {
    const backgroundImage = document.getElementById('backgroundImage');
    if (backgroundImage) {
        if (document.getElementById("showLayerBackground").checked) {
            backgroundImage.style.display = 'block';
        } else {
            backgroundImage.style.display = 'none';
        }
    }
});

// document.getElementById("showLayerFurniture").addEventListener("click", function () {
//   if (document.getElementById("showLayerFurniture").checked) {
//     $('#boxFurniture').show(200);
//   }
//   else {
//     $('#boxFurniture').hide(100);
//   }
// });

document.getElementById("applySurface").addEventListener("click", function () {
    $('#roomTools').hide(100);
    $('#panel').show(200);
    binder.remove();
    delete binder;
    let id = $('#roomIndex').val();
    //COLOR
    let data = $('#roomBackground').val();
    ROOM[id].color = data;
    //ROOM NAME
    let roomName = $('#roomName').val();
    if (roomName === 'None') {
        roomName = '';
    }
    ROOM[id].name = roomName;
    //ROOM SURFACE
    let area = $('#roomSurface').val();
    ROOM[id].surface = area;
    //SHOW SURFACE
    let show = document.querySelector("#seeArea").checked;
    ROOM[id].showSurface = show;
    //ACTION PARAM
    let action = document.querySelector('input[type=radio]:checked').value;
    ROOM[id].action = action;
    if (action === 'sub') {
        ROOM[id].color = 'hatch';
    }
    if (action != 'sub' && data === 'hatch') {
        ROOM[id].color = 'gradientNeutral';
    }
    $('#boxRoom').empty();
    $('#boxSurface').empty();
    editor.roomMaker(Rooms);
    $('#boxinfo').html('Updated room');
    fonc_button('select_mode');
});

document.getElementById("resetRoomTools").addEventListener("click", function () {
    $('#roomTools').hide(100);
    $('#panel').show(200);
    binder.remove();
    delete binder;
    $('#boxinfo').html('Updated room');
    fonc_button('select_mode');

});

document.getElementById("wallTrash").addEventListener("click", function () {
    let wall = binder.wall;
    for (let k in WALLS) {
        if (isObjectsEquals(WALLS[k].child, wall)) WALLS[k].child = null;
        if (isObjectsEquals(WALLS[k].parent, wall)) {
            WALLS[k].parent = null;
        }
    }
    WALLS.splice(WALLS.indexOf(wall), 1);
    $('#wallTools').hide(100);
    wall.graph.remove();
    binder.graph.remove();
    editor.architect(WALLS);
    // Reapply floorplan opacity after wall rebuild
    if (typeof applyFloorplanOpacity === 'function') applyFloorplanOpacity();
    rib();
    mode = "select_mode";
    $('#panel').show(200);
});

let textEditorColorBtn = document.querySelectorAll('.textEditorColor');
for (let k = 0; k < textEditorColorBtn.length; k++) {
    textEditorColorBtn[k].addEventListener('click', function () {
        document.getElementById('labelBox').style.color = this.style.color;
    });
}

let zoomBtn = document.querySelectorAll('.zoom');
for (let k = 0; k < zoomBtn.length; k++) {
    zoomBtn[k].addEventListener("click", function () {
        let lens = this.getAttribute('data-zoom');
        zoom_maker(lens, 200, 50);
    })
}

let roomColorBtn = document.querySelectorAll(".roomColor");
for (let k = 0; k < roomColorBtn.length; k++) {
    roomColorBtn[k].addEventListener("click", function () {
        let data = this.getAttribute('data-type');
        $('#roomBackground').val(data);
        binder.attr({ 'fill': 'url(#' + data + ')' });
    });
}

let objTrashBtn = document.querySelectorAll(".objTrash");
for (let k = 0; k < objTrashBtn.length; k++) {
    objTrashBtn[k].addEventListener("click", function () {
        $('#objTools').hide('100');
        let obj = binder.obj;
        obj.graph.remove();
        OBJDATA.splice(OBJDATA.indexOf(obj), 1);
        fonc_button('select_mode');
        $('#boxinfo').html('Selection mode');
        $('#panel').show('200');
        binder.graph.remove();
        delete binder;
        rib();
        $('#panel').show('300');
    });
}

// Keep hidden #roomName in sync with the visible #roomLabel <select>
(function(){
    const select = document.getElementById('roomLabel');
    if (!select) return;
    select.addEventListener('change', function(){
        const txt = this.options && this.selectedIndex >= 0 ? this.options[this.selectedIndex].text.trim() : '';
        $('#roomName').val(txt === 'None' ? '' : txt);
    });
})();

// TRY MATRIX CALC FOR BBOX REAL COORDS WITH TRAS + ROT.
function matrixCalc(el, message = false) {
    if (message) console.log("matrixCalc called by -> " + message);
    let m = el.getCTM();
    let bb = el.getBBox();
    let tpts = [
        matrixXY(m, bb.x, bb.y),
        matrixXY(m, bb.x + bb.width, bb.y),
        matrixXY(m, bb.x + bb.width, bb.y + bb.height),
        matrixXY(m, bb.x, bb.y + bb.height)];
    return tpts;
}

function matrixXY(m, x, y) {
    return { x: x * m.a + y * m.c + m.e, y: x * m.b + y * m.d + m.f };
}

function realBboxShow(coords) {
    for (let k in coords) {
        debugPoint(coords[k]);
    }
}


function limitObj(equation, size, coords, message = false) {
    if (message) {
        console.log(message);
    }
    let Px = coords.x;
    let Py = coords.y;
    let Aq = equation.A;
    let Bq = equation.B;
    let pos1, pos2;
    if (Aq === 'v') {
        pos1 = { x: Px, y: Py - size / 2 };
        pos2 = { x: Px, y: Py + size / 2 };
    } else if (Aq === 'h') {
        pos1 = { x: Px - size / 2, y: Py };
        pos2 = { x: Px + size / 2, y: Py };
    } else {
        let A = 1 + Aq * Aq;
        let B = (-2 * Px) + (2 * Aq * Bq) + (-2 * Py * Aq);
        let C = (Px * Px) + (Bq * Bq) - (2 * Py * Bq) + (Py * Py) - (size * size) / 4; // -N
        let Delta = (B * B) - (4 * A * C);
        let posX1 = (-B - (Math.sqrt(Delta))) / (2 * A);
        let posX2 = (-B + (Math.sqrt(Delta))) / (2 * A);
        pos1 = { x: posX1, y: (Aq * posX1) + Bq };
        pos2 = { x: posX2, y: (Aq * posX2) + Bq };
    }
    return [pos1, pos2];
}

function zoom_maker(lens, xmove, xview) {
    if (lens === 'zoomin' && zoom < 12) {
        zoom++;
        width_viewbox = width_viewbox - xmove;
        let ratioWidthZoom = taille_w / width_viewbox;
        height_viewbox = width_viewbox * ratio_viewbox;
        myDiv = document.getElementById("scaleVal");
        if (myDiv) myDiv.style.width = 60 * ratioWidthZoom + 'px';
        originX_viewbox = originX_viewbox + (xmove / 2);
        originY_viewbox = originY_viewbox + (xmove / 2 * ratio_viewbox);
    }
    if (lens === 'zoomout' && zoom > 1) {
        zoom--;
        width_viewbox = width_viewbox + xmove;
        let ratioWidthZoom = taille_w / width_viewbox;
        height_viewbox = width_viewbox * ratio_viewbox;
        myDiv = document.getElementById("scaleVal");
        if (myDiv) myDiv.style.width = 60 * ratioWidthZoom + 'px';
        originX_viewbox = originX_viewbox - (xmove / 2);
        originY_viewbox = originY_viewbox - (xmove / 2 * ratio_viewbox);
    }
    if (lens === 'zoomreset') {
        // Center and fit floorplan to screen with 50px border
        if (!centerFloorplanView(100)) {
            // Fallback to default values if no walls exist
            width_viewbox = 1100;
            height_viewbox = 700;
            originX_viewbox = 0;
            originY_viewbox = 0;
            factor = 1;
        }
        zoom = 9;
    }
    if (lens === 'zoomright') {
        originX_viewbox += xview;
    }
    if (lens === 'zoomleft') {
        originX_viewbox -= xview;
    }
    if (lens === 'zoomtop') {
        originY_viewbox -= xview;
    }
    if (lens === 'zoombottom') {
        originY_viewbox += xview;
    }
    if (lens === 'zoomdrag') {
        originX_viewbox -= xmove;
        originY_viewbox -= xview;
    }
    // Update pixel-to-SVG factor after any viewBox change
    factor = width_viewbox / taille_w;
    $('svg').each(function () {
        $(this)[0].setAttribute('viewBox', originX_viewbox + ' ' + originY_viewbox + ' ' + width_viewbox + ' ' + height_viewbox)
    });
}

// Center the current floorplan in view by fitting the WALLS bounding box to the viewport
function centerFloorplanView(padding = 40) {
    try {
        if (!Array.isArray(WALLS) || WALLS.length === 0) return false;

        // Update viewport dimensions in case window was resized
        taille_w = $('#lin').width();
        taille_h = $('#lin').height();
        ratio_viewbox = taille_h / taille_w;

        // Compute bounding box from wall endpoints
        let minX, minY, maxX, maxY;
        let hasElements = false;
        
        // Include walls
        for (let i = 0; i < WALLS.length; i++) {
            const s = WALLS[i].start;
            const e = WALLS[i].end;
            if (!hasElements) {
                minX = Math.min(s.x, e.x);
                minY = Math.min(s.y, e.y);
                maxX = Math.max(s.x, e.x);
                maxY = Math.max(s.y, e.y);
                hasElements = true;
            } else {
                minX = Math.min(minX, s.x, e.x);
                minY = Math.min(minY, s.y, e.y);
                maxX = Math.max(maxX, s.x, e.x);
                maxY = Math.max(maxY, s.y, e.y);
            }
        }
        
        // Include furniture items
        if (typeof FURNITURE_ITEMS !== 'undefined' && Array.isArray(FURNITURE_ITEMS)) {
            for (let i = 0; i < FURNITURE_ITEMS.length; i++) {
                const furniture = FURNITURE_ITEMS[i];
                if (furniture.x !== undefined && furniture.y !== undefined) {
                    if (!hasElements) {
                        minX = maxX = furniture.x;
                        minY = maxY = furniture.y;
                        hasElements = true;
                    } else {
                        minX = Math.min(minX, furniture.x);
                        minY = Math.min(minY, furniture.y);
                        maxX = Math.max(maxX, furniture.x);
                        maxY = Math.max(maxY, furniture.y);
                    }
                }
            }
        }
        
        // Include dimension labels (text elements in #boxRib)
        const dimensionTexts = document.querySelectorAll('#boxRib text');
        for (let i = 0; i < dimensionTexts.length; i++) {
            const textEl = dimensionTexts[i];
            const x = parseFloat(textEl.getAttribute('x'));
            const y = parseFloat(textEl.getAttribute('y'));
            if (!isNaN(x) && !isNaN(y)) {
                if (!hasElements) {
                    minX = maxX = x;
                    minY = maxY = y;
                    hasElements = true;
                } else {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        // Handle degenerate cases
        if (minX === undefined || minY === undefined || maxX === undefined || maxY === undefined) return false;
        const bboxW = Math.max(1, maxX - minX);
        const bboxH = Math.max(1, maxY - minY);

        // Target size keeping aspect ratio with minimum padding on both dimensions
        const viewAspect = ratio_viewbox; // height/width
        const targetWidth = bboxW + 2 * padding;
        const targetHeight = bboxH + 2 * padding;
        const widthFromHeight = targetHeight / viewAspect;
        const heightFromWidth = targetWidth * viewAspect;
        const fitWidth = Math.max(targetWidth, widthFromHeight);
        const fitHeight = Math.max(targetHeight, heightFromWidth);

        width_viewbox = fitWidth;
        height_viewbox = fitHeight;

        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        originX_viewbox = cx - (width_viewbox / 2);
        originY_viewbox = cy - (height_viewbox / 2);

        // Update pixel-to-SVG factor based on new viewBox size
        factor = width_viewbox / taille_w;

        // Update scale indicator if present
        const scaleEl = document.getElementById('scaleVal');
        if (scaleEl) {
            const ratioWidthZoom = taille_w / width_viewbox;
            scaleEl.style.width = (60 * ratioWidthZoom) + 'px';
        }

        // Apply viewBox to all SVGs
        $('svg').each(function () {
            $(this)[0].setAttribute('viewBox', originX_viewbox + ' ' + originY_viewbox + ' ' + width_viewbox + ' ' + height_viewbox);
        });

        return true;
    } catch (e) {
        console.error('Error centering view:', e);
        return false;
    }
}

tactile = false;

function calcul_snap(event, state) {
    if (event.touches) {
        let touches = event.changedTouches;
        console.log("toto")
        eX = touches[0].pageX;
        eY = touches[0].pageY;
        tactile = true;
    } else {
        eX = event.pageX;
        eY = event.pageY;
    }
    
    // Validate factor and offset before calculations
    if (isNaN(factor) || factor <= 0) {
        console.warn('Invalid factor detected:', factor);
        factor = 1; // Fallback value
    }
    if (!offset || isNaN(offset.left) || isNaN(offset.top)) {
        console.warn('Invalid offset detected:', offset);
        offset = { left: 0, top: 0 }; // Fallback value
    }
    if (isNaN(originX_viewbox)) originX_viewbox = 0;
    if (isNaN(originY_viewbox)) originY_viewbox = 0;
    
    x_mouse = (eX * factor) - (offset.left * factor) + originX_viewbox;
    y_mouse = (eY * factor) - (offset.top * factor) + originY_viewbox;

    // Validate calculated mouse coordinates
    if (isNaN(x_mouse)) x_mouse = 0;
    if (isNaN(y_mouse)) y_mouse = 0;

    if (state === 'on') {
        if (isNaN(grid) || grid <= 0) grid = 10; // Fallback grid size
        x_grid = Math.round(x_mouse / grid) * grid;
        y_grid = Math.round(y_mouse / grid) * grid;
    }
    if (state === 'off') {
        x_grid = x_mouse;
        y_grid = y_mouse;
    }
    
    // Final validation of return values
    if (isNaN(x_grid)) x_grid = 0;
    if (isNaN(y_grid)) y_grid = 0;
    
    return {
        x: x_grid,
        y: y_grid,
        xMouse: x_mouse,
        yMouse: y_mouse
    };
}

minMoveGrid = function (mouse) {
    return Math.abs(Math.abs(pox - mouse.x) + Math.abs(poy - mouse.y));
}

function intersectionOff() {
    if (typeof (lineIntersectionP) != 'undefined') {
        lineIntersectionP.remove();
        delete lineIntersectionP;
    }
}

function intersection(snap, range = Infinity, except = ['']) {
    // ORANGE LINES 90° NEAR SEGMENT
    let bestEqPoint = {};
    let equation = {};

    bestEqPoint.distance = range;

    if (typeof (lineIntersectionP) != 'undefined') {
        lineIntersectionP.remove();
        delete lineIntersectionP;
    }

    lineIntersectionP = qSVG.create("boxbind", "path", { // ORANGE TEMP LINE FOR ANGLE 0 90 45 -+
        d: "",
        "stroke": "transparent",
        "stroke-width": 0.5,
        "stroke-opacity": "1",
        fill: "none"
    });

    for (index = 0; index < WALLS.length; index++) {
        if (except.indexOf(WALLS[index]) === -1) {
            let x1 = WALLS[index].start.x;
            let y1 = WALLS[index].start.y;
            let x2 = WALLS[index].end.x;
            let y2 = WALLS[index].end.y;

            // EQUATION 90° of segment nf/nf-1 at X2/Y2 Point
            if (Math.abs(y2 - y1) === 0) {
                equation.C = 'v'; // C/D equation 90° Coef = -1/E
                equation.D = x1;
                equation.E = 'h'; // E/F equation Segment
                equation.F = y1;
                equation.G = 'v'; // G/H equation 90° Coef = -1/E
                equation.H = x2;
                equation.I = 'h'; // I/J equation Segment
                equation.J = y2;
            } else if (Math.abs(x2 - x1) === 0) {
                equation.C = 'h'; // C/D equation 90° Coef = -1/E
                equation.D = y1;
                equation.E = 'v'; // E/F equation Segment
                equation.F = x1;
                equation.G = 'h'; // G/H equation 90° Coef = -1/E
                equation.H = y2;
                equation.I = 'v'; // I/J equation Segment
                equation.J = x2;
            } else {
                equation.C = (x1 - x2) / (y2 - y1);
                equation.D = y1 - (x1 * equation.C);
                equation.E = (y2 - y1) / (x2 - x1);
                equation.F = y1 - (x1 * equation.E);
                equation.G = (x1 - x2) / (y2 - y1);
                equation.H = y2 - (x2 * equation.C);
                equation.I = (y2 - y1) / (x2 - x1);
                equation.J = y2 - (x2 * equation.E);
            }
            equation.A = equation.C;
            equation.B = equation.D;
            eq = qSVG.nearPointOnEquation(equation, snap);
            if (eq.distance < bestEqPoint.distance) {
                setBestEqPoint(bestEqPoint, eq.distance, index, eq.x, eq.y, x1, y1, x2, y2, 1);
            }
            equation.A = equation.E;
            equation.B = equation.F;
            eq = qSVG.nearPointOnEquation(equation, snap);
            if (eq.distance < bestEqPoint.distance) {
                setBestEqPoint(bestEqPoint, eq.distance, index, eq.x, eq.y, x1, y1, x2, y2, 1);
            }
            equation.A = equation.G;
            equation.B = equation.H;
            eq = qSVG.nearPointOnEquation(equation, snap);
            if (eq.distance < bestEqPoint.distance) {
                setBestEqPoint(bestEqPoint, eq.distance, index, eq.x, eq.y, x1, y1, x2, y2, 2);
            }
            equation.A = equation.I;
            equation.B = equation.J;
            eq = qSVG.nearPointOnEquation(equation, snap);
            if (eq.distance < bestEqPoint.distance) {
                setBestEqPoint(bestEqPoint, eq.distance, index, eq.x, eq.y, x1, y1, x2, y2, 2);
            }
        } // END INDEXOF EXCEPT TEST
    } // END LOOP FOR

    if (bestEqPoint.distance < range) {
        if (bestEqPoint.way === 2) {
            lineIntersectionP.attr({ // ORANGE TEMP LINE FOR ANGLE 0 90 45 -+
                d: "M" + bestEqPoint.x1 + "," + bestEqPoint.y1 + " L" + bestEqPoint.x2 + "," + bestEqPoint.y2 + " L" + bestEqPoint.x + "," +
                    bestEqPoint.y,
                "stroke": "#d7ac57"
            });
        } else {
            lineIntersectionP.attr({ // ORANGE TEMP LINE FOR ANGLE 0 90 45 -+
                d: "M" + bestEqPoint.x2 + "," + bestEqPoint.y2 + " L" + bestEqPoint.x1 + "," + bestEqPoint.y1 + " L" + bestEqPoint.x + "," +
                    bestEqPoint.y,
                "stroke": "#d7ac57"
            });
        }
        return ({
            x: bestEqPoint.x,
            y: bestEqPoint.y,
            wall: WALLS[bestEqPoint.node],
            distance: bestEqPoint.distance
        });
    } else {
        return false;
    }
}

function debugPoint(point, name, color = "#00ff00") {
    qSVG.create('boxDebug', 'circle', {
        cx: point.x,
        cy: point.y,
        r: 7,
        fill: color,
        id: name,
        class: "visu"
    });
}

function showVertex() {
    for (let i = 0; i < vertex.length; i++) {
        debugPoint(vertex[i], i);

    }
}

function showJunction() {
    for (let i = 0; i < junction.length; i++) {
        debugPoint({ x: junction[i].values[0], y: junction[i].values[1] }, i);

    }
}

$('.visu').mouseover(function () {
    console.log(this.id)
});

let sizeText = [];
let showAllSizeStatus = 0;

function hideAllSize() {
    $('#boxbind').empty();
    sizeText = [];
    showAllSizeStatus = 0;
}

function allRib() {
    $('#boxRib').empty();
    for (let i in WALLS) {
        inWallRib(WALLS[i], 'all');
    }
}

function inWallRib(wall, option = false) {
    if (!option) $('#boxRib').empty();
    ribMaster = [];
    ribMaster.push([]);
    ribMaster.push([]);
    let inter;
    let distance;
    let cross;
    let angleTextValue = wall.angle * (180 / Math.PI);
    let objWall = editor.objFromWall(wall); // LIST OBJ ON EDGE
    if (objWall.length == 0) return
    ribMaster[0].push({ wall: wall, crossObj: false, side: 'up', coords: wall.coords[0], distance: 0 });
    ribMaster[1].push({ wall: wall, crossObj: false, side: 'down', coords: wall.coords[1], distance: 0 });
    let objTarget = null
    for (let ob in objWall) {
        objTarget = objWall[ob];
        objTarget.up = [
            qSVG.nearPointOnEquation(wall.equations.up, objTarget.limit[0]),
            qSVG.nearPointOnEquation(wall.equations.up, objTarget.limit[1])
        ];
        objTarget.down = [
            qSVG.nearPointOnEquation(wall.equations.down, objTarget.limit[0]),
            qSVG.nearPointOnEquation(wall.equations.down, objTarget.limit[1])
        ];

        distance = qSVG.measure(wall.coords[0], objTarget.up[0]) / meter;
        ribMaster[0].push({
            wall: objTarget,
            crossObj: ob,
            side: 'up',
            coords: objTarget.up[0],
            distance: distance.toFixed(2)
        });
        distance = qSVG.measure(wall.coords[0], objTarget.up[1]) / meter;
        ribMaster[0].push({
            wall: objTarget,
            crossObj: ob,
            side: 'up',
            coords: objTarget.up[1],
            distance: distance.toFixed(2)
        });
        distance = qSVG.measure(wall.coords[1], objTarget.down[0]) / meter;
        ribMaster[1].push({
            wall: objTarget,
            crossObj: ob,
            side: 'down',
            coords: objTarget.down[0],
            distance: distance.toFixed(2)
        });
        distance = qSVG.measure(wall.coords[1], objTarget.down[1]) / meter;
        ribMaster[1].push({
            wall: objTarget,
            crossObj: ob,
            side: 'down',
            coords: objTarget.down[1],
            distance: distance.toFixed(2)
        });
    }
    distance = qSVG.measure(wall.coords[0], wall.coords[3]) / meter;
    ribMaster[0].push({ wall: objTarget, crossObj: false, side: 'up', coords: wall.coords[3], distance: distance });
    distance = qSVG.measure(wall.coords[1], wall.coords[2]) / meter;
    ribMaster[1].push({ wall: objTarget, crossObj: false, side: 'down', coords: wall.coords[2], distance: distance });
    ribMaster[0].sort(function (a, b) {
        return (a.distance - b.distance).toFixed(2);
    });
    ribMaster[1].sort(function (a, b) {
        return (a.distance - b.distance).toFixed(2);
    });
    for (let t in ribMaster) {
        for (let n = 1; n < ribMaster[t].length; n++) {
            let found = true;
            let shift = -5;
            let valueText = Math.abs(ribMaster[t][n - 1].distance - ribMaster[t][n].distance);
            let angleText = angleTextValue;
            if (found) {
                if (ribMaster[t][n - 1].side === 'down') {
                    shift = -shift + 10;
                }
                if (angleText > 89 || angleText < -89) {
                    angleText -= 180;
                    if (ribMaster[t][n - 1].side === 'down') {
                        shift = -5;
                    } else shift = -shift + 10;
                }


                sizeText[n] = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                let startText = qSVG.middle(ribMaster[t][n - 1].coords.x, ribMaster[t][n - 1].coords.y, ribMaster[t][n].coords.x,
                    ribMaster[t][n].coords.y);
                
                // Check for valid coordinates before setting attributes
                if (startText && !isNaN(startText.x) && !isNaN(startText.y)) {
                    sizeText[n].setAttributeNS(null, 'x', startText.x);
                    sizeText[n].setAttributeNS(null, 'y', (startText.y) + shift);
                    sizeText[n].setAttributeNS(null, 'text-anchor', 'middle');
                    sizeText[n].setAttributeNS(null, 'font-family', 'roboto');
                    sizeText[n].setAttributeNS(null, 'stroke', '#ffffff');
                    sizeText[n].textContent = valueText.toFixed(2);
                    if (sizeText[n].textContent < 1) {
                        sizeText[n].setAttributeNS(null, 'font-size', '0.8em');
                        sizeText[n].textContent = sizeText[n].textContent.substring(1, sizeText[n].textContent.length);
                    } else sizeText[n].setAttributeNS(null, 'font-size', '1em');
                    sizeText[n].setAttributeNS(null, 'stroke-width', '0.27px');
                    sizeText[n].setAttributeNS(null, 'fill', '#666666');
                    sizeText[n].setAttribute("transform", "rotate(" + angleText + " " + startText.x + "," + (startText.y) + ")");
                } else {
                    // Skip creating text element if coordinates are invalid
                    console.warn('Invalid coordinates for size text element:', startText);
                }

                $('#boxRib').append(sizeText[n]);
            }
        }
    }
}

function rib(shift = 5) {
    // return false;
    let ribMaster = [];
    ribMaster.push([]);
    ribMaster.push([]);
    let inter;
    let distance;
    let cross;
    for (let i in WALLS) {
        if (WALLS[i].equations.base) {
            ribMaster[0].push([]);
            pushToRibMaster(ribMaster, 0, i, i, i, 'up', WALLS[i].coords[0], 0);
            ribMaster[1].push([]);
            pushToRibMaster(ribMaster, 1, i, i, i, 'down', WALLS[i].coords[1], 0);

            for (let p in WALLS) {
                if (i != p && WALLS[p].equations.base) {
                    cross = qSVG.intersectionOfEquations(WALLS[i].equations.base, WALLS[p].equations.base, "object");
                    if (cross && cross.x !== undefined && cross.y !== undefined &&
                        qSVG.btwn(cross.x, WALLS[i].start.x, WALLS[i].end.x, 'round') &&
                        qSVG.btwn(cross.y, WALLS[i].start.y, WALLS[i].end.y, 'round')) {

                        inter = qSVG.intersectionOfEquations(WALLS[i].equations.up, WALLS[p].equations.up, "object");
                        if (inter && inter.x !== undefined && inter.y !== undefined &&
                            qSVG.btwn(inter.x, WALLS[i].coords[0].x, WALLS[i].coords[3].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[i].coords[0].y, WALLS[i].coords[3].y, 'round') &&
                            qSVG.btwn(inter.x, WALLS[p].coords[0].x, WALLS[p].coords[3].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[p].coords[0].y, WALLS[p].coords[3].y, 'round')) {
                            distance = qSVG.measure(WALLS[i].coords[0], inter) / meter;
                            pushToRibMaster(ribMaster, 0, i, i, p, 'up', inter, distance.toFixed(2));

                        }

                        inter = qSVG.intersectionOfEquations(WALLS[i].equations.up, WALLS[p].equations.down, "object");
                        if (inter && inter.x !== undefined && inter.y !== undefined &&
                            qSVG.btwn(inter.x, WALLS[i].coords[0].x, WALLS[i].coords[3].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[i].coords[0].y, WALLS[i].coords[3].y, 'round') &&
                            qSVG.btwn(inter.x, WALLS[p].coords[1].x, WALLS[p].coords[2].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[p].coords[1].y, WALLS[p].coords[2].y, 'round')) {
                            distance = qSVG.measure(WALLS[i].coords[0], inter) / meter;
                            pushToRibMaster(ribMaster, 0, i, i, p, 'up', inter, distance.toFixed(2));

                        }

                        inter = qSVG.intersectionOfEquations(WALLS[i].equations.down, WALLS[p].equations.up, "object");
                        if (inter && inter.x !== undefined && inter.y !== undefined &&
                            qSVG.btwn(inter.x, WALLS[i].coords[1].x, WALLS[i].coords[2].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[i].coords[1].y, WALLS[i].coords[2].y, 'round') &&
                            qSVG.btwn(inter.x, WALLS[p].coords[0].x, WALLS[p].coords[3].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[p].coords[0].y, WALLS[p].coords[3].y, 'round')) {
                            distance = qSVG.measure(WALLS[i].coords[1], inter) / meter;
                            pushToRibMaster(ribMaster, 1, i, i, p, 'down', inter, distance.toFixed(2));

                        }

                        inter = qSVG.intersectionOfEquations(WALLS[i].equations.down, WALLS[p].equations.down, "object");
                        if (inter && inter.x !== undefined && inter.y !== undefined &&
                            qSVG.btwn(inter.x, WALLS[i].coords[1].x, WALLS[i].coords[2].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[i].coords[1].y, WALLS[i].coords[2].y, 'round') &&
                            qSVG.btwn(inter.x, WALLS[p].coords[1].x, WALLS[p].coords[2].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[p].coords[1].y, WALLS[p].coords[2].y, 'round')) {
                            distance = qSVG.measure(WALLS[i].coords[1], inter) / meter;
                            pushToRibMaster(ribMaster, 1, i, i, p, 'down', inter, distance.toFixed(2));

                        }
                    }
                }
            }
            distance = qSVG.measure(WALLS[i].coords[0], WALLS[i].coords[3]) / meter;
            pushToRibMaster(ribMaster, 0, i, i, i, 'up', WALLS[i].coords[3], distance.toFixed(2));

            distance = qSVG.measure(WALLS[i].coords[1], WALLS[i].coords[2]) / meter;
            pushToRibMaster(ribMaster, 1, i, i, i, 'down', WALLS[i].coords[2], distance.toFixed(2));
        }
    }

    for (let a in ribMaster[0]) {
        ribMaster[0][a].sort(function (a, b) {
            return (a.distance - b.distance).toFixed(2);
        });
    }
    for (let a in ribMaster[1]) {
        ribMaster[1][a].sort(function (a, b) {
            return (a.distance - b.distance).toFixed(2);
        });
    }

    let sizeText = [];
    if (shift === 5) $('#boxRib').empty();
    for (let t in ribMaster) {
        for (let a in ribMaster[t]) {
            for (let n = 1; n < ribMaster[t][a].length; n++) {
                if (ribMaster[t][a][n - 1].wallIndex === ribMaster[t][a][n].wallIndex) {
                    let edge = ribMaster[t][a][n].wallIndex;
                    let found = true;
                    let valueText = Math.abs(ribMaster[t][a][n - 1].distance - ribMaster[t][a][n].distance);
                    // CLEAR TOO LITTLE VALUE
                    if (valueText < 0.15) {
                        found = false;
                    }
                    // CLEAR (thick) BETWEEN CROSS EDGE
                    if (found && ribMaster[t][a][n - 1].crossEdge === ribMaster[t][a][n].crossEdge && ribMaster[t][a][n].crossEdge !=
                        ribMaster[t][a][n].wallIndex) {
                        found = false;
                    }
                    // CLEAR START INTO EDGE
                    if (found && ribMaster[t][a].length > 2 && n === 1) {
                        let polygon = [];
                        for (let pp = 0; pp < 4; pp++) {
                            polygon.push({
                                x: WALLS[ribMaster[t][a][n].crossEdge].coords[pp].x,
                                y: WALLS[ribMaster[t][a][n].crossEdge].coords[pp].y
                            }); // FOR Z
                        }
                        if (qSVG.rayCasting(ribMaster[t][a][0].coords, polygon)) {
                            found = false;
                        }
                    }
                    // CLEAR END INTO EDGE
                    if (found && ribMaster[t][a].length > 2 && n === ribMaster[t][a].length - 1) {
                        let polygon = [];
                        for (let pp = 0; pp < 4; pp++) {
                            polygon.push({
                                x: WALLS[ribMaster[t][a][n - 1].crossEdge].coords[pp].x,
                                y: WALLS[ribMaster[t][a][n - 1].crossEdge].coords[pp].y
                            }); // FOR Z
                        }
                        if (qSVG.rayCasting(ribMaster[t][a][ribMaster[t][a].length - 1].coords, polygon)) {
                            found = false;
                        }
                    }

                    if (found) {
                        let angleText = WALLS[ribMaster[t][a][n].wallIndex].angle * (180 / Math.PI);
                        let shiftValue = -shift;
                        if (ribMaster[t][a][n - 1].side === 'down') {
                            shiftValue = -shiftValue + 10;
                        }
                        if (angleText > 90 || angleText < -89) {
                            angleText -= 180;
                            if (ribMaster[t][a][n - 1].side === 'down') {
                                shiftValue = -shift;
                            } else shiftValue = -shiftValue + 10;
                        }
                        sizeText[n] = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        let startText = qSVG.middle(ribMaster[t][a][n - 1].coords.x, ribMaster[t][a][n - 1].coords.y, ribMaster[t][a][n].coords.x,
                            ribMaster[t][a][n].coords.y);
                        
                        // Calculate perpendicular offset based on wall direction
                        let wallIndex = ribMaster[t][a][n].wallIndex;
                        let wall = WALLS[wallIndex];
                        let wallAngle = wall.angle;
                        
                        // Calculate perpendicular direction (90 degrees from wall angle)
                        let perpAngle = wallAngle + (Math.PI / 2);
                        
                        // Determine offset direction based on side
                        let offsetDistance = Math.abs(shiftValue) + 5;
                        if (ribMaster[t][a][n - 1].side === 'down') {
                            perpAngle += Math.PI; // Flip to other side
                        }
                        
                        let offsetX = Math.cos(perpAngle) * offsetDistance;
                        let offsetY = Math.sin(perpAngle) * offsetDistance;
                        
                        // Check for valid coordinates before setting attributes
                        if (startText && !isNaN(startText.x) && !isNaN(startText.y)) {
                            // Use simple positioning - just place at wall midpoint with minimal offset
                            sizeText[n].setAttributeNS(null, 'x', startText.x);
                            sizeText[n].setAttributeNS(null, 'y', startText.y + shiftValue);
                            sizeText[n].setAttributeNS(null, 'text-anchor', 'middle');
                            sizeText[n].setAttributeNS(null, 'font-family', 'roboto');
                            sizeText[n].setAttributeNS(null, 'stroke', '#ffffff');
                            sizeText[n].textContent = valueText.toFixed(2);
                            if (sizeText[n].textContent < 1) {
                                sizeText[n].setAttributeNS(null, 'font-size', '0.73em');
                                sizeText[n].textContent = sizeText[n].textContent.substring(1, sizeText[n].textContent.length);
                            } else sizeText[n].setAttributeNS(null, 'font-size', '0.9em');
                            sizeText[n].setAttributeNS(null, 'stroke-width', '0.2px');
                            sizeText[n].setAttributeNS(null, 'fill', '#555555');
                            sizeText[n].setAttribute("transform", "rotate(" + angleText + " " + startText.x + "," + (startText.y + shiftValue) + ")");
                        } else {
                            // Skip creating text element if coordinates are invalid
                            console.warn('Invalid coordinates for size text element:', startText);
                        }

                        $('#boxRib').append(sizeText[n]);
                    }
                }
            }
        }
    }
}

function cursor(tool) {
    if (tool === 'grab') tool =
        "url('https://wiki.openmrs.org/s/en_GB/7502/b9217199c27dd617c8d51f6186067d7767c5001b/_/images/icons/emoticons/add.png') 8 8, auto";
    if (tool === 'scissor') tool = "url('https://maxcdn.icons8.com/windows10/PNG/64/Hands/hand_scissors-64.png'), auto";
    if (tool === 'trash') tool = "url('https://cdn4.iconfinder.com/data/icons/common-toolbar/36/Cancel-32.png'), auto";
    if (tool === 'validation') tool = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><path fill=\"%23008000\" d=\"M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z\"/></svg>') 8 8, auto";
    linElement.css('cursor', tool);
}

function fullscreen() {
    // go full-screen
    let i = document.body;
    if (i.requestFullscreen) {
        i.requestFullscreen();
    } else if (i.webkitRequestFullscreen) {
        i.webkitRequestFullscreen();
    } else if (i.mozRequestFullScreen) {
        i.mozRequestFullScreen();
    } else if (i.msRequestFullscreen) {
        i.msRequestFullscreen();
    }
}

function outFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}

document.addEventListener("fullscreenchange", function () {
    if (
        !document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement) {
        $('#nofull_mode').display = 'none';
        $('#full_mode').show();
    }
});

function raz_button() {
    $('#rect_mode').removeClass('btn-success');
    $('#rect_mode').addClass('btn-default');
    $('#select_mode').removeClass('btn-success');
    $('#select_mode').addClass('btn-default');
    $('#line_mode').removeClass('btn-success');
    $('#line_mode').addClass('btn-default');
    $('#partition_mode').removeClass('btn-success');
    $('#partition_mode').addClass('btn-default');
    $('#door_mode').removeClass('btn-success');
    $('#door_mode').addClass('btn-default');
    $('#node_mode').removeClass('btn-success');
    $('#node_mode').addClass('btn-default');
    $('#text_mode').removeClass('btn-success');
    $('#text_mode').addClass('btn-default');
    $('#room_mode').removeClass('btn-success');
    $('#room_mode').addClass('btn-default');
    $('#distance_mode').removeClass('btn-success');
    $('#distance_mode').addClass('btn-default');
    $('#object_mode').removeClass('btn-success');
    $('#object_mode').addClass('btn-default');
    $('#stair_mode').removeClass('btn-success');
    $('#stair_mode').addClass('btn-default');
}

function fonc_button(modesetting, option) {
    save();

    $('.sub').hide();
    raz_button();
    if (option != 'simpleStair') {
        $('#' + modesetting).removeClass('btn-default');
        $('#' + modesetting).addClass('btn-success');

    }
    mode = modesetting;
    modeOption = option;

    if (typeof (lineIntersectionP) != 'undefined') {
        lineIntersectionP.remove();
        delete lineIntersectionP;
    }
}


$('#distance_mode').click(function () {
    linElement.css('cursor', 'crosshair');
    $('#boxinfo').html('Add a measurement');
    fonc_button('distance_mode');
});

$('#room_mode').click(function () {
    linElement.css('cursor', 'pointer');
    $('#boxinfo').html('Config. of rooms');
    fonc_button('room_mode');
});

$('#select_mode').click(function () {
    $('#boxinfo').html('Mode "select"');
    if (typeof (binder) != 'undefined') {
        try { if (binder.graph) $(binder.graph).remove(); } catch (e) {}
        $('#boxbind').empty();
        binder = undefined;
    }

    fonc_button('select_mode');
});

$('#line_mode').click(function () {
    linElement.css('cursor', 'crosshair');
    $('#boxinfo').html('Creation of wall(s)');
    multi = 0;
    action = 0;
    // snap = calcul_snap(event, grid_snap);
    //
    // pox = snap.x;
    // poy = snap.y;
    fonc_button('line_mode');
});

$('#partition_mode').click(function () {
    linElement.css('cursor', 'crosshair');
    $('#boxinfo').html('Creation of thin wall(s)');
    multi = 0;
    fonc_button('partition_mode');
});

$('#rect_mode').click(function () {
    linElement.css('cursor', 'crosshair');
    $('#boxinfo').html('Room(s) creation');
    fonc_button('rect_mode');
});

$('.door').click(function () {
    linElement.css('cursor', 'crosshair');
    $('#boxinfo').html('Add a door');
    $('#door_list').hide(200);
    fonc_button('door_mode', this.id);
});

$('.window').click(function () {
    linElement.css('cursor', 'crosshair');
    $('#boxinfo').html('Add a window');
    $('#door_list').hide(200);
    $('#window_list').hide(200);
    fonc_button('door_mode', this.id);
});

$('.object').click(function () {
    cursor('move');
    $('#boxinfo').html('Add an object');
    fonc_button('object_mode', this.id);
});

$('#stair_mode').click(function () {
    cursor('move');
    $('#boxinfo').html('Add stair');
    fonc_button('object_mode', 'simpleStair');
});

$('#node_mode').click(function () {
    $('#boxinfo')
        .html('Cut a wall<br/><span style=\"font-size:0.7em\">Warning : Cutting the wall of a room can cancel its ' +
            'configuration</span>');
    fonc_button('node_mode');
});

$('#text_mode').click(function () {
    $('#boxinfo').html('Add text<br/><span style=\"font-size:0.7em\">Place the cursor to the desired location, then ' +
        'type your text.</span>');
    fonc_button('text_mode');
});

$('#grid_mode').click(function () {
    if (grid_snap === 'on') {
        grid_snap = 'off';
        $('#boxinfo').html('Help grid off');
        $('#grid_mode').removeClass('btn-success');
        $('#grid_mode').addClass('btn-warning');
        $('#grid_mode').html('GRID OFF');
        $('#boxgrid').css('opacity', '0.5');
    } else {
        grid_snap = 'on';
        $('#boxinfo').html('Help grid on');
        $('#grid_mode').removeClass('btn-warning');
        $('#grid_mode').addClass('btn-success');
        $('#grid_mode').html('GRID ON <i class="fa fa-th" aria-hidden="true"></i>');
        $('#boxgrid').css('opacity', '1');
    }
});

//  RETURN PATH(s) ARRAY FOR OBJECT + PROPERTY params => bindBox (false = open sideTool), move, resize, rotate
function carpentryCalc(classObj, typeObj, sizeObj, thickObj, dividerObj = 10) {
    // Validate input parameters to prevent NaN propagation
    if (isNaN(sizeObj) || sizeObj <= 0) sizeObj = 60;
    if (isNaN(thickObj) || thickObj <= 0) thickObj = 20;
    if (isNaN(dividerObj) || dividerObj <= 0) dividerObj = 10;
    
    let construc = [];
    construc.params = {};
    construc.params.bindBox = false;
    construc.params.move = false;
    construc.params.resize = false;
    construc.params.resizeLimit = {};
    construc.params.resizeLimit.width = { min: false, max: false };
    construc.params.resizeLimit.height = { min: false, max: false };
    construc.params.rotate = false;

    if (classObj === 'socle') {
        pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," +
            thickObj / 2 + " L " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2) +
            " Z", "#5cba79", "#5cba79", '');
    }


    if (classObj === 'doorWindow') {
        if (typeObj === 'simple') {

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " L " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2) + " Z", "#ccc", "none",
                '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," +
                (-sizeObj - thickObj / 2) + "  A" + sizeObj + "," + sizeObj + " 0 0,1 " + sizeObj / 2 + "," + (-thickObj / 2), "none", colorWall,
                '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = { min: 40, max: 120 };
        }
        if (typeObj === 'double') {

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " L " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2) + " Z", "#ccc", "none",
                '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," +
                (-sizeObj / 2 - thickObj / 2) + "  A" + sizeObj / 2 + "," + sizeObj / 2 + " 0 0,1 0," + (-thickObj / 2), "none", colorWall,
                '');

            pushToConstruc(construc, "M " + (sizeObj / 2) + "," + (-thickObj / 2) + " L " + (sizeObj / 2) + "," +
                (-sizeObj / 2 - thickObj / 2) + "  A" + sizeObj / 2 + "," + sizeObj / 2 + " 0 0,0 0," + (-thickObj / 2), "none", colorWall,
                '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = { min: 40, max: 160 };
        }
        if (typeObj === 'pocket') {
            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-(thickObj / 2) - 4) + " L " + (-sizeObj / 2) + "," +
                thickObj / 2 + " L " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-(thickObj / 2) - 4) + " Z", "#ccc",
                "none",
                'none');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " M " + (sizeObj / 2) + "," + (thickObj / 2) + " L " + (sizeObj / 2) + "," + (-thickObj / 2), "none", "#494646",
                '5 5');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," +
                (-thickObj / 2 - 5) + " L " + (+sizeObj / 2) + "," + (-thickObj / 2 - 5) + " L " + (+sizeObj / 2) +
                "," + (-thickObj / 2) + " Z", "url(#hatch)", "#494646", '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = { min: 60, max: 200 };
        }
        if (typeObj === 'aperture') {
            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " L " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2) + " Z", "#ccc", "#494646",
                '5,5');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-(thickObj / 2)) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " L " + ((-sizeObj / 2) + 5) + "," + thickObj / 2 + " L " + ((-sizeObj / 2) + 5) + "," + (-(thickObj / 2)) + " Z", "none",
                "#494646",
                'none');

            pushToConstruc(construc, "M " + ((sizeObj / 2) - 5) + "," + (-(thickObj / 2)) + " L " + ((sizeObj / 2) - 5) + "," + thickObj / 2 +
                " L " + (sizeObj / 2) + "," + thickObj / 2 + " L " + (sizeObj / 2) + "," + (-(thickObj / 2)) + " Z", "none", "#494646",
                'none');
            construc.params.resize = true;
            construc.params.resizeLimit.width = { min: 40, max: 500 };
        }
        if (typeObj === 'fix') {
            pushToConstruc(construc, "M " + (-sizeObj / 2) + ",-2 L " + (-sizeObj / 2) + ",2 L " +
                sizeObj / 2 + ",2 L " + sizeObj / 2 + ",-2 Z", "#ccc", "none", '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " M " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2), "none", "#ccc", '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = { min: 30, max: 300 };
        }
        if (typeObj === 'flap') {

            pushToConstruc(construc, "M " + (-sizeObj / 2) + ",-2 L " + (-sizeObj / 2) + ",2 L " +
                sizeObj / 2 + ",2 L " + sizeObj / 2 + ",-2 Z", "#ccc", "none", '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " M " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2), "none", "#ccc", '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + ((-sizeObj / 2) +
                ((sizeObj) * 0.866)) + "," + ((-sizeObj / 2) - (thickObj / 2)) + "  A" + sizeObj + "," +
                sizeObj + " 0 0,1 " + sizeObj / 2 + "," + (-thickObj / 2), "none", colorWall, '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = { min: 20, max: 100 };
        }
        if (typeObj === 'twin') {

            pushToConstruc(construc, "M " + (-sizeObj / 2) + ",-2 L " + (-sizeObj / 2) + ",2 L " + sizeObj / 2 +
                ",2 L " + sizeObj / 2 + ",-2 Z", "#000", "none", '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " L " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2), "#fff", "#fff", '', 0.7);

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " M " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2), "none", "#000", '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + ((-sizeObj / 2) +
                ((sizeObj / 2) * 0.866)) + "," + (-sizeObj / 4 - thickObj / 2) + "  A" +
                sizeObj / 2 + "," + sizeObj / 2 + " 0 0,1 0," + (-thickObj / 2), "none", colorWall, '');

            pushToConstruc(construc, "M " + (sizeObj / 2) + "," + (-thickObj / 2) + " L " + ((sizeObj / 2) +
                ((-sizeObj / 2) * 0.866)) + "," + (-sizeObj / 4 - thickObj / 2) + "  A" +
                sizeObj / 2 + "," + sizeObj / 2 + " 0 0,0 0," + (-thickObj / 2), "none", colorWall, '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = { min: 40, max: 200 };
        }
        if (typeObj === 'bay') {

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " M " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2), "none", "#ccc", '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + ",-2 L " + (-sizeObj / 2) + ",0 L 2,0 L 2,2 L 3,2 L 3,-2 Z", "#ccc", "none", '');

            pushToConstruc(construc, "M -2,1 L -2,3 L " + sizeObj / 2 + ",3 L " + sizeObj / 2 + ",1 L -1,1 L -1,-1 L -2,-1 Z", "#ccc", "none", '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = { min: 60, max: 300 };
        }
    }

    if (classObj === 'measure') {
        construc.params.bindBox = true;
        pushToConstruc(construc, "M-" + (sizeObj / 2) + ",0 l10,-10 l0,8 l" + (sizeObj - 20) +
            ",0 l0,-8 l10,10 l-10,10 l0,-8 l-" + (sizeObj - 20) + ",0 l0,8 Z", "#729eeb", "none", '');
    }

    if (classObj === 'boundingBox') {

        pushToConstruc(construc,
            "M" + (-sizeObj / 2 - 10) + "," + (-thickObj / 2 - 10) + " L" + (sizeObj / 2 + 10) + "," + (-thickObj / 2 - 10) + " L" +
            (sizeObj / 2 + 10) + "," + (thickObj / 2 + 10) + " L" + (-sizeObj / 2 - 10) + "," + (thickObj / 2 + 10) + " Z", 'none',
            "#aaa", '');

        // construc.push({'path':"M"+dividerObj[0].x+","+dividerObj[0].y+" L"+dividerObj[1].x+","+dividerObj[1].y+" L"+dividerObj[2].x+",
        // "+dividerObj[2].y+" L"+dividerObj[3].x+","+dividerObj[3].y+" Z", 'fill':'none', 'stroke':"#000", 'strokeDashArray': ''});
    }

    //typeObj = color  dividerObj = text
    if (classObj === 'text') {
        construc.params.bindBox = true;
        construc.params.move = true;
        construc.params.rotate = true;
        construc.push({
            'text': dividerObj.text,
            'x': '0',
            'y': '0',
            'fill': typeObj,
            'stroke': typeObj,
            'fontSize': dividerObj.size + 'px',
            "strokeWidth": "0px"
        });
    }

    if (classObj === 'stair') {
        construc.params.bindBox = true;
        construc.params.move = true;
        construc.params.resize = true;
        construc.params.rotate = true;
        construc.params.width = 60;
        construc.params.height = 180;
        if (typeObj === 'simpleStair') {

            pushToConstruc(construc,
                "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 + " L " + sizeObj / 2 + "," +
                thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2) + " Z", "#fff", "#000", '');

            let heightStep = thickObj / (dividerObj);
            for (let i = 1; i < dividerObj + 1; i++) {
                pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + ((-thickObj / 2) + (i * heightStep)) + " L " + (sizeObj / 2) + "," +
                    ((-thickObj / 2) + (i * heightStep)), "none", "#000", 'none');
            }
            construc.params.resizeLimit.width = { min: 40, max: 200 };
            construc.params.resizeLimit.height = { min: 40, max: 400 };
        }

    }

    if (classObj === 'energy') {
        construc.params.bindBox = true;
        construc.params.move = true;
        construc.params.resize = false;
        construc.params.rotate = false;
        if (typeObj === 'gtl') {
            pushToConstruc(construc, "m -20,-20 l 40,0 l0,40 l-40,0 Z", "#fff", "#333", '');
            construc.push({
                'text': "GTL",
                'x': '0',
                'y': '5',
                'fill': "#333333",
                'stroke': "none",
                'fontSize': '0.9em',
                "strokeWidth": "0.4px"
            });
            construc.params.width = 40;
            construc.params.height = 40;
            construc.family = 'stick';
        }
        if (typeObj === 'switch') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#333", '');
            pushToConstruc(construc, qSVG.circlePath(-2, 4, 5), "none", "#333", '');
            pushToConstruc(construc, "m 0,0 5,-9", "none", "#333", '');
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';

        }
        if (typeObj === 'doubleSwitch') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#333", '');
            pushToConstruc(construc, qSVG.circlePath(0, 0, 4), "none", "#333", '');
            pushToConstruc(construc, "m 2,-3 5,-8 3,2", "none", "#333", '');
            pushToConstruc(construc, "m -2,3 -5,8 -3,-2", "none", "#333", '');
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'dimmer') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#333", '');
            pushToConstruc(construc, qSVG.circlePath(-2, 4, 5), "none", "#333", '');
            pushToConstruc(construc, "m 0,0 5,-9", "none", "#333", '');
            pushToConstruc(construc, "M -2,-6 L 10,-4 L-2,-2 Z", "none", "#333", '');

            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'plug') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc, "M 10,-6 a 10,10 0 0 1 -5,8 10,10 0 0 1 -10,0 10,10 0 0 1 -5,-8", "none", "#333", '');
            pushToConstruc(construc, "m 0,3 v 7", "none", "#333", '');
            pushToConstruc(construc, "m -10,4 h 20", "none", "#333", '');
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'plug20') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc, "M 10,-6 a 10,10 0 0 1 -5,8 10,10 0 0 1 -10,0 10,10 0 0 1 -5,-8", "none", "#333", '');
            pushToConstruc(construc, "m 0,3 v 7", "none", "#333", '');
            pushToConstruc(construc, "m -10,4 h 20", "none", "#333", '');

            construc.push({
                'text': "20A",
                'x': '0',
                'y': '-5',
                'fill': "#333333",
                'stroke': "none",
                'fontSize': '0.65em',
                "strokeWidth": "0.4px"
            });
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'plug32') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc, "M 10,-6 a 10,10 0 0 1 -5,8 10,10 0 0 1 -10,0 10,10 0 0 1 -5,-8", "none", "#333", '');
            pushToConstruc(construc, "m 0,3 v 7", "none", "#333", '');
            pushToConstruc(construc, "m -10,4 h 20", "none", "#333", '');

            construc.push({
                'text': "32A",
                'x': '0',
                'y': '-5',
                'fill': "#333333",
                'stroke': "none",
                'fontSize': '0.65em',
                "strokeWidth": "0.4px"
            });
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'roofLight') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc, "M -8,-8 L 8,8 M -8,8 L 8,-8", "none", "#333", '');

            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'free';
        }
        if (typeObj === 'wallLight') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc, "M -8,-8 L 8,8 M -8,8 L 8,-8", "none", "#333", '');
            pushToConstruc(construc, "M -10,10 L 10,10", "none", "#333", '');

            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'www') {
            pushToConstruc(construc, "m -20,-20 l 40,0 l0,40 l-40,0 Z", "#fff", "#333", '');

            construc.push({
                'text': "@",
                'x': '0',
                'y': '4',
                'fill': "#333333",
                'stroke': "none",
                'fontSize': '1.2em',
                "strokeWidth": "0.4px"
            });
            construc.params.width = 40;
            construc.params.height = 40;
            construc.family = 'free';
        }
        if (typeObj === 'rj45') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc, "m-10,5 l0,-10 m20,0 l0,10", "none", "#333", '');
            pushToConstruc(construc, "m 0,5 v 7", "none", "#333", '');
            pushToConstruc(construc, "m -10,5 h 20", "none", "#333", '');

            construc.push({
                'text': "RJ45",
                'x': '0',
                'y': '-5',
                'fill': "#333333",
                'stroke': "none",
                'fontSize': '0.5em',
                "strokeWidth": "0.4px"
            });
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'tv') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc, "m-10,5 l0-10 m20,0 l0,10", "none", "#333", '');
            pushToConstruc(construc, "m-7,-5 l0,7 l14,0 l0,-7", "none", "#333", '');
            pushToConstruc(construc, "m 0,5 v 7", "none", "#333", '');
            pushToConstruc(construc, "m -10,5 h 20", "none", "#333", '');

            construc.push({
                'text': "TV",
                'x': '0',
                'y': '-5',
                'fill': "#333333",
                'stroke': "none",
                'fontSize': '0.5em',
                "strokeWidth": "0.4px"
            });
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }

        if (typeObj === 'heater') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc, "m-15,-4 l30,0", "none", "#333", '');
            pushToConstruc(construc, "m-14,-8 l28,0", "none", "#333", '');
            pushToConstruc(construc, "m-11,-12 l22,0", "none", "#333", '');
            pushToConstruc(construc, "m-16,0 l32,0", "none", "#333", '');
            pushToConstruc(construc, "m-15,4 l30,0", "none", "#333", '');
            pushToConstruc(construc, "m-14,8 l28,0", "none", "#333", '');
            pushToConstruc(construc, "m-11,12 l22,0", "none", "#333", '');

            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'radiator') {
            pushToConstruc(construc, "m -20,-10 l 40,0 l0,20 l-40,0 Z", "#fff", "#333", '');
            pushToConstruc(construc, "M -15,-10 L -15,10", "#fff", "#333", '');
            pushToConstruc(construc, "M -10,-10 L -10,10", "#fff", "#333", '');
            pushToConstruc(construc, "M -5,-10 L -5,10", "#fff", "#333", '');
            pushToConstruc(construc, "M -0,-10 L -0,10", "#fff", "#333", '');
            pushToConstruc(construc, "M 5,-10 L 5,10", "#fff", "#333", '');
            pushToConstruc(construc, "M 10,-10 L 10,10", "#fff", "#333", '');
            pushToConstruc(construc, "M 15,-10 L 15,10", "#fff", "#333", '');

            construc.params.width = 40;
            construc.params.height = 20;
            construc.family = 'stick';

        }
    }

    if (classObj === 'furniture') {
        construc.params.bindBox = true;
        construc.params.move = true;
        construc.params.resize = true;
        construc.params.rotate = true;
    }

    return construc;
}

function setBestEqPoint(bestEqPoint, distance, index, x, y, x1, y1, x2, y2, way) {
    bestEqPoint.distance = distance;
    bestEqPoint.node = index;
    bestEqPoint.x = x;
    bestEqPoint.y = y;
    bestEqPoint.x1 = x1;
    bestEqPoint.y1 = y1;
    bestEqPoint.x2 = x2;
    bestEqPoint.y2 = y2;
    bestEqPoint.way = way;
}

function pushToRibMaster(ribMaster, firstIndex, secondIndex, wallIndex, crossEdge, side, coords, distance) {
    ribMaster[firstIndex][secondIndex].push({
        wallIndex: wallIndex,
        crossEdge: crossEdge,
        side: side,
        coords: coords,
        distance: distance
    });
}

function pushToConstruc(construc, path, fill, stroke, strokeDashArray, opacity = 1) {
    construc.push({
        'path': path,
        'fill': fill,
        'stroke': stroke,
        'strokeDashArray': strokeDashArray,
        'opacity': opacity
    });
}

// Export button event handler
document.getElementById('export_mode').addEventListener('click', function() {
    // Generate filename with current date
    const now = new Date();
    const dateStr = now.getFullYear() + '-' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(now.getDate()).padStart(2, '0');
    const filename = 'floorplan_' + dateStr;
    
    // Call the export function
    if (exportFloorplanJSON(filename, true)) {
        $('#boxinfo').html('Floorplan saved successfully!');
    } else {
        $('#boxinfo').html('Save failed. Please try again.');
    }
});

// Blender export button event handler
document.getElementById('export_blender_mode').addEventListener('click', function() {
    // Generate filename with current date
    const now = new Date();
    const dateStr = now.getFullYear() + '-' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(now.getDate()).padStart(2, '0');
    const filename = 'floorplan_blender_' + dateStr;
    
    // Call the Blender export function
    if (exportForBlender(filename, 2.8, 0.08)) {
        $('#boxinfo').html('Floorplan exported for Blender successfully!');
    } else {
        $('#boxinfo').html('Blender export failed. Please try again.');
    }
});

// Import button event handler
document.getElementById('import_mode').addEventListener('click', function() {
    // Show confirmation dialog before importing (will clear current work)
    if (WALLS.length > 0 || OBJDATA.length > 0 || ROOM.length > 0) {
        if (!confirm('Opening a floorplan will replace your current work. Are you sure you want to continue?')) {
            $('#boxinfo').html('Open cancelled');
            return;
        }
    }
    
    // Trigger the file selection dialog
    triggerImportDialog();
});

// Import from AI button event handler
document.getElementById('import_ai_mode').addEventListener('click', function () {
    // Show confirmation dialog before importing (will clear current work)
    if (typeof WALLS !== 'undefined' && (WALLS.length > 0 || (typeof OBJDATA !== 'undefined' && OBJDATA.length > 0) || (typeof ROOM !== 'undefined' && ROOM.length > 0))) {
        if (!confirm('Importing will replace your current floorplan. Are you sure you want to continue?')) {
            if (typeof $('#boxinfo') !== 'undefined') $('#boxinfo').html('Import cancelled');
            return;
        }
    }

    // Trigger the AI import dialog
    if (typeof triggerAIImportDialog === 'function') {
        triggerAIImportDialog();
    } else {
        console.error('triggerAIImportDialog is not available');
        if (typeof $('#boxinfo') !== 'undefined') $('#boxinfo').html('AI import is not available');
    }
});

// Import image button event handler
document.getElementById('import_image_mode').addEventListener('click', function() {
    // Trigger the image import dialog
    triggerImageImportDialog();
});

// Background image opacity slider event handler (guard against missing element)
(function(){
    const opacitySlider = document.getElementById('backgroundImageOpacitySlider');
    if (opacitySlider) {
        opacitySlider.addEventListener('input', function() {
            const opacityValue = this.value;
            if (typeof setBackgroundImageOpacity === 'function') setBackgroundImageOpacity(opacityValue);
            const label = document.getElementById('backgroundImageOpacityVal');
            if (label) label.textContent = opacityValue;
        });
    }
})();

// Background image remove button event handler (guard against missing element)
(function(){
    const removeBtn = document.getElementById('backgroundImageRemove');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to remove the background image?')) {
                if (typeof removeBackgroundImage === 'function') removeBackgroundImage();
                if (typeof hideBackgroundImageTools === 'function') hideBackgroundImageTools();
                if (typeof $ !== 'undefined') $('#boxinfo').html('Background image removed');
            }
        });
    }
})();

// Combined Import (JSON + Image) modal handlers
(function(){
    const jsonInput = document.getElementById('combined_json_input');
    const imageInput = document.getElementById('combined_image_input');
    const widthInput = document.getElementById('combined_target_width');
    const importBtn = document.getElementById('combined_import_btn');
    const jsonName = document.getElementById('combined_json_name');
    const imageName = document.getElementById('combined_image_name');
    const errMsg = document.getElementById('combined_error_msg');
    const okMsg = document.getElementById('combined_success_msg');

    if (!(jsonInput && imageInput && importBtn && widthInput)) return; // Modal not present

    function resetMessages() {
        if (errMsg) errMsg.textContent = '';
        if (okMsg) okMsg.textContent = '';
    }

    function validateEnable() {
        const jf = jsonInput.files && jsonInput.files[0];
        const imf = imageInput.files && imageInput.files[0];
        const targetWidth = parseFloat(widthInput.value);
        let ok = true;
        resetMessages();
        if (jf) {
            const validJson = /\.json$/i.test(jf.name);
            if (!validJson) { ok = false; if (errMsg) errMsg.textContent = 'Selected JSON file is not a .json'; }
        } else { ok = false; }
        // Image is optional; if provided, validate type
        if (imf) {
            const validImg = /\.(png|jpe?g)$/i.test(imf.name);
            if (!validImg) { ok = false; if (errMsg) errMsg.textContent = 'Selected image must be PNG or JPG'; }
        }
        // Width is required and must be positive
        if (!targetWidth || targetWidth <= 0) {
            ok = false;
            if (errMsg && !errMsg.textContent) errMsg.textContent = 'Please specify a valid target width';
        }
        importBtn.disabled = !ok;
    }

    jsonInput.addEventListener('change', function(){
        if (jsonName) jsonName.textContent = this.files[0] ? this.files[0].name : '';
        validateEnable();
    });
    imageInput.addEventListener('change', function(){
        if (imageName) imageName.textContent = this.files[0] ? this.files[0].name : '';
        validateEnable();
    });
    widthInput.addEventListener('input', validateEnable);

    importBtn.addEventListener('click', async function(){
        resetMessages();

        // Confirm replacing current work if any
        try {
            if ((typeof WALLS !== 'undefined' && WALLS.length) || (typeof OBJDATA !== 'undefined' && OBJDATA.length) || (typeof ROOM !== 'undefined' && ROOM.length)) {
                if (!confirm('Importing will replace your current floorplan. Continue?')) {
                    if (typeof $ !== 'undefined') $('#boxinfo').html('Import cancelled');
                    return;
                }
            }
        } catch(e) { /* ignore */ }

        const jf = jsonInput.files[0];
        const imf = imageInput.files[0];
        const targetWidth = parseFloat(widthInput.value);
        importBtn.disabled = true;
        importBtn.textContent = 'Importing...';

        try {
            // Import JSON first to get the original floorplan dimensions
            const jsonOk = await (typeof importAIFloorplanJSONWithScaling === 'function' ? 
                importAIFloorplanJSONWithScaling(jf, targetWidth) : 
                Promise.resolve(false));
            if (!jsonOk) {
                if (errMsg) errMsg.textContent = 'Failed to import floorplan JSON.';
                importBtn.textContent = 'Import';
                validateEnable();
                return;
            }

            // Image is optional: import if provided and apply scaling immediately
            let imgOk = true;
            if (imf) {
                imgOk = await (typeof importBackgroundImage === 'function' ? importBackgroundImage(imf) : Promise.resolve(false));
                
                if (!imgOk) {
                    if (errMsg) errMsg.textContent = 'Floorplan JSON loaded and scaled, but background image import failed.';
                    importBtn.textContent = 'Import';
                    validateEnable();
                    return;
                }

                // Scale the background image to match the target width directly
                // Use setTimeout to ensure scaling happens after any default sizing
                setTimeout(() => {
                    const bgImg = document.getElementById('backgroundImage');
                    if (bgImg) {
                        // Get current floorplan bounds after scaling
                        const finalBounds = (typeof calculateFloorplanBounds === 'function') ? calculateFloorplanBounds() : null;
                        if (finalBounds) {
                            // Get current background image properties after any default sizing
                            const currentImgWidth = parseFloat(bgImg.getAttribute('width')) || 1100;
                            const currentImgHeight = parseFloat(bgImg.getAttribute('height')) || 700;
                            const currentImgX = parseFloat(bgImg.getAttribute('x')) || 0;
                            const currentImgY = parseFloat(bgImg.getAttribute('y')) || 0;
                            
                            // Calculate what the background image width should be in pixels to match target
                            const targetImgWidthPixels = targetWidth * meter;
                            const scaleFactor = targetImgWidthPixels / currentImgWidth;
                            
                            
                            // Use the floorplan bounds as origin (same as scaleAllElementsUniformly)
                            const originX = finalBounds.minX;
                            const originY = finalBounds.minY;
                            
                            const newImgWidth = currentImgWidth * scaleFactor;
                            const newImgHeight = currentImgHeight * scaleFactor;
                            
                            // Center the background image relative to the floorplan bounds
                            const floorplanCenterX = finalBounds.minX + finalBounds.width / 2;
                            const floorplanCenterY = finalBounds.minY + finalBounds.height / 2;
                            
                            const newImgX = floorplanCenterX - newImgWidth / 2;
                            const newImgY = floorplanCenterY - newImgHeight / 2;
                            
                            bgImg.setAttribute('width', newImgWidth);
                            bgImg.setAttribute('height', newImgHeight);
                            bgImg.setAttribute('x', newImgX);
                            bgImg.setAttribute('y', newImgY);
                            
                            
                            // Force save to prevent reversion
                            if (typeof save === 'function') {
                                save();
                            }
                        }
                    }
                }, 200);
            }

            if (okMsg) okMsg.textContent = imf ? 
                `Imported and scaled to ${targetWidth}m width successfully!` : 
                `Floorplan JSON imported and scaled to ${targetWidth}m width successfully.`;
            if (typeof $ !== 'undefined') $('#boxinfo').html(imf ? 
                'Floorplan and image imported and scaled successfully' : 
                'Floorplan JSON imported and scaled successfully');

            // Close modal after short delay and clear inputs
            setTimeout(function(){
                const modalEl = document.getElementById('combinedImportModal');
                if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const instance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                    instance.hide();
                }
                jsonInput.value = '';
                imageInput.value = '';
                widthInput.value = '';
                if (jsonName) jsonName.textContent = '';
                if (imageName) imageName.textContent = '';
                importBtn.textContent = 'Import';
                validateEnable();
            }, 400);
        } catch (e) {
            console.error('Combined import error:', e);
            if (errMsg) errMsg.textContent = 'Unexpected error during import.';
            if (typeof $ !== 'undefined') $('#boxinfo').html('Import failed');
            importBtn.textContent = 'Import';
            validateEnable();
        }
    });
})();