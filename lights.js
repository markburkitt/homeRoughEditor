// Light placement functionality
let LIGHT_DATA = [];
let LIGHT_ITEMS = [];
let selectedLightType = null;
let lightCursor = null;
let draggingLightItem = null;
let draggingLightOffset = { dx: 0, dy: 0 };
let lightDragSaveTimeout = null;

// Default light types
const DEFAULT_LIGHT_TYPES = [
    {
        "id": "CeilingSpotlight",
        "name": "Ceiling Spotlight",
        "on_ceiling": true,
        "category": "light"
      },
];

// Enter light placement mode
function enterLightMode() {
    mode = 'light_mode';
    $('.leftBox').hide();
    $('#lightPanel').show();
    $('#boxinfo').html('Light placement mode - select light to place');
    
    // Initialize light data if not already loaded
    if (LIGHT_DATA.length === 0) {
        LIGHT_DATA = DEFAULT_LIGHT_TYPES;
    }
    
    // Populate light options
    populateLightOptions();
}

// Exit light placement mode
function exitLightMode() {
    mode = 'select_mode';
    selectedLightType = null;
    
    if (lightCursor) {
        lightCursor.attr('style', 'display: none');
    }
    
    // Reset light option buttons
    document.querySelectorAll('.light-option').forEach(btn => {
        btn.classList.remove('btn-success');
        btn.classList.add('btn-light');
    });
    
    // Hide light panel and show main panel
    $('#lightPanel').hide();
    $('.leftBox').hide();
    $('#panel').show();
    $('#boxinfo').html('Selection mode');
}

// Populate light options in the panel
function populateLightOptions() {
    const optionsContainer = document.getElementById('light_options');
    if (!optionsContainer) {
        console.error('light_options container not found');
        return;
    }
    
    optionsContainer.innerHTML = '';
    
    LIGHT_DATA.forEach(light => {
        const button = document.createElement('button');
        button.className = 'btn btn-light fully light-option';
        button.style.marginBottom = '5px';
        button.style.width = '100%';
        button.textContent = light.name;
        button.onclick = () => selectLightType(light);
        optionsContainer.appendChild(button);
    });
    
    if (LIGHT_DATA.length === 0) {
        optionsContainer.innerHTML = '<p>No light types available</p>';
    }
}

// Select light type for placement
function selectLightType(light) {
    selectedLightType = light;
    mode = 'light_placement_mode';
    $('#boxinfo').html('Click to place ' + light.name);
    
    // Highlight selected light
    document.querySelectorAll('.light-option').forEach(btn => {
        btn.classList.remove('btn-success');
        btn.classList.add('btn-light');
    });
    event.target.classList.remove('btn-light');
    event.target.classList.add('btn-success');
    
    createLightCursor();
}

// Create cursor icon for light placement
function createLightCursor() {
    if (lightCursor) {
        lightCursor.remove();
    }
    
    // Create yellow circle cursor with sun icon
    lightCursor = qSVG.create('boxbind', 'g', {
        id: 'light-cursor'
    });
    
    const circle = qSVG.create('none', 'circle', {
        cx: 0,
        cy: 0,
        r: 15,
        fill: 'rgba(255, 235, 59, 0.7)',
        stroke: '#FFC107',
        'stroke-width': 2
    });
    
    // Create FontAwesome sun icon using foreignObject
    const ICON_SIZE = 20;
    const HALF = ICON_SIZE / 2;
    
    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.setAttribute('class', 'light-cursor-icon');
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
    iEl.className = 'fa-solid fa-sun';
    iEl.setAttribute('aria-hidden', 'true');
    iEl.style.color = '#F57F17';
    iEl.style.fontSize = '14px';
    
    div.appendChild(iEl);
    fo.appendChild(div);
    
    lightCursor.append(circle);
    lightCursor.append(fo);
    lightCursor.attr('style', 'display: none');
}

// Update cursor position
function updateLightCursor(x, y) {
    if (lightCursor && mode === 'light_placement_mode') {
        lightCursor.attr({
            transform: `translate(${x}, ${y})`,
            style: 'display: block'
        });
    }
}

// Place light item on the floorplan
function placeLightItem(x, y, skipSave = false) {
    if (!selectedLightType && !skipSave) return;
    
    const lightItem = {
        id: generateLightId(),
        type: selectedLightType ? selectedLightType.type : 'ceiling',
        name: selectedLightType ? selectedLightType.name : 'Light',
        lightId: selectedLightType ? selectedLightType.id : 'ceiling',
        x: x,
        y: y,
        graph: null,
        label: null
    };
    
    // Create visual representation
    const lightGroup = qSVG.create('boxLights', 'g', {
        id: 'light-' + lightItem.id,
        class: 'light-item',
        'data-light-id': lightItem.id
    });
    
    // Create light icon (yellow circle with sun icon)
    const icon = qSVG.create('none', 'circle', {
        cx: 0,
        cy: 0,
        r: 20,
        fill: '#FFEB3B',
        stroke: '#FFC107',
        'stroke-width': 2
    });
    
    // Create FontAwesome sun icon using foreignObject
    const ICON_SIZE = 28;
    const HALF = ICON_SIZE / 2;
    
    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.setAttribute('class', 'light-icon');
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
    iEl.className = 'fa-solid fa-sun';
    iEl.setAttribute('aria-hidden', 'true');
    iEl.style.color = '#F57F17';
    iEl.style.fontSize = '18px';
    
    div.appendChild(iEl);
    fo.appendChild(div);
    
    // Create text label
    const label = qSVG.create('none', 'text', {
        x: 0,
        y: 39,
        'text-anchor': 'middle',
        'font-family': 'roboto',
        'font-size': '10px',
        fill: '#777',
        'font-weight': 'normal'
    });
    label.text((lightItem.name || '').toLowerCase());
    
    lightGroup.append(icon);
    lightGroup.append(fo);
    lightGroup.append(label);

    // Assign references
    lightItem.graph = lightGroup;
    lightItem.label = label;

    lightGroup.attr({
        transform: `translate(${x}, ${y})`
    });
    
    // Add light to the DOM - append to boxLights group
    const lightBox = document.getElementById('boxLights');
    if (lightBox) {
        lightBox.appendChild(lightGroup.get(0));
    }
    
    LIGHT_ITEMS.push(lightItem);
    
    // Add click handler for selection (only in light modes)
    lightGroup.on('click', function(e) {
        e.stopPropagation();
        if (mode === 'light_mode' || mode === 'light_placement_mode') {
            selectLightItem(lightItem);
        }
    });

    // Add mousedown handler to start drag only if this item is selected
    lightGroup.on('mousedown', function(e) {
        // Do not allow dragging during placement mode
        if (mode === 'light_placement_mode') return;
        // Only start dragging if this item is currently selected
        if (window.selectedLightItem !== lightItem) return;
        e.preventDefault();
        e.stopPropagation();
        // Use existing snap helper to get SVG coords if available
        try {
            const snap = calcul_snap(e, 'off');
            draggingLightOffset.dx = lightItem.x - snap.x;
            draggingLightOffset.dy = lightItem.y - snap.y;
        } catch (err) {
            // Fallback: no offset, will jump under cursor
            draggingLightOffset.dx = 0;
            draggingLightOffset.dy = 0;
        }
        draggingLightItem = lightItem;
        window.draggingLightItem = lightItem;
        // Temporarily switch to light_mode to prevent select-mode panning
        window._prevModeBeforeLightDrag = mode;
        mode = 'light_mode';
        // Ensure engine's panning is disabled even if it set drag='on' in capture phase
        try { window.drag = 'off'; } catch (_) {}
        $('#boxinfo').html('Dragging ' + lightItem.name + ' (release to drop)');
        cursor('move');
    });
    
    // Only update UI state and mode when this is a user placement, not restoration
    if (!skipSave) {
        $('#boxinfo').html('Placed ' + lightItem.name);
        // Clear selection and reset to light mode
        selectedLightType = null;
        mode = 'light_mode';
        // Hide light cursor
        if (lightCursor) {
            lightCursor.attr('style', 'display: none');
        }
        // Reset light option buttons
        document.querySelectorAll('.light-option').forEach(btn => {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-light');
        });
        // Ensure light panel stays visible
        $('#lightPanel').show();
        save();
    }
}

// Generate unique light ID
function generateLightId() {
    return 'light_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Select light item for editing
function selectLightItem(lightItem) {
    // Stay in light_mode while a light item is selected to avoid wall interactions
    mode = 'light_mode';
    selectedLightType = null;
    
    // Hide all panels first
    $('.leftBox').hide();
    
    // Show light details panel
    $('#lightName').text(lightItem.name);
    $('#lightId').text(lightItem.lightId);
    $('#lightType').text(lightItem.type);
    
    $('#lightTools').show();
    
    // Store reference for removal
    window.selectedLightItem = lightItem;
    
    // Highlight selected light
    document.querySelectorAll('.light-item').forEach(item => {
        item.style.opacity = '0.5';
    });
    lightItem.graph.get(0).style.opacity = '1';
    lightItem.graph.get(0).style.filter = 'drop-shadow(0 0 5px #FFC107)';
}

// Remove light item
function removeLightItem(lightItem) {
    if (lightItem && lightItem.graph) {
        lightItem.graph.remove();
        const index = LIGHT_ITEMS.indexOf(lightItem);
        if (index > -1) {
            LIGHT_ITEMS.splice(index, 1);
        }
        save();
    }
}

// Close light placement mode
function closeLightMode() {
    exitLightMode();
}

// Hide light tools panel
function hideLightTools() {
    $('#lightTools').hide();
    window.selectedLightItem = null;
    
    // Reset light highlighting
    document.querySelectorAll('.light-item').forEach(item => {
        item.style.opacity = '1';
        item.style.filter = 'none';
    });
    
    // Show light panel to return to light mode
    $('.leftBox').hide();
    $('#lightPanel').show();
    mode = 'light_mode';
    $('#boxinfo').html('Light placement mode - select light to place');
}

// Toggle light layer visibility
function toggleLightLayer() {
    const lightLayer = document.getElementById('boxLights');
    const checkbox = document.getElementById('showLayerLights');
    
    if (checkbox && checkbox.checked) {
        if (lightLayer) lightLayer.style.display = 'block';
    } else {
        if (lightLayer) lightLayer.style.display = 'none';
    }
}

// Export light data for save/load functionality
function getLightData() {
    const data = LIGHT_ITEMS.map(item => ({
        id: item.id,
        type: item.type,
        lightId: item.lightId, // Maps to 'id' from LIGHT_DATA
        name: item.name,
        x: item.x,
        y: item.y
    }));
    return data;
}

// Load saved light data (for undo/redo operations)
async function loadSavedLightData(lightData) {
    console.log('Loading light data:', lightData);
    
    // Ensure LIGHT_DATA is initialized
    if (LIGHT_DATA.length === 0) {
        LIGHT_DATA = DEFAULT_LIGHT_TYPES;
    }
    
    // Clear existing lights
    LIGHT_ITEMS.forEach(light => {
        if (light.graph) {
            light.graph.remove();
        }
    });
    LIGHT_ITEMS = [];
    
    // Recreate lights
    if (lightData && Array.isArray(lightData)) {
        for (const lightInfo of lightData) {
            // Find light type by lightId (which maps to 'id' from LIGHT_DATA)
            const lightType = LIGHT_DATA.find(l => l.id === lightInfo.lightId);
            
            if (lightType) {
                const light = {
                    id: lightInfo.id || generateLightId(),
                    type: lightInfo.type,
                    lightId: lightInfo.lightId,
                    name: lightInfo.name || lightType.name,
                    x: lightInfo.x,
                    y: lightInfo.y,
                    graph: null
                };
                
                // Create SVG element
                const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                group.setAttribute('class', 'light-item');
                group.setAttribute('data-light-id', light.id);
                
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', light.x);
                circle.setAttribute('cy', light.y);
                circle.setAttribute('r', '15');
                circle.setAttribute('fill', '#FFD700');
                circle.setAttribute('stroke', '#FFA500');
                circle.setAttribute('stroke-width', '2');
                
                const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                icon.setAttribute('x', light.x);
                icon.setAttribute('y', light.y + 5);
                icon.setAttribute('text-anchor', 'middle');
                icon.setAttribute('font-family', 'FontAwesome');
                icon.setAttribute('font-size', '16');
                icon.setAttribute('fill', '#FF8C00');
                icon.textContent = '\uf185'; // fa-sun
                
                group.appendChild(circle);
                group.appendChild(icon);
                
                light.graph = group;
                
                // Add to DOM
                const lightLayer = document.getElementById('boxLights');
                if (lightLayer) {
                    lightLayer.appendChild(group);
                }
                
                LIGHT_ITEMS.push(light);
            }
        }
    }
    
    console.log('Restored lights:', LIGHT_ITEMS.length);
}

// Initialize light system
function initLightSystem() {
    // Initialize LIGHT_DATA with default types
    if (LIGHT_DATA.length === 0) {
        LIGHT_DATA = DEFAULT_LIGHT_TYPES;
    }
    
    // Add light removal handler
    document.getElementById('lightRemove').addEventListener('click', function() {
        if (window.selectedLightItem) {
            removeLightItem(window.selectedLightItem);
            hideLightTools();
            $('#boxinfo').html('Light removed');
        }
    });
    
    // Add layer toggle handler
    const layerToggle = document.getElementById('showLayerLights');
    if (layerToggle) {
        layerToggle.addEventListener('change', function() {
            toggleLightLayer(this.checked);
        });
    }

    // Global mousemove/up handlers for dragging lights
    document.addEventListener('mousemove', function(e) {
        if (!draggingLightItem) return;
        // Do not drag during placement mode, but allow in other modes (e.g., select_mode)
        if (mode === 'light_placement_mode') return;
        let snap;
        try {
            snap = calcul_snap(e, 'off');
        } catch (err) {
            // If calcul_snap is unavailable, approximate using client coords relative to SVG viewBox
            const svg = document.getElementById('lin');
            if (!svg) return;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const ctm = svg.getScreenCTM();
            if (!ctm) return;
            const inv = ctm.inverse();
            const p = pt.matrixTransform(inv);
            snap = { x: p.x, y: p.y };
        }
        const nx = snap.x + draggingLightOffset.dx;
        const ny = snap.y + draggingLightOffset.dy;
        draggingLightItem.x = nx;
        draggingLightItem.y = ny;
        if (draggingLightItem.graph) {
            draggingLightItem.graph.attr({
                transform: `translate(${nx}, ${ny})`
            });
        }
        // Throttle saves while dragging
        clearTimeout(lightDragSaveTimeout);
        lightDragSaveTimeout = setTimeout(() => { try { save(); } catch (e) {} }, 150);
    }, true);

    document.addEventListener('mouseup', function() {
        if (!draggingLightItem) return;
        const justDropped = draggingLightItem;
        draggingLightItem = null;
        window.draggingLightItem = null;
        // Restore previous mode after drag ends
        if (window._prevModeBeforeLightDrag) {
            mode = window._prevModeBeforeLightDrag;
            window._prevModeBeforeLightDrag = null;
        }
        cursor('default');
        try { save(); } catch (e) {}
        if (justDropped) {
            $('#boxinfo').html('Placed ' + justDropped.name);
        }
    }, true);
}

// Export light data for save/load functionality
function getLightData() {
    const data = LIGHT_ITEMS.map(item => ({
        id: item.id,
        type: item.type,
        name: item.name,
        lightId: item.lightId,
        x: item.x,
        y: item.y
    }));
    // console.log('Saving light data:', data);
    return data;
}

// Load saved light data (for undo/redo operations)
function loadSavedLightData(lightData) {
    //console.log('Loading light data:', lightData);
    
    // Clear existing lights
    LIGHT_ITEMS.forEach(item => {
        if (item.graph) item.graph.remove();
    });
    LIGHT_ITEMS = [];
    
    // Recreate light items
    if (Array.isArray(lightData)) {
        lightData.forEach(data => {
           // console.log('Restoring light item:', data);
            
            // Find matching light type from LIGHT_DATA
            const lightType = LIGHT_DATA.find(l => l.id === data.lightId || l.type === data.type);
            if (lightType) {
                // Temporarily set selectedLightType for placeLightItem
                const originalSelected = selectedLightType;
                selectedLightType = lightType;
                
                placeLightItem(data.x, data.y, true); // Skip save during restoration
                const item = LIGHT_ITEMS[LIGHT_ITEMS.length - 1];
                
                if (item) {
                    item.id = data.id;
                    item.type = data.type;
                    item.name = data.name;
                    item.lightId = data.lightId;
                    
                    // Update visual representation
                    if (item.graph) {
                        item.graph.attr({
                            transform: `translate(${item.x}, ${item.y})`
                        });
                    }
                    
                    // Update label text to match restored name
                    try {
                        if (item.label) {
                            item.label.text((item.name || '').toLowerCase());
                        } else {
                            // Fallback: find first text element inside group
                            const g = item.graph && item.graph.get ? item.graph.get(0) : null;
                            if (g) {
                                const t = g.querySelector('text');
                                if (t) t.textContent = (item.name || '').toLowerCase();
                            }
                        }
                    } catch (e) {}
                } else {
                    console.warn('Failed to create light item:', data);
                }
                
                // Restore original selectedLightType
                selectedLightType = originalSelected;
            } else {
                console.warn('Light type not found for:', data);
            }
        });
    }
    
    // Save the restored light state to history
    if (lightData && lightData.length > 0) {
        save();
    }
}

// Clear all lights
function clearLights() {
    LIGHT_ITEMS.forEach(light => {
        if (light.graph) {
            light.graph.remove();
        }
    });
    LIGHT_ITEMS = [];
    if (typeof save === 'function') save();
    console.log('All lights cleared');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initLightSystem();
});
