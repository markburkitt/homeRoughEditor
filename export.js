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
            if (WALLS[k].child != null && typeof WALLS[k].child === 'number') {
                WALLS[k].child = WALLS[WALLS[k].child];
            }
            if (WALLS[k].parent != null && typeof WALLS[k].parent === 'number') {
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
            if (WALLS[k].child != null && typeof WALLS[k].child === 'number') {
                WALLS[k].child = WALLS[WALLS[k].child];
            }
            if (WALLS[k].parent != null && typeof WALLS[k].parent === 'number') {
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

        // Save the imported state to history
        if (typeof save === 'function') {
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
        imageElement.setAttribute('href', imageDataUrl);
        
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
        
        // Position the image to cover the viewable area
        // We'll start with a reasonable size and position
        imageElement.setAttribute('x', '0');
        imageElement.setAttribute('y', '0');
        imageElement.setAttribute('width', '1100');
        imageElement.setAttribute('height', '700');
        imageElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        imageElement.setAttribute('opacity', '0.7'); // Semi-transparent so grid and other elements are visible
        
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
                svgElement.appendChild(imageElement);
            }
        }
        
        // Store reference for later manipulation
        window.currentBackgroundImage = {
            element: imageElement,
            fileName: fileName,
            dataUrl: imageDataUrl
        };
        
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
        
        // Apply properties
        if (properties.x !== undefined) imageElement.setAttribute('x', properties.x);
        if (properties.y !== undefined) imageElement.setAttribute('y', properties.y);
        if (properties.width !== undefined) imageElement.setAttribute('width', properties.width);
        if (properties.height !== undefined) imageElement.setAttribute('height', properties.height);
        if (properties.opacity !== undefined) imageElement.setAttribute('opacity', properties.opacity);
        
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
        
        // Update slider values based on current image properties
        const currentWidth = parseFloat(imageElement.getAttribute('width')) || 1100;
        const currentOpacity = parseFloat(imageElement.getAttribute('opacity')) || 0.7;
        
        // Calculate scale percentage (assuming base width of 1100)
        const scalePercent = Math.round((currentWidth / 1100) * 100);
        const opacityPercent = Math.round(currentOpacity * 100);
        
        // Update slider values and displays
        document.getElementById('backgroundImageScaleSlider').value = scalePercent;
        document.getElementById('backgroundImageScaleVal').textContent = scalePercent;
        document.getElementById('backgroundImageOpacitySlider').value = opacityPercent;
        document.getElementById('backgroundImageOpacityVal').textContent = opacityPercent;
        
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
            main: [],
            walls: [],
            doors: [],
            windows: []
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

        // Calculate center offset
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        console.log(`Floorplan extents: X[${minX.toFixed(2)}, ${maxX.toFixed(2)}], Y[${minY.toFixed(2)}, ${maxY.toFixed(2)}]`);
        console.log(`Center offset: [${centerX.toFixed(2)}, ${centerY.toFixed(2)}]`);

        // Convert rooms to main polygons
        // Each room becomes a polygon of [x, y] coordinates
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
                if (roomPolygon.length > 0) {
                    blenderData.main.push(roomPolygon);
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
        if (externalOutline && externalOutline.length >= 3) {
            blenderData.external_outline = externalOutline;
        }

        // Build internal outlines by joining segments (chains may be open)
        const internalOutlines = buildJoinedChains(internal, 0.03);
        if (internalOutlines && internalOutlines.length > 0) {
            blenderData.internal_outlines = internalOutlines;
        }


        // Convert objects (doors and windows) to position arrays
        for (let i = 0; i < OBJDATA.length; i++) {
            const obj = OBJDATA[i];
            if (obj.x !== undefined && obj.y !== undefined) {
                let x = parseFloat((obj.x / 60).toFixed(2));
                let y = parseFloat((obj.y / 60).toFixed(2));
                
                // Adjust position based on angle property
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
                    
                    // Round to 2 decimal places after adjustment
                    x = parseFloat(x.toFixed(2));
                    y = parseFloat(y.toFixed(2));
                }

                // Apply center offset to position coordinates
                x = parseFloat((x - centerX).toFixed(2));
                y = parseFloat((y - centerY).toFixed(2));

                // Categorize objects based on their type
                if (obj.type === 'door' || obj.type === 'doorDouble' || obj.type === 'doorSliding' || obj.type === 'simple') {
                    blenderData.doors.push([x, y]);
                } else if (obj.type === 'window' || obj.type === 'windowDouble' || obj.type === 'windowBay' || obj.type === 'fix') {
                    blenderData.windows.push([x, y]);
                }
            }
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
 * Classify wall segments into internal vs external using room polygons from blenderData.main.
 * A wall is considered INTERNAL if points on both sides of its midpoint lie inside any room polygon.
 * Otherwise it is EXTERNAL.
 *
 * Coordinate system: expects the same centered, meter-scaled coords used by exportForBlender
 *   - blenderData.main: Array of room polygons -> [ [ [x,y], ... ], ... ]
 *   - blenderData.walls: Array of wall segments -> [ [ [x1,y1], [x2,y2] ], ... ]
 *
 * @param {Object} blenderData
 * @param {number} [epsilon=0.2] - Offset distance from midpoint in meters for inside/outside tests
 * @returns {{ internal: Array, external: Array }}
 */
function classifyWalls(blenderData, epsilon = 0.2) {
    if (!blenderData || !Array.isArray(blenderData.walls) || !Array.isArray(blenderData.main)) {
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
        for (let k = 0; k < blenderData.main.length; k++) {
            const poly = blenderData.main[k];
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

    return bestLoop && bestLoop.length >= 3 ? bestLoop : null;

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

            // Try to extend at tail
            for (let j = 0; j < pool.length; j++) {
                if (pool[j].used) continue;
                const [p, q] = pool[j].pts;
                if (dist(tail, p) <= tolerance) {
                    chain.push(q);
                    pool[j].used = true;
                    extended = true;
                    break;
                } else if (dist(tail, q) <= tolerance) {
                    chain.push(p);
                    pool[j].used = true;
                    extended = true;
                    break;
                }
            }

            // Try to extend at head if no tail extension
            if (!extended) {
                for (let j = 0; j < pool.length; j++) {
                    if (pool[j].used) continue;
                    const [p, q] = pool[j].pts;
                    if (dist(head, p) <= tolerance) {
                        chain.unshift(q);
                        pool[j].used = true;
                        extended = true;
                        break;
                    } else if (dist(head, q) <= tolerance) {
                        chain.unshift(p);
                        pool[j].used = true;
                        extended = true;
                        break;
                    }
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
