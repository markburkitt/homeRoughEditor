/**
 * Persistence functionality for homeRoughEditor
 * Handles saving and loading floorplan data to/from JSON files
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

        // Prepare furniture data for export
        const furnitureDataForExport = [];
        if (typeof FURNITURE_ITEMS !== 'undefined' && Array.isArray(FURNITURE_ITEMS)) {
            for (let i = 0; i < FURNITURE_ITEMS.length; i++) {
                const furniture = FURNITURE_ITEMS[i];
                furnitureDataForExport.push({
                    id: furniture.id,
                    type: furniture.type,
                    name: furniture.name,
                    furnitureId: furniture.furnitureId,
                    category: furniture.category,
                    x: furniture.x,
                    y: furniture.y,
                    rotation: furniture.rotation || 0,
                    size: furniture.size || 1
                });
            }
        }

        // Prepare lights data for export
        const lightsDataForExport = [];
        if (typeof LIGHT_ITEMS !== 'undefined' && Array.isArray(LIGHT_ITEMS)) {
            for (let i = 0; i < LIGHT_ITEMS.length; i++) {
                const light = LIGHT_ITEMS[i];
                lightsDataForExport.push({
                    id: light.id,
                    type: light.type,
                    name: light.name,
                    lightId: light.lightId,
                    x: light.x,
                    y: light.y
                });
            }
        }

        // Prepare cameras data for export
        const camerasDataForExport = [];
        if (typeof CAMERA_ITEMS !== 'undefined' && Array.isArray(CAMERA_ITEMS)) {
            for (let i = 0; i < CAMERA_ITEMS.length; i++) {
                const camera = CAMERA_ITEMS[i];
                camerasDataForExport.push({
                    id: camera.id,
                    type: camera.type,
                    name: camera.name,
                    x: camera.x,
                    y: camera.y,
                    rotation: camera.rotation || 0,
                    height: camera.height || 1.2
                });
            }
        }

        // Prepare background image data for export
        let backgroundImageData = null;
        const backgroundImageElement = document.getElementById('backgroundImage');
        if (backgroundImageElement) {
            const href = backgroundImageElement.getAttribute('href') || backgroundImageElement.getAttribute('xlink:href');
            if (href && href.startsWith('data:')) {
                backgroundImageData = {
                    dataUrl: href,
                    x: parseFloat(backgroundImageElement.getAttribute('x')) || 0,
                    y: parseFloat(backgroundImageElement.getAttribute('y')) || 0,
                    width: parseFloat(backgroundImageElement.getAttribute('width')) || 0,
                    height: parseFloat(backgroundImageElement.getAttribute('height')) || 0,
                    opacity: parseFloat(backgroundImageElement.getAttribute('opacity')) || 1,
                    fileName: (typeof window !== 'undefined' && window.currentBackgroundImage && window.currentBackgroundImage.fileName) || 'background.jpg'
                };
            }
        }

        // Create the export data structure
        const exportData = {
            version: "0.95",
            exportDate: new Date().toISOString(),
            data: {
                walls: wallDataForExport,
                objects: objDataForExport,
                rooms: roomDataForExport,
                furniture: furnitureDataForExport,
                lights: lightsDataForExport,
                cameras: camerasDataForExport,
                backgroundImage: backgroundImageData
            }
        };

        // Add metadata if requested
        if (includeMetadata) {
            exportData.metadata = {
                totalWalls: wallDataForExport.length,
                totalObjects: objDataForExport.length,
                totalRooms: roomDataForExport.length,
                totalFurniture: furnitureDataForExport.length,
                totalLights: lightsDataForExport.length,
                totalCameras: camerasDataForExport.length,
                totalArea: typeof globalArea !== 'undefined' ? 
                    ((typeof metersToSquareFeet === 'function') ? 
                        metersToSquareFeet(globalArea / 3600) : 
                        (globalArea / 3600).toFixed(2) + ' m²') : 
                    'Not calculated',
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

        console.log('Floorplan saved successfully as:', a.download);
        if (typeof $('#boxinfo') !== 'undefined') {
            const totalItems = furnitureDataForExport.length + lightsDataForExport.length + camerasDataForExport.length;
            const backgroundImageText = backgroundImageData ? ' and background image' : '';
            $('#boxinfo').html('Floorplan saved successfully with ' + totalItems + ' furniture/lights/cameras items' + backgroundImageText);
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
                    console.log('Floorplan opened successfully');
                    const furnitureCount = (jsonData.data.furniture && jsonData.data.furniture.length) || 0;
                    const lightsCount = (jsonData.data.lights && jsonData.data.lights.length) || 0;
                    const camerasCount = (jsonData.data.cameras && jsonData.data.cameras.length) || 0;
                    const totalItems = furnitureCount + lightsCount + camerasCount;
                    const hasBackgroundImage = jsonData.data.backgroundImage && jsonData.data.backgroundImage.dataUrl;
                    
                    if (typeof $('#boxinfo') !== 'undefined') {
                        let message = 'Floorplan opened successfully';
                        if (totalItems > 0) {
                            message += ' with ' + totalItems + ' furniture/lights/cameras items';
                        }
                        if (hasBackgroundImage) {
                            message += ' and background image';
                        }
                        message += '!';
                        $('#boxinfo').html(message);
                    }
                    if (typeof fonc_button === 'function') {
                        try { fonc_button('select_mode'); } catch (e) { /* noop */ }
                    }
                    // Center the imported plan in view
                    if (typeof centerFloorplanView === 'function') {
                        try { centerFloorplanView(100); } catch (e) { /* noop */ }
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

    // Optional arrays for furniture, lights, and cameras (backward compatibility)
    if (data.furniture && !Array.isArray(data.furniture)) {
        return false;
    }
    if (data.lights && !Array.isArray(data.lights)) {
        return false;
    }
    if (data.cameras && !Array.isArray(data.cameras)) {
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

        // Load furniture data if present
        if (data.furniture && Array.isArray(data.furniture)) {
            if (typeof loadSavedFurnitureData === 'function') {
                loadSavedFurnitureData(data.furniture);
            }
        }

        // Load lights data if present
        if (data.lights && Array.isArray(data.lights)) {
            if (typeof loadSavedLightData === 'function') {
                loadSavedLightData(data.lights);
            }
        }

        // Load cameras data if present
        if (data.cameras && Array.isArray(data.cameras)) {
            if (typeof loadSavedCameraData === 'function') {
                loadSavedCameraData(data.cameras);
            }
        }

        // Load background image if present
        if (data.backgroundImage && data.backgroundImage.dataUrl) {
            if (typeof addBackgroundImage === 'function') {
                addBackgroundImage(data.backgroundImage.dataUrl, data.backgroundImage.fileName || 'background.jpg');
                
                // Apply saved positioning and properties
                setTimeout(() => {
                    const backgroundImageElement = document.getElementById('backgroundImage');
                    if (backgroundImageElement) {
                        backgroundImageElement.setAttribute('x', data.backgroundImage.x || 0);
                        backgroundImageElement.setAttribute('y', data.backgroundImage.y || 0);
                        backgroundImageElement.setAttribute('width', data.backgroundImage.width || 0);
                        backgroundImageElement.setAttribute('height', data.backgroundImage.height || 0);
                        backgroundImageElement.setAttribute('opacity', data.backgroundImage.opacity || 1);
                    }
                }, 100); // Small delay to ensure image is loaded
            }
        }

        // Rebuild the visual representation
        if (typeof editor !== 'undefined' && editor.architect) {
            editor.architect(WALLS);
            // Reapply floorplan opacity after wall rebuild
            if (typeof applyFloorplanOpacity === 'function') applyFloorplanOpacity();
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
        // Ensure global variables exist
        if (typeof WALLS === 'undefined') window.WALLS = [];
        if (typeof ROOM === 'undefined') window.ROOM = [];
        if (typeof OBJDATA === 'undefined') window.OBJDATA = [];
        // Clear objects and their SVG elements
        if (typeof OBJDATA !== 'undefined') {
            for (let k in OBJDATA) {
                if (OBJDATA[k].graph && OBJDATA[k].graph.remove) {
                    OBJDATA[k].graph.remove();
                }
            }
            OBJDATA.length = 0;
        } else {
            OBJDATA = [];
        }

        // Clear walls
        if (typeof WALLS !== 'undefined') {
            WALLS.length = 0;
        } else {
            window.WALLS = [];
        }

        // Clear rooms
        if (typeof ROOM !== 'undefined') {
            ROOM.length = 0;
        } else {
            window.ROOM = [];
        }

        // Clear furniture items
        if (typeof FURNITURE_ITEMS !== 'undefined' && Array.isArray(FURNITURE_ITEMS)) {
            FURNITURE_ITEMS.forEach(item => {
                if (item.graph && item.graph.remove) {
                    item.graph.remove();
                }
            });
            FURNITURE_ITEMS.length = 0;
        }

        // Clear light items
        if (typeof LIGHT_ITEMS !== 'undefined' && Array.isArray(LIGHT_ITEMS)) {
            LIGHT_ITEMS.forEach(item => {
                if (item.graph && item.graph.remove) {
                    item.graph.remove();
                }
            });
            LIGHT_ITEMS.length = 0;
        }

        // Clear camera items
        if (typeof CAMERA_ITEMS !== 'undefined' && Array.isArray(CAMERA_ITEMS)) {
            CAMERA_ITEMS.forEach(item => {
                if (item.graph && item.graph.remove) {
                    item.graph.remove();
                }
            });
            CAMERA_ITEMS.length = 0;
        }

        // Clear SVG containers
        if (typeof $ !== 'undefined') {
            $('#boxpath').empty();
            $('#boxSurface').empty();
            $('#boxRoom').empty();
            $('#boxwall').empty();
            $('#boxcarpentry').empty();
            $('#boxEnergy').empty();
            $('#boxFurniture').empty();
            $('#boxCameras').empty();
            $('#boxLights').empty();
            $('#boxbind').empty();
            $('#boxArea').empty();
            $('#boxRib').empty();
            $('#boxScale').empty();
            $('#boxText').empty();
            $('#boxDebug').empty();
            
            // Clear area display
            $('#areaValue').empty();
            $('#boxinfo').empty();
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
        
        // Add double-click event handler (disabled)
        imageElement.addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // Double-click functionality disabled
            return;
        });
        
        // Add drag functionality
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let imageStartX = 0;
        let imageStartY = 0;
        
        imageElement.addEventListener('mousedown', function(e) {
            // Only enable dragging when background image tools are visible
            const toolsPanel = document.getElementById('backgroundImageTools');
            if (!toolsPanel || toolsPanel.style.display === 'none' || 
                window.getComputedStyle(toolsPanel).display === 'none') {
                e.preventDefault();
                e.stopPropagation();
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
                imageElement.style.cursor = 'default';
            }
        }
        
        // Store the cursor update function globally for scaling mode access
        window.updateBackgroundImageCursor = updateImageCursor;
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

                // Skip localStorage restoration - background images should only use default sizing
                // Properties will be managed through floorplan state only

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

        const pxPerMeter = (typeof meter !== 'undefined') ? meter : 160; // editor scale
        
        // Helper functions for feet/inches conversion
        function metersToFeetInches(meters) {
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
        
        function feetInchesToMeters(feet, inches) {
            const totalInches = (feet || 0) * 12 + (inches || 0);
            return totalInches / 39.3701; // Convert inches to meters
        }
        
        // Get input elements
        const widthFtInput = document.getElementById('backgroundImageWidthFt');
        const widthInInput = document.getElementById('backgroundImageWidthIn');
        const heightFtInput = document.getElementById('backgroundImageHeightFt');
        const heightInInput = document.getElementById('backgroundImageHeightIn');
        const aspectInfo = document.getElementById('backgroundImageAspectInfo');

        // Convert current dimensions to feet/inches and populate inputs
        const currentWidthM = currentWidthPx / pxPerMeter;
        const currentHeightM = currentHeightPx / pxPerMeter;
        const widthFtIn = metersToFeetInches(currentWidthM);
        const heightFtIn = metersToFeetInches(currentHeightM);
        
        if (widthFtInput) widthFtInput.value = widthFtIn.feet;
        if (widthInInput) widthInInput.value = widthFtIn.inches;
        if (heightFtInput) heightFtInput.value = heightFtIn.feet;
        if (heightInInput) heightInInput.value = heightFtIn.inches;
        if (aspectInfo) aspectInfo.textContent = `Aspect ratio: ${(aspect).toFixed(4)} (W/H)`;

        // Function to validate and clamp inches input
        function validateInches(input) {
            let value = parseInt(input.value) || 0;
            if (value < 0) value = 0;
            if (value > 11) value = 11;
            input.value = value;
            return value;
        }

        // Function to validate and clamp feet input
        function validateFeet(input) {
            let value = parseInt(input.value) || 4;
            if (value < 4) value = 4;
            input.value = value;
            return value;
        }

        // Function to update image dimensions from width inputs
        function updateFromWidth() {
            const img = document.getElementById('backgroundImage');
            if (!img) return;
            const curX = parseFloat(img.getAttribute('x')) || 0;
            const curY = parseFloat(img.getAttribute('y')) || 0;
            const ar = parseFloat(img.dataset.aspectRatio) || aspect;
            
            const widthFt = validateFeet(widthFtInput);
            const widthIn = validateInches(widthInInput);
            const wM = feetInchesToMeters(widthFt, widthIn);
            
            if (wM <= 0) return;
            
            const wPx = wM * pxPerMeter;
            const hPx = wPx / ar;
            const hM = hPx / pxPerMeter;
            
            img.setAttribute('width', String(wPx));
            img.setAttribute('height', String(hPx));
            img.setAttribute('x', String(curX));
            img.setAttribute('y', String(curY));
            
            // Update height inputs
            const heightFtIn = metersToFeetInches(hM);
            if (heightFtInput) heightFtInput.value = heightFtIn.feet;
            if (heightInInput) heightInInput.value = heightFtIn.inches;
        }
        
        // Function to update image dimensions from height inputs
        function updateFromHeight() {
            const img = document.getElementById('backgroundImage');
            if (!img) return;
            const curX = parseFloat(img.getAttribute('x')) || 0;
            const curY = parseFloat(img.getAttribute('y')) || 0;
            const ar = parseFloat(img.dataset.aspectRatio) || aspect;
            
            const heightFt = validateFeet(heightFtInput);
            const heightIn = validateInches(heightInInput);
            const hM = feetInchesToMeters(heightFt, heightIn);
            
            if (hM <= 0) return;
            
            const hPx = hM * pxPerMeter;
            const wPx = hPx * ar;
            const wM = wPx / pxPerMeter;
            
            img.setAttribute('width', String(wPx));
            img.setAttribute('height', String(hPx));
            img.setAttribute('x', String(curX));
            img.setAttribute('y', String(curY));
            
            // Update width inputs
            const widthFtIn = metersToFeetInches(wM);
            if (widthFtInput) widthFtInput.value = widthFtIn.feet;
            if (widthInInput) widthInInput.value = widthFtIn.inches;
        }

        // Bind input handlers to maintain aspect ratio
        if (widthFtInput) widthFtInput.oninput = updateFromWidth;
        if (widthInInput) widthInInput.oninput = updateFromWidth;
        if (heightFtInput) heightFtInput.oninput = updateFromHeight;
        if (heightInInput) heightInInput.oninput = updateFromHeight;

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
