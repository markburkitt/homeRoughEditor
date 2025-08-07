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
