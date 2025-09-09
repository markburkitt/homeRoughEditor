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
        // Initialize the Blender export data structure
        const blenderData = {
            wall_height: wallHeight,
            wall_thickness: wallThickness,
            floors: [],
            walls: [],
            cameras: [],
            builtins: [],
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
        const exwallObject = {
            material: "Walls",
            trim: "SquareTrim", 
            trim_material: "Walls",
            points: []
        };

        // Create wall object with all outlines
        const wallObject = {
            material: "Walls",
            trim: "SquareTrim", 
            trim_material: "Walls",
            points: []
        };
        
        if (externalOutline && externalOutline.length >= 1) {
            exwallObject.points = externalOutline;
        }
        else {
            console.log("No external outline found");
            console.log(external);
        }

        if (internalOutlines && internalOutlines.length > 0) {
            for (const outline of internalOutlines) {
                wallObject.points.push(outline);
            }
        }
        
        if (exwallObject.points.length > 0) {
            blenderData.walls.push(exwallObject);
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
                    blenderData.builtins.push({
                        asset: 'OpenDoor',
                        position: [x, y],
                        rotation: obj.angle || 0
                    });
                } else if (obj.type === 'window' || obj.type === 'windowDouble' || obj.type === 'windowBay' || obj.type === 'fix') {
                    blenderData.builtins.push({
                        asset: 'WindowPanel',
                        position: [x, y],
                        rotation: obj.angle || 0
                    });
                }
            }
        }

        // Convert light items to Blender format
        if (typeof LIGHT_ITEMS !== 'undefined' && Array.isArray(LIGHT_ITEMS)) {
            for (let i = 0; i < LIGHT_ITEMS.length; i++) {
                const light = LIGHT_ITEMS[i];
                if (light.x !== undefined && light.y !== undefined) {
                    // Convert position from pixels to meters and apply center offset
                    const x = parseFloat(((light.x / 60) - centerX).toFixed(2));
                    const y = parseFloat(((light.y / 60) - centerY).toFixed(2));
                    
                    let onCeiling = false;
                    if (typeof LIGHT_DATA !== 'undefined' && Array.isArray(LIGHT_DATA)) {
                        const lightType = LIGHT_DATA.find(f => f.id === light.lightId || f.type === light.type);
                        if (lightType && lightType.on_ceiling !== undefined) {
                            onCeiling = lightType.on_ceiling;
                        }
                    }

                    const asset = light.lightId || light.type || 'unknown';

                    blenderData.builtins.push({
                        asset: asset,
                        position: [x, y],
                        rotation: 0,
                        on_ceiling: onCeiling
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

        // Add unfurnished style
        blenderData.styles.push({
            name: "unfurnished",
            furniture: []
        });

        // Convert camera items to Blender format
        const cameraArray = [];
        if (typeof CAMERA_ITEMS !== 'undefined' && Array.isArray(CAMERA_ITEMS)) {
            for (let i = 0; i < CAMERA_ITEMS.length; i++) {
                const camera = CAMERA_ITEMS[i];
                if (camera.x !== undefined && camera.y !== undefined) {
                    // Convert position from pixels to meters and apply center offset
                    const x = parseFloat(((camera.x / 60) - centerX).toFixed(1));
                    const y = parseFloat(((camera.y / 60) - centerY).toFixed(1));
                    
                    // Get rotation and height
                    const rotation = (-camera.rotation || 0) - 90;
                    const height = camera.height || 1.2;
                    
                    cameraArray.push({
                        id: camera.id.toString(),
                        option: "01",
                        position: [x, y],
                        height: height,
                        rotation: rotation
                    });
                }
            }
        }
        
        // Add cameras to blender data
        blenderData.cameras = cameraArray;

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
 * Classify walls as internal or external based on room polygons
 * @returns {Object} Object with internal and external wall arrays
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
 * Build chains by stitching wall segments whose endpoints meet within a tolerance.
 * Returns all chains found as an array of chains (each chain is an array of [x, y] points).
 *
 * @param {Array} segments - Array of segments: [ [ [x1,y1], [x2,y2] ], ... ]
 * @param {number} [tolerance=0.03] - Max distance between endpoints to be considered matching
 * @returns {Array<Array<[number,number]>>} - Array of chains
 */
function buildExternalPolygon(segments, tolerance = 0.03) {
    if (!Array.isArray(segments) || segments.length === 0) {
        return [];
    }

    // Utility: distance between points
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

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

    // Make a mutable copy of segments
    const pool = segments.map(s => [[s[0][0], s[0][1]], [s[1][0], s[1][1]]]);

    let allChains = [];

    // Try building chains starting from each segment in the pool
    for (let startIdx = 0; startIdx < pool.length; startIdx++) {
        if (!pool[startIdx]) {
            continue; // already consumed
        }
        // Start a new chain
        let [a, b] = pool[startIdx];
        let chain = [a, b];
        pool[startIdx] = null; // consume

        // Extend chain forward until stuck
        let guard = 0;
        const maxIterations = segments.length + 5;
        while (guard++ < maxIterations) {
            const tail = chain[chain.length - 1];
            let found = false;
            
            for (let i = 0; i < pool.length; i++) {
                const seg = pool[i];
                if (!seg) continue;
                const sA = seg[0];
                const sB = seg[1];

                const distToA = dist(tail, sA);
                const distToB = dist(tail, sB);

                if (distToA <= tolerance) {
                    chain.push(sB);
                    pool[i] = null;
                    found = true;
                    break;
                } else if (distToB <= tolerance) {
                    chain.push(sA);
                    pool[i] = null;
                    found = true;
                    break;
                }
            }

            if (!found) {
                break; // stuck
            }
        }
        

        // Clean up the chain and add it to results
        const cleanChain = dedupeConsecutive(chain);
        if (cleanChain.length >= 2) {
            allChains.push(cleanChain);
        }
    }

    
    // Extra pass: try to connect loose chains by matching start/end points
    let connected = true;
    let connectionAttempts = 0;
    const maxConnectionAttempts = 10;
    
    while (connected && connectionAttempts < maxConnectionAttempts) {
        connected = false;
        connectionAttempts++;
        
        for (let i = 0; i < allChains.length; i++) {
            if (!allChains[i]) continue;
            
            const chainA = allChains[i];
            const startA = chainA[0];
            const endA = chainA[chainA.length - 1];
            
            for (let j = i + 1; j < allChains.length; j++) {
                if (!allChains[j]) continue;
                
                const chainB = allChains[j];
                const startB = chainB[0];
                const endB = chainB[chainB.length - 1];
                
                let mergedChain = null;
                let connectionType = '';
                
                // Check all possible connections
                if (dist(endA, startB) <= tolerance) {
                    // A-end connects to B-start: A + B
                    mergedChain = [...chainA, ...chainB.slice(1)];
                    connectionType = 'A-end to B-start';
                } else if (dist(endA, endB) <= tolerance) {
                    // A-end connects to B-end: A + reverse(B)
                    mergedChain = [...chainA, ...chainB.slice(0, -1).reverse()];
                    connectionType = 'A-end to B-end';
                } else if (dist(startA, startB) <= tolerance) {
                    // A-start connects to B-start: reverse(A) + B
                    mergedChain = [...chainA.slice(0, -1).reverse(), ...chainB];
                    connectionType = 'A-start to B-start';
                } else if (dist(startA, endB) <= tolerance) {
                    // A-start connects to B-end: B + A
                    mergedChain = [...chainB, ...chainA.slice(1)];
                    connectionType = 'A-start to B-end';
                }
                
                if (mergedChain) {
                    // Replace chainA with merged chain, remove chainB
                    allChains[i] = dedupeConsecutive(mergedChain);
                    allChains[j] = null;
                    connected = true;
                    break;
                }
            }
            
            if (connected) break;
        }
    }
    
    // Filter out null entries
    allChains = allChains.filter(chain => chain !== null);
    
    return allChains;
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