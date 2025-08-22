// Furniture placement functionality
let FURNITURE_DATA = [];
let FURNITURE_ITEMS = [];
let selectedFurnitureType = null;
let furnitureCursor = null;

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
        console.log('Loaded furniture data from furniture.json:', FURNITURE_DATA.length, 'items');
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
    
    console.log('Populating furniture options:', FURNITURE_DATA);
    
    FURNITURE_DATA.forEach(furniture => {
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
    
    const square = qSVG.create('none', 'rect', {
        x: -15,
        y: -15,
        width: 30,
        height: 30,
        fill: 'rgba(76, 175, 80, 0.7)',
        stroke: '#4CAF50',
        'stroke-width': 2
    });
    
    const arrow = qSVG.create('none', 'path', {
        d: 'M-8,-8 L8,0 L-8,8 Z',
        fill: '#2E7D32',
        stroke: '#2E7D32',
        'stroke-width': 1
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
        x: x,
        y: y,
        rotation: 0,
        graph: null
    };
    
    // Create visual representation
    const furnitureGroup = qSVG.create('boxFurniture', 'g', {
        id: 'furniture-' + furnitureItem.id,
        class: 'furniture-item',
        'data-furniture-id': furnitureItem.id
    });
    
    // Create furniture icon (square with arrow)
    const icon = qSVG.create('none', 'rect', {
        x: -20,
        y: -20,
        width: 40,
        height: 40,
        fill: '#8BC34A',
        stroke: '#689F38',
        'stroke-width': 2,
        rx: 3
    });
    
    const arrow = qSVG.create('none', 'path', {
        d: 'M-10,-10 L10,0 L-10,10 Z',
        fill: '#33691E',
        stroke: '#33691E',
        'stroke-width': 1
    });
    
    // Create text label
    const label = qSVG.create('none', 'text', {
        x: 0,
        y: 35,
        'text-anchor': 'middle',
        'font-family': 'roboto',
        'font-size': '12px',
        fill: '#333',
        'font-weight': 'bold'
    });
    label.textContent = furnitureItem.name;
    
    furnitureGroup.append(icon);
    furnitureGroup.append(arrow);
    furnitureGroup.append(label);
    
    furnitureGroup.attr({
        transform: `translate(${x}, ${y}) rotate(${furnitureItem.rotation})`
    });
    
    furnitureItem.graph = furnitureGroup;
    FURNITURE_ITEMS.push(furnitureItem);
    
    // Add click handler for selection (only in furniture mode)
    furnitureGroup.on('click', function(e) {
        e.stopPropagation();
        if (mode === 'furniture_mode' || mode === 'furniture_placement_mode') {
            selectFurnitureItem(furnitureItem);
        }
    });
    
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
    
    if (!skipSave) {
        save();
    }
}

// Generate unique furniture ID
function generateFurnitureId() {
    return 'furn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Select furniture item for editing
function selectFurnitureItem(furnitureItem) {
    mode = 'select_mode';
    selectedFurnitureType = null;
    
    // Hide all panels first
    $('.leftBox').hide();
    
    // Show furniture details panel
    $('#furnitureName').text(furnitureItem.name);
    $('#furnitureType').text(furnitureItem.type);
    $('#furnitureId').text(furnitureItem.furnitureId);
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
            
            // Apply rotation to the furniture item immediately for smooth visual feedback
            window.selectedFurnitureItem.graph.attr({
                transform: `translate(${window.selectedFurnitureItem.x}, ${window.selectedFurnitureItem.y}) rotate(${rotation})`
            });
            
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
}

// Export furniture data for save/load functionality
function getFurnitureData() {
    const data = FURNITURE_ITEMS.map(item => ({
        id: item.id,
        type: item.type,
        name: item.name,
        furnitureId: item.furnitureId,
        x: item.x,
        y: item.y,
        rotation: item.rotation
    }));
    console.log('Saving furniture data:', data);
    return data;
}

// Load saved furniture data (for undo/redo operations)
async function loadSavedFurnitureData(furnitureData) {
    console.log('Loading furniture data:', furnitureData);
    
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
            console.log('Restoring furniture item:', data);
            
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
                    item.rotation = data.rotation || 0;
                    
                    console.log('Setting rotation to:', item.rotation);
                    
                    // Update visual representation with proper rotation
                    item.graph.attr({
                        transform: `translate(${item.x}, ${item.y}) rotate(${item.rotation})`
                    });
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
