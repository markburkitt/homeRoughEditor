// Camera placement functionality
let CAMERA_ITEMS = [];
let selectedCameraType = null;
let cameraCursor = null;
let draggingCameraItem = null;
let draggingCameraOffset = { dx: 0, dy: 0 };
let cameraDragSaveTimeout = null;

// Enter camera placement mode
function enterCameraMode() {
    mode = 'camera_mode';
    $('.leftBox').hide();
    $('#cameraPanel').show();
    
    
    $('#boxinfo').html('Camera placement mode - click Add Camera to place cameras');
}

// Exit camera placement mode
function exitCameraMode() {
    mode = 'select_mode';
    selectedCameraType = null;
    
    if (cameraCursor) {
        cameraCursor.attr('style', 'display: none');
    }
    
    document.querySelectorAll('.camera-option').forEach(btn => {
        btn.classList.remove('btn-success');
        btn.classList.add('btn-light');
    });
    
    $('#cameraPanel').hide();
    $('.leftBox').hide();
    $('#panel').show();
    $('#boxinfo').html('Selection mode');
}

// Select camera for placement
function selectCameraPlacement() {
    selectedCameraType = { type: 'camera', name: 'Camera' };
    mode = 'camera_placement_mode';
    $('#boxinfo').html('Click to place camera');
    
    createCameraCursor();
}

// Create cursor icon for camera placement
function createCameraCursor() {
    if (cameraCursor) {
        cameraCursor.remove();
    }
    
    // Create camera cursor icon
    cameraCursor = qSVG.create('boxbind', 'g', {
        id: 'camera-cursor'
    });
    
    const square = qSVG.create('none', 'circle', {
        cx: 0,
        cy: 0,
        r: 20,
        fill: '#FF5722',
        stroke: '#D84315',
        'stroke-width': 2
    });
    
    const videoIcon = qSVG.create('none', 'text', {
        x: 0,
        y: 6,
        'text-anchor': 'middle',
        'font-family': 'Font Awesome 6 Free',
        'font-weight': '900',
        'font-size': '16',
        fill: 'white'
    });
    videoIcon.textContent = '\uf03d'; // fa-video unicode
    
    cameraCursor.append(square);
    cameraCursor.append(videoIcon);
    cameraCursor.attr('style', 'display: none');
}

// Update cursor position
function updateCameraCursor(x, y) {
    if (cameraCursor && mode === 'camera_placement_mode') {
        cameraCursor.attr({
            transform: `translate(${x}, ${y})`,
            style: 'display: block'
        });
    }
}

// Place camera item on the floorplan
function placeCameraItem(x, y, skipSave = false) {
    if (!selectedCameraType && !skipSave) return;
    
    const cameraItem = {
        id: generateCameraId(),
        type: 'camera',
        name: 'Camera',
        x: x,
        y: y,
        rotation: 0,
        height: 1.2,
        graph: null,
        rotGroup: null,
        label: null
    };
    
    // Create main camera group
    const cameraGroup = qSVG.create('none', 'g', {
        transform: `translate(${x}, ${y})`,
        id: `camera-${cameraItem.id}`,
        class: 'camera-item'
    });
    const cameraRotGroup = qSVG.create('none', 'g', { class: 'camera-rot' });
    
    // Create camera icon (circle with FontAwesome video icon)
    const icon = qSVG.create('none', 'circle', {
        cx: 0,
        cy: 0,
        r: 20,
        fill: '#FF5722',
        stroke: '#D84315',
        'stroke-width': 2
    });
    
    // Create FontAwesome video icon using foreignObject
    const ICON_SIZE = 24;
    const HALF = ICON_SIZE / 2;
    
    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.setAttribute('class', 'camera-icon');
    fo.setAttribute('x', -HALF);
    fo.setAttribute('y', -HALF);
    fo.setAttribute('width', ICON_SIZE);
    fo.setAttribute('height', ICON_SIZE);

    // Create XHTML wrapper and icon element
    const div = document.createElement('div');
    div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    div.style.width = ICON_SIZE + 'px';
    div.style.height = ICON_SIZE + 'px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.pointerEvents = 'none';
    
    const iEl = document.createElement('i');
    iEl.className = 'fa-solid fa-video';
    iEl.setAttribute('aria-hidden', 'true');
    iEl.style.color = 'white';
    iEl.style.fontSize = '14px';
    
    div.appendChild(iEl);
    fo.appendChild(div);
    
    // Create direction arrow
    const arrow = qSVG.create('none', 'path', {
        d: 'M30,0 L22,-6 L22,6 Z',
        fill: '#BF360C',
        stroke: '#BF360C',
        'stroke-width': 1,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round'
    });
    
    // Create text label
    const label = qSVG.create('none', 'text', {
        x: 0,
        y: -35,
        'text-anchor': 'middle',
        'font-size': '12',
        fill: '#333',
        'font-family': 'Arial, sans-serif'
    });
    label.textContent = `Camera ${cameraItem.id}`;
    
    // Assemble the camera
    cameraRotGroup.append(icon);
    cameraRotGroup.append(fo);
    cameraRotGroup.append(arrow);
    cameraGroup.append(cameraRotGroup);
    cameraGroup.append(label);
    
    // Position the camera
    cameraGroup.attr('transform', `translate(${x}, ${y})`);
    
    // Store references
    cameraItem.graph = cameraGroup;
    cameraItem.rotGroup = cameraRotGroup;
    cameraItem.label = label;
    
    // Add camera to the DOM - append to boxCameras group
    const cameraBox = document.getElementById('boxCameras');
    if (cameraBox) {
        cameraBox.appendChild(cameraGroup.get(0));
    }
    
    // Add to cameras array
    CAMERA_ITEMS.push(cameraItem);
    
    // Add click handlers for selection (only in camera modes)
    cameraGroup.on('click', function(e) {
        e.stopPropagation();
        if (mode === 'camera_mode') {
            selectCameraItem(cameraItem);
        }
    });
    
    // Add drag functionality
    setupCameraDragging(cameraItem);
    
    // Save cameras with floorplan data
    if (!skipSave) {
        if (typeof save === 'function') save();
    }
    
    // Exit placement mode after placing camera
    if (mode === 'camera_placement_mode') {
        mode = 'camera_mode';
        selectedCameraType = null;
        if (cameraCursor) {
            cameraCursor.attr('style', 'display: none');
        }
        $('#boxinfo').html('Camera placed - click Add Camera to place more cameras');
    }
    
    // console.log('Placed camera:', cameraItem);
    return cameraItem;
}

// Generate unique camera ID
function generateCameraId() {
    let id = 1;
    while (CAMERA_ITEMS.some(camera => camera.id === id)) {
        id++;
    }
    return id;
}

// Select camera item for editing
function selectCameraItem(cameraItem) {
    // Stay in camera_mode while a camera item is selected to avoid wall interactions
    mode = 'camera_mode';
    selectedCameraType = null;
    
    // Hide other panels and show camera tools
    $('.leftBox').hide();
    $('#cameraTools').show();
    
    // Populate camera details
    document.getElementById('cameraId').textContent = cameraItem.id;
    document.getElementById('cameraRotationValue').textContent = Math.round(cameraItem.rotation);
    document.getElementById('cameraRotationSlider').value = cameraItem.rotation;
    document.getElementById('cameraHeightValue').textContent = cameraItem.height.toFixed(1);
    document.getElementById('cameraHeightSlider').value = cameraItem.height;
    
    // Store selected camera globally
    window.selectedCamera = cameraItem;
    
    // Highlight selected camera
    document.querySelectorAll('.camera-item').forEach(item => {
        item.style.opacity = '0.5';
    });
    cameraItem.graph.get(0).style.opacity = '1';
    cameraItem.graph.get(0).style.filter = 'drop-shadow(0 0 5px #FF5722)';
    
    // Set up event listeners for sliders
    setupCameraSliders(cameraItem);
    
    // Set up remove button
    document.getElementById('cameraRemove').onclick = function() {
        removeCameraItem(cameraItem);
    };
    
    $('#boxinfo').html(`Camera ${cameraItem.id} selected - adjust rotation and height`);
}

// Hide camera tools panel
function hideCameraTools() {
    $('#cameraTools').hide();
    window.selectedCamera = null;
    
    // Reset camera highlighting
    document.querySelectorAll('.camera-item').forEach(item => {
        item.style.opacity = '1';
        item.style.filter = 'none';
    });
    
    // Show camera panel to return to camera mode
    $('.leftBox').hide();
    $('#cameraPanel').show();
    mode = 'camera_mode';
}

// Setup camera sliders
function setupCameraSliders(cameraItem) {
    const rotationSlider = document.getElementById('cameraRotationSlider');
    const heightSlider = document.getElementById('cameraHeightSlider');
    
    // Rotation slider
    rotationSlider.oninput = function() {
        const rotation = parseFloat(this.value);
        cameraItem.rotation = rotation;
        document.getElementById('cameraRotationValue').textContent = Math.round(rotation);
        
        // Apply rotation to the rotation group
        if (cameraItem.rotGroup) {
            cameraItem.rotGroup.attr('transform', `rotate(${rotation})`);
        }
        
        // Debounced save
        clearTimeout(cameraDragSaveTimeout);
        cameraDragSaveTimeout = setTimeout(() => {
            if (typeof save === 'function') save();
        }, 500);
    };
    
    // Height slider
    heightSlider.oninput = function() {
        const height = parseFloat(this.value);
        cameraItem.height = height;
        document.getElementById('cameraHeightValue').textContent = height.toFixed(1);
        
        // Debounced save
        clearTimeout(cameraDragSaveTimeout);
        cameraDragSaveTimeout = setTimeout(() => {
            if (typeof save === 'function') save();
        }, 500);
    };
}

// Setup camera dragging functionality
function setupCameraDragging(cameraItem) {
    cameraItem.graph.on('mousedown', function(e) {
        // Only allow dragging in camera modes and if this camera is selected
        if (mode !== 'camera_mode') return;
        if (mode === 'camera_placement_mode') return;
        // Only start dragging if this item is currently selected
        if (window.selectedCamera !== cameraItem) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Use existing snap helper to get SVG coords if available
        try {
            const snap = calcul_snap(e, 'off');
            draggingCameraOffset.dx = cameraItem.x - snap.x;
            draggingCameraOffset.dy = cameraItem.y - snap.y;
        } catch (err) {
            // Fallback: no offset, will jump under cursor
            draggingCameraOffset.dx = 0;
            draggingCameraOffset.dy = 0;
        }
        
        draggingCameraItem = cameraItem;
        window.draggingCameraItem = cameraItem;
        
        // Temporarily switch to camera_mode to prevent select-mode panning
        window._prevModeBeforeCameraDrag = mode;
        mode = 'camera_mode';
        
        // Ensure engine's panning is disabled
        try { window.drag = 'off'; } catch (_) {}
        
        $('#boxinfo').html('Dragging Camera ' + cameraItem.id + ' (release to drop)');
        cursor('move');
    });
}

// Remove camera item
function removeCameraItem(cameraItem) {
    // Remove from DOM
    if (cameraItem.graph) {
        cameraItem.graph.remove();
    }
    
    // Remove from array
    const index = CAMERA_ITEMS.findIndex(camera => camera.id === cameraItem.id);
    if (index !== -1) {
        CAMERA_ITEMS.splice(index, 1);
    }
    
    // Save cameras
    if (typeof save === 'function') save();
    
    console.log('Removed camera:', cameraItem.id);
}

// Export camera data for save/load functionality
function getCameraData() {
    const data = CAMERA_ITEMS.map(item => ({
        id: item.id,
        type: item.type,
        name: item.name,
        x: item.x,
        y: item.y,
        rotation: item.rotation,
        height: item.height
    }));
    return data;
}

// Load saved camera data (for undo/redo operations)
async function loadSavedCameraData(cameraData) {
    //console.log('Loading camera data:', cameraData);
    
    // Clear existing cameras
    CAMERA_ITEMS.forEach(camera => {
        if (camera.graph) {
            camera.graph.remove();
        }
    });
    CAMERA_ITEMS = [];
    
    // Recreate cameras
    if (cameraData && Array.isArray(cameraData)) {
        cameraData.forEach(cameraInfo => {
            const camera = placeCameraItem(cameraInfo.x, cameraInfo.y, true);
            if (camera) {
                camera.id = cameraInfo.id;
                camera.rotation = cameraInfo.rotation || 0;
                camera.height = cameraInfo.height || 1.2;
                
                // Apply rotation
                if (camera.rotGroup) {
                    camera.rotGroup.attr('transform', `rotate(${camera.rotation})`);
                }
                
                // Update label
                if (camera.label) {
                    camera.label.textContent = `Camera ${camera.id}`;
                }
            }
        });
    }
    
    //console.log('Loaded camera data:', cameraData ? cameraData.length : 0, 'cameras');
}

// Clear all cameras
function clearCameras() {
    CAMERA_ITEMS.forEach(camera => {
        if (camera.graph) {
            camera.graph.remove();
        }
    });
    CAMERA_ITEMS = [];
    if (typeof save === 'function') save();
    console.log('All cameras cleared');
}

// Toggle camera layer visibility
function toggleCameraLayer(visible) {
    const cameraBox = document.getElementById('boxCameras');
    if (cameraBox) {
        if (visible) {
            cameraBox.style.display = 'block';
        } else {
            cameraBox.style.display = 'none';
        }
    }
}

// Initialize camera system
function initializeCameras() {
    // Add layer toggle handler
    const layerToggle = document.getElementById('showLayerCameras');
    if (layerToggle) {
        layerToggle.addEventListener('change', function() {
            toggleCameraLayer(this.checked);
        });
    }
    
    // Global mousemove/up handlers for dragging cameras
    document.addEventListener('mousemove', function(e) {
        if (!draggingCameraItem) return;
        // Do not drag during placement mode, but allow in other modes
        if (mode === 'camera_placement_mode') return;
        let snap;
        try {
            snap = calcul_snap(e, 'off');
        } catch (err) {
            // Fallback if calcul_snap is not available
            const svgElement = document.getElementById('svg');
            if (!svgElement) return;
            const rect = svgElement.getBoundingClientRect();
            snap = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
        const nx = snap.x + draggingCameraOffset.dx;
        const ny = snap.y + draggingCameraOffset.dy;
        draggingCameraItem.x = nx;
        draggingCameraItem.y = ny;
        if (draggingCameraItem.graph) {
            draggingCameraItem.graph.attr({
                transform: `translate(${nx}, ${ny})`
            });
        }
        if (draggingCameraItem.rotGroup) {
            draggingCameraItem.rotGroup.attr({
                transform: `rotate(${draggingCameraItem.rotation || 0})`
            });
        }
        // Throttle saves while dragging
        clearTimeout(cameraDragSaveTimeout);
        cameraDragSaveTimeout = setTimeout(() => { if (typeof save === 'function') save(); }, 300);
    }, true);

    document.addEventListener('mouseup', function() {
        if (!draggingCameraItem) return;
        const justDropped = draggingCameraItem;
        draggingCameraItem = null;
        window.draggingCameraItem = null;
        // Restore previous mode after drag ends
        if (window._prevModeBeforeCameraDrag) {
            mode = window._prevModeBeforeCameraDrag;
            window._prevModeBeforeCameraDrag = null;
        }
        cursor('default');
        $('#boxinfo').html('Camera ' + justDropped.id + ' moved');
        // Final save after drag completes
        if (typeof save === 'function') save();
    }, true);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCameras();
});
