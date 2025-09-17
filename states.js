/**
 * State and Mode Management functionality for homeRoughEditor
 * Handles floorplan mode, scaling mode, and other state transitions
 */

// Helper functions for feet/inches conversion in scaling mode
function scalingMetersToFeetInches(meters) {
    const totalInches = Math.round(meters * 39.3701); // Round total inches first
    let feet = Math.floor(totalInches / 12);
    let inches = totalInches % 12;
    
    // Handle the case where modulo gives us 12 (shouldn't happen but let's be safe)
    if (inches >= 12) {
        feet += Math.floor(inches / 12);
        inches = inches % 12;
    }
    
    return { feet: feet, inches: inches };
}

function scalingFeetInchesToMeters(feet, inches) {
    const totalInches = (feet || 0) * 12 + (inches || 0);
    return totalInches / 39.3701; // Convert inches to meters
}

// Function to validate and clamp inches input for scaling
function scalingValidateInches(input) {
    let value = parseInt(input.value) || 0;
    if (value < 0) value = 0;
    if (value > 11) value = 11;
    input.value = value;
    return value;
}

// Function to validate and clamp feet input for scaling
function scalingValidateFeet(input) {
    let value = parseInt(input.value) || 4;
    if (value < 4) value = 4;
    input.value = value;
    return value;
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
        
        // Update input values directly - no delay needed
        const widthInMeters = (bounds.width / meter);
        const heightInMeters = (bounds.height / meter);
        
        // Get feet/inches input elements
        const widthFtInput = document.getElementById('floorplanWidthFt');
        const widthInInput = document.getElementById('floorplanWidthIn');
        const heightFtInput = document.getElementById('floorplanHeightFt');
        const heightInInput = document.getElementById('floorplanHeightIn');
        const originalDimSpan = document.getElementById('originalDimensions');
        const scaleFactorSpan = document.getElementById('scaleFactor');
        
        if (widthFtInput && widthInInput && heightFtInput && heightInInput && originalDimSpan && scaleFactorSpan) {
            // Convert current dimensions to feet/inches
            const widthFtIn = scalingMetersToFeetInches(widthInMeters);
            const heightFtIn = scalingMetersToFeetInches(heightInMeters);
            
            // Populate feet/inches inputs
            widthFtInput.value = widthFtIn.feet;
            widthInInput.value = widthFtIn.inches;
            heightFtInput.value = heightFtIn.feet;
            heightInInput.value = heightFtIn.inches;
            
            // Update display with feet/inches format
            originalDimSpan.textContent = `${widthFtIn.feet}' ${widthFtIn.inches}" × ${heightFtIn.feet}' ${heightFtIn.inches}"`;
            scaleFactorSpan.textContent = '1.0';
            
            // Store exact dimensions for scaling calculations
            window.__originalDimensions = { 
                width: bounds.width, 
                height: bounds.height 
            };
        } else {
            console.error('Could not find scaling UI elements');
        }
        
        // Update button text
        if (window.__scalingBtn) {
            window.__scalingBtn.innerText = 'Exit scaling mode';
        }
        
        // Update background image cursor
        if (typeof window.updateBackgroundImageCursor === 'function') {
            window.updateBackgroundImageCursor();
        }
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
        
        // Update background image cursor
        if (typeof window.updateBackgroundImageCursor === 'function') {
            window.updateBackgroundImageCursor();
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
        // Get feet/inches inputs and validate
        const widthFtInput = document.getElementById('floorplanWidthFt');
        const widthInInput = document.getElementById('floorplanWidthIn');
        
        if (!widthFtInput || !widthInInput) return;
        
        const widthFt = scalingValidateFeet(widthFtInput);
        const widthIn = scalingValidateInches(widthInInput);
        const newWidthM = scalingFeetInchesToMeters(widthFt, widthIn);
        
        if (newWidthM <= 0) return;
        
        // Calculate current floorplan bounds
        const currentBounds = calculateFloorplanBounds();
        const currentWidthM = currentBounds.width / meter;
        const currentHeightM = currentBounds.height / meter;
        
        // Calculate scale factor based on width change
        const scaleFactor = newWidthM / currentWidthM;
        
        // Update height to maintain aspect ratio (both dimensions scale by same factor)
        const newHeightM = currentHeightM * scaleFactor;
        const heightFtIn = scalingMetersToFeetInches(newHeightM);
        
        // Update height inputs
        const heightFtInput = document.getElementById('floorplanHeightFt');
        const heightInInput = document.getElementById('floorplanHeightIn');
        if (heightFtInput) heightFtInput.value = heightFtIn.feet;
        if (heightInInput) heightInInput.value = heightFtIn.inches;
        
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
        // Get feet/inches inputs and validate
        const heightFtInput = document.getElementById('floorplanHeightFt');
        const heightInInput = document.getElementById('floorplanHeightIn');
        
        if (!heightFtInput || !heightInInput) return;
        
        const heightFt = scalingValidateFeet(heightFtInput);
        const heightIn = scalingValidateInches(heightInInput);
        const newHeightM = scalingFeetInchesToMeters(heightFt, heightIn);
        
        if (newHeightM <= 0) return;
        
        // Calculate current floorplan bounds
        const currentBounds = calculateFloorplanBounds();
        const currentWidthM = currentBounds.width / meter;
        const currentHeightM = currentBounds.height / meter;
        
        // Calculate scale factor based on height change
        const scaleFactor = newHeightM / currentHeightM;
        
        // Update width to maintain aspect ratio (both dimensions scale by same factor)
        const newWidthM = currentWidthM * scaleFactor;
        const widthFtIn = scalingMetersToFeetInches(newWidthM);
        
        // Update width inputs
        const widthFtInput = document.getElementById('floorplanWidthFt');
        const widthInInput = document.getElementById('floorplanWidthIn');
        if (widthFtInput) widthFtInput.value = widthFtIn.feet;
        if (widthInInput) widthInInput.value = widthFtIn.inches;
        
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
            // Reapply floorplan opacity after wall rebuild
            if (typeof applyFloorplanOpacity === 'function') applyFloorplanOpacity();
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
