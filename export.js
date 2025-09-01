/**
 * Export functionality for homeRoughEditor floorplan data
 * Allows saving floorplan data as JSON files
 */

/**
 * Export the current floorplan data to a JSON file
 * @param {string} filename - Optional filename (without extension)
 * @param {boolean} includeMetadata - Whether to include additional metadata
 */
function exportFloorplanJSON(filename = 'floorplan', includeMetadata = true) {
    try {
        // Prepare wall data for export (handle cyclic references)
        const wallDataForExport = [];
        for (let k in WALLS) {
            const wall = { ...WALLS[k] };
            // Convert parent/child references to indices for JSON serialization
            if (wall.child != null) {
                wall.child = WALLS.indexOf(wall.child);
            }

 
            if (wall.parent != null) {
                wall.parent = WALLS.indexOf(wall.parent);
            }
            wallDataForExport.push(wall);
        }

        // Prepare object data for export
        const objDataForExport = [];
        for (let k in OBJDATA) {
            const obj = { ...OBJDATA[k] };
            // Remove SVG graph references that can't be serialized
            delete obj.graph;
            objDataForExport.push(obj);
        }

        // Prepare room data for export
        const roomDataForExport = [...ROOM];

        // Create the export data structure
        const exportData = {
            version: "0.95",
            exportDate: new Date().toISOString(),
            data: {
                walls: wallDataForExport,
                objects: objDataForExport,
                rooms: roomDataForExport
            }
        };

        // Add metadata if requested
        if (includeMetadata) {
            exportData.metadata = {
                totalWalls: wallDataForExport.length,
                totalObjects: objDataForExport.length,
                totalRooms: roomDataForExport.length,
                totalArea: typeof globalArea !== 'undefined' ? (globalArea / 3600).toFixed(2) + ' m²' : 'Not calculated',
                settings: {
                    wallSize: wallSize,
                    partitionSize: partitionSize,
                    meter: meter,
                    grid: grid,
                    colorSettings: {
                        background: colorbackground,
                        line: colorline,
                        room: colorroom,
                        wall: colorWall
                    }
                }
            };
        }

        // Convert to JSON string
        const jsonString = JSON.stringify(exportData, null, 2);

        // Create and trigger download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.json') ? filename : filename + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up the URL object
        URL.revokeObjectURL(url);

        // Restore original wall references
        for (let k in WALLS) {
            if (WALLS[k].child != null && typeof WALLS[k].child === 'number') {
                WALLS[k].child = WALLS[WALLS[k].child];
            }
            if (WALLS[k].parent != null && typeof WALLS[k].parent === 'number') {
                WALLS[k].parent = WALLS[WALLS[k].parent];
            }
        }

        console.log('Floorplan exported successfully as:', a.download);
        if (typeof $('#boxinfo') !== 'undefined') {
            $('#boxinfo').html('Floorplan exported successfully');
        }
        
        return true;

    } catch (error) {
        console.error('Error exporting floorplan:', error);
        if (typeof $('#boxinfo') !== 'undefined') {
            $('#boxinfo').html('Export failed: ' + error.message);
        }
        return false;
    }
}


// ------------------------ Floorplan Mode (view floorplan under walls) ------------------------
/**
 * Make walls translucent and trigger the same behavior as a double-click on the floorplan.
 * Useful for aligning to a background image.
 */
function enterFloorplanMode() {
    try {
        // Dim only walls layer so underlying background remains visible
        const boxWall = document.getElementById('boxwall');
        if (boxWall) {
            boxWall.setAttribute('opacity', '0.35');
            boxWall.setAttribute('pointer-events', 'none');
        }
        // Dim identified room layers similarly
        const boxRoom = document.getElementById('boxRoom');
        if (boxRoom) {
            boxRoom.setAttribute('opacity', '0.35');
            boxRoom.setAttribute('pointer-events', 'none');
        }
        const boxSurface = document.getElementById('boxSurface');
        if (boxSurface) {
            boxSurface.setAttribute('opacity', '0.35');
            boxSurface.setAttribute('pointer-events', 'none');
        }

        // If a background image exists, show its tools (equivalent to double-clicking the image)
        const bgImg = document.getElementById('backgroundImage');
        if (bgImg && typeof showBackgroundImageTools === 'function') {
            showBackgroundImageTools();
        }

        window.__floorplanMode = true;
        if (typeof $ !== 'undefined') $('#boxinfo').html('Floorplan mode: walls translucent');
        // Update stored toggle button label if any
        if (window.__floorplanBtn && window.__floorplanBtn instanceof HTMLElement) {
            window.__floorplanBtn.innerText = 'Exit floorplan mode';
        }
    } catch (e) { console.error('enterFloorplanMode error:', e); }
}

/**
 * Restore normal wall opacity
 */
function exitFloorplanMode() {
    try {
        const boxWall = document.getElementById('boxwall');
        if (boxWall) {
            boxWall.setAttribute('opacity', '1');
            // Explicitly restore interactivity
            boxWall.setAttribute('pointer-events', 'auto');
        }
        // Restore room layers opacity
        const boxRoom = document.getElementById('boxRoom');
        if (boxRoom) {
            boxRoom.setAttribute('opacity', '1');
            boxRoom.setAttribute('pointer-events', 'auto');
        }
        const boxSurface = document.getElementById('boxSurface');
        if (boxSurface) {
            boxSurface.setAttribute('opacity', '1');
            boxSurface.setAttribute('pointer-events', 'auto');
        }
        // Restore binder/highlight layer
        const boxBind = document.getElementById('boxbind');
        if (boxBind) {
            boxBind.removeAttribute('display');
        }
        // Hide background image tools if visible
        if (typeof hideBackgroundImageTools === 'function') {
            hideBackgroundImageTools();
        }
        window.__floorplanMode = false;
        if (typeof $ !== 'undefined') $('#boxinfo').html('Floorplan mode: off');
        // Update stored toggle button label if any
        if (window.__floorplanBtn && window.__floorplanBtn instanceof HTMLElement) {
            window.__floorplanBtn.innerText = 'Floorplan mode';
        }
    } catch (e) { console.error('exitFloorplanMode error:', e); }
}

/**
 * Toggle floorplan mode and update button label if present
 */
function toggleFloorplanMode(btn) {
    // Remember the last-used toggle button for later label sync
    if (btn && btn instanceof HTMLElement) {
        window.__floorplanBtn = btn;
    }
    const on = !!window.__floorplanMode;
    if (on) {
        exitFloorplanMode();
        if (btn && btn instanceof HTMLElement) btn.innerText = 'Floorplan mode';
    } else {
        enterFloorplanMode();
        if (btn && btn instanceof HTMLElement) btn.innerText = 'Exit floorplan mode';
    }
}

/**
 * Toggle scaling mode and update button label if present
 */
function toggleScalingMode(btn) {
    // Remember the last-used toggle button for later label sync
    if (btn && btn instanceof HTMLElement) {
        window.__scalingBtn = btn;
    }
    const on = !!window.__scalingMode;
    if (on) {
        exitScalingMode();
        if (btn && btn instanceof HTMLElement) btn.innerText = 'Scaling mode';
    } else {
        enterScalingMode();
        if (btn && btn instanceof HTMLElement) btn.innerText = 'Exit scaling mode';
    }
}

/**
 * Enter scaling mode - show scaling panel and calculate current dimensions
 */
function enterScalingMode() {
    try {
        window.__scalingMode = true;
        
        // Hide other panels
        $('.leftBox').hide();
        $('#scalingTools').show();
        
        // Calculate current floorplan dimensions and store original state
        const bounds = calculateFloorplanBounds();
        const currentWidth = bounds.width;
        const currentHeight = bounds.height;
        
        console.log('Calculated bounds:', bounds);
        console.log('WALLS array:', WALLS);
        
        // Store original dimensions and bounds for reference
        window.__originalDimensions = { width: currentWidth, height: currentHeight };
        window.__originalBounds = bounds;
        
        // Store original wall coordinates for proper scaling
        if (WALLS && WALLS.length > 0) {
            window.__originalWalls = WALLS.map(wall => ({...wall}));
        } else {
            console.warn('No walls found for scaling');
            window.__originalWalls = [];
        }
        
        // Store original furniture positions if they exist
        if (window.OBJDATA) {
            window.__originalObjData = window.OBJDATA.map(obj => ({...obj}));
        }
        
        // Store relative positions of doors/windows on their walls
        if (OBJDATA) {
            window.__originalObjWallPositions = OBJDATA.map(obj => {
                if (typeof editor !== 'undefined' && editor.rayCastingWalls) {
                    const wallBind = editor.rayCastingWalls(obj, WALLS);
                    if (wallBind && wallBind.length > 0) {
                        const wall = wallBind.length > 1 ? wallBind[wallBind.length - 1] : wallBind[0];
                        if (wall) {
                            // Calculate relative position along wall (0 = start, 1 = end)
                            const wallLength = qSVG.measure(wall.start.x, wall.start.y, wall.end.x, wall.end.y);
                            const objDistFromStart = qSVG.measure(wall.start.x, wall.start.y, obj.x, obj.y);
                            const relativePos = wallLength > 0 ? objDistFromStart / wallLength : 0;
                            
                            return {
                                wallIndex: WALLS.indexOf(wall),
                                relativePosition: relativePos,
                                originalSize: obj.size,
                                originalThick: obj.thick
                            };
                        }
                    }
                }
                return null;
            });
        }
        
        // Store aspect ratio for maintaining proportions
        window.__originalAspectRatio = currentWidth / currentHeight;
        
        // Use setTimeout to ensure DOM elements are accessible after panel is shown
        setTimeout(() => {
            // Use bounds calculation instead of measurement ribbons for more accurate dimensions
            const bounds = calculateFloorplanBounds();
            const widthInMeters = (bounds.width / meter);
            const heightInMeters = (bounds.height / meter);
            
            const widthInput = document.getElementById('floorplanWidth');
            const heightInput = document.getElementById('floorplanHeight');
            const originalDimSpan = document.getElementById('originalDimensions');
            const scaleFactorSpan = document.getElementById('scaleFactor');
            
            if (widthInput && heightInput && originalDimSpan && scaleFactorSpan) {
                // Round to match displayed measurements precision
                const displayWidth = Math.round(widthInMeters);
                const displayHeight = Math.round(heightInMeters);
                
                widthInput.value = displayWidth;
                heightInput.value = displayHeight;
                originalDimSpan.textContent = `${displayWidth}m × ${displayHeight}m`;
                scaleFactorSpan.textContent = '1.0';
                
                // Store exact dimensions for scaling calculations
                window.__originalDimensions = { 
                    width: bounds.width, 
                    height: bounds.height 
                };
                
                console.log('Set input values from bounds calculation:', displayWidth, displayHeight);
            } else {
                console.error('Could not find scaling UI elements');
            }
        }, 500); // Increased delay to ensure measurements are rendered
        
        // Update button text
        if (window.__scalingBtn) {
            window.__scalingBtn.innerText = 'Exit scaling mode';
        }
        
        console.log('Entered scaling mode. Current dimensions:', currentWidth, 'x', currentHeight);
    } catch (e) {
        console.error('enterScalingMode error:', e);
    }
}

/**
 * Exit scaling mode - hide scaling panel and return to normal mode
 */
function exitScalingMode() {
    try {
        window.__scalingMode = false;
        
        // Hide scaling panel
        $('#scalingTools').hide();
        
        // Show main panel
        $('#panel').show();
        
        // Update button text
        if (window.__scalingBtn) {
            window.__scalingBtn.innerText = 'Scaling mode';
        }
        
        // Clear stored dimensions and original data
        delete window.__originalDimensions;
        delete window.__originalBounds;
        delete window.__originalWalls;
        delete window.__originalObjData;
        delete window.__originalAspectRatio;
        
        console.log('Exited scaling mode');
    } catch (e) {
        console.error('exitScalingMode error:', e);
    }
}

/**
 * Calculate current floorplan bounds based on walls (no padding)
 */
function calculateFloorplanBounds() {
    if (!WALLS || WALLS.length === 0) {
        return { width: 600, height: 400, minX: 0, minY: 0, maxX: 600, maxY: 400 };
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Find bounds from all wall coordinates (walls are objects with start/end properties)
    WALLS.forEach(wall => {
        if (wall && wall.start && wall.end) {
            const x1 = wall.start.x;
            const y1 = wall.start.y;
            const x2 = wall.end.x;
            const y2 = wall.end.y;
            minX = Math.min(minX, x1, x2);
            minY = Math.min(minY, y1, y2);
            maxX = Math.max(maxX, x1, x2);
            maxY = Math.max(maxY, y1, y2);
        }
    });
    
    // Handle case where no valid walls found
    if (minX === Infinity) {
        return { width: 600, height: 400, minX: 0, minY: 0, maxX: 600, maxY: 400 };
    }
    
    return {
        width: maxX - minX,
        height: maxY - minY,
        minX: minX,
        minY: minY,
        maxX: maxX,
        maxY: maxY
    };
}

/**
 * Update floorplan width while maintaining aspect ratio
 */
function updateFloorplanWidth() {
    if (!window.__scalingMode) return;
    
    try {
        const newWidthM = parseFloat(document.getElementById('floorplanWidth').value);
        
        if (isNaN(newWidthM) || newWidthM <= 0) {
            return;
        }
        
        // Calculate current floorplan bounds
        const currentBounds = calculateFloorplanBounds();
        const currentWidthM = currentBounds.width / meter;
        const currentHeightM = currentBounds.height / meter;
        
        // Calculate scale factor based on width change
        const scaleFactor = newWidthM / currentWidthM;
        
        // Update height to maintain aspect ratio (both dimensions scale by same factor)
        const newHeightM = currentHeightM * scaleFactor;
        document.getElementById('floorplanHeight').value = newHeightM.toFixed(1);
        
        // Update scale factor display
        document.getElementById('scaleFactor').textContent = scaleFactor.toFixed(2);
        
        // Apply uniform scaling to all elements (same factor for X and Y)
        scaleAllElementsUniformly(scaleFactor);
        
    } catch (e) {
        console.error('updateFloorplanWidth error:', e);
    }
}

/**
 * Update floorplan height while maintaining aspect ratio
 */
function updateFloorplanHeight() {
    if (!window.__scalingMode) return;
    
    try {
        const newHeightM = parseFloat(document.getElementById('floorplanHeight').value);
        
        if (isNaN(newHeightM) || newHeightM <= 0) {
            return;
        }
        
        // Calculate current floorplan bounds
        const currentBounds = calculateFloorplanBounds();
        const currentWidthM = currentBounds.width / meter;
        const currentHeightM = currentBounds.height / meter;
        
        // Calculate scale factor based on height change
        const scaleFactor = newHeightM / currentHeightM;
        
        // Update width to maintain aspect ratio (both dimensions scale by same factor)
        const newWidthM = currentWidthM * scaleFactor;
        document.getElementById('floorplanWidth').value = newWidthM.toFixed(1);
        
        // Update scale factor display
        document.getElementById('scaleFactor').textContent = scaleFactor.toFixed(2);
        
        // Apply uniform scaling to all elements (same factor for X and Y)
        scaleAllElementsUniformly(scaleFactor);
        
    } catch (e) {
        console.error('updateFloorplanHeight error:', e);
    }
}

/**
 * Scale all elements uniformly by the given factor (maintains shape)
 */
function scaleAllElementsUniformly(scaleFactor) {
    try {
        // Calculate bounds and origin point for rigid scaling
        const bounds = calculateFloorplanBounds();
        const originX = bounds.minX;
        const originY = bounds.minY;
        
        console.log('Rigid scaling by factor:', scaleFactor, 'Origin:', originX, originY);
        
        WALLS.forEach(wall => {
            // Scale from fixed origin point (top-left) to maintain wall angles
            wall.start.x = originX + (wall.start.x - originX) * scaleFactor;
            wall.start.y = originY + (wall.start.y - originY) * scaleFactor;
            
            wall.end.x = originX + (wall.end.x - originX) * scaleFactor;
            wall.end.y = originY + (wall.end.y - originY) * scaleFactor;
        });
        
        // Restore doors/windows to their exact relative positions on scaled walls
        if (OBJDATA && window.__originalObjWallPositions) {
            OBJDATA.forEach((obj, index) => {
                const wallPos = window.__originalObjWallPositions[index];
                if (wallPos && wallPos.wallIndex >= 0 && WALLS[wallPos.wallIndex]) {
                    const wall = WALLS[wallPos.wallIndex];
                    
                    // Scale size properties
                    if (wallPos.originalSize !== undefined) {
                        obj.size = wallPos.originalSize * scaleFactor;
                    }
                    if (wallPos.originalThick !== undefined) {
                        obj.thick = wallPos.originalThick * scaleFactor;
                    }
                    
                    // Calculate new position based on relative position along scaled wall
                    const wallLength = qSVG.measure(wall.start.x, wall.start.y, wall.end.x, wall.end.y);
                    const distFromStart = wallLength * wallPos.relativePosition;
                    
                    // Position object at exact relative position on wall
                    const wallAngle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
                    obj.x = wall.start.x + Math.cos(wallAngle) * distFromStart;
                    obj.y = wall.start.y + Math.sin(wallAngle) * distFromStart;
                    
                    // Recalculate limits for the new position and size
                    if (wall.equations && typeof limitObj === 'function') {
                        const newLimits = limitObj(wall.equations.base, obj.size, obj);
                        if (Array.isArray(newLimits) && newLimits.length >= 2) {
                            obj.limit = newLimits;
                        }
                    }
                }
            });
        }
        
        // Scale furniture from fixed origin point
        if (window.OBJDATA) {
            window.OBJDATA.forEach(obj => {
                if (obj) {
                    // Scale position from fixed origin point
                    obj.x = originX + (obj.x - originX) * scaleFactor;
                    obj.y = originY + (obj.y - originY) * scaleFactor;
                    
                    // Scale furniture size
                    if (obj.size !== undefined) {
                        obj.size = obj.size * scaleFactor;
                    }
                }
            });
        }
        
        // Clear all visual elements first
        $('#boxcarpentry').empty();
        $('#boxRib').empty();
        
        // Rebuild walls with new coordinates - this triggers wall equations recalculation
        if (typeof editor !== 'undefined' && editor.architect) {
            editor.architect(WALLS);
        }
        
        // Rebuild rooms with new wall positions
        if (typeof editor !== 'undefined' && editor.make_rooms) {
            editor.make_rooms();
        }
        
        // Rebuild all objects (doors, windows, furniture) with updated positions
        if (OBJDATA) {
            OBJDATA.forEach(obj => {
                if (obj && obj.update) {
                    obj.update();
                    if (obj.graph) {
                        $('#boxcarpentry').append(obj.graph);
                    }
                }
            });
        }
        
        // Rebuild furniture if it exists in window.OBJDATA
        if (window.OBJDATA) {
            window.OBJDATA.forEach(obj => {
                if (obj && obj.update) {
                    obj.update();
                    if (obj.graph) {
                        $('#boxcarpentry').append(obj.graph);
                    }
                }
            });
        }
        
        // Rebuild all measurements and scale bars - this updates the displayed dimensions
        if (typeof rib === 'function') {
            rib();
        }
        
        // Update individual wall measurements if available
        WALLS.forEach(wall => {
            if (typeof inWallRib === 'function') {
                inWallRib(wall, true); // true = append mode, don't clear existing
            }
        });
        
        // Update the top-level total width/height scale bars
        if (typeof editor !== 'undefined' && editor.showScaleBox) {
            editor.showScaleBox();
        }
        
        // Force save the new state
        if (typeof save === 'function') {
            save();
        }
        
    } catch (e) {
        console.error('scaleAllElementsUniformly error:', e);
    }
}

/**
 * Get the actual displayed dimensions by checking the measurement ribbons
 */
function getActualFloorplanDimensions() {
    try {
        // Look for measurement text elements that show the actual dimensions
        const ribElements = document.querySelectorAll('#boxRib text');
        let maxWidth = 0;
        let maxHeight = 0;
        
        ribElements.forEach(element => {
            const text = element.textContent;
            if (text && text.includes('.')) {
                const value = parseFloat(text);
                if (!isNaN(value)) {
                    // Determine if this is likely a width or height measurement
                    const rect = element.getBoundingClientRect();
                    if (rect.width > rect.height) {
                        maxWidth = Math.max(maxWidth, value);
                    } else {
                        maxHeight = Math.max(maxHeight, value);
                    }
                }
            }
        });
        
        // If no measurements found, fall back to bounds calculation
        if (maxWidth === 0 || maxHeight === 0) {
            const bounds = calculateFloorplanBounds();
            return {
                width: bounds.width / meter,
                height: bounds.height / meter
            };
        }
        
        return {
            width: maxWidth,
            height: maxHeight
        };
        
    } catch (e) {
        console.error('getActualFloorplanDimensions error:', e);
        const bounds = calculateFloorplanBounds();
        return {
            width: bounds.width / meter,
            height: bounds.height / meter
        };
    }
}

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
                    try { centerFloorplanView(40); } catch (e) { /* noop */ }
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
                    try { centerFloorplanView(40); } catch (e) { /* noop */ }
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

/**
 * Export floorplan data with custom options
 * @param {Object} options - Export configuration
 * @param {string} options.filename - Custom filename
 * @param {boolean} options.includeMetadata - Include metadata
 * @param {boolean} options.minified - Export minified JSON (no formatting)
 */
function exportFloorplanCustom(options = {}) {
    const {
        filename = 'floorplan_' + new Date().toISOString().slice(0, 10),
        includeMetadata = true,
        minified = false
    } = options;

    try {
        // Prepare data similar to main export function
        const wallDataForExport = [];
        for (let k in WALLS) {
            const wall = { ...WALLS[k] };
            if (wall.child != null) {
                wall.child = WALLS.indexOf(wall.child);
            }
            if (wall.parent != null) {
                wall.parent = WALLS.indexOf(wall.parent);
            }
            wallDataForExport.push(wall);
        }

        const objDataForExport = [];
        for (let k in OBJDATA) {
            const obj = { ...OBJDATA[k] };
            delete obj.graph;
            objDataForExport.push(obj);
        }

        const exportData = {
            version: "0.95",
            exportDate: new Date().toISOString(),
            data: {
                walls: wallDataForExport,
                objects: objDataForExport,
                rooms: [...ROOM]
            }
        };

        if (includeMetadata) {
            exportData.metadata = {
                totalWalls: wallDataForExport.length,
                totalObjects: objDataForExport.length,
                totalRooms: ROOM.length,
                settings: {
                    wallSize: wallSize,
                    partitionSize: partitionSize,
                    meter: meter,
                    grid: grid
                }
            };
        }

        // Create JSON with or without formatting
        const jsonString = minified ? 
            JSON.stringify(exportData) : 
            JSON.stringify(exportData, null, 2);

        // Download the file
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.json') ? filename : filename + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Restore wall references
        for (let k in WALLS) {
            if (WALLS[k].child !== null && typeof WALLS[k].child === 'number') {
                WALLS[k].child = WALLS[WALLS[k].child];
            }
            if (WALLS[k].parent !== null && typeof WALLS[k].parent === 'number') {
                WALLS[k].parent = WALLS[WALLS[k].parent];
            }
        }

        return true;

    } catch (error) {
        console.error('Error exporting floorplan:', error);
        return false;
    }
}

/**
 * Get floorplan data as JSON string (without downloading)
 * @param {boolean} includeMetadata - Whether to include metadata
 * @returns {string} JSON string of floorplan data
 */
function getFloorplanJSON(includeMetadata = true) {
    try {
        // Prepare data for JSON conversion
        const wallDataForExport = [];
        for (let k in WALLS) {
            const wall = { ...WALLS[k] };
            if (wall.child != null) {
                wall.child = WALLS.indexOf(wall.child);
            }
            if (wall.parent != null) {
                wall.parent = WALLS.indexOf(wall.parent);
            }
            wallDataForExport.push(wall);
        }

        const objDataForExport = [];
        for (let k in OBJDATA) {
            const obj = { ...OBJDATA[k] };
            delete obj.graph;
            objDataForExport.push(obj);
        }

        const exportData = {
            version: "0.95",
            exportDate: new Date().toISOString(),
            data: {
                walls: wallDataForExport,
                objects: objDataForExport,
                rooms: [...ROOM]
            }
        };

        if (includeMetadata) {
            exportData.metadata = {
                totalWalls: wallDataForExport.length,
                totalObjects: objDataForExport.length,
                totalRooms: ROOM.length
            };
        }

        // Restore wall references
        for (let k in WALLS) {
            if (WALLS[k].child !== null && typeof WALLS[k].child === 'number') {
                WALLS[k].child = WALLS[WALLS[k].child];
            }
            if (WALLS[k].parent !== null && typeof WALLS[k].parent === 'number') {
                WALLS[k].parent = WALLS[WALLS[k].parent];
            }
        }

        return JSON.stringify(exportData, null, 2);

    } catch (error) {
        console.error('Error generating floorplan JSON:', error);
        return null;
    }
}

/**
 * Import floorplan data from a JSON file
 * @param {File} file - The JSON file to import
 * @returns {Promise<boolean>} - Success status
 */
function importFloorplanJSON(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            console.error('No file provided for import');
            if (typeof $('#boxinfo') !== 'undefined') {
                $('#boxinfo').html('No file selected for import');
            }
            resolve(false);
            return;
        }

        // Check if it's a JSON file
        if (!file.name.toLowerCase().endsWith('.json')) {
            console.error('File must be a JSON file');
            if (typeof $('#boxinfo') !== 'undefined') {
                $('#boxinfo').html('Please select a JSON file');
            }
            resolve(false);
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // Validate the JSON structure
                if (!validateImportData(jsonData)) {
                    console.error('Invalid floorplan JSON format');
                    if (typeof $('#boxinfo') !== 'undefined') {
                        $('#boxinfo').html('Invalid floorplan file format');
                    }
                    resolve(false);
                    return;
                }

                // Load the data into the editor
                if (loadFloorplanData(jsonData)) {
                    console.log('Floorplan imported successfully');
                    if (typeof $('#boxinfo') !== 'undefined') {
                        $('#boxinfo').html('Floorplan imported successfully!');
                    }
                    if (typeof fonc_button === 'function') {
                        try { fonc_button('select_mode'); } catch (e) { /* noop */ }
                    }
                    resolve(true);
                } else {
                    console.error('Failed to load floorplan data');
                    if (typeof $('#boxinfo') !== 'undefined') {
                        $('#boxinfo').html('Failed to load floorplan data');
                    }
                    resolve(false);
                }
                
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                if (typeof $('#boxinfo') !== 'undefined') {
                    $('#boxinfo').html('Error reading file: Invalid JSON');
                }
                resolve(false);
            }
        };

        reader.onerror = function() {
            console.error('Error reading file');
            if (typeof $('#boxinfo') !== 'undefined') {
                $('#boxinfo').html('Error reading file');
            }
            resolve(false);
        };

        reader.readAsText(file);
    });
}

/**
 * Validate the structure of imported JSON data
 * @param {Object} jsonData - The parsed JSON data
 * @returns {boolean} - Whether the data is valid
 */
function validateImportData(jsonData) {
    // Check for required top-level structure
    if (!jsonData || typeof jsonData !== 'object') {
        return false;
    }

    // Check for data object
    if (!jsonData.data || typeof jsonData.data !== 'object') {
        return false;
    }

    const data = jsonData.data;

    // Check for required arrays
    if (!Array.isArray(data.walls) || !Array.isArray(data.objects) || !Array.isArray(data.rooms)) {
        return false;
    }

    // Basic validation of wall structure
    for (let wall of data.walls) {
        if (!wall.start || !wall.end || typeof wall.thick === 'undefined') {
            return false;
        }
        if (typeof wall.start.x === 'undefined' || typeof wall.start.y === 'undefined' ||
            typeof wall.end.x === 'undefined' || typeof wall.end.y === 'undefined') {
            return false;
        }
    }

    return true;
}

/**
 * Load floorplan data into the editor
 * @param {Object} jsonData - The validated JSON data
 * @returns {boolean} - Success status
 */
function loadFloorplanData(jsonData) {
    try {
        // Clear existing data
        clearCurrentFloorplan();

        const data = jsonData.data;

        // Load walls
        WALLS = [];
        for (let wallData of data.walls) {
            WALLS.push(wallData);
        }

        // Restore wall parent/child references from indices
        for (let k in WALLS) {
            if (WALLS[k].child !== null && typeof WALLS[k].child === 'number') {
                WALLS[k].child = WALLS[WALLS[k].child];
            }
            if (WALLS[k].parent !== null && typeof WALLS[k].parent === 'number') {
                WALLS[k].parent = WALLS[WALLS[k].parent];
            }
        }

        // Load rooms
        ROOM = [];
        for (let roomData of data.rooms) {
            ROOM.push(roomData);
        }

        // Load objects
        OBJDATA = [];
        for (let objData of data.objects) {
            try {
                // Recreate the object using the editor's obj2D constructor
                let obj = new editor.obj2D(
                    objData.family || 'free',
                    objData.class || 'furniture',
                    objData.type || 'default',
                    { x: objData.x || 0, y: objData.y || 0 },
                    objData.angle || 0,
                    objData.angleSign || 0,
                    objData.size || 60,
                    objData.hinge || 'normal',
                    objData.thick || 20,
                    objData.value || null
                );
                
                // Restore additional properties
                if (objData.limit) obj.limit = objData.limit;
                
                OBJDATA.push(obj);
                
                // Add to appropriate SVG container
                if (obj.class === 'energy') {
                    $('#boxEnergy').append(obj.graph);
                } else {
                    $('#boxcarpentry').append(obj.graph);
                }
                
                obj.update();
            } catch (objError) {
                console.warn('Failed to load object:', objData, objError);
                // Continue loading other objects even if one fails
            }
        }

        // Rebuild the visual representation
        if (typeof editor !== 'undefined' && editor.architect) {
            editor.architect(WALLS);
        }
        
        if (typeof editor !== 'undefined' && editor.showScaleBox) {
            editor.showScaleBox();
        }
        
        if (typeof rib === 'function') {
            rib();
        }

        // Save the imported state to history.
        // Suppress save if background image element is not present but previous snapshot had one.
        if (typeof save === 'function') {
            try { if (typeof window !== 'undefined') window.__suppressSaveIfNoBg = true; } catch(_) {}
            save();
        }

        return true;
        
    } catch (error) {
        console.error('Error loading floorplan data:', error);
        return false;
    }
}

/**
 * Clear the current floorplan data
 */
function clearCurrentFloorplan() {
    try {
        // Clear objects and their SVG elements
        for (let k in OBJDATA) {
            if (OBJDATA[k].graph && OBJDATA[k].graph.remove) {
                OBJDATA[k].graph.remove();
            }
        }
        OBJDATA = [];

        // Clear walls
        WALLS = [];

        // Clear rooms
        ROOM = [];

        // Clear SVG containers
        if (typeof $ !== 'undefined') {
            $('#boxwall').empty();
            $('#boxcarpentry').empty();
            $('#boxEnergy').empty();
            $('#boxRoom').empty();
            $('#boxArea').empty();
            $('#boxRib').empty();
            $('#boxText').empty();
        }
        
    } catch (error) {
        console.error('Error clearing floorplan:', error);
    }
}

/**
 * Trigger file input dialog for importing
 */
function triggerImportDialog() {
    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            importFloorplanJSON(file).then(success => {
                // Clean up the temporary input element
                document.body.removeChild(fileInput);
            });
        } else {
            document.body.removeChild(fileInput);
        }
    });
    
    // Add to DOM and trigger click
    document.body.appendChild(fileInput);
    fileInput.click();
}

/**
 * Import an image file as background layer
 * @param {File} file - The image file to import
 * @returns {Promise<boolean>} - Success status
 */
function importBackgroundImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            console.error('No file provided for image import');
            if (typeof $('#boxinfo') !== 'undefined') {
                $('#boxinfo').html('No image file selected');
            }
            resolve(false);
            return;
        }

        // Check if it's an image file
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        const validExtensions = ['.png', '.jpg', '.jpeg'];
        const fileName = file.name.toLowerCase();
        
        if (!validTypes.includes(file.type) && !validExtensions.some(ext => fileName.endsWith(ext))) {
            console.error('File must be a PNG or JPG image');
            if (typeof $('#boxinfo') !== 'undefined') {
                $('#boxinfo').html('Please select a PNG or JPG image file');
            }
            resolve(false);
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const imageDataUrl = e.target.result;
                
                // Add the image as a background layer
                if (addBackgroundImage(imageDataUrl, file.name)) {
                    console.log('Background image imported successfully');
                    if (typeof $('#boxinfo') !== 'undefined') {
                        $('#boxinfo').html('Background image imported successfully!');
                    }
                    // Update UI: show filename and enable Floorplan mode button
                    try {
                        const nameEl = document.getElementById('floorplan_filename');
                        if (nameEl) nameEl.textContent = file.name || '';
                        const btn = document.getElementById('floorplan_mode_btn');
                        if (btn) btn.disabled = false;
                    } catch(_) {}
                    resolve(true);
                } else {
                    console.error('Failed to add background image');
                    if (typeof $('#boxinfo') !== 'undefined') {
                        $('#boxinfo').html('Failed to add background image');
                    }
                    resolve(false);
                }
                
            } catch (error) {
                console.error('Error processing image file:', error);
                if (typeof $('#boxinfo') !== 'undefined') {
                    $('#boxinfo').html('Error processing image file');
                }
                resolve(false);
            }
        };

        reader.onerror = function() {
            console.error('Error reading image file');
            if (typeof $('#boxinfo') !== 'undefined') {
                $('#boxinfo').html('Error reading image file');
            }
            resolve(false);
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Add an image as a background layer to the SVG
 * @param {string} imageDataUrl - The data URL of the image
 * @param {string} fileName - The original filename
 * @returns {boolean} - Success status
 */
function addBackgroundImage(imageDataUrl, fileName) {
    try {
        // Capture existing image geometry if same image is being reloaded
        let previousGeometry = null;
        try {
            const existingEl = document.getElementById('backgroundImage');
            if (existingEl) {
                const prevHref = existingEl.getAttribute('href') || existingEl.getAttribute('xlink:href') || '';
                if (prevHref && imageDataUrl && prevHref === imageDataUrl) {
                    previousGeometry = {
                        x: parseFloat(existingEl.getAttribute('x')) || 0,
                        y: parseFloat(existingEl.getAttribute('y')) || 0,
                        width: parseFloat(existingEl.getAttribute('width')) || 0,
                        height: parseFloat(existingEl.getAttribute('height')) || 0,
                        opacity: parseFloat(existingEl.getAttribute('opacity'))
                    };
                    if (typeof console !== 'undefined' && console.debug) {
                        console.debug('[addBackgroundImage] preserving previous geometry for same image', previousGeometry);
                    }
                }
            }
        } catch (_) {}

        // Remove any existing background image
        removeBackgroundImage();
        
        // Create an image element in the SVG
        const svgElement = document.getElementById('lin');
        if (!svgElement) {
            console.error('SVG element not found');
            return false;
        }

        // Create image element
        const imageElement = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        imageElement.setAttribute('id', 'backgroundImage');
        
        // Add double-click event handler
        imageElement.addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showBackgroundImageTools();
        });
        
        // Add drag functionality
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let imageStartX = 0;
        let imageStartY = 0;
        
        imageElement.addEventListener('mousedown', function(e) {
            // Only enable dragging when background image tools are visible
            if (!document.getElementById('backgroundImageTools').style.display || 
                document.getElementById('backgroundImageTools').style.display === 'none') {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            isDragging = true;
            window.draggingBackgroundImage = true; // inform engine to pause scene panning
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            imageStartX = parseFloat(imageElement.getAttribute('x')) || 0;
            imageStartY = parseFloat(imageElement.getAttribute('y')) || 0;
            
            imageElement.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            
            const newX = imageStartX + deltaX;
            const newY = imageStartY + deltaY;
            
            imageElement.setAttribute('x', newX);
            imageElement.setAttribute('y', newY);
        });
        
        document.addEventListener('mouseup', function(e) {
            if (isDragging) {
                isDragging = false;
                window.draggingBackgroundImage = false;
                updateImageCursor();
            }
        });
        
        // Function to update cursor based on tools panel visibility
        function updateImageCursor() {
            const toolsPanel = document.getElementById('backgroundImageTools');
            if (toolsPanel && toolsPanel.style.display !== 'none' && 
                window.getComputedStyle(toolsPanel).display !== 'none') {
                imageElement.style.cursor = 'grab';
            } else {
                imageElement.style.cursor = 'pointer';
            }
        }
        
        // Store the cursor update function for later use
        imageElement.updateCursor = updateImageCursor;
        
        // Set initial cursor
        updateImageCursor();
        
        // Do not show default size/position; wait for intrinsic probe to set them
        // Keep preserveAspectRatio but hide initially to avoid flashing at 0,0 1100x700
        imageElement.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        imageElement.setAttribute('opacity', '0'); // will be restored after sizing
        // Mark that background image sizing is in progress to avoid premature snapshotting
        try { if (typeof window !== 'undefined') window.__bgSizing = true; } catch(_) {}
        
        // Add to the SVG, but after the grid and before other elements
        const boxGrid = document.getElementById('boxgrid');
        if (boxGrid && boxGrid.nextSibling) {
            svgElement.insertBefore(imageElement, boxGrid.nextSibling);
        } else {
            // Fallback: add as first child after defs
            const defs = svgElement.querySelector('defs');
            if (defs && defs.nextSibling) {
                svgElement.insertBefore(imageElement, defs.nextSibling);
            } else {
                svgElement.insertBefore(imageElement, svgElement.firstChild);
            }
        }
        
        // Attach a MutationObserver to trace attribute changes on the background image
        try {
            if (window._bgImgObserver) {
                try { window._bgImgObserver.disconnect(); } catch(_) {}
            }
            const attrsToWatch = ['x','y','width','height','opacity','href','xlink:href'];
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(m => {
                    if (m.type === 'attributes') {
                        const name = m.attributeName;
                        if (attrsToWatch.includes(name)) {
                            const newVal = imageElement.getAttribute(name) || imageElement.getAttributeNS('http://www.w3.org/1999/xlink', name) || null;
                            const oldVal = m.oldValue;
                            if (typeof console !== 'undefined') {
                                console.debug('[bgImage observe]', { name, oldVal, newVal });
                                if (console.trace) console.trace('[bgImage attribute changed]');
                            }
                        }
                    }
                });
            });
            observer.observe(imageElement, { attributes: true, attributeOldValue: true, attributeFilter: attrsToWatch });
            window._bgImgObserver = observer;
        } catch(_) { /* ignore observer errors */ }

        
        // Use the uploaded image's intrinsic size to set initial SVG image dimensions
        // so landscape/portrait are respected, and center it within the 1100x700 viewBox
        try {
            const probe = new Image();
            probe.onload = function() {
                const natW = probe.naturalWidth || 1100;
                const natH = probe.naturalHeight || 700;
                // Establish base viewBox size (SVG is 1100x700)
                const baseW = 1100;
                const baseH = 700;
                // Compute initial size preserving aspect ratio to fit within viewBox
                const scale = Math.min(baseW / natW, baseH / natH);
                const w = Math.max(1, Math.round(natW * scale));
                const h = Math.max(1, Math.round(natH * scale));
                // Centered position
                const cx = Math.round((baseW - w) / 2);
                const cy = Math.round((baseH - h) / 2);

                // Apply geometry; if reloading same image, preserve previous geometry
                if (previousGeometry) {
                    const pw = previousGeometry.width > 0 ? previousGeometry.width : w;
                    const ph = previousGeometry.height > 0 ? previousGeometry.height : h;
                    const px = previousGeometry.x != null ? previousGeometry.x : cx;
                    const py = previousGeometry.y != null ? previousGeometry.y : cy;
                    imageElement.setAttribute('width', String(pw));
                    imageElement.setAttribute('height', String(ph));
                    imageElement.setAttribute('x', String(px));
                    imageElement.setAttribute('y', String(py));
                } else {
                    imageElement.setAttribute('width', String(w));
                    imageElement.setAttribute('height', String(h));
                    imageElement.setAttribute('x', String(cx));
                    imageElement.setAttribute('y', String(cy));
                }
                if (imageElement.dataset) {
                    const naturalAspect = natW / natH;
                    imageElement.dataset.naturalAspect = String(naturalAspect);
                    imageElement.dataset.aspectRatio = String(naturalAspect);
                }
                // Update stored reference geometry if present
                if (window.currentBackgroundImage) {
                    window.currentBackgroundImage.x = cx;
                    window.currentBackgroundImage.y = cy;
                    window.currentBackgroundImage.width = w;
                    window.currentBackgroundImage.height = h;
                }
                if (typeof console !== 'undefined' && console.debug) {
                    console.debug('[addBackgroundImage] sized & centered', { natW, natH, baseW, baseH, w, h, cx, cy });
                }
                // Now set the image source; this will paint with the correct geometry
                imageElement.setAttribute('href', imageDataUrl);
                imageElement.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imageDataUrl);
                // Reveal now that proper size/position are applied
                imageElement.setAttribute('opacity', String(previousGeometry && previousGeometry.opacity != null ? previousGeometry.opacity : 0.7));

                // If we didn't capture previousGeometry from an existing element, try restoring
                // geometry from the most recent HISTORY snapshot that matches this image by href or fileName.
                try {
                    if (!previousGeometry && typeof localStorage !== 'undefined') {
                        const histStr = localStorage.getItem('history');
                        if (histStr) {
                            const histArr = JSON.parse(histStr);
                            for (let i = histArr.length - 1; i >= 0; i--) {
                                try {
                                    const snap = JSON.parse(histArr[i]);
                                    if (snap && snap.backgroundImage) {
                                        const hrefMatch = (snap.backgroundImage.href === imageDataUrl);
                                        const nameMatch = (fileName && snap.backgroundImage.fileName && String(fileName).toLowerCase() === String(snap.backgroundImage.fileName).toLowerCase());
                                        if (hrefMatch || nameMatch) {
                                        const props = snap.backgroundImage;
                                        if (props.width != null) imageElement.setAttribute('width', props.width);
                                        if (props.height != null) imageElement.setAttribute('height', props.height);
                                        if (props.x != null) imageElement.setAttribute('x', props.x);
                                        if (props.y != null) imageElement.setAttribute('y', props.y);
                                        if (props.opacity != null) imageElement.setAttribute('opacity', props.opacity);
                                        if (typeof console !== 'undefined' && console.debug) {
                                            console.debug('[addBackgroundImage] restored geometry from HISTORY snapshot', { hrefMatch, nameMatch });
                                        }
                                        break;
                                        }
                                    }
                                } catch(_) { /* skip malformed entry */ }
                            }
                        }
                    }
                } catch(_) { /* ignore history restore errors */ }

                // Persist correct geometry now that it's set
                try {
                    // Clear sizing guard before saving so save() proceeds
                    if (typeof window !== 'undefined') window.__bgSizing = false;
                    if (typeof save === 'function') save();
                } catch(_) { /* ignore */ }

                // If the background image tools are open, refresh their fields to reflect new geometry
                try {
                    const tools = document.getElementById('backgroundImageTools');
                    const visible = tools && tools.style.display !== 'none' && window.getComputedStyle(tools).display !== 'none';
                    if (visible && typeof showBackgroundImageTools === 'function') {
                        showBackgroundImageTools();
                    }
                } catch(_) { /* ignore */ }
            };
            probe.src = imageDataUrl;
        } catch (e) {
            console.warn('Could not derive intrinsic image size:', e);
            try { if (typeof window !== 'undefined') window.__bgSizing = false; } catch(_) {}
        }

        // Store reference for later manipulation
        window.currentBackgroundImage = {
            element: imageElement,
            fileName: fileName,
            dataUrl: imageDataUrl
        };

        // Update UI: set filename display and enable Floorplan mode button
        try {
            const nameEl = document.getElementById('floorplan_filename');
            if (nameEl) nameEl.textContent = fileName || '';
            const btn = document.getElementById('floorplan_mode_btn');
            if (btn) btn.disabled = false;
        } catch(_) {}

        return true;
        
    } catch (error) {
        console.error('Error adding background image:', error);
        return false;
    }
}

/**
 * Remove the current background image
 */
function removeBackgroundImage() {
    try {
        const existingImage = document.getElementById('backgroundImage');
        if (existingImage) {
            existingImage.remove();
        }
        
        // Clear the reference
        if (window.currentBackgroundImage) {
            delete window.currentBackgroundImage;
        }

        // Update UI: clear filename, disable Floorplan mode button, and exit mode if active
        try {
            const nameEl = document.getElementById('floorplan_filename');
            if (nameEl) nameEl.textContent = '';
            const btn = document.getElementById('floorplan_mode_btn');
            if (btn) {
                btn.disabled = true;
                btn.innerText = 'Floorplan mode';
            }
            if (window.__floorplanMode && typeof exitFloorplanMode === 'function') {
                exitFloorplanMode();
            }
        } catch(_) {}
    } catch (error) {
        console.error('Error removing background image:', error);
    }
}

/**
 * Trigger file input dialog for importing background images
 */
function triggerImageImportDialog() {
    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png,image/jpeg,image/jpg,.png,.jpg,.jpeg';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            importBackgroundImage(file).then(success => {
                // Clean up the temporary input element
                document.body.removeChild(fileInput);
            });
        } else {
            document.body.removeChild(fileInput);
        }
    });
    
    // Add to DOM and trigger click
    document.body.appendChild(fileInput);
    fileInput.click();
}

/**
 * Adjust background image properties
 * @param {Object} properties - Properties to adjust (x, y, width, height, opacity)
 */
function adjustBackgroundImage(properties) {
    try {
        const imageElement = document.getElementById('backgroundImage');
        if (!imageElement) {
            console.warn('No background image to adjust');
            return false;
        }
        try { if (console && console.debug) console.debug('[adjustBackgroundImage] input', properties); } catch(_) {}
        const keys = ['x', 'y', 'width', 'height', 'opacity'];
        keys.forEach(key => {
            if (properties[key] !== undefined) imageElement.setAttribute(key, properties[key]);
        });
        try {
            if (console && console.debug) {
                console.debug('[adjustBackgroundImage] applied', {
                    x: imageElement.getAttribute('x'),
                    y: imageElement.getAttribute('y'),
                    width: imageElement.getAttribute('width'),
                    height: imageElement.getAttribute('height'),
                    opacity: imageElement.getAttribute('opacity')
                });
            }
        } catch(_) {}
        return true;
        
    } catch (error) {
        console.error('Error adjusting background image:', error);
        return false;
    }
}

/**
 * Show the background image tools panel
 */
function showBackgroundImageTools() {
    try {
        const imageElement = document.getElementById('backgroundImage');
        if (!imageElement) {
            console.warn('No background image found');
            return;
        }
        
        // Hide other panels and show background image tools
        $('.leftBox').hide();
        $('#backgroundImageTools').show(200);
        
        // Initialize size inputs based on current image properties
        const currentWidthPx = parseFloat(imageElement.getAttribute('width')) || 1100;
        const currentHeightPx = parseFloat(imageElement.getAttribute('height')) || 700;
        const currentOpacity = parseFloat(imageElement.getAttribute('opacity')) || 0.7;

        // Prefer intrinsic aspect ratio if available
        let aspect = undefined;
        if (imageElement.dataset && imageElement.dataset.aspectRatio) {
            aspect = parseFloat(imageElement.dataset.aspectRatio);
        }
        if (!isFinite(aspect) || aspect <= 0) {
            aspect = (currentWidthPx > 0 && currentHeightPx > 0)
                ? (currentWidthPx / currentHeightPx)
                : (1100 / 700);
            if (imageElement.dataset) imageElement.dataset.aspectRatio = String(aspect);
        }

        const pxPerMeter = 60; // editor scale
        const widthMInput = document.getElementById('backgroundImageWidthM');
        const heightMInput = document.getElementById('backgroundImageHeightM');
        const aspectInfo = document.getElementById('backgroundImageAspectInfo');

        if (widthMInput) widthMInput.value = (currentWidthPx / pxPerMeter).toFixed(2);
        if (heightMInput) heightMInput.value = (currentHeightPx / pxPerMeter).toFixed(2);
        if (aspectInfo) aspectInfo.textContent = `Aspect ratio: ${(aspect).toFixed(4)} (W/H)`;

        // Bind input handlers to maintain aspect ratio
        if (widthMInput) {
            widthMInput.oninput = function(e) {
                const img = document.getElementById('backgroundImage');
                if (!img) return;
                const curX = parseFloat(img.getAttribute('x')) || 0;
                const curY = parseFloat(img.getAttribute('y')) || 0;
                const ar = parseFloat(img.dataset.aspectRatio) || aspect;
                const wM = parseFloat(e.target.value);
                if (!isFinite(wM) || wM <= 0) return;
                const wPx = wM * pxPerMeter;
                const hPx = wPx / ar;
                img.setAttribute('width', String(wPx));
                img.setAttribute('height', String(hPx));
                img.setAttribute('x', String(curX));
                img.setAttribute('y', String(curY));
                if (heightMInput) heightMInput.value = (hPx / pxPerMeter).toFixed(2);
            };
        }
        if (heightMInput) {
            heightMInput.oninput = function(e) {
                const img = document.getElementById('backgroundImage');
                if (!img) return;
                const curX = parseFloat(img.getAttribute('x')) || 0;
                const curY = parseFloat(img.getAttribute('y')) || 0;
                const ar = parseFloat(img.dataset.aspectRatio) || aspect;
                const hM = parseFloat(e.target.value);
                if (!isFinite(hM) || hM <= 0) return;
                const hPx = hM * pxPerMeter;
                const wPx = hPx * ar;
                img.setAttribute('width', String(wPx));
                img.setAttribute('height', String(hPx));
                img.setAttribute('x', String(curX));
                img.setAttribute('y', String(curY));
                if (widthMInput) widthMInput.value = (wPx / pxPerMeter).toFixed(2);
            };
        }

        // Initialize opacity slider and label
        const opacityPercent = Math.round(currentOpacity * 100);
        const opacitySlider = document.getElementById('backgroundImageOpacitySlider');
        const opacityLabel = document.getElementById('backgroundImageOpacityVal');
        if (opacitySlider) opacitySlider.value = opacityPercent;
        if (opacityLabel) opacityLabel.textContent = opacityPercent;
        if (opacitySlider) {
            opacitySlider.oninput = function(e) {
                const v = parseInt(e.target.value, 10) || 70;
                setBackgroundImageOpacity(v);
                if (opacityLabel) opacityLabel.textContent = v;
            };
        }
        
        // Update info box
        if (typeof $('#boxinfo') !== 'undefined') {
            $('#boxinfo').html('Background image settings - drag to move');
        }
        
        // Update cursor to indicate draggable state
        if (imageElement.updateCursor) {
            imageElement.updateCursor();
        }
        
    } catch (error) {
        console.error('Error showing background image tools:', error);
    }
}

/**
 * Scale the background image
 * @param {number} scalePercent - Scale percentage (10-300)
 */
function scaleBackgroundImage(scalePercent) {
    try {
        const imageElement = document.getElementById('backgroundImage');
        if (!imageElement) {
            return false;
        }
        
        // Calculate new dimensions based on scale
        const baseWidth = 1100;
        const baseHeight = 700;
        const scale = scalePercent / 100;
        
        const newWidth = baseWidth * scale;
        const newHeight = baseHeight * scale;
        
        // Update image dimensions
        imageElement.setAttribute('width', newWidth);
        imageElement.setAttribute('height', newHeight);
        
        // Update the stored reference if it exists
        if (window.currentBackgroundImage) {
            window.currentBackgroundImage.scale = scale;
        }
        
        return true;
        
    } catch (error) {
        console.error('Error scaling background image:', error);
        return false;
    }
}

/**
 * Set the background image opacity
 * @param {number} opacityPercent - Opacity percentage (0-100)
 */
function setBackgroundImageOpacity(opacityPercent) {
    try {
        const imageElement = document.getElementById('backgroundImage');
        if (!imageElement) {
            return false;
        }
        
        const opacity = opacityPercent / 100;
        imageElement.setAttribute('opacity', opacity);
        
        // Update the stored reference if it exists
        if (window.currentBackgroundImage) {
            window.currentBackgroundImage.opacity = opacity;
        }
        
        return true;
        
    } catch (error) {
        console.error('Error setting background image opacity:', error);
        return false;
    }
}

/**
 * Hide the background image tools panel and update cursor
 */
function hideBackgroundImageTools() {
    try {
        // Hide the tools panel
        $('#backgroundImageTools').hide(100);
        $('#panel').show(200);
        
        // Update cursor state for the background image
        const imageElement = document.getElementById('backgroundImage');
        if (imageElement && imageElement.updateCursor) {
            imageElement.updateCursor();
        }
        
    } catch (error) {
        console.error('Error hiding background image tools:', error);
    }
}

/**
 * Export floorplan data in Blender-compatible format
 * @param {string} filename - Optional filename (without extension)
 * @param {number} wallHeight - Wall height in meters (default: 2.8)
 * @param {number} wallThickness - Wall thickness in meters (default: 0.08)
 */
function exportForBlender(filename = 'floorplan_blender', wallHeight = 2.8, wallThickness = 0.08) {
    try {
        // Initialize the Blender export data structure
        const blenderData = {
            wall_height: wallHeight,
            wall_thickness: wallThickness,
            floors: [],
            walls: [],
            doors: [],
            windows: [],
            styles: []
        };

        // First pass: collect all coordinates to calculate extents
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        // Helper function to update extents
        function updateExtents(x, y) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }

        // Calculate extents from rooms
        for (let i = 0; i < ROOM.length; i++) {
            const room = ROOM[i];
            if (room.coords && room.coords.length > 0) {
                for (let j = 0; j < room.coords.length; j++) {
                    const coord = room.coords[j];
                    const x = coord.x / 60;
                    const y = coord.y / 60;
                    updateExtents(x, y);
                }
            }
        }

        // Calculate extents from walls
        for (let i = 0; i < WALLS.length; i++) {
            const wall = WALLS[i];
            if (wall.start && wall.end) {
                updateExtents(wall.start.x / 60, wall.start.y / 60);
                updateExtents(wall.end.x / 60, wall.end.y / 60);
            }
        }

        // Calculate extents from objects (doors and windows)
        for (let i = 0; i < OBJDATA.length; i++) {
            const obj = OBJDATA[i];
            if (obj.x !== undefined && obj.y !== undefined) {
                let x = obj.x / 60;
                let y = obj.y / 60;
                
                // Apply angle-based adjustments for extent calculation
                if (obj.angle !== undefined) {
                    const angle = obj.angle;
                    if (angle === 90) {
                        x += 0.1;
                    } else if (angle === 270) {
                        x -= 0.1;
                    } else if (angle === 180) {
                        y += 0.1;
                    } else if (angle === 0) {
                        y -= 0.1;
                    }
                }
                
                // Only include doors and windows in extent calculation
                if (obj.type === 'door' || obj.type === 'doorDouble' || obj.type === 'doorSliding' || obj.type === 'simple' ||
                    obj.type === 'window' || obj.type === 'windowDouble' || obj.type === 'windowBay' || obj.type === 'fix') {
                    updateExtents(x, y);
                }
            }
        }

        // Calculate extents from furniture items
        if (typeof FURNITURE_ITEMS !== 'undefined' && Array.isArray(FURNITURE_ITEMS)) {
            for (let i = 0; i < FURNITURE_ITEMS.length; i++) {
                const furniture = FURNITURE_ITEMS[i];
                if (furniture.x !== undefined && furniture.y !== undefined) {
                    const x = furniture.x / 60;
                    const y = furniture.y / 60;
                    updateExtents(x, y);
                }
            }
        }

        // Calculate center offset
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        console.log(`Floorplan extents: X[${minX.toFixed(2)}, ${maxX.toFixed(2)}], Y[${minY.toFixed(2)}, ${maxY.toFixed(2)}]`);
        console.log(`Center offset: [${centerX.toFixed(2)}, ${centerY.toFixed(2)}]`);

        // Convert rooms to floors array
        // Each room becomes an object with materials and a polygon of [x, y] coordinates
        for (let i = 0; i < ROOM.length; i++) {
            const room = ROOM[i];
            if (room.coords && room.coords.length > 0) {
                const roomPolygon = [];
                for (let j = 0; j < room.coords.length; j++) {
                    const coord = room.coords[j];
                    // Convert from editor coordinates to Blender coordinates and center around (0,0)
                    // Scale down from pixels to meters (assuming 60 pixels = 1 meter based on grid)
                    const x = parseFloat(((coord.x / 60) - centerX).toFixed(2));
                    const y = parseFloat(((coord.y / 60) - centerY).toFixed(2));
                    roomPolygon.push([x, y]);
                }
                // Ensure polygon is closed (last point equals first)
                if (roomPolygon.length > 0) {
                    const first = roomPolygon[0];
                    const last = roomPolygon[roomPolygon.length - 1];
                    if (first[0] !== last[0] || first[1] !== last[1]) {
                        roomPolygon.push([first[0], first[1]]);
                    }
                    blenderData.floors.push({
                        floor_material: 'WoodFloor',
                        ceiling_material: 'DefaultCeiling',
                        points: roomPolygon
                    });
                }
            }
        }

        



        // Convert walls to line segments
        // Each wall becomes [[start.x, start.y], [end.x, end.y]]
        for (let i = 0; i < WALLS.length; i++) {
            const wall = WALLS[i];
            if (wall.start && wall.end) {
                const startX = parseFloat(((wall.start.x / 60) - centerX).toFixed(2));
                const startY = parseFloat(((wall.start.y / 60) - centerY).toFixed(2));
                const endX = parseFloat(((wall.end.x / 60) - centerX).toFixed(2));
                const endY = parseFloat(((wall.end.y / 60) - centerY).toFixed(2));
                
                blenderData.walls.push([
                    [startX, startY],
                    [endX, endY]
                ]);
            }
        }

        // Classify walls
        const { internal, external } = classifyWalls(blenderData);
        // Attempt to stitch external walls into a single outline polygon
        const externalOutline = buildExternalPolygon(external, 0.03);
        // if (externalOutline && externalOutline.length >= 3) {
        //     blenderData.external_outline = externalOutline;
        // }

        // Build internal outlines by joining segments (chains may be open)
        const internalOutlines = buildJoinedChains(internal, 0.03);
        // if (internalOutlines && internalOutlines.length > 0) {
        //     blenderData.internal_outlines = internalOutlines;
        // }

        // Convert wall outlines into requested object structure
        blenderData.walls = [];
        
        // Create wall object with all outlines
        const wallObject = {
            material: "Walls",
            trim: "SquareTrim", 
            trim_material: "Walls",
            points: []
        };
        
        if (externalOutline && externalOutline.length >= 2) {
            wallObject.points.push(externalOutline);
        }

        if (internalOutlines && internalOutlines.length > 0) {
            for (const outline of internalOutlines) {
                wallObject.points.push(outline);
            }
        }
        
        // Only add wall object if it has points
        if (wallObject.points.length > 0) {
            blenderData.walls.push(wallObject);
        }

        // Convert objects (doors and windows) to individual objects with asset, position, and rotation
        for (let i = 0; i < OBJDATA.length; i++) {
            const obj = OBJDATA[i];
            if (obj.x !== undefined && obj.y !== undefined) {
                let x = parseFloat((obj.x / 60).toFixed(2));
                let y = parseFloat((obj.y / 60).toFixed(2));
                
                // Adjust position based on angle property
                // if (obj.angle !== undefined) {
                //     const angle = obj.angle;
                //     if (angle === 90) {
                //         x += 0.1;
                //     } else if (angle === 270) {
                //         x -= 0.1;
                //     } else if (angle === 180) {
                //         y += 0.1;
                //     } else if (angle === 0) {
                //         y -= 0.1;
                //     }
                    
                //     // Round to 2 decimal places after adjustment
                //     x = parseFloat(x.toFixed(2));
                //     y = parseFloat(y.toFixed(2));
                // }

                // Apply center offset to position coordinates
                x = parseFloat((x - centerX).toFixed(2));
                y = parseFloat((y - centerY).toFixed(2));

                // Categorize objects based on their type
                if (obj.type === 'door' || obj.type === 'doorDouble' || obj.type === 'doorSliding' || obj.type === 'simple') {
                    blenderData.doors.push({
                        asset: 'OpenDoor',
                        position: [x, y],
                        rotation: obj.angle || 0
                    });
                } else if (obj.type === 'window' || obj.type === 'windowDouble' || obj.type === 'windowBay' || obj.type === 'fix') {
                    blenderData.windows.push({
                        asset: 'WindowPanel',
                        position: [x, y],
                        rotation: obj.angle || 0
                    });
                }
            }
        }

        // Convert furniture items to Blender format and wrap in styles
        const furnitureArray = [];
        if (typeof FURNITURE_ITEMS !== 'undefined' && Array.isArray(FURNITURE_ITEMS)) {
            for (let i = 0; i < FURNITURE_ITEMS.length; i++) {
                const furniture = FURNITURE_ITEMS[i];
                if (furniture.x !== undefined && furniture.y !== undefined) {
                    // Convert position from pixels to meters and apply center offset
                    const x = parseFloat(((furniture.x / 60) - centerX).toFixed(1));
                    const y = parseFloat(((furniture.y / 60) - centerY).toFixed(1));
                    
                    // Get rotation (default to 0 if not specified)
                    const rotation = (-furniture.rotation || 0) - 90;
                    
                    // Get on_ceiling property from furniture definition
                    let onCeiling = false;
                    if (typeof FURNITURE_DATA !== 'undefined' && Array.isArray(FURNITURE_DATA)) {
                        const furnitureType = FURNITURE_DATA.find(f => f.id === furniture.furnitureId || f.type === furniture.type);
                        if (furnitureType && furnitureType.on_ceiling !== undefined) {
                            onCeiling = furnitureType.on_ceiling;
                        }
                    }
                    
                    // Use furnitureId as asset identifier, fallback to type if not available
                    const asset = furniture.furnitureId || furniture.type || 'unknown';
                    
                    furnitureArray.push({
                        asset: asset,
                        position: [x, y],
                        rotation: rotation,
                        on_ceiling: onCeiling
                    });
                }
            }
        }
        
        // Wrap furniture in styles structure
        if (furnitureArray.length > 0) {
            blenderData.styles.push({
                name: "furnished",
                furniture: furnitureArray
            });
        }

        // Convert to JSON string with custom formatting for compact coordinate arrays
        let jsonString = JSON.stringify(blenderData, null, '\t');
        
        // Post-process to make coordinate arrays more compact
        // Replace multi-line coordinate arrays with single-line format
        jsonString = jsonString.replace(/\[\s*\n\s*([\d.-]+),\s*\n\s*([\d.-]+)\s*\n\s*\]/g, '[$1, $2]');
        
        // Create and trigger download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Blender export completed:', filename + '.json');
        return true;
        
    } catch (error) {
        console.error('Error exporting for Blender:', error);
        return false;
    }
}

/**
 * Classify wall segments into internal vs external using room polygons from blenderData.floors[*].points.
 * A wall is considered INTERNAL if points on both sides of its midpoint lie inside any room polygon.
 * Otherwise it is EXTERNAL.
 *
 * Coordinate system: expects the same centered, meter-scaled coords used by exportForBlender
 *   - blenderData.floors: Array of floors -> [ { points: [ [x,y], ... ], ... }, ... ]
 *   - blenderData.walls: Array of wall outlines/segments -> [ [ [x1,y1], [x2,y2] ], ... ] or arrays of points
 *
 * @param {Object} blenderData
 * @param {number} [epsilon=0.2] - Offset distance from midpoint in meters for inside/outside tests
 * @returns {{ internal: Array, external: Array }}
 */
function classifyWalls(blenderData, epsilon = 0.2) {
    if (!blenderData || !Array.isArray(blenderData.walls) || !Array.isArray(blenderData.floors)) {
        console.warn('classifyWalls: Invalid blenderData structure.');
        return { internal: [], external: blenderData && blenderData.walls ? [...blenderData.walls] : [] };
    }

    // Ray-casting point-in-polygon test
    function pointInPolygon(point, polygon) {
        // polygon: [ [x,y], [x,y], ... ]
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];
            const intersect = ((yi > point[1]) !== (yj > point[1])) &&
                (point[0] < (xj - xi) * (point[1] - yi) / ((yj - yi) || 1e-12) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    function insideAnyRoom(pt) {
        for (let k = 0; k < blenderData.floors.length; k++) {
            const floor = blenderData.floors[k];
            const poly = floor && Array.isArray(floor.points) ? floor.points : null;
            if (Array.isArray(poly) && poly.length >= 3 && pointInPolygon(pt, poly)) {
                return true;
            }
        }
        return false;
    }

    const internal = [];
    const external = [];

    for (let i = 0; i < blenderData.walls.length; i++) {
        const seg = blenderData.walls[i];
        if (!Array.isArray(seg) || seg.length !== 2) {
            // Malformed segment, treat as external by default
            external.push(seg);
            continue;
        }
        const ax = seg[0][0], ay = seg[0][1];
        const bx = seg[1][0], by = seg[1][1];

        // Midpoint
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;

        // Perpendicular unit vector (normal)
        const dx = bx - ax;
        const dy = by - ay;
        const len = Math.hypot(dx, dy) || 1e-12;
        // Normal vectors: ( -dy/len, dx/len ) and opposite
        const nx = -dy / len;
        const ny = dx / len;

        // Sample points on both sides of the wall
        const p1 = [mx + nx * epsilon, my + ny * epsilon];
        const p2 = [mx - nx * epsilon, my - ny * epsilon];

        const side1Inside = insideAnyRoom(p1);
        const side2Inside = insideAnyRoom(p2);

        if (side1Inside && side2Inside) {
            internal.push(seg);
        } else {
            external.push(seg);
        }
    }

    return { internal, external };
}

/**
 * Build a closed polygon by stitching wall segments whose endpoints meet within a tolerance.
 * Returns the largest closed loop found (by area) as an array of [x, y] points.
 * If no closed loop can be formed, returns null.
 *
 * @param {Array} segments - Array of segments: [ [ [x1,y1], [x2,y2] ], ... ]
 * @param {number} [tolerance=0.03] - Max distance between endpoints to be considered matching
 * @returns {Array|null}
 */
function buildExternalPolygon(segments, tolerance = 0.03) {
    if (!Array.isArray(segments) || segments.length === 0) return null;

    // Utility: distance between points
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

    // Shoelace area (signed)
    function polygonArea(poly) {
        let area = 0;
        for (let i = 0, n = poly.length; i < n; i++) {
            const j = (i + 1) % n;
            area += poly[i][0] * poly[j][1] - poly[j][0] * poly[i][1];
        }
        return area / 2;
    }

    // Make a mutable copy of segments
    const pool = segments.map(s => [[s[0][0], s[0][1]], [s[1][0], s[1][1]]]);

    let bestLoop = null;
    let bestArea = 0;

    // Try building loops starting from each segment in the pool
    for (let startIdx = 0; startIdx < pool.length; startIdx++) {
        if (!pool[startIdx]) continue; // already consumed
        // Start a new chain
        let [a, b] = pool[startIdx];
        let chain = [a, b];
        pool[startIdx] = null; // consume

        // Extend chain forward until closed or stuck
        let guard = 0;
        while (guard++ < segments.length + 5) {
            const tail = chain[chain.length - 1];
            let found = false;
            for (let i = 0; i < pool.length; i++) {
                const seg = pool[i];
                if (!seg) continue;
                const sA = seg[0];
                const sB = seg[1];

                if (dist(tail, sA) <= tolerance) {
                    chain.push(sB);
                    pool[i] = null;
                    found = true;
                    break;
                } else if (dist(tail, sB) <= tolerance) {
                    chain.push(sA);
                    pool[i] = null;
                    found = true;
                    break;
                }
            }

            // Closed loop?
            if (dist(chain[chain.length - 1], chain[0]) <= tolerance && chain.length > 3) {
                // Remove duplicated last point if extremely close to first
                chain[chain.length - 1] = chain[0];
                // Compute area and keep the largest absolute-area loop
                const unique = dedupeConsecutive(chain);
                const clean = ensureClosed(unique);
                const cleanNoDup = clean.slice(0, clean.length - 1); // area expects no repeated final point
                const area = Math.abs(polygonArea(cleanNoDup));
                if (area > bestArea) {
                    bestArea = area;
                    bestLoop = cleanNoDup;
                }
                break;
            }

            if (!found) break; // stuck
        }
    }

    // Ensure closed loop by appending the first vertex at the end
    return bestLoop && bestLoop.length >= 3 ? [...bestLoop, bestLoop[0]] : null;

    // Remove consecutive duplicates (within tolerance)
    function dedupeConsecutive(points) {
        const out = [];
        for (let i = 0; i < points.length; i++) {
            if (i === 0 || dist(points[i], points[i - 1]) > tolerance / 4) {
                out.push(points[i]);
            }
        }
        return out;
    }

    // Ensure first == last (closed)
    function ensureClosed(points) {
        if (points.length === 0) return points;
        const first = points[0];
        const last = points[points.length - 1];
        if (dist(first, last) > tolerance) {
            return [...points, first];
        }
        return points;
    }
}

/**
 * Join segments into chains by matching endpoints within a tolerance.
 * Chains do NOT need to be closed; returns all chains of 2+ points.
 * Each chain is an array of [x,y] points in order.
 *
 * @param {Array} segments - [ [ [x1,y1], [x2,y2] ], ... ]
 * @param {number} [tolerance=0.03]
 * @returns {Array<Array<[number,number]>>}
 */
function buildJoinedChains(segments, tolerance = 0.03) {
    if (!Array.isArray(segments) || segments.length === 0) return [];
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    
    // Calculate deviation angle from current chain direction
    function calculateDeviationAngle(chain, currentPoint, nextPoint) {
        if (chain.length < 2) return 0; // No existing direction to compare
        
        // Get the current direction vector (from second-to-last to last point)
        const prevPoint = chain[chain.length - 2];
        const currentDir = [currentPoint[0] - prevPoint[0], currentPoint[1] - prevPoint[1]];
        const currentDirMag = Math.hypot(currentDir[0], currentDir[1]);
        
        if (currentDirMag < 1e-6) return 0; // Degenerate case
        
        // Get the proposed direction vector
        const nextDir = [nextPoint[0] - currentPoint[0], nextPoint[1] - currentPoint[1]];
        const nextDirMag = Math.hypot(nextDir[0], nextDir[1]);
        
        if (nextDirMag < 1e-6) return Math.PI; // Degenerate case - maximum deviation
        
        // Calculate angle between vectors using dot product
        const dot = (currentDir[0] * nextDir[0] + currentDir[1] * nextDir[1]) / (currentDirMag * nextDirMag);
        const clampedDot = Math.max(-1, Math.min(1, dot)); // Clamp to avoid numerical errors
        return Math.acos(clampedDot); // Return angle in radians (0 = straight, π = opposite)
    }

    // Initialize pool of unused segments
    const pool = segments.map(s => ({ pts: [[s[0][0], s[0][1]], [s[1][0], s[1][1]]], used: false }));
    const chains = [];

    for (let i = 0; i < pool.length; i++) {
        if (pool[i].used) continue;
        let [a, b] = pool[i].pts;
        let chain = [a, b];
        pool[i].used = true;

        let extended = true;
        let guard = 0;
        while (extended && guard++ < segments.length * 3) {
            extended = false;
            const head = chain[0];
            const tail = chain[chain.length - 1];

            // Try to extend at tail - prioritize straight connections
            let bestTailOption = null;
            let bestTailAngle = Infinity;
            
            for (let j = 0; j < pool.length; j++) {
                if (pool[j].used) continue;
                const [p, q] = pool[j].pts;
                
                if (dist(tail, p) <= tolerance) {
                    const angle = calculateDeviationAngle(chain, tail, q);
                    if (angle < bestTailAngle) {
                        bestTailAngle = angle;
                        bestTailOption = { index: j, nextPoint: q };
                    }
                } else if (dist(tail, q) <= tolerance) {
                    const angle = calculateDeviationAngle(chain, tail, p);
                    if (angle < bestTailAngle) {
                        bestTailAngle = angle;
                        bestTailOption = { index: j, nextPoint: p };
                    }
                }
            }
            
            if (bestTailOption) {
                chain.push(bestTailOption.nextPoint);
                pool[bestTailOption.index].used = true;
                extended = true;
            }

            // Try to extend at head if no tail extension - prioritize straight connections
            if (!extended) {
                let bestHeadOption = null;
                let bestHeadAngle = Infinity;
                
                for (let j = 0; j < pool.length; j++) {
                    if (pool[j].used) continue;
                    const [p, q] = pool[j].pts;
                    
                    if (dist(head, p) <= tolerance) {
                        const angle = calculateDeviationAngle(chain.slice().reverse(), head, q);
                        if (angle < bestHeadAngle) {
                            bestHeadAngle = angle;
                            bestHeadOption = { index: j, nextPoint: q };
                        }
                    } else if (dist(head, q) <= tolerance) {
                        const angle = calculateDeviationAngle(chain.slice().reverse(), head, p);
                        if (angle < bestHeadAngle) {
                            bestHeadAngle = angle;
                            bestHeadOption = { index: j, nextPoint: p };
                        }
                    }
                }
                
                if (bestHeadOption) {
                    chain.unshift(bestHeadOption.nextPoint);
                    pool[bestHeadOption.index].used = true;
                    extended = true;
                }
            }
        }

        // Deduplicate consecutive near-equal points
        const cleaned = [];
        for (let k = 0; k < chain.length; k++) {
            if (k === 0 || dist(chain[k], chain[k - 1]) > tolerance / 5) cleaned.push(chain[k]);
        }
        if (cleaned.length >= 2) chains.push(cleaned);
    }

    return chains;
}
