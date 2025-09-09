// Furniture placement functionality
let FURNITURE_DATA = [];
let FURNITURE_ITEMS = [];
let selectedFurnitureType = null;
let furnitureCursor = null;
let draggingFurnitureItem = null;
let draggingFurnitureOffset = { dx: 0, dy: 0 };
let furnitureDragSaveTimeout = null;

// Enter furniture placement mode
async function enterFurnitureMode() {
    mode = 'furniture_mode';
    $('.leftBox').hide();
    $('#furniturePanel').show();
    $('#boxinfo').html('Furniture placement mode - select furniture to place');
    
    
    // Load furniture data from JSON if not already loaded
    if (FURNITURE_DATA.length === 0) {
        await loadFurnitureData();
    }
    
    // Populate furniture options (data is now embedded)
    populateFurnitureOptions();
}

// Exit furniture placement mode
function exitFurnitureMode() {
    mode = 'select_mode';
    selectedFurnitureType = null;
    
    if (furnitureCursor) {
        furnitureCursor.attr('style', 'display: none');
    }
    
    // Reset furniture option buttons
    document.querySelectorAll('.furniture-option').forEach(btn => {
        btn.classList.remove('btn-success');
        btn.classList.add('btn-light');
    });
    
    // Hide furniture panel and show main panel
    $('#furniturePanel').hide();
    $('.leftBox').hide();
    $('#panel').show();
    $('#boxinfo').html('Selection mode');
}

// Load furniture data from JSON file
async function loadFurnitureData() {
    try {
        const response = await fetch('furniture.json');
        const data = await response.json();
        FURNITURE_DATA = data.furniture;
        // console.log('Loaded furniture data from furniture.json:', FURNITURE_DATA.length, 'items');
        populateFurnitureOptions();
    } catch (error) {
        console.error('Error loading furniture data:', error);
        // Fallback to empty array if file can't be loaded
        FURNITURE_DATA = [];
        console.log('Using empty fallback furniture data');
        populateFurnitureOptions();
    }
}

// Populate furniture options in the panel
function populateFurnitureOptions() {
    const optionsContainer = document.getElementById('furniture_options');
    if (!optionsContainer) {
        console.error('furniture_options container not found');
        return;
    }
    
    optionsContainer.innerHTML = '';
    
    // console.log('Populating furniture options:', FURNITURE_DATA);
    
    FURNITURE_DATA.filter(furniture => furniture.category !== 'light').forEach(furniture => {
        const button = document.createElement('button');
        button.className = 'btn btn-light fully furniture-option';
        button.style.marginBottom = '5px';
        button.style.width = '100%';
        button.textContent = furniture.name;
        button.onclick = () => selectFurnitureType(furniture);
        optionsContainer.appendChild(button);
    });
    
    if (FURNITURE_DATA.length === 0) {
        optionsContainer.innerHTML = '<p>No furniture data loaded</p>';
    }
}

// Select furniture type for placement
function selectFurnitureType(furniture) {
    selectedFurnitureType = furniture;
    mode = 'furniture_placement_mode';
    $('#boxinfo').html('Click to place ' + furniture.name);
    
    // Highlight selected furniture
    document.querySelectorAll('.furniture-option').forEach(btn => {
        btn.classList.remove('btn-success');
        btn.classList.add('btn-light');
    });
    event.target.classList.remove('btn-light');
    event.target.classList.add('btn-success');
    
    createFurnitureCursor();
}

// Create cursor icon for furniture placement
function createFurnitureCursor() {
    if (furnitureCursor) {
        furnitureCursor.remove();
    }
    
    // Create square with arrow cursor icon
    furnitureCursor = qSVG.create('boxbind', 'g', {
        id: 'furniture-cursor'
    });
    
    const square = qSVG.create('none', 'circle', {
        cx: 0,
        cy: 0,
        r: 15,
        fill: 'rgba(76, 175, 80, 0.7)',
        stroke: '#4CAF50',
        'stroke-width': 2
    });
    
    const arrow = qSVG.create('none', 'path', {
        d: 'M23,0 L17,-5 L17,5 Z',
        fill: '#2E7D32',
        stroke: '#2E7D32',
        'stroke-width': 1,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round'
    });
    
    furnitureCursor.append(square);
    furnitureCursor.append(arrow);
    furnitureCursor.attr('style', 'display: none');
}

// Update cursor position
function updateFurnitureCursor(x, y) {
    if (furnitureCursor && mode === 'furniture_placement_mode') {
        furnitureCursor.attr({
            transform: `translate(${x}, ${y})`,
            style: 'display: block'
        });
    }
}

// Place furniture item on the floorplan
function placeFurnitureItem(x, y, skipSave = false) {
    if (!selectedFurnitureType) return;
    
    const furnitureItem = {
        id: generateFurnitureId(),
        type: selectedFurnitureType.type,
        name: selectedFurnitureType.name,
        furnitureId: selectedFurnitureType.id,
        category: selectedFurnitureType.category || '',
        x: x,
        y: y,
        rotation: 0,
        graph: null,
        rotGroup: null,
        label: null
    };
    
    // Create visual representation (outer group translates, inner group rotates)
    const furnitureGroup = qSVG.create('boxFurniture', 'g', {
        id: 'furniture-' + furnitureItem.id,
        class: 'furniture-item',
        'data-furniture-id': furnitureItem.id
    });
    const furnitureRotGroup = qSVG.create('none', 'g', { class: 'furniture-rot' });
    
    // Create furniture icon (circle with arrow)
    const icon = qSVG.create('none', 'circle', {
        cx: 0,
        cy: 0,
        r: 20,
        fill: '#8BC34A',
        stroke: '#689F38',
        'stroke-width': 2
    });
    
    const arrow = qSVG.create('none', 'path', {
        d: 'M30,0 L22,-6 L22,6 Z',
        fill: '#33691E',
        stroke: '#33691E',
        'stroke-width': 1,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round'
    });
    
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
    label.text((furnitureItem.name || '').toLowerCase());
    
    furnitureRotGroup.append(icon);
    furnitureRotGroup.append(arrow);
    furnitureGroup.append(furnitureRotGroup);
    furnitureGroup.append(label);

    // Assign references BEFORE rendering icon so it can attach to the outer group
    furnitureItem.graph = furnitureGroup;
    furnitureItem.rotGroup = furnitureRotGroup;
    // Keep a reference to the label for future updates (e.g., on restore)
    furnitureItem.label = label;

    // Ensure category is synced from latest FURNITURE_DATA before rendering icon
    try {
        const latest = Array.isArray(FURNITURE_DATA) ? FURNITURE_DATA.find(f => f.id === furnitureItem.furnitureId) : null;
        if (latest && typeof latest.category !== 'undefined') {
            furnitureItem.category = latest.category;
        }
    } catch (e) {}
    // Render category icon inside the circle
    renderFurnitureIcon(furnitureItem);

    furnitureGroup.attr({
        transform: `translate(${x}, ${y})`
    });
    furnitureRotGroup.attr({
        transform: `rotate(${furnitureItem.rotation})`
    });
    // Add furniture to the DOM - append to boxFurniture group
    const furnitureBox = document.getElementById('boxFurniture');
    if (furnitureBox) {
        furnitureBox.appendChild(furnitureGroup.get(0));
    }
    
    FURNITURE_ITEMS.push(furnitureItem);
    
    // Add click handler for selection (only in furniture modes)
    furnitureGroup.on('click', function(e) {
        e.stopPropagation();
        if (mode === 'furniture_mode' || mode === 'furniture_placement_mode') {
            selectFurnitureItem(furnitureItem);
        }
    });

    // Add mousedown handler to start drag only if this item is selected
    furnitureGroup.on('mousedown', function(e) {
        // Do not allow dragging during placement mode
        if (mode === 'furniture_placement_mode') return;
        // Only start dragging if this item is currently selected
        if (window.selectedFurnitureItem !== furnitureItem) return;
        e.preventDefault();
        e.stopPropagation();
        // Use existing snap helper to get SVG coords if available
        try {
            const snap = calcul_snap(e, 'off');
            draggingFurnitureOffset.dx = furnitureItem.x - snap.x;
            draggingFurnitureOffset.dy = furnitureItem.y - snap.y;
        } catch (err) {
            // Fallback: no offset, will jump under cursor
            draggingFurnitureOffset.dx = 0;
            draggingFurnitureOffset.dy = 0;
        }
        draggingFurnitureItem = furnitureItem;
        window.draggingFurnitureItem = furnitureItem;
        // Temporarily switch to furniture_mode to prevent select-mode panning
        window._prevModeBeforeFurnitureDrag = mode;
        mode = 'furniture_mode';
        // Ensure engine's panning is disabled even if it set drag='on' in capture phase
        try { window.drag = 'off'; } catch (_) {}
        $('#boxinfo').html('Dragging ' + furnitureItem.name + ' (release to drop)');
        cursor('move');
    });
    
    // Only update UI state and mode when this is a user placement, not restoration
    if (!skipSave) {
        $('#boxinfo').html('Placed ' + furnitureItem.name);
        // Clear selection and reset to furniture mode
        selectedFurnitureType = null;
        mode = 'furniture_mode';
        // Hide furniture cursor
        if (furnitureCursor) {
            furnitureCursor.attr('style', 'display: none');
        }
        // Reset furniture option buttons
        document.querySelectorAll('.furniture-option').forEach(btn => {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-light');
        });
        // Ensure furniture panel stays visible
        $('#furniturePanel').show();
        save();
    }
}

// Generate unique furniture ID
function generateFurnitureId() {
    return 'furn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Select furniture item for editing
function selectFurnitureItem(furnitureItem) {
    // Stay in furniture_mode while a furniture item is selected to avoid wall interactions
    mode = 'furniture_mode';
    selectedFurnitureType = null;
    
    // Hide all panels first
    $('.leftBox').hide();
    
    // Show furniture details panel
    $('#furnitureName').text(furnitureItem.name);
    $('#furnitureId').text(furnitureItem.furnitureId);
    // Always use the latest category from FURNITURE_DATA in case furniture.json changed
    try {
        const latest = Array.isArray(FURNITURE_DATA) ? FURNITURE_DATA.find(f => f.id === furnitureItem.furnitureId) : null;
        let latestCategory = furnitureItem.category || '';
        if (latest && Object.prototype.hasOwnProperty.call(latest, 'category')) {
            latestCategory = latest.category; // allow empty string
        }
        furnitureItem.category = latestCategory; // keep the item in sync
        $('#furnitureCategory').text(latestCategory);
        // Refresh icon according to updated category
        renderFurnitureIcon(furnitureItem);
    } catch (e) {}
    $('#furnitureRotationValue').text(furnitureItem.rotation || 0);
    $('#furnitureRotationSlider').val(furnitureItem.rotation || 0);
    
    $('#furnitureTools').show();
    
    // Store reference for removal
    window.selectedFurnitureItem = furnitureItem;
    
    // Highlight selected furniture
    document.querySelectorAll('.furniture-item').forEach(item => {
        item.style.opacity = '0.5';
    });
    furnitureItem.graph.get(0).style.opacity = '1';
    furnitureItem.graph.get(0).style.filter = 'drop-shadow(0 0 5px #FF5722)';
}

// Remove furniture item
function removeFurnitureItem(furnitureItem) {
    if (furnitureItem && furnitureItem.graph) {
        furnitureItem.graph.remove();
        const index = FURNITURE_ITEMS.indexOf(furnitureItem);
        if (index > -1) {
            FURNITURE_ITEMS.splice(index, 1);
        }
        save();
    }
}

// Close furniture placement mode
function closeFurnitureMode() {
    exitFurnitureMode();
}

// Hide furniture tools panel
function hideFurnitureTools() {
    $('#furnitureTools').hide();
    window.selectedFurnitureItem = null;
    
    // Reset furniture highlighting
    document.querySelectorAll('.furniture-item').forEach(item => {
        item.style.opacity = '1';
        item.style.filter = 'none';
    });
    
    // Show furniture panel to return to furniture mode
    $('.leftBox').hide();
    $('#furniturePanel').show();
    mode = 'furniture_mode';
    $('#boxinfo').html('Furniture placement mode - select furniture to place');
}

// Toggle furniture layer visibility
function toggleFurnitureLayer(visible) {
    const furnitureLayer = document.getElementById('boxFurniture');
    if (furnitureLayer) {
        furnitureLayer.style.display = visible ? 'block' : 'none';
    }
}

// Initialize furniture system
async function initFurnitureSystem() {
    // No need to load data - it's now embedded
    
    // Add furniture removal handler
    document.getElementById('furnitureRemove').addEventListener('click', function() {
        if (window.selectedFurnitureItem) {
            removeFurnitureItem(window.selectedFurnitureItem);
            hideFurnitureTools();
            $('#boxinfo').html('Furniture removed');
        }
    });
    
    // Add rotation slider handler with throttling for smooth updates
    let rotationTimeout;
    document.getElementById('furnitureRotationSlider').addEventListener('input', function() {
        if (window.selectedFurnitureItem) {
            const rotation = parseInt(this.value);
            window.selectedFurnitureItem.rotation = rotation;
            $('#furnitureRotationValue').text(rotation);
            
            // Apply transform split: translate on outer group, rotate on inner group
            if (window.selectedFurnitureItem.graph) {
                window.selectedFurnitureItem.graph.attr({
                    transform: `translate(${window.selectedFurnitureItem.x}, ${window.selectedFurnitureItem.y})`
                });
            }
            if (window.selectedFurnitureItem.rotGroup) {
                window.selectedFurnitureItem.rotGroup.attr({
                    transform: `rotate(${rotation})`
                });
            }
            
            // Throttle save operations to avoid excessive calls
            clearTimeout(rotationTimeout);
            rotationTimeout = setTimeout(() => {
                save();
            }, 100);
        }
    });
    
    // Add layer toggle handler
    document.getElementById('showLayerFurniture').addEventListener('change', function() {
        toggleFurnitureLayer(this.checked);
    });

    // Global mousemove/up handlers for dragging furniture
    document.addEventListener('mousemove', function(e) {
        if (!draggingFurnitureItem) return;
        // Do not drag during placement mode, but allow in other modes (e.g., select_mode)
        if (mode === 'furniture_placement_mode') return;
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
        const nx = snap.x + draggingFurnitureOffset.dx;
        const ny = snap.y + draggingFurnitureOffset.dy;
        draggingFurnitureItem.x = nx;
        draggingFurnitureItem.y = ny;
        if (draggingFurnitureItem.graph) {
            draggingFurnitureItem.graph.attr({
                transform: `translate(${nx}, ${ny})`
            });
        }
        if (draggingFurnitureItem.rotGroup) {
            draggingFurnitureItem.rotGroup.attr({
                transform: `rotate(${draggingFurnitureItem.rotation || 0})`
            });
        }
        // Throttle saves while dragging
        clearTimeout(furnitureDragSaveTimeout);
        furnitureDragSaveTimeout = setTimeout(() => { try { save(); } catch (e) {} }, 150);
    }, true);

    document.addEventListener('mouseup', function() {
        if (!draggingFurnitureItem) return;
        const justDropped = draggingFurnitureItem;
        draggingFurnitureItem = null;
        window.draggingFurnitureItem = null;
        // Restore previous mode after drag ends
        if (window._prevModeBeforeFurnitureDrag) {
            mode = window._prevModeBeforeFurnitureDrag;
            window._prevModeBeforeFurnitureDrag = null;
        }
        cursor('default');
        try { save(); } catch (e) {}
        if (justDropped) {
            $('#boxinfo').html('Placed ' + justDropped.name);
        }
    }, true);
}

// Export furniture data for save/load functionality
function getFurnitureData() {
    const data = FURNITURE_ITEMS.map(item => ({
        id: item.id,
        type: item.type,
        name: item.name,
        furnitureId: item.furnitureId,
        category: item.category || '',
        x: item.x,
        y: item.y,
        rotation: item.rotation
    }));
   //  console.log('Saving furniture data:', data);
    return data;
}

// Load saved furniture data (for undo/redo operations)
async function loadSavedFurnitureData(furnitureData) {
    //console.log('Loading furniture data:', furnitureData);
    
    // Ensure FURNITURE_DATA is loaded before restoring furniture
    if (FURNITURE_DATA.length === 0) {
        await loadFurnitureData();
    }
    
    // Clear existing furniture
    FURNITURE_ITEMS.forEach(item => {
        if (item.graph) item.graph.remove();
    });
    FURNITURE_ITEMS = [];
    
    // Recreate furniture items
    if (Array.isArray(furnitureData)) {
        furnitureData.forEach(data => {
            //console.log('Restoring furniture item:', data);
            
            // Find matching furniture type from FURNITURE_DATA
            const furnitureType = FURNITURE_DATA.find(f => f.id === data.furnitureId || f.type === data.type);
            if (furnitureType) {
                // Temporarily set selectedFurnitureType for placeFurnitureItem
                const originalSelected = selectedFurnitureType;
                selectedFurnitureType = furnitureType;
                
                placeFurnitureItem(data.x, data.y, true); // Skip save during restoration
                const item = FURNITURE_ITEMS[FURNITURE_ITEMS.length - 1];
                
                if (item) {
                    item.id = data.id;
                    item.type = data.type;
                    item.name = data.name;
                    item.furnitureId = data.furnitureId;
                    // Prefer the latest category from FURNITURE_DATA over saved data, respecting empty string
                    try {
                        const latest = Array.isArray(FURNITURE_DATA) ? FURNITURE_DATA.find(f => f.id === data.furnitureId) : null;
                        if (latest && Object.prototype.hasOwnProperty.call(latest, 'category')) {
                            item.category = latest.category; // may be ''
                        } else if (Object.prototype.hasOwnProperty.call(data, 'category')) {
                            item.category = data.category; // may be ''
                        } else if (furnitureType && Object.prototype.hasOwnProperty.call(furnitureType, 'category')) {
                            item.category = furnitureType.category;
                        } else {
                            item.category = '';
                        }
                    } catch (_) {
                        if (Object.prototype.hasOwnProperty.call(data, 'category')) {
                            item.category = data.category;
                        } else if (furnitureType && Object.prototype.hasOwnProperty.call(furnitureType, 'category')) {
                            item.category = furnitureType.category;
                        } else {
                            item.category = '';
                        }
                    }
                    item.rotation = data.rotation || 0;
                    
                    // console.log('Setting rotation to:', item.rotation);
                    
                    // Update visual representation: translate outer group, rotate inner group
                    if (item.graph) {
                        item.graph.attr({
                            transform: `translate(${item.x}, ${item.y})`
                        });
                    }
                    if (item.rotGroup) {
                        item.rotGroup.attr({
                            transform: `rotate(${item.rotation})`
                        });
                    } else {
                        // Fallback: find rot group if restoring from older session
                        const g = item.graph && item.graph.get ? item.graph.get(0) : null;
                        if (g) {
                            const rg = g.querySelector('g.furniture-rot');
                            if (rg) {
                                $(rg).attr('transform', `rotate(${item.rotation})`);
                                item.rotGroup = $(rg);
                            }
                        }
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

                    // Ensure category icon is rendered/updated after restore
                    renderFurnitureIcon(item);

                    // If this restored item is currently selected, refresh the panel category
                    try {
                        if (window.selectedFurnitureItem === item) {
                            $('#furnitureCategory').text(item.category || '');
                        }
                    } catch (e) {}
                } else {
                    console.warn('Failed to create furniture item:', data);
                }
                
                // Restore original selectedFurnitureType
                selectedFurnitureType = originalSelected;
            } else {
                console.warn('Furniture type not found for:', data);
            }
        });
    }
    
    // Save the restored furniture state to history
    // This ensures the furniture data is properly saved after restoration
    if (furnitureData && furnitureData.length > 0) {
        save();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initFurnitureSystem();
});

// Map category to Font Awesome icon class
function getCategoryIconClass(category) {
    const cat = (category || '').toLowerCase();
    switch (cat) {
        case 'bed': return 'fa-solid fa-bed';
        case 'chair': return 'fa-solid fa-chair';
        case 'sofa': return 'fa-solid fa-couch';
        case 'light': return 'fa-solid fa-lightbulb';
        case 'utility': return 'fa-solid fa-toilet-portable';
        case 'table': return 'fa-solid fa-table-cells-large';
        default: return 'fa-solid fa-star'; // "empty" or unknown
    }
}

// Create or update the icon inside the furniture item (non-rotating)
function renderFurnitureIcon(furnitureItem) {
    if (!furnitureItem || !furnitureItem.graph) return;
    const outer = furnitureItem.graph.get ? furnitureItem.graph.get(0) : null;
    if (!outer) return;
    const ICON_SIZE = 28; // was 24, make icon a bit bigger
    const HALF = ICON_SIZE / 2;

    // Remove any icon previously attached to the rotating group to prevent rotation
    try {
        const oldInRot = furnitureItem.rotGroup && furnitureItem.rotGroup.get ? furnitureItem.rotGroup.get(0).querySelector('foreignObject.furniture-icon') : null;
        if (oldInRot) oldInRot.remove();
    } catch (_) {}

    // Try to find an existing foreignObject with our marker class on the outer group
    let fo = outer.querySelector('foreignObject.furniture-icon');
    if (!fo) {
        // Create a centered 24x24 foreignObject inside the circle (radius 20)
        fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        fo.setAttribute('class', 'furniture-icon');
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
        iEl.setAttribute('aria-hidden', 'true');
        div.appendChild(iEl);
        fo.appendChild(div);
        outer.appendChild(fo);
    }
    // Always ensure position/size reflects current constants (in case we change size later)
    fo.setAttribute('x', -HALF);
    fo.setAttribute('y', -HALF);
    fo.setAttribute('width', ICON_SIZE);
    fo.setAttribute('height', ICON_SIZE);
    const divWrap = fo.firstChild;
    if (divWrap && divWrap.style) {
        divWrap.style.width = ICON_SIZE + 'px';
        divWrap.style.height = ICON_SIZE + 'px';
    }
    const iEl = fo.querySelector('i');
    if (!iEl) return;
    iEl.className = getCategoryIconClass(furnitureItem.category);
    iEl.style.fontSize = '18px';
    iEl.style.color = '#ffffff';
}
