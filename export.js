/**
 * Export.js - Blender Export Functions Only
 * 
 * This file contains only Blender export functionality.
 * Other functions have been moved to separate modules:
 * - aiimport.js: AI import related functions
 * - persistence.js: Save/load floorplan functions  
 * - states.js: Mode switching functions
 * 
 * Load order in index.html should be:
 * 1. export.js (this file)
 * 2. aiimport.js
 * 3. persistence.js
 * 4. states.js
 */

/**
 * Export floorplan data for Blender in JSON format
 * @param {string} filename - Output filename
 * @param {number} wallHeight - Wall height in meters
 * @param {number} wallThickness - Wall thickness in meters
 */
function exportForBlender(filename = 'floorplan_blender', wallHeight = 2.8, wallThickness = 0.08) {
    try {
        const blenderData = {
            wall_height: wallHeight,
            wall_thickness: wallThickness,
            floors: [],
            walls: [],
            cameras: [],
            builtins: [],
            styles: []
        };

        // Calculate extents
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        // Get extents from walls
        for (let k in WALLS) {
            const wall = WALLS[k];
            minX = Math.min(minX, wall.start.x, wall.end.x);
            minY = Math.min(minY, wall.start.y, wall.end.y);
            maxX = Math.max(maxX, wall.start.x, wall.end.x);
            maxY = Math.max(maxY, wall.start.y, wall.end.y);
        }
        
        // Convert rooms to floors
        for (let i = 0; i < ROOM.length; i++) {
            const room = ROOM[i];
            if (room && room.polygon && room.polygon.length > 0) {
                const floor = {
                    id: `floor_${i}`,
                    points: room.polygon.map(p => [p.x / (typeof meter !== 'undefined' ? meter : 160), p.y / (typeof meter !== 'undefined' ? meter : 160)]),
                    material: 'floor_default'
                };
                blenderData.floors.push(floor);
            }
        }
        
        // Convert walls
        const wallClassification = classifyWalls();
        for (let k in WALLS) {
            const wall = WALLS[k];
            const isExternal = wallClassification.external.includes(wall);
            
            const blenderWall = {
                id: `wall_${k}`,
                start: [wall.start.x / (typeof meter !== 'undefined' ? meter : 160), wall.start.y / (typeof meter !== 'undefined' ? meter : 160)],
                end: [wall.end.x / (typeof meter !== 'undefined' ? meter : 160), wall.end.y / (typeof meter !== 'undefined' ? meter : 160)],
                thickness: wallThickness,
                height: wallHeight,
                type: isExternal ? 'external' : 'internal',
                material: isExternal ? 'wall_external' : 'wall_internal'
            };
            blenderData.walls.push(blenderWall);
        }
        
        // Convert objects (doors/windows)
        for (let k in OBJDATA) {
            const obj = OBJDATA[k];
            if (obj && obj.wall) {
                const builtin = {
                    id: `builtin_${k}`,
                    type: obj.type || 'door',
                    wall_id: `wall_${WALLS.indexOf(obj.wall)}`,
                    position: obj.pos || 0.5,
                    width: (obj.size || 0.8) / (typeof meter !== 'undefined' ? meter : 160),
                    height: wallHeight * 0.9
                };
                blenderData.builtins.push(builtin);
            }
        }
        
        // Convert furniture
        if (typeof FURNITURE_ITEMS !== 'undefined' && Array.isArray(FURNITURE_ITEMS)) {
            for (let item of FURNITURE_ITEMS) {
                const furniture = {
                    id: `furniture_${item.id}`,
                    type: 'furniture',
                    name: item.name || item.type,
                    position: [item.x / (typeof meter !== 'undefined' ? meter : 160), item.y / (typeof meter !== 'undefined' ? meter : 160)],
                    rotation: item.rotation || 0,
                    size: (item.size || 1) / (typeof meter !== 'undefined' ? meter : 160)
                };
                blenderData.builtins.push(furniture);
            }
        }
        
        // Convert lights
        if (typeof LIGHT_ITEMS !== 'undefined' && Array.isArray(LIGHT_ITEMS)) {
            for (let item of LIGHT_ITEMS) {
                const light = {
                    id: `light_${item.id}`,
                    type: 'light',
                    name: item.name || item.type,
                    position: [item.x / (typeof meter !== 'undefined' ? meter : 160), item.y / (typeof meter !== 'undefined' ? meter : 160), wallHeight * 0.9]
                };
                blenderData.builtins.push(light);
            }
        }
        
        // Convert cameras
        if (typeof CAMERA_ITEMS !== 'undefined' && Array.isArray(CAMERA_ITEMS)) {
            for (let item of CAMERA_ITEMS) {
                const camera = {
                    id: `camera_${item.id}`,
                    type: 'camera',
                    name: item.name || 'Security Camera',
                    position: [item.x / (typeof meter !== 'undefined' ? meter : 160), item.y / (typeof meter !== 'undefined' ? meter : 160), item.height || 2.5],
                    rotation: item.rotation || 0
                };
                blenderData.cameras.push(camera);
            }
        }
        
        // Add default materials
        blenderData.styles = [
            { id: 'floor_default', type: 'floor', color: '#f0f0f0' },
            { id: 'wall_external', type: 'wall', color: '#8b4513' },
            { id: 'wall_internal', type: 'wall', color: '#ddd' }
        ];
        
        // Create and download file
        const jsonStr = JSON.stringify(blenderData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (typeof $('#boxinfo') !== 'undefined') {
            $('#boxinfo').html(`Blender export completed: ${filename}.json`);
        }
        
    } catch (error) {
        console.error('Error exporting for Blender:', error);
        if (typeof $('#boxinfo') !== 'undefined') {
            $('#boxinfo').html('Blender export failed: ' + error.message);
        }
    }
}

/**
 * Classify walls as internal or external based on room polygons
 * @returns {Object} Object with internal and external wall arrays
 */
function classifyWalls() {
    const internal = [];
    const external = [];
    
    for (let k in WALLS) {
        const wall = WALLS[k];
        let touchingRooms = 0;
        
        // Check how many rooms this wall touches
        for (let i = 0; i < ROOM.length; i++) {
            const room = ROOM[i];
            if (room && room.polygon) {
                // Check if wall is part of room boundary
                for (let j = 0; j < room.polygon.length; j++) {
                    const p1 = room.polygon[j];
                    const p2 = room.polygon[(j + 1) % room.polygon.length];
                    
                    // Check if wall segment matches room edge
                    const dist1 = Math.hypot(wall.start.x - p1.x, wall.start.y - p1.y) + 
                                 Math.hypot(wall.end.x - p2.x, wall.end.y - p2.y);
                    const dist2 = Math.hypot(wall.start.x - p2.x, wall.start.y - p2.y) + 
                                 Math.hypot(wall.end.x - p1.x, wall.end.y - p1.y);
                    
                    if (Math.min(dist1, dist2) < 10) { // 10px tolerance
                        touchingRooms++;
                        break;
                    }
                }
            }
        }
        
        if (touchingRooms >= 2) {
            internal.push(wall);
        } else {
            external.push(wall);
        }
    }
    
    return { internal, external };
}

/**
 * Build external polygon from wall segments
 * @param {Array} walls - Array of wall objects
 * @returns {Array} Array of polygon points
 */
function buildExternalPolygon(walls) {
    if (!walls || walls.length === 0) return [];
    
    // Convert walls to segments
    const segments = walls.map(wall => [
        [wall.start.x, wall.start.y],
        [wall.end.x, wall.end.y]
    ]);
    
    // Build chains
    const chains = buildJoinedChains(segments);
    
    // Return the longest chain as the external polygon
    if (chains.length === 0) return [];
    
    let longestChain = chains[0];
    for (let i = 1; i < chains.length; i++) {
        if (chains[i].length > longestChain.length) {
            longestChain = chains[i];
        }
    }
    
    return longestChain;
}

/**
 * Build joined chains from wall segments
 * @param {Array} segments - Array of line segments [[x1,y1],[x2,y2]]
 * @param {number} tolerance - Distance tolerance for joining
 * @returns {Array} Array of chains, each chain is an array of points
 */
function buildJoinedChains(segments, tolerance = 0.03) {
    if (!Array.isArray(segments) || segments.length === 0) return [];
    
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const chains = [];
    const used = new Set();
    
    for (let i = 0; i < segments.length; i++) {
        if (used.has(i)) continue;
        
        const chain = [segments[i][0], segments[i][1]];
        used.add(i);
        
        let extended = true;
        while (extended) {
            extended = false;
            
            for (let j = 0; j < segments.length; j++) {
                if (used.has(j)) continue;
                
                const seg = segments[j];
                const chainStart = chain[0];
                const chainEnd = chain[chain.length - 1];
                
                // Try to extend at the end
                if (dist(chainEnd, seg[0]) < tolerance) {
                    chain.push(seg[1]);
                    used.add(j);
                    extended = true;
                    break;
                } else if (dist(chainEnd, seg[1]) < tolerance) {
                    chain.push(seg[0]);
                    used.add(j);
                    extended = true;
                    break;
                }
                
                // Try to extend at the start
                if (dist(chainStart, seg[0]) < tolerance) {
                    chain.unshift(seg[1]);
                    used.add(j);
                    extended = true;
                    break;
                } else if (dist(chainStart, seg[1]) < tolerance) {
                    chain.unshift(seg[0]);
                    used.add(j);
                    extended = true;
                    break;
                }
            }
        }
        
        // Clean up duplicate points
        const cleaned = [];
        for (let k = 0; k < chain.length; k++) {
            if (k === 0 || dist(chain[k], chain[k - 1]) > tolerance / 5) cleaned.push(chain[k]);
        }
        if (cleaned.length >= 2) chains.push(cleaned);
    }
    
    return chains;
}
