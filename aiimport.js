/**
 * AI Import functionality for homeRoughEditor
 * Handles importing AI-generated floorplan JSON files
 */

/**
 * Trigger AI import modal dialog for importing AI JSON with scaling option
 */
function triggerAIImportDialog() {
    // Clear previous values and messages
    document.getElementById('ai_json_input').value = '';
    document.getElementById('ai_target_width').value = '';
    document.getElementById('ai_json_name').textContent = '';
    document.getElementById('ai_error_msg').textContent = '';
    document.getElementById('ai_success_msg').textContent = '';
    document.getElementById('ai_import_btn').disabled = true;

    // Set up file input event listener
    const fileInput = document.getElementById('ai_json_input');
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            document.getElementById('ai_json_name').textContent = file.name;
            validateAIImportForm();
        } else {
            document.getElementById('ai_json_name').textContent = '';
            validateAIImportForm();
        }
    });

    // Set up width input event listener
    const widthInput = document.getElementById('ai_target_width');
    widthInput.addEventListener('input', validateAIImportForm);

    // Set up import button event listener
    const importBtn = document.getElementById('ai_import_btn');
    importBtn.addEventListener('click', function() {
        const file = fileInput.files[0];
        const targetWidth = parseFloat(widthInput.value);
        
        if (file && targetWidth > 0) {
            importAIFloorplanJSONWithScaling(file, targetWidth).then((success) => {
                if (success) {
                    // Close modal on success
                    const modal = bootstrap.Modal.getInstance(document.getElementById('aiImportModal'));
                    if (modal) modal.hide();
                }
            });
        }
    });

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('aiImportModal'));
    modal.show();
}

/**
 * Validate AI import form and enable/disable import button
 */
function validateAIImportForm() {
    const file = document.getElementById('ai_json_input').files[0];
    const targetWidth = parseFloat(document.getElementById('ai_target_width').value);
    const importBtn = document.getElementById('ai_import_btn');
    
    const isValid = file && targetWidth > 0;
    importBtn.disabled = !isValid;
}

/**
 * Import AI floorplan JSON with automatic scaling to target width
 * @param {File} file
 * @param {number} targetWidthM - Target width in meters
 * @returns {Promise<boolean>}
 */
function importAIFloorplanJSONWithScaling(file, targetWidthM) {
    return new Promise((resolve) => {
        if (!file) {
            console.error('No file provided for AI import');
            document.getElementById('ai_error_msg').textContent = 'No file selected for AI import';
            resolve(false);
            return;
        }

        if (!targetWidthM || targetWidthM <= 0) {
            document.getElementById('ai_error_msg').textContent = 'Please specify a valid target width';
            resolve(false);
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // Validate the JSON structure
                if (!validateAIImportData(jsonData)) {
                    document.getElementById('ai_error_msg').textContent = 'Invalid AI JSON format. Expected {"walls": [[x0,y0,x1,y1], ...]}';
                    resolve(false);
                    return;
                }

                // Clear current plan
                clearCurrentFloorplan();

                // Import walls first (without scaling)
                const importSuccess = importAIWallsData(jsonData);
                if (!importSuccess) {
                    document.getElementById('ai_error_msg').textContent = 'Failed to import wall data';
                    resolve(false);
                    return;
                }

                // Calculate current floorplan bounds after import
                const currentBounds = calculateFloorplanBounds();
                const currentWidthM = currentBounds.width / meter;
                
                if (currentWidthM <= 0) {
                    document.getElementById('ai_error_msg').textContent = 'Invalid floorplan dimensions after import';
                    resolve(false);
                    return;
                }

                // Calculate and apply scale factor
                const scaleFactor = targetWidthM / currentWidthM;
                scaleAllElementsUniformly(scaleFactor);

                // Save state
                if (typeof save === 'function') save();

                document.getElementById('ai_success_msg').textContent = `AI floorplan imported and scaled to ${targetWidthM}m width (scale factor: ${scaleFactor.toFixed(2)})`;
                
                if (typeof fonc_button === 'function') {
                    try { fonc_button('select_mode'); } catch (e) { /* noop */ }
                }
                
                // Center the imported plan in view
                if (typeof centerFloorplanView === 'function') {
                    try { centerFloorplanView(100); } catch (e) { /* noop */ }
                }
                
                resolve(true);
            } catch (err) {
                console.error('Error importing AI JSON:', err);
                document.getElementById('ai_error_msg').textContent = 'AI import failed: ' + err.message;
                resolve(false);
            }
        };

        reader.onerror = function () {
            console.error('Error reading AI JSON file');
            document.getElementById('ai_error_msg').textContent = 'Error reading AI JSON file';
            resolve(false);
        };

        reader.readAsText(file);
    });
}

/**
 * Import walls data from AI JSON format
 * @param {Object} jsonData - The parsed JSON data
 * @returns {boolean} - Success status
 */
function importAIWallsData(jsonData) {
    try {
        // Create walls (skip malformed segments)
        const created = [];
        const defaultThick = typeof wallSize !== 'undefined' ? wallSize : 0.2;
        const isFiniteNum = (v) => typeof v === 'number' && isFinite(v);
        const dist2 = (a, b) => {
            const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy;
        };
        let skipped = 0;
        
        for (let i = 0; i < jsonData.walls.length; i++) {
            const seg = jsonData.walls[i];
            // Validate structure and values
            if (!Array.isArray(seg) || seg.length !== 4) { skipped++; continue; }
            const start = { x: seg[0], y: seg[1] };
            const end = { x: seg[2], y: seg[3] };
            if (!isFiniteNum(start.x) || !isFiniteNum(start.y) || !isFiniteNum(end.x) || !isFiniteNum(end.y)) { skipped++; continue; }
            // Reject zero-length or near-zero walls
            if (dist2(start, end) < 1e-10) { skipped++; continue; }
            try {
                const w = new editor.wall(start, end, 'normal', defaultThick);
                // Basic sanity on constructed wall
                if (!w || !w.start || !w.end || !isFiniteNum(w.start.x) || !isFiniteNum(w.start.y) || !isFiniteNum(w.end.x) || !isFiniteNum(w.end.y)) { skipped++; continue; }
                WALLS.push(w);
                created.push(w);
            } catch (e2) {
                skipped++;
            }
        }

        // Connect walls by matching endpoints (with small tolerance)
        const tol = 1e-3;
        const eq = (a, b) => (Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol);
        for (let i = 0; i < created.length; i++) {
            const wi = created[i];
            for (let j = 0; j < created.length; j++) {
                if (i === j) continue;
                const wj = created[j];
                if (!wi.parent && eq(wj.end, wi.start)) wi.parent = wj;
                if (!wi.child && eq(wj.start, wi.end)) wi.child = wj;
                if (wi.parent && wi.child) break;
            }
        }

        // Compute wall geometry first
        editor.architect(WALLS);
        // Reapply floorplan opacity after wall rebuild
        if (typeof applyFloorplanOpacity === 'function') applyFloorplanOpacity();

        // If doors/windows provided, place them
        try {
            if (Array.isArray(jsonData.doors) || Array.isArray(jsonData.windows)) {
                addOpeningsFromAI(jsonData);
            }
        } catch (openErr) {
            console.warn('Opening placement warning:', openErr);
        }

        return true;
    } catch (err) {
        console.error('Error importing AI walls data:', err);
        return false;
    }
}

/**
 * Import simple AI floorplan JSON with format: { "walls": [[x0,y0,x1,y1], ...] }
 * @param {File} file
 * @returns {Promise<boolean>}
 */
function importAIFloorplanJSON(file) {
    return new Promise((resolve) => {
        if (!file) {
            console.error('No file provided for AI import');
            if (typeof $('#boxinfo') !== 'undefined') $('#boxinfo').html('No file selected for AI import');
            resolve(false);
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // Validate the JSON structure
                if (!validateAIImportData(jsonData)) {
                    if (typeof $('#boxinfo') !== 'undefined') $('#boxinfo').html('Invalid AI JSON format. Expected {"walls": [[x0,y0,x1,y1], ...]}');
                    resolve(false);
                    return;
                }

                // Clear current plan
                clearCurrentFloorplan();

                // Create walls (skip malformed segments)
                const created = [];
                const defaultThick = typeof wallSize !== 'undefined' ? wallSize : 0.2;
                const isFiniteNum = (v) => typeof v === 'number' && isFinite(v);
                const dist2 = (a, b) => {
                    const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy;
                };
                let skipped = 0;
                for (let i = 0; i < jsonData.walls.length; i++) {
                    const seg = jsonData.walls[i];
                    // Validate structure and values
                    if (!Array.isArray(seg) || seg.length !== 4) { skipped++; continue; }
                    const start = { x: seg[0], y: seg[1] };
                    const end = { x: seg[2], y: seg[3] };
                    if (!isFiniteNum(start.x) || !isFiniteNum(start.y) || !isFiniteNum(end.x) || !isFiniteNum(end.y)) { skipped++; continue; }
                    // Reject zero-length or near-zero walls
                    if (dist2(start, end) < 1e-10) { skipped++; continue; }
                    try {
                        const w = new editor.wall(start, end, 'normal', defaultThick);
                        // Basic sanity on constructed wall
                        if (!w || !w.start || !w.end || !isFiniteNum(w.start.x) || !isFiniteNum(w.start.y) || !isFiniteNum(w.end.x) || !isFiniteNum(w.end.y)) { skipped++; continue; }
                        WALLS.push(w);
                        created.push(w);
                    } catch (e2) {
                        skipped++;
                    }
                }

                // Connect walls by matching endpoints (with small tolerance)
                const tol = 1e-3;
                const eq = (a, b) => (Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol);
                for (let i = 0; i < created.length; i++) {
                    const wi = created[i];
                    for (let j = 0; j < created.length; j++) {
                        if (i === j) continue;
                        const wj = created[j];
                        if (!wi.parent && eq(wj.end, wi.start)) wi.parent = wj;
                        if (!wi.child && eq(wj.start, wi.end)) wi.child = wj;
                        if (wi.parent && wi.child) break;
                    }
                }

                // Compute wall geometry first
                editor.architect(WALLS);
                // Reapply floorplan opacity after wall rebuild
                if (typeof applyFloorplanOpacity === 'function') applyFloorplanOpacity();

                // If doors/windows provided, place them
                try {
                    if (Array.isArray(jsonData.doors) || Array.isArray(jsonData.windows)) {
                        addOpeningsFromAI(jsonData);
                    }
                } catch (openErr) {
                    console.warn('Opening placement warning:', openErr);
                }

                // Save state
                if (typeof save === 'function') save();

                if (typeof $('#boxinfo') !== 'undefined') {
                    const msg = skipped > 0 ? `AI floorplan imported successfully (skipped ${skipped} malformed wall${skipped>1?'s':''})` : 'AI floorplan imported successfully';
                    $('#boxinfo').html(msg);
                }
                if (typeof fonc_button === 'function') {
                    try { fonc_button('select_mode'); } catch (e) { /* noop */ }
                }
                // Center the imported plan in view
                if (typeof centerFloorplanView === 'function') {
                    try { centerFloorplanView(100); } catch (e) { /* noop */ }
                }
                resolve(true);
            } catch (err) {
                console.error('Error importing AI JSON:', err);
                if (typeof $('#boxinfo') !== 'undefined') $('#boxinfo').html('AI import failed: ' + err.message);
                resolve(false);
            }
        };

        reader.onerror = function () {
            console.error('Error reading AI JSON file');
            if (typeof $('#boxinfo') !== 'undefined') $('#boxinfo').html('Error reading AI JSON file');
            resolve(false);
        };

        reader.readAsText(file);
    });
}

/**
 * Validate AI import data
 * @param {Object} data
 */
function validateAIImportData(data) {
    if (!data || !Array.isArray(data.walls)) return false;
    // walls: [[x0,y0,x1,y1], ...]
    for (let i = 0; i < data.walls.length; i++) {
        const seg = data.walls[i];
        if (!Array.isArray(seg) || seg.length !== 4) return false;
        for (let k = 0; k < 4; k++) {
            if (typeof seg[k] !== 'number' || !isFinite(seg[k])) return false;
        }
    }
    // Optional doors/windows: arrays of 8 numbers per rectangle
    const checkRects = (arr) => {
        if (!arr) return true;
        if (!Array.isArray(arr)) return false;
        for (let i = 0; i < arr.length; i++) {
            const r = arr[i];
            if (!Array.isArray(r) || r.length !== 8) return false;
            for (let k = 0; k < 8; k++) {
                if (typeof r[k] !== 'number' || !isFinite(r[k])) return false;
            }
        }
        return true;
    };
    if (!checkRects(data.doors)) return false;
    if (!checkRects(data.windows)) return false;
    return true;
}

// ------------------------ Helpers for AI openings placement ------------------------
function addOpeningsFromAI(jsonData) {
    const rectsWithType = [];
    if (Array.isArray(jsonData.doors)) {
        for (const r of jsonData.doors) rectsWithType.push({ type: 'simple', rect: r });
    }
    if (Array.isArray(jsonData.windows)) {
        for (const r of jsonData.windows) rectsWithType.push({ type: 'fix', rect: r });
    }

    for (const item of rectsWithType) {
        const pts = [
            { x: item.rect[0], y: item.rect[1] },
            { x: item.rect[2], y: item.rect[3] },
            { x: item.rect[4], y: item.rect[5] },
            { x: item.rect[6], y: item.rect[7] }
        ];
        const center = {
            x: (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4,
            y: (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4
        };
        // Standardized sizes (pixels) based on meter scale
        const meterPx = 100;
        const standardDoorWidthPx = 0.6 * meterPx; // 0.6 m doors
        const standardWindowWidthPx = 0.8 * meterPx; // 0.8 m windows
        const minWindowSpacing = 0.2 * meterPx; // 0.2 m minimum spacing between windows

        // Find best wall by distance to the bounds midpoint (no intersection required)
        let best = null; // { wall, pos, widthAlongClamped, widthAlongDesired, angleSign }
        for (const wall of WALLS) {
            const wdx = wall.end.x - wall.start.x;
            const wdy = wall.end.y - wall.start.y;
            const wlen = Math.hypot(wdx, wdy);
            if (wlen < 1e-6) continue;
            const ux = wdx / wlen, uy = wdy / wlen; // along-wall unit
            const vx = -uy, vy = ux; // perpendicular unit

            // projections of corners along wall (s) and perpendicular (p)
            let sMin = Infinity, sMax = -Infinity;
            for (const P of pts) {
                const rx = P.x - wall.start.x, ry = P.y - wall.start.y;
                const s = rx * ux + ry * uy;
                if (s < sMin) sMin = s;
                if (s > sMax) sMax = s;
            }

            // center projection and closest point on wall
            const rcx = center.x - wall.start.x, rcy = center.y - wall.start.y;
            const sCenter = rcx * ux + rcy * uy;
            const pCenter = rcx * vx + rcy * vy;
            const t = Math.max(0, Math.min(wlen, sCenter));
            const closest = { x: wall.start.x + ux * t, y: wall.start.y + uy * t };

            // Distance from center to the wall segment
            const perpDist = Math.hypot(center.x - closest.x, center.y - closest.y);

            // Calculate available space for windows/doors
            const clamp = (v) => Math.max(0, Math.min(wlen, v));
            const sMinC = clamp(sMin);
            const sMaxC = clamp(sMax);
            const widthAlongClamped = Math.max(0, sMaxC - sMinC);
            const widthAlongDesired = (item.type === 'simple') ? standardDoorWidthPx : widthAlongClamped;

            const angleSign = (pCenter > 0) ? 1 : 0;
            const candidate = { wall, pos: { x: closest.x, y: closest.y, wall }, widthAlongClamped, widthAlongDesired, angleSign, score: perpDist, sMinC, sMaxC, ux, uy };
            if (!best || candidate.score < best.score) best = candidate;
        }

        if (!best) continue; // no walls available

        // For windows, create multiple default-sized windows instead of one large window
        if (item.type === 'fix') { // windows
            const availableSpace = best.widthAlongClamped;
            const numWindows = Math.floor(availableSpace / (standardWindowWidthPx + minWindowSpacing));
            
            if (numWindows > 0) {
                // Calculate total width needed for all windows and spacing
                const totalWindowWidth = numWindows * standardWindowWidthPx;
                const totalSpacingWidth = (numWindows - 1) * minWindowSpacing;
                const totalNeededWidth = totalWindowWidth + totalSpacingWidth;
                
                // Center the window group in the available space
                const startOffset = (availableSpace - totalNeededWidth) / 2;
                
                // Create each window
                for (let i = 0; i < numWindows; i++) {
                    try {
                        const wall = best.wall;
                        const angleDeg = qSVG.angleDeg(wall.start.x, wall.start.y, wall.end.x, wall.end.y);
                        
                        // Calculate position for this window
                        const windowOffset = best.sMinC + startOffset + (i * (standardWindowWidthPx + minWindowSpacing)) + (standardWindowWidthPx / 2);
                        const windowPos = {
                            x: wall.start.x + best.ux * windowOffset,
                            y: wall.start.y + best.uy * windowOffset,
                            wall: wall
                        };
                        
                        const obj = new editor.obj2D('inWall', 'doorWindow', item.type, windowPos, 0, 0, standardWindowWidthPx, 'normal', wall.thick);

                        let finalAngle = angleDeg;
                        let sign = 0;
                        if (best.angleSign === 1) { finalAngle += 180; sign = 1; }

                        obj.x = windowPos.x;
                        obj.y = windowPos.y;
                        obj.angle = finalAngle;
                        obj.angleSign = sign;

                        // Limits along the wall
                        let limits = limitObj(wall.equations.base, obj.size, windowPos);
                        if (Array.isArray(limits)) {
                            const onSeg = (pt) => qSVG.btwn(pt.x, wall.start.x, wall.end.x) && qSVG.btwn(pt.y, wall.start.y, wall.end.y);
                            if (onSeg(limits[0]) && onSeg(limits[1])) {
                                obj.limit = limits;
                            }
                        }

                        OBJDATA.push(obj);
                        if (typeof $ !== 'undefined') {
                            $('#boxcarpentry').append(obj.graph);
                        }
                        obj.update();
                    } catch (e) {
                        console.warn('Failed to create window object:', e);
                    }
                }
            }
        } else {
            // Original door logic (single door)
            try {
                const wall = best.wall;
                const angleDeg = qSVG.angleDeg(wall.start.x, wall.start.y, wall.end.x, wall.end.y);
                // Use standardized width for doors; clamped bounds width for windows
                // Ensure it fits the usable span on the wall; shrink if necessary
                const minWidthPx = 20; // don't create degenerate tiny openings
                const spanFit = Math.max(0, best.widthAlongClamped);
                let sizeForObj = Math.max(minWidthPx, Math.min(best.widthAlongDesired, spanFit));
                const obj = new editor.obj2D('inWall', 'doorWindow', item.type, best.pos, 0, 0, sizeForObj, 'normal', wall.thick);

                let finalAngle = angleDeg;
                let sign = 0;
                if (best.angleSign === 1) { finalAngle += 180; sign = 1; }

                obj.x = best.pos.x;
                obj.y = best.pos.y;
                obj.angle = finalAngle;
                obj.angleSign = sign;

                // Limits along the wall
                let limits = limitObj(wall.equations.base, obj.size, best.pos);
                if (Array.isArray(limits)) {
                    // verify both points are on the segment
                    const onSeg = (pt) => qSVG.btwn(pt.x, wall.start.x, wall.end.x) && qSVG.btwn(pt.y, wall.start.y, wall.end.y);

                    // If limits are off the segment, clamp size to fit the segment span
                    if (!(onSeg(limits[0]) && onSeg(limits[1]))) {
                        // Compute clamped endpoints projected to the wall segment extents
                        const clampToSeg = (pt) => ({
                            x: qSVG.btwn(pt.x, wall.start.x, wall.end.x) ? pt.x : (Math.abs(pt.x - wall.start.x) < Math.abs(pt.x - wall.end.x) ? wall.start.x : wall.end.x),
                            y: qSVG.btwn(pt.y, wall.start.y, wall.end.y) ? pt.y : (Math.abs(pt.y - wall.start.y) < Math.abs(pt.y - wall.end.y) ? wall.start.y : wall.end.y)
                        });
                        const c0 = clampToSeg(limits[0]);
                        const c1 = clampToSeg(limits[1]);
                        const clampedSpan = qSVG.measure(c0.x, c0.y, c1.x, c1.y);
                        if (isFinite(clampedSpan) && clampedSpan > 0) {
                            obj.size = Math.max(minWidthPx, Math.min(obj.size, clampedSpan));
                            limits = limitObj(wall.equations.base, obj.size, best.pos);
                        }
                    }

                    if (Array.isArray(limits)) {
                        const onSeg2 = (pt) => qSVG.btwn(pt.x, wall.start.x, wall.end.x) && qSVG.btwn(pt.y, wall.start.y, wall.end.y);
                        if (onSeg2(limits[0]) && onSeg2(limits[1])) {
                            obj.limit = limits;
                            // SNAP: set position exactly to the midpoint of the limits on the wall
                            const mid = qSVG.middle(limits[0].x, limits[0].y, limits[1].x, limits[1].y);
                            obj.x = mid.x;
                            obj.y = mid.y;
                        }
                    }
                }

                OBJDATA.push(obj);
                if (typeof $ !== 'undefined') {
                    $('#boxcarpentry').append(obj.graph);
                }
                obj.update();
            } catch (e) {
                console.warn('Failed to create opening object:', e);
            }
        }
    }

    // Refresh ribbons/indicators
    if (typeof rib === 'function') rib();
}
