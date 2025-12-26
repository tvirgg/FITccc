import React, { useRef, useEffect, useState } from 'react';

// --- Constants & Types ---

const CANVAS_WIDTH = 800; // Internal resolution width
const CANVAS_HEIGHT = 900; // Internal resolution height
const WORLD_WIDTH = 6000; // 3x bigger world!
const WORLD_HEIGHT = 6000;
const FOREST_BORDER = 400; // Dark forest perimeter width
const CAPY_SPEED = 5; // Slightly faster for bigger world
const DRAGON_SPEED = 3.2; // Dragon speed - немного медленнее игрока
const SCALE = 0.5; // Zoom out factor (0.5 = see 2x more)
const APPLES_TO_WIN = 10; // Collect 10 apples to win!
const DRAGON_ATTACK_RANGE = 70; // Дистанция атаки дракона
const DRAGON_DAMAGE = 10; // Урон дракона (уменьшен)
const DAMAGE_COOLDOWN = 150; // Кулдаун урона (кадры) - увеличен для избежания лагов
const CAPY_ATTACK_RANGE = 100; // Дистанция атаки капибары
const CAPY_DAMAGE = 15; // Урон капибары по дракону (x3!)
const CAPY_WEAK_DAMAGE = 5; // Слабый урон без яблок
const ATTACK_COOLDOWN = 30; // Кулдаун атаки игрока - увеличен для меньшего спама
const DRAGON_FIGHT_DAMAGE_COOLDOWN = 250; // Кулдаун атаки дракона в фазе боя (медленнее)

// Фазы игры
type GamePhase = 'COLLECT' | 'EATING' | 'FIGHT';
type GameMode = 'INTRO' | 'PLAYING' | 'DIALOGUE' | 'CASTLE_SCENE' | 'BOSS_INTRO' | 'BOSS_FIGHT' | 'VICTORY' | 'GAME_OVER' | 'MENU';

interface Entity {
    id: number;
    type: 'capy' | 'flower' | 'tree' | 'rock' | 'castle' | 'princess' | 'dragon' | 'signpost' | 'apple' | 'house' | 'mountain' | 'farm' | 'lake' | 'well' | 'windmill' | 'campfire' | 'bridge' | 'fence' | 'bush' | 'mushroom';
    x: number;
    y: number;
    width: number;
    height: number;
    data?: any;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

export const CapybaraGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // UI State
    const [gameMode, setGameMode] = useState<GameMode>('INTRO');
    const [dialogueText, setDialogueText] = useState<string>('');
    const [showMenu, setShowMenu] = useState(false);
    const [dragonHP, setDragonHP] = useState(100);
    const [capyHP, setCapyHP] = useState(100);
    const [showBossUI, setShowBossUI] = useState(false);
    const [score, setScore] = useState(0);
    const [gamePhase, setGamePhase] = useState<GamePhase>('COLLECT');
    const [canAttack, setCanAttack] = useState(false);
    const [waveNumber, setWaveNumber] = useState(0);
    const [dragonsRemaining, setDragonsRemaining] = useState(0);
    const [targetDragonHP, setTargetDragonHP] = useState(0); // HP текущего целевого дракона

    // Refs for game loop state (mutable without re-renders)
    const gameState = useRef({
        capy: { x: 100, y: 100, direction: 1, frame: 0, moving: false, invulnerable: 0, hp: 100, attackCooldown: 0, isAttacking: 0 },
        camera: { x: 0, y: 0 },
        entities: [] as Entity[],
        particles: [] as Particle[],
        keys: {} as Record<string, boolean>,
        mode: 'INTRO' as GameMode, // Mirror state for loop access
        dialogueQueue: [] as string[],
        boss: { x: 0, y: 0, vx: 0, vy: 0, active: true, frame: 0, cooldown: 0, hp: 100, attackCooldown: 0, hitCooldown: 0 },
        phase: 'COLLECT' as GamePhase,
        applesCollected: 0,
        eatingTimer: 0,
        damageFlash: 0,
        dragonDamageFlash: 0,
        dragonDefeated: false,
        // Wave system
        waveNumber: 0, // 0 = initial dragon, 1 = 2 dragons, 2 = 4 dragons, 3 = 6 dragons, 4 = 8 dragons (final)
        dragons: [] as { id: number; x: number; y: number; hp: number; hitCooldown: number; damageFlash: number }[],
        princessMet: false,
        waveInProgress: false,
        allWavesCompleted: false
    });

    // Helper to start dialogue
    const startDialogue = (texts: string[]) => {
        gameState.current.dialogueQueue = texts;
        gameState.current.mode = 'DIALOGUE';
        setGameMode('DIALOGUE');
        const next = gameState.current.dialogueQueue.shift();
        if (next) setDialogueText(next);
    };

    const advanceDialogue = () => {
        if (gameState.current.dialogueQueue.length > 0) {
            const next = gameState.current.dialogueQueue.shift();
            if (next) setDialogueText(next);
        } else {
            // End of dialogue
            // Check context to see where to go next
            if (gameState.current.waveInProgress) {
                // Wave is in progress, go to playing mode
                gameState.current.mode = 'PLAYING';
                setGameMode('PLAYING');
                setShowBossUI(true);
            } else if (gameState.current.boss.active) {
                gameState.current.mode = 'BOSS_FIGHT';
                setGameMode('BOSS_FIGHT');
                setShowBossUI(true);
            } else if (gameState.current.allWavesCompleted) {
                // Game complete, stay in victory
                gameState.current.mode = 'VICTORY';
                setGameMode('VICTORY');
            } else {
                gameState.current.mode = 'PLAYING';
                setGameMode('PLAYING');
            }
        }
    };

    // Function to spawn a wave of dragons
    const spawnDragonWave = (count: number) => {
        const state = gameState.current;
        const princess = state.entities.find(e => e.type === 'princess');
        const centerX = princess ? princess.x : WORLD_WIDTH / 2;
        const centerY = princess ? princess.y : WORLD_HEIGHT / 2;

        state.dragons = [];

        for (let i = 0; i < count; i++) {
            // Spawn dragons in a circle around the princess/castle
            const angle = (Math.PI * 2 * i) / count;
            const distance = 500 + Math.random() * 200;
            const dragonX = centerX + Math.cos(angle) * distance;
            const dragonY = centerY + Math.sin(angle) * distance;

            const dragonId = 10000 + state.waveNumber * 100 + i;

            state.dragons.push({
                id: dragonId,
                x: dragonX,
                y: dragonY,
                hp: 80, // Slightly less HP than boss dragon
                hitCooldown: 0,
                damageFlash: 0
            });

            // Add dragon entity
            state.entities.push({
                id: dragonId,
                type: 'dragon',
                x: dragonX,
                y: dragonY,
                width: 100,
                height: 100
            });
        }

        state.waveInProgress = true;
        setShowBossUI(true);
    };

    // --- Initialization ---
    useEffect(() => {
        const state = gameState.current;
        console.log("CapybaraGame: Initializing...");

        // Reset State
        state.entities = [];
        state.particles = [];
        state.phase = 'COLLECT';
        state.applesCollected = 0;
        state.capy.hp = 100;
        state.boss.hp = 100;

        // --- Populating World ---

        // Safe zone is inside the forest border
        const safeZoneStart = FOREST_BORDER + 100;
        const safeZoneEnd = WORLD_WIDTH - FOREST_BORDER - 100;

        // 1. Capy Start (Center of safe zone - away from forest edges)
        state.capy.x = safeZoneStart + 200;
        state.capy.y = safeZoneStart + 200;

        // Initialize camera centered on capybara
        const viewWidth = CANVAS_WIDTH / SCALE;
        const viewHeight = CANVAS_HEIGHT / SCALE;
        state.camera.x = state.capy.x - viewWidth / 2;
        state.camera.y = state.capy.y - viewHeight / 2;

        // 2. Spawn Castle at center of world
        const castleX = WORLD_WIDTH / 2 - 100;
        const castleY = WORLD_HEIGHT / 2 - 100;
        state.entities.push({
            id: -100, type: 'castle', x: castleX, y: castleY, width: 200, height: 160
        });

        // 3. Spawn Princess near castle entrance
        state.entities.push({
            id: -98, type: 'princess', x: castleX + 90, y: castleY + 130, width: 20, height: 30
        });

        // 4. Dragon starts near the player and CHASES from the beginning!
        state.boss.active = true; // Dragon is active immediately!
        state.boss.x = state.capy.x + 400; // Spawn dragon nearby
        state.boss.y = state.capy.y + 300;
        state.boss.hp = 100;
        state.boss.cooldown = 0;
        state.boss.hitCooldown = 0;
        state.dragonDefeated = false;
        state.entities.push({
            id: -99, type: 'dragon', x: state.boss.x, y: state.boss.y, width: 100, height: 100
        });

        // 3. Spawn LOTS of Apples scattered across the safe zone
        const numApples = 60; // More apples for bigger map
        for (let i = 0; i < numApples; i++) {
            const x = safeZoneStart + Math.random() * (safeZoneEnd - safeZoneStart);
            const y = safeZoneStart + Math.random() * (safeZoneEnd - safeZoneStart);

            // Don't spawn too close to player start
            const distToStart = Math.sqrt(Math.pow(x - state.capy.x, 2) + Math.pow(y - state.capy.y, 2));
            if (distToStart < 200) continue;

            state.entities.push({
                id: 1000 + i,
                type: 'apple',
                x, y,
                width: 25,
                height: 25
            });
        }

        // 4. Random Trees & Rocks scattered in safe zone (less trees for better visibility)
        for (let i = 0; i < 200; i++) {
            const isTree = Math.random() > 0.4;
            const x = safeZoneStart + Math.random() * (safeZoneEnd - safeZoneStart);
            const y = safeZoneStart + Math.random() * (safeZoneEnd - safeZoneStart);

            // Avoid spawn area
            const distToStart = Math.sqrt(Math.pow(x - state.capy.x, 2) + Math.pow(y - state.capy.y, 2));
            if (distToStart < 150) continue;

            state.entities.push({
                id: i,
                type: isTree ? 'tree' : 'rock',
                x, y,
                width: isTree ? 40 : 30,
                height: isTree ? 25 : 18,
                data: { variant: Math.floor(Math.random() * 3) }
            });
        }

        // 5. Dense dark forest trees along the perimeter
        for (let i = 0; i < 600; i++) {
            let x, y;
            const side = Math.floor(Math.random() * 4);

            if (side === 0) { // Top
                x = Math.random() * WORLD_WIDTH;
                y = Math.random() * FOREST_BORDER;
            } else if (side === 1) { // Bottom
                x = Math.random() * WORLD_WIDTH;
                y = WORLD_HEIGHT - Math.random() * FOREST_BORDER;
            } else if (side === 2) { // Left
                x = Math.random() * FOREST_BORDER;
                y = Math.random() * WORLD_HEIGHT;
            } else { // Right
                x = WORLD_WIDTH - Math.random() * FOREST_BORDER;
                y = Math.random() * WORLD_HEIGHT;
            }

            state.entities.push({
                id: 5000 + i,
                type: 'tree',
                x, y,
                width: 50,
                height: 35,
                data: { variant: 2, dark: true } // Dark forest variant
            });
        }

        // === NEW DECORATIONS ===

        // 6. SIGNPOSTS along the road to castle (visual guidance!)
        const roadMidX = WORLD_WIDTH / 4;
        const roadMidY = WORLD_HEIGHT / 4;

        // Signpost near start
        state.entities.push({
            id: 6001, type: 'signpost', x: safeZoneStart + 300, y: safeZoneStart + 250, width: 30, height: 40,
            data: { text: '→ Castle' }
        });

        // Signposts along the path
        state.entities.push({
            id: 6002, type: 'signpost', x: roadMidX, y: roadMidY, width: 30, height: 40,
            data: { text: '↘ Castle' }
        });

        state.entities.push({
            id: 6003, type: 'signpost', x: castleX - 200, y: castleY - 200, width: 30, height: 40,
            data: { text: '🏰 Castle!' }
        });

        // 7. VILLAGE 1 - Near player start (safe haven feeling)
        const village1X = safeZoneStart + 500;
        const village1Y = safeZoneStart + 150;

        // Houses
        state.entities.push({ id: 7001, type: 'house', x: village1X, y: village1Y, width: 60, height: 50, data: { variant: 0 } });
        state.entities.push({ id: 7002, type: 'house', x: village1X + 100, y: village1Y + 30, width: 60, height: 50, data: { variant: 1 } });
        state.entities.push({ id: 7003, type: 'house', x: village1X + 50, y: village1Y + 100, width: 60, height: 50, data: { variant: 2 } });

        // Well in village center
        state.entities.push({ id: 7010, type: 'well', x: village1X + 70, y: village1Y + 60, width: 25, height: 25 });

        // Fences around village
        for (let i = 0; i < 8; i++) {
            state.entities.push({ id: 7020 + i, type: 'fence', x: village1X - 30 + i * 40, y: village1Y - 30, width: 40, height: 15 });
        }

        // 8. VILLAGE 2 - Middle of map, bigger
        const village2X = WORLD_WIDTH / 3;
        const village2Y = WORLD_HEIGHT / 3 - 200;

        state.entities.push({ id: 7101, type: 'house', x: village2X, y: village2Y, width: 70, height: 55, data: { variant: 0 } });
        state.entities.push({ id: 7102, type: 'house', x: village2X + 120, y: village2Y - 20, width: 70, height: 55, data: { variant: 1 } });
        state.entities.push({ id: 7103, type: 'house', x: village2X + 60, y: village2Y + 80, width: 70, height: 55, data: { variant: 2 } });
        state.entities.push({ id: 7104, type: 'house', x: village2X - 80, y: village2Y + 60, width: 60, height: 50, data: { variant: 0 } });
        state.entities.push({ id: 7105, type: 'windmill', x: village2X + 180, y: village2Y + 50, width: 50, height: 80 });
        state.entities.push({ id: 7106, type: 'well', x: village2X + 80, y: village2Y + 40, width: 25, height: 25 });

        // Signpost near village 2
        state.entities.push({
            id: 7107, type: 'signpost', x: village2X + 200, y: village2Y + 100, width: 30, height: 40,
            data: { text: '→ Castle' }
        });

        // 9. FARM AREA
        const farmX = safeZoneStart + 800;
        const farmY = safeZoneEnd - 600;

        state.entities.push({ id: 7200, type: 'farm', x: farmX, y: farmY, width: 100, height: 60 });
        state.entities.push({ id: 7201, type: 'house', x: farmX + 120, y: farmY + 10, width: 60, height: 50, data: { variant: 1 } });
        state.entities.push({ id: 7202, type: 'windmill', x: farmX - 70, y: farmY, width: 50, height: 80 });

        // Haystacks (using rocks as variant)
        for (let i = 0; i < 5; i++) {
            state.entities.push({
                id: 7210 + i, type: 'bush', x: farmX + 30 + i * 30, y: farmY + 80, width: 25, height: 20
            });
        }

        // 10. MOUNTAINS in the distance (top-right and bottom-left corners of safe zone)
        // Top-right mountain range
        state.entities.push({ id: 7300, type: 'mountain', x: safeZoneEnd - 400, y: safeZoneStart + 100, width: 150, height: 120 });
        state.entities.push({ id: 7301, type: 'mountain', x: safeZoneEnd - 250, y: safeZoneStart + 80, width: 180, height: 140 });
        state.entities.push({ id: 7302, type: 'mountain', x: safeZoneEnd - 100, y: safeZoneStart + 120, width: 120, height: 100 });

        // Bottom-left mountain range
        state.entities.push({ id: 7310, type: 'mountain', x: safeZoneStart + 50, y: safeZoneEnd - 300, width: 160, height: 130 });
        state.entities.push({ id: 7311, type: 'mountain', x: safeZoneStart + 200, y: safeZoneEnd - 280, width: 140, height: 110 });

        // 11. LAKES scattered around
        state.entities.push({ id: 7400, type: 'lake', x: safeZoneStart + 900, y: safeZoneStart + 600, width: 200, height: 120 });
        state.entities.push({ id: 7401, type: 'lake', x: WORLD_WIDTH / 2 + 400, y: WORLD_HEIGHT / 2 - 300, width: 150, height: 100 });
        state.entities.push({ id: 7402, type: 'lake', x: safeZoneEnd - 700, y: safeZoneEnd - 400, width: 180, height: 110 });

        // Bridge over the first lake
        state.entities.push({ id: 7410, type: 'bridge', x: safeZoneStart + 950, y: safeZoneStart + 650, width: 80, height: 40 });

        // 12. CAMPFIRES for atmosphere
        state.entities.push({ id: 7500, type: 'campfire', x: safeZoneStart + 400, y: safeZoneStart + 500, width: 30, height: 30 });
        state.entities.push({ id: 7501, type: 'campfire', x: WORLD_WIDTH / 3 + 100, y: WORLD_HEIGHT / 3, width: 30, height: 30 });
        state.entities.push({ id: 7502, type: 'campfire', x: castleX - 300, y: castleY + 100, width: 30, height: 30 });

        // 13. MUSHROOMS scattered around (decorative)
        for (let i = 0; i < 40; i++) {
            const x = safeZoneStart + Math.random() * (safeZoneEnd - safeZoneStart);
            const y = safeZoneStart + Math.random() * (safeZoneEnd - safeZoneStart);
            const distToStart = Math.sqrt(Math.pow(x - state.capy.x, 2) + Math.pow(y - state.capy.y, 2));
            if (distToStart < 100) continue;

            state.entities.push({
                id: 7600 + i, type: 'mushroom', x, y, width: 15, height: 15,
                data: { variant: Math.floor(Math.random() * 3) }
            });
        }

        // 14. BUSHES scattered around
        for (let i = 0; i < 60; i++) {
            const x = safeZoneStart + Math.random() * (safeZoneEnd - safeZoneStart);
            const y = safeZoneStart + Math.random() * (safeZoneEnd - safeZoneStart);
            const distToStart = Math.sqrt(Math.pow(x - state.capy.x, 2) + Math.pow(y - state.capy.y, 2));
            if (distToStart < 120) continue;

            state.entities.push({
                id: 7700 + i, type: 'bush', x, y, width: 30, height: 25,
                data: { variant: Math.floor(Math.random() * 2) }
            });
        }

        // 15. Additional signposts for clear navigation
        // Near mountain area
        state.entities.push({
            id: 7800, type: 'signpost', x: safeZoneEnd - 500, y: safeZoneStart + 250, width: 30, height: 40,
            data: { text: '⛰️ Mountains' }
        });

        // Near lake area
        state.entities.push({
            id: 7801, type: 'signpost', x: safeZoneStart + 850, y: safeZoneStart + 550, width: 30, height: 40,
            data: { text: '🌊 Lake' }
        });

        // Near farm
        state.entities.push({
            id: 7802, type: 'signpost', x: farmX - 50, y: farmY - 30, width: 30, height: 40,
            data: { text: '🌾 Farm' }
        });

        // 16. VILLAGE 3 - Near the castle (bigger, more impressive)
        const village3X = castleX - 400;
        const village3Y = castleY + 300;

        state.entities.push({ id: 7901, type: 'house', x: village3X, y: village3Y, width: 70, height: 55, data: { variant: 0 } });
        state.entities.push({ id: 7902, type: 'house', x: village3X + 100, y: village3Y - 30, width: 80, height: 60, data: { variant: 1 } });
        state.entities.push({ id: 7903, type: 'house', x: village3X + 200, y: village3Y, width: 70, height: 55, data: { variant: 2 } });
        state.entities.push({ id: 7904, type: 'house', x: village3X + 50, y: village3Y + 90, width: 60, height: 50, data: { variant: 0 } });
        state.entities.push({ id: 7905, type: 'house', x: village3X + 150, y: village3Y + 80, width: 70, height: 55, data: { variant: 1 } });
        state.entities.push({ id: 7906, type: 'well', x: village3X + 120, y: village3Y + 50, width: 25, height: 25 });
        state.entities.push({ id: 7907, type: 'windmill', x: village3X - 80, y: village3Y + 40, width: 50, height: 80 });
        state.entities.push({ id: 7908, type: 'campfire', x: village3X + 100, y: village3Y + 130, width: 30, height: 30 });

        // 17. === TREES ALONG ALL ROADS (Аллеи к замку!) ===
        const castleCenterX = WORLD_WIDTH / 2;
        const castleCenterY = WORLD_HEIGHT / 2;
        const treeSpacing = 80; // Расстояние между деревьями
        const treeOffset = 60; // Отступ от дороги

        // Функция для добавления деревьев вдоль дороги
        const addTreesAlongRoad = (startX: number, startY: number, endX: number, endY: number, startId: number) => {
            const roadLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const numTrees = Math.floor(roadLength / treeSpacing);
            const dx = (endX - startX) / roadLength;
            const dy = (endY - startY) / roadLength;
            // Перпендикулярный вектор для отступа
            const perpX = -dy;
            const perpY = dx;

            for (let i = 0; i < numTrees; i++) {
                const t = i / numTrees;
                const baseX = startX + t * (endX - startX);
                const baseY = startY + t * (endY - startY);

                // Деревья с обеих сторон дороги
                // Левая сторона
                state.entities.push({
                    id: startId + i * 2,
                    type: 'tree',
                    x: baseX + perpX * treeOffset + (Math.random() - 0.5) * 20,
                    y: baseY + perpY * treeOffset + (Math.random() - 0.5) * 20,
                    width: 45,
                    height: 30,
                    data: { variant: Math.floor(Math.random() * 3) }
                });
                // Правая сторона
                state.entities.push({
                    id: startId + i * 2 + 1,
                    type: 'tree',
                    x: baseX - perpX * treeOffset + (Math.random() - 0.5) * 20,
                    y: baseY - perpY * treeOffset + (Math.random() - 0.5) * 20,
                    width: 45,
                    height: 30,
                    data: { variant: Math.floor(Math.random() * 3) }
                });
            }
        };

        // Аллеи вдоль главных дорог к замку
        // От спавна к замку (главная дорога)
        addTreesAlongRoad(FOREST_BORDER + 300, FOREST_BORDER + 300, WORLD_WIDTH / 4, WORLD_HEIGHT / 4, 8000);
        addTreesAlongRoad(WORLD_WIDTH / 4, WORLD_HEIGHT / 4, castleCenterX, castleCenterY, 8100);

        // Северная дорога к замку
        addTreesAlongRoad(WORLD_WIDTH / 2, FOREST_BORDER + 200, WORLD_WIDTH / 2, WORLD_HEIGHT / 4, 8200);
        addTreesAlongRoad(WORLD_WIDTH / 2, WORLD_HEIGHT / 4, castleCenterX, castleCenterY, 8300);

        // Южная дорога к замку
        addTreesAlongRoad(WORLD_WIDTH / 2, WORLD_HEIGHT - FOREST_BORDER - 200, WORLD_WIDTH / 2, WORLD_HEIGHT * 3 / 4, 8400);
        addTreesAlongRoad(WORLD_WIDTH / 2, WORLD_HEIGHT * 3 / 4, castleCenterX, castleCenterY, 8500);

        // Западная дорога к замку
        addTreesAlongRoad(FOREST_BORDER + 200, WORLD_HEIGHT / 2, WORLD_WIDTH / 4, WORLD_HEIGHT / 2, 8600);
        addTreesAlongRoad(WORLD_WIDTH / 4, WORLD_HEIGHT / 2, castleCenterX, castleCenterY, 8700);

        // Восточная дорога к замку
        addTreesAlongRoad(WORLD_WIDTH - FOREST_BORDER - 200, WORLD_HEIGHT / 2, WORLD_WIDTH * 3 / 4, WORLD_HEIGHT / 2, 8800);
        addTreesAlongRoad(WORLD_WIDTH * 3 / 4, WORLD_HEIGHT / 2, castleCenterX, castleCenterY, 8900);

        // 18. Дополнительные указатели на пересечениях
        // Указатели на перекрёстках, все указывающие на замок
        state.entities.push({
            id: 9000, type: 'signpost', x: WORLD_WIDTH / 4 + 50, y: WORLD_HEIGHT / 4 + 50, width: 30, height: 40,
            data: { text: '🏰 Castle →' }
        });
        state.entities.push({
            id: 9001, type: 'signpost', x: WORLD_WIDTH * 3 / 4 - 50, y: WORLD_HEIGHT / 4 + 50, width: 30, height: 40,
            data: { text: '← 🏰 Castle' }
        });
        state.entities.push({
            id: 9002, type: 'signpost', x: WORLD_WIDTH / 4 + 50, y: WORLD_HEIGHT * 3 / 4 - 50, width: 30, height: 40,
            data: { text: '🏰 Castle ↗' }
        });
        state.entities.push({
            id: 9003, type: 'signpost', x: WORLD_WIDTH * 3 / 4 - 50, y: WORLD_HEIGHT * 3 / 4 - 50, width: 30, height: 40,
            data: { text: '↖ 🏰 Castle' }
        });
        state.entities.push({
            id: 9004, type: 'signpost', x: WORLD_WIDTH / 2 + 50, y: WORLD_HEIGHT / 4 + 50, width: 30, height: 40,
            data: { text: '🏰 Castle ↓' }
        });
        state.entities.push({
            id: 9005, type: 'signpost', x: WORLD_WIDTH / 2 + 50, y: WORLD_HEIGHT * 3 / 4 - 50, width: 30, height: 40,
            data: { text: '🏰 Castle ↑' }
        });
        state.entities.push({
            id: 9006, type: 'signpost', x: WORLD_WIDTH / 4 + 50, y: WORLD_HEIGHT / 2, width: 30, height: 40,
            data: { text: '🏰 Castle →' }
        });
        state.entities.push({
            id: 9007, type: 'signpost', x: WORLD_WIDTH * 3 / 4 - 50, y: WORLD_HEIGHT / 2, width: 30, height: 40,
            data: { text: '← 🏰 Castle' }
        });

        // Start Intro dialogue - new survival story!
        startDialogue([
            "🐲 Dragon: ROOOAR! I WILL CATCH YOU, LITTLE RODENT!",
            "🦫 Capy: Oh no! A dragon is chasing me!",
            "🦫 Capy: I need to collect 10 apples to gain power!",
            "⚠️ RUN! Collect 🍎 apples while avoiding the dragon!",
            "⌨️ Use WASD to move. Don't let the dragon catch you!"
        ]);

    }, []);

    // --- Game Loop ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const state = gameState.current;

        let animationFrameId: number;
        let lastTime = 0;

        const loop = (timestamp: number) => {
            if (!lastTime) lastTime = timestamp;
            const _dt = timestamp - lastTime;
            lastTime = timestamp;

            const state = gameState.current;

            // --- UPDATE ---

            if (state.mode === 'PLAYING' || state.mode === 'BOSS_FIGHT') {
                // Уменьшаем кулдауны
                if (state.capy.invulnerable > 0) state.capy.invulnerable--;
                if (state.capy.attackCooldown > 0) state.capy.attackCooldown--;
                if (state.capy.isAttacking > 0) state.capy.isAttacking--;
                if (state.boss.attackCooldown > 0) state.boss.attackCooldown--;
                if (state.boss.hitCooldown > 0) state.boss.hitCooldown--;
                if (state.damageFlash > 0) state.damageFlash--;
                if (state.dragonDamageFlash > 0) state.dragonDamageFlash--;

                // Movement
                let dx = 0;
                let dy = 0;

                // Во время EATING фазы - игрок не двигается
                if (state.phase !== 'EATING') {
                    if (state.keys['w'] || state.keys['ArrowUp']) dy -= 1;
                    if (state.keys['s'] || state.keys['ArrowDown']) dy += 1;
                    if (state.keys['a'] || state.keys['ArrowLeft']) dx -= 1;
                    if (state.keys['d'] || state.keys['ArrowRight']) dx += 1;
                }

                // Normalize
                if (dx !== 0 || dy !== 0) {
                    const len = Math.sqrt(dx * dx + dy * dy);
                    dx = (dx / len) * CAPY_SPEED;
                    dy = (dy / len) * CAPY_SPEED;

                    state.capy.moving = true;
                    state.capy.frame++;
                    if (dx !== 0) state.capy.direction = dx > 0 ? 1 : -1;

                    // Bounds Check & Collision - World bounds only
                    let nextX = state.capy.x + dx;
                    let nextY = state.capy.y + dy;

                    // Apply world bounds (capybara can go anywhere in the world)
                    nextX = Math.max(0, Math.min(WORLD_WIDTH - 32, nextX));
                    nextY = Math.max(0, Math.min(WORLD_HEIGHT - 32, nextY));

                    state.capy.x = nextX;
                    state.capy.y = nextY;
                } else {
                    state.capy.moving = false;
                    state.capy.frame = 0;
                }

                // === DRAGON CHASING LOGIC ===
                if (state.boss.active && state.phase !== 'EATING') {
                    // Calculate direction to player
                    const toPlayerX = state.capy.x - state.boss.x;
                    const toPlayerY = state.capy.y - state.boss.y;
                    const distToPlayer = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY);

                    if (distToPlayer > 0) {
                        // Normalize and apply speed
                        const dragonSpeed = state.phase === 'FIGHT' ? DRAGON_SPEED * 0.7 : DRAGON_SPEED; // Slower during fight
                        state.boss.x += (toPlayerX / distToPlayer) * dragonSpeed;
                        state.boss.y += (toPlayerY / distToPlayer) * dragonSpeed;

                        // Update dragon entity position
                        const dragonEntity = state.entities.find(e => e.type === 'dragon');
                        if (dragonEntity) {
                            dragonEntity.x = state.boss.x;
                            dragonEntity.y = state.boss.y;
                        }
                    }

                    // === DRAGON ATTACKS PLAYER (only in COLLECT phase) ===
                    if (distToPlayer < DRAGON_ATTACK_RANGE && state.capy.invulnerable <= 0 && state.phase === 'COLLECT' && state.boss.hitCooldown <= 0) {
                        // Dragon hits capybara!
                        state.capy.hp -= DRAGON_DAMAGE;
                        state.capy.invulnerable = DAMAGE_COOLDOWN;
                        state.boss.hitCooldown = DAMAGE_COOLDOWN;
                        state.damageFlash = 10;

                        // Damage particles (меньше для оптимизации)
                        for (let j = 0; j < 3; j++) {
                            state.particles.push({
                                x: state.capy.x + 16, y: state.capy.y + 16,
                                vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                                life: 12, color: '#FF0000'
                            });
                        }

                        // Knockback (отбрасывание) - меньше для плавности
                        if (distToPlayer > 0) {
                            state.capy.x += (toPlayerX / distToPlayer) * 25;
                            state.capy.y += (toPlayerY / distToPlayer) * 25;
                        }
                    }

                    // === WEAK ATTACK IN COLLECT PHASE (without apples) ===
                    if (state.keys[' '] && state.capy.attackCooldown <= 0 && distToPlayer < CAPY_ATTACK_RANGE) {
                        // Weak attack!
                        state.boss.hp -= CAPY_WEAK_DAMAGE;
                        state.capy.attackCooldown = ATTACK_COOLDOWN + 10; // Longer cooldown for weak attack
                        state.capy.isAttacking = 10;
                        state.dragonDamageFlash = 8;

                        // Attack particles (small)
                        for (let j = 0; j < 3; j++) {
                            state.particles.push({
                                x: state.boss.x + 50, y: state.boss.y + 50,
                                vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                                life: 10, color: '#FFFFFF'
                            });
                        }

                        // Small knockback
                        if (distToPlayer > 0) {
                            state.boss.x += (toPlayerX / distToPlayer) * -10;
                            state.boss.y += (toPlayerY / distToPlayer) * -10;
                        }

                        // Check for dragon death from weak attacks!
                        if (state.boss.hp <= 0) {
                            state.boss.active = false;
                            state.dragonDefeated = true;

                            // Remove dragon from entities (dragon dies!)
                            const dragonIndex = state.entities.findIndex(e => e.type === 'dragon');
                            if (dragonIndex !== -1) {
                                state.entities.splice(dragonIndex, 1);
                            }

                            // Death particles for dragon
                            for (let j = 0; j < 12; j++) {
                                state.particles.push({
                                    x: state.boss.x + 50, y: state.boss.y + 50,
                                    vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                                    life: 30, color: Math.random() > 0.5 ? '#FF0000' : '#FF6600'
                                });
                            }

                            setShowBossUI(false); // Hide dragon HP bar
                            setDragonHP(0);

                            // Диалог победы над драконом
                            startDialogue([
                                "🐲 Dragon: NOOO! I... I'm defeated...",
                                "💥 The dragon disappears in flames!",
                                "🦫 Capy: I did it without the apples!",
                                "👸 Princess: Amazing! You're so strong!",
                                "📍 HINT: Find the PRINCESS at the castle! 👸",
                                "⌨️ Go to the castle to meet the Princess!"
                            ]);

                            state.mode = 'PLAYING';
                            setGameMode('PLAYING');
                        }
                    }
                }

                // === APPLE COLLECTION ===
                if (state.phase === 'COLLECT') {
                    for (let i = state.entities.length - 1; i >= 0; i--) {
                        const e = state.entities[i];
                        if (e.type === 'apple') {
                            const adx = state.capy.x + 16 - (e.x + 12);
                            const ady = state.capy.y + 16 - (e.y + 12);
                            const dist = Math.sqrt(adx * adx + ady * ady);
                            if (dist < 70) {
                                // Collect apple
                                state.entities.splice(i, 1);
                                state.applesCollected++;
                                setScore(state.applesCollected);

                                // Particle effect
                                for (let j = 0; j < 8; j++) {
                                    state.particles.push({
                                        x: e.x + 12, y: e.y + 12,
                                        vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
                                        life: 25, color: Math.random() > 0.5 ? '#FF5722' : '#FFD700'
                                    });
                                }

                                // Check if we collected enough apples!
                                if (state.applesCollected >= APPLES_TO_WIN) {
                                    // Transition to EATING phase!
                                    state.phase = 'EATING';
                                    state.eatingTimer = 180; // 3 seconds at 60fps
                                    setGamePhase('EATING');

                                    startDialogue([
                                        "🦫 Capy: I collected all the apples!",
                                        "🦫 Capy: *munch munch* Time to power up!",
                                        "⚡ EATING APPLES... GAINING POWER!"
                                    ]);
                                }
                            }
                        }
                    }
                }

                // === EATING PHASE ===
                if (state.phase === 'EATING') {
                    state.eatingTimer--;

                    // Heal particles during eating
                    if (Math.random() > 0.7) {
                        state.particles.push({
                            x: state.capy.x + Math.random() * 32,
                            y: state.capy.y + 32,
                            vx: 0, vy: -2,
                            life: 40, color: '#4CAF50'
                        });
                    }

                    // Dragon can't hurt during eating (divine protection!)
                    state.capy.invulnerable = 10;

                    if (state.eatingTimer <= 0) {
                        // Transition to FIGHT phase!
                        state.phase = 'FIGHT';
                        state.capy.hp = 100; // Full heal!
                        setCapyHP(100);
                        setGamePhase('FIGHT');
                        setCanAttack(true);
                        setShowBossUI(true);

                        startDialogue([
                            "🦫 Capy: I feel... POWERFUL!",
                            "🦫 Capy: Now it's MY turn to attack!",
                            "⚔️ Press SPACE to attack the dragon!",
                            "⚔️ Get close and DEFEAT the dragon!"
                        ]);
                    }
                }

                // === FIGHT PHASE - PLAYER ATTACKS DRAGON ===
                if (state.phase === 'FIGHT' && state.boss.active) {
                    // Calculate distance to dragon
                    const todragonX = state.boss.x - state.capy.x;
                    const todragonY = state.boss.y - state.capy.y;
                    const distToDragon = Math.sqrt(todragonX * todragonX + todragonY * todragonY);

                    // Attack with SPACE - только игрок может атаковать!
                    if (state.keys[' '] && state.capy.attackCooldown <= 0 && distToDragon < CAPY_ATTACK_RANGE) {
                        // Attack dragon! x3 урон!
                        state.boss.hp -= CAPY_DAMAGE;
                        state.capy.attackCooldown = ATTACK_COOLDOWN;
                        state.capy.isAttacking = 15; // Анимация атаки
                        state.dragonDamageFlash = 12;

                        // Attack particles (оптимизировано)
                        for (let j = 0; j < 5; j++) {
                            state.particles.push({
                                x: state.boss.x + 50, y: state.boss.y + 50,
                                vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                                life: 15, color: Math.random() > 0.5 ? '#FFEB3B' : '#FF9800'
                            });
                        }

                        // Knockback dragon
                        if (distToDragon > 0) {
                            state.boss.x += (todragonX / distToDragon) * 25;
                            state.boss.y += (todragonY / distToDragon) * 25;
                        }

                        // Check for victory!
                        if (state.boss.hp <= 0) {
                            state.boss.active = false;
                            state.dragonDefeated = true;

                            // Remove dragon from entities (dragon dies!)
                            const dragonIndex = state.entities.findIndex(e => e.type === 'dragon');
                            if (dragonIndex !== -1) {
                                state.entities.splice(dragonIndex, 1);
                            }

                            // Death particles for dragon
                            for (let j = 0; j < 12; j++) {
                                state.particles.push({
                                    x: state.boss.x + 50, y: state.boss.y + 50,
                                    vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                                    life: 30, color: Math.random() > 0.5 ? '#FF0000' : '#FF6600'
                                });
                            }

                            setShowBossUI(false); // Hide dragon HP bar

                            // Диалог победы над драконом
                            startDialogue([
                                "🐲 Dragon: NOOO! I... I'm defeated...",
                                "💥 The dragon disappears in flames!",
                                "🦫 Capy: The power of apples is unstoppable!",
                                "👸 Princess: Brave capybara! You saved us all!",
                                "📍 HINT: Find the PRINCESS at the castle! 👸",
                                "⌨️ Go to the castle to meet the Princess!"
                            ]);

                            state.mode = 'PLAYING';
                            setGameMode('PLAYING');
                            setGamePhase('COLLECT'); // Reset phase display
                        }
                    }

                    // Dragon attacks during fight phase - НАМНОГО МЕДЛЕННЕЕ (в 3 раза)
                    if (distToDragon < DRAGON_ATTACK_RANGE && state.capy.invulnerable <= 0 && state.boss.hitCooldown <= 0) {
                        state.capy.hp -= Math.floor(DRAGON_DAMAGE / 3); // 1/3 урона в фазе боя
                        state.capy.invulnerable = DAMAGE_COOLDOWN;
                        state.boss.hitCooldown = DRAGON_FIGHT_DAMAGE_COOLDOWN; // Очень долгий кулдаун
                        state.damageFlash = 12;

                        // Knockback
                        if (distToDragon > 0) {
                            state.capy.x -= (todragonX / distToDragon) * 20;
                            state.capy.y -= (todragonY / distToDragon) * 20;
                        }

                        if (state.capy.hp <= 0) {
                            state.mode = 'GAME_OVER';
                            setGameMode('GAME_OVER');
                        }
                    }
                }

                // === PRINCESS INTERACTION (after dragon defeated) ===
                if (state.dragonDefeated && !state.princessMet) {
                    const princess = state.entities.find(e => e.type === 'princess');
                    if (princess) {
                        const dxPrincess = state.capy.x - princess.x;
                        const dyPrincess = state.capy.y - princess.y;
                        const distToPrincess = Math.sqrt(dxPrincess * dxPrincess + dyPrincess * dyPrincess);

                        if (distToPrincess < 60) {
                            state.dragonDefeated = false;
                            state.princessMet = true;
                            state.waveNumber = 1; // Start wave 1 (2 dragons)

                            startDialogue([
                                "👸 Princess: My hero! You saved me!",
                                "🦫 Capy: It was nothing, princess!",
                                "👸 Princess: But wait... I hear more dragons coming!",
                                "🐲🐲 Two dragons appear on the horizon!",
                                "⚔️ WAVE 1: Defeat 2 dragons!"
                            ]);

                            // Spawn 2 dragons for wave 1
                            spawnDragonWave(2);
                        }
                    }
                }

                // === DRAGON WAVE SYSTEM ===
                if (state.waveInProgress && state.dragons.length > 0) {
                    // Update all dragons
                    for (let i = state.dragons.length - 1; i >= 0; i--) {
                        const dragon = state.dragons[i];

                        // Dragon chase player
                        const toDragonX = state.capy.x - dragon.x;
                        const toDragonY = state.capy.y - dragon.y;
                        const distToDragon = Math.sqrt(toDragonX * toDragonX + toDragonY * toDragonY);

                        if (distToDragon > 0) {
                            dragon.x += (toDragonX / distToDragon) * (DRAGON_SPEED * 0.8);
                            dragon.y += (toDragonY / distToDragon) * (DRAGON_SPEED * 0.8);
                        }

                        // Update dragon entity position
                        const dragonEntity = state.entities.find(e => e.id === dragon.id);
                        if (dragonEntity) {
                            dragonEntity.x = dragon.x;
                            dragonEntity.y = dragon.y;
                        }

                        // Dragon attacks player
                        if (distToDragon < DRAGON_ATTACK_RANGE && state.capy.invulnerable <= 0 && dragon.hitCooldown <= 0) {
                            state.capy.hp -= Math.floor(DRAGON_DAMAGE / 2);
                            state.capy.invulnerable = DAMAGE_COOLDOWN;
                            dragon.hitCooldown = DAMAGE_COOLDOWN * 2;
                            state.damageFlash = 10;

                            // Knockback
                            if (distToDragon > 0) {
                                state.capy.x += (toDragonX / distToDragon) * 20;
                                state.capy.y += (toDragonY / distToDragon) * 20;
                            }
                        }

                        // Cooldowns
                        if (dragon.hitCooldown > 0) dragon.hitCooldown--;
                        if (dragon.damageFlash > 0) dragon.damageFlash--;

                        // Player attacks dragon
                        if (state.keys[' '] && state.capy.attackCooldown <= 0 && distToDragon < CAPY_ATTACK_RANGE) {
                            dragon.hp -= CAPY_DAMAGE;
                            state.capy.attackCooldown = ATTACK_COOLDOWN;
                            state.capy.isAttacking = 15;
                            dragon.damageFlash = 12;

                            // Attack particles
                            for (let j = 0; j < 4; j++) {
                                state.particles.push({
                                    x: dragon.x + 50, y: dragon.y + 50,
                                    vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                                    life: 15, color: Math.random() > 0.5 ? '#FFEB3B' : '#FF9800'
                                });
                            }

                            // Check if dragon died
                            if (dragon.hp <= 0) {
                                // Remove dragon from entities
                                const dragonIndex = state.entities.findIndex(e => e.id === dragon.id);
                                if (dragonIndex !== -1) {
                                    state.entities.splice(dragonIndex, 1);
                                }

                                // Death particles
                                for (let j = 0; j < 10; j++) {
                                    state.particles.push({
                                        x: dragon.x + 50, y: dragon.y + 50,
                                        vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
                                        life: 25, color: Math.random() > 0.5 ? '#FF0000' : '#FF6600'
                                    });
                                }

                                // Remove from dragons array
                                state.dragons.splice(i, 1);
                            }
                        }
                    }

                    // Check if wave is complete
                    if (state.dragons.length === 0) {
                        state.waveInProgress = false;

                        if (state.waveNumber >= 4) {
                            // All waves complete - FINAL VICTORY!
                            state.allWavesCompleted = true;
                            state.mode = 'VICTORY';
                            setGameMode('VICTORY');

                            startDialogue([
                                "💥 All dragons have been defeated!",
                                "👸 Princess: You are the greatest hero ever!",
                                "🦫 Capy: For you, princess... anything!",
                                "🎉 CONGRATULATIONS! ALL WAVES COMPLETE!",
                                "🏆 GAME WIN! GO AND BUY TOKEN NOW! 🚀"
                            ]);
                        } else {
                            // Next wave
                            state.waveNumber++;
                            const dragonCounts = [0, 2, 4, 6, 8];
                            const nextCount = dragonCounts[state.waveNumber];

                            startDialogue([
                                `🎉 Wave ${state.waveNumber - 1} Complete!`,
                                "👸 Princess: Amazing! But more are coming!",
                                `🐲 ${nextCount} more dragons approach!`,
                                `⚔️ WAVE ${state.waveNumber}: Defeat ${nextCount} dragons!`
                            ]);

                            spawnDragonWave(nextCount);
                        }
                    }

                    // Game over check
                    if (state.capy.hp <= 0) {
                        state.mode = 'GAME_OVER';
                        setGameMode('GAME_OVER');
                    }
                }
            }

            // Camera Follow - Capybara ALWAYS stays centered on screen
            // Target is center of capy (accounting for scale)
            const viewWidth = CANVAS_WIDTH / SCALE;
            const viewHeight = CANVAS_HEIGHT / SCALE;

            // Calculate target camera position to center capybara
            const capyCenterX = state.capy.x + 16; // Center of capybara sprite
            const capyCenterY = state.capy.y + 16;
            const targetCamX = capyCenterX - viewWidth / 2;
            const targetCamY = capyCenterY - viewHeight / 2;

            // Smooth but responsive follow (higher value = faster follow)
            const followSpeed = 0.15;
            state.camera.x += (targetCamX - state.camera.x) * followSpeed;
            state.camera.y += (targetCamY - state.camera.y) * followSpeed;

            // Particle Update
            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                if (p.life <= 0) state.particles.splice(i, 1);
            }

            // Sync HP to React state (реже, чтобы избежать лагов - каждые 10 кадров)
            if (Math.floor(timestamp / 100) % 2 === 0) {
                setCapyHP(Math.max(0, state.capy.hp));

                // Показываем HP ближайшего дракона
                if (state.waveInProgress && state.dragons.length > 0) {
                    // Находим ближайшего дракона и показываем его HP
                    let closestDragon = state.dragons[0];
                    let minDist = Infinity;
                    for (const dragon of state.dragons) {
                        const dx = state.capy.x - dragon.x;
                        const dy = state.capy.y - dragon.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < minDist) {
                            minDist = dist;
                            closestDragon = dragon;
                        }
                    }
                    setDragonHP(Math.max(0, closestDragon.hp));
                    setTargetDragonHP(Math.max(0, closestDragon.hp));
                } else if (state.boss.active) {
                    setDragonHP(Math.max(0, state.boss.hp));
                }

                // Update wave UI
                setWaveNumber(state.waveNumber);
                setDragonsRemaining(state.dragons.length);

                // Check for game over
                if (state.capy.hp <= 0 && state.mode !== 'GAME_OVER') {
                    state.mode = 'GAME_OVER';
                    setGameMode('GAME_OVER');
                }
            }


            // --- DRAW ---

            // 1. Background - Animated gradient grass
            const time = Date.now() / 2000; // Slow animation

            // Create animated gradient
            const gradient = ctx.createLinearGradient(
                Math.sin(time) * 200,
                Math.cos(time) * 200,
                CANVAS_WIDTH + Math.cos(time) * 200,
                CANVAS_HEIGHT + Math.sin(time) * 200
            );
            gradient.addColorStop(0, '#3d5a1f');
            gradient.addColorStop(0.25, '#4a6b25');
            gradient.addColorStop(0.5, '#527a2a');
            gradient.addColorStop(0.75, '#4a6b25');
            gradient.addColorStop(1, '#3d5a1f');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.save();
            ctx.scale(SCALE, SCALE); // Apply zoom
            ctx.translate(-Math.floor(state.camera.x), -Math.floor(state.camera.y));

            // Subtle grass texture overlay (waves)
            const waveTime = Date.now() / 3000;
            ctx.fillStyle = 'rgba(60, 90, 30, 0.15)';
            const gridStartX = Math.floor(state.camera.x / 80) * 80;
            const gridStartY = Math.floor(state.camera.y / 80) * 80;

            for (let x = gridStartX; x < gridStartX + viewWidth + 80; x += 80) {
                for (let y = gridStartY; y < gridStartY + viewHeight + 80; y += 80) {
                    const wave = Math.sin(waveTime + x / 200 + y / 200) * 0.5 + 0.5;
                    if (wave > 0.6) {
                        ctx.fillStyle = `rgba(70, 100, 35, ${wave * 0.2})`;
                        ctx.fillRect(x, y, 80, 80);
                    }
                }
            }

            // === ROAD NETWORK - All roads lead to the castle! ===
            const castleCenterX = WORLD_WIDTH / 2;
            const castleCenterY = WORLD_HEIGHT / 2;
            const roadWidth = 70;
            const roadTileSize = 35;

            // Helper function to draw a road segment
            const drawRoadSegment = (startX: number, startY: number, endX: number, endY: number) => {
                const roadLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                const numTiles = Math.ceil(roadLength / roadTileSize);

                for (let i = 0; i <= numTiles; i++) {
                    const t = i / numTiles;
                    const tileX = startX + t * (endX - startX);
                    const tileY = startY + t * (endY - startY);

                    // Only draw if in view
                    if (tileX + roadWidth > state.camera.x && tileX < state.camera.x + viewWidth &&
                        tileY + roadWidth > state.camera.y && tileY < state.camera.y + viewHeight) {

                        // Road base (sandy/dirt color)
                        ctx.fillStyle = '#C4A574';
                        ctx.fillRect(tileX - roadWidth / 2, tileY - roadWidth / 2, roadWidth, roadWidth);

                        // Road detail (darker lines for tiles)
                        ctx.fillStyle = '#A68B5B';
                        if (i % 2 === 0) {
                            ctx.fillRect(tileX - roadWidth / 2 + 5, tileY - roadWidth / 2 + 5, roadWidth - 10, 3);
                            ctx.fillRect(tileX - roadWidth / 2 + 5, tileY + roadWidth / 2 - 8, roadWidth - 10, 3);
                        }

                        // Road edges
                        ctx.fillStyle = '#8B7355';
                        ctx.fillRect(tileX - roadWidth / 2 - 3, tileY - roadWidth / 2, 3, roadWidth);
                        ctx.fillRect(tileX + roadWidth / 2, tileY - roadWidth / 2, 3, roadWidth);
                    }
                }
            };

            // Helper to draw intersection circle
            const drawIntersection = (x: number, y: number, radius: number = 80) => {
                if (x + radius > state.camera.x && x - radius < state.camera.x + viewWidth &&
                    y + radius > state.camera.y && y - radius < state.camera.y + viewHeight) {
                    ctx.fillStyle = '#C4A574';
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = '#8B7355';
                    ctx.lineWidth = 4;
                    ctx.stroke();

                    // Center decoration
                    ctx.fillStyle = '#A68B5B';
                    ctx.beginPath();
                    ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
            };

            // Define intersection points (all roads lead to castle)
            const intersections = [
                { x: FOREST_BORDER + 300, y: FOREST_BORDER + 300 }, // Near spawn
                { x: WORLD_WIDTH / 4, y: WORLD_HEIGHT / 4 }, // Quarter point NW
                { x: WORLD_WIDTH * 3 / 4, y: WORLD_HEIGHT / 4 }, // Quarter point NE
                { x: WORLD_WIDTH / 4, y: WORLD_HEIGHT * 3 / 4 }, // Quarter point SW
                { x: WORLD_WIDTH * 3 / 4, y: WORLD_HEIGHT * 3 / 4 }, // Quarter point SE
                { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 4 }, // North of castle
                { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT * 3 / 4 }, // South of castle
                { x: WORLD_WIDTH / 4, y: WORLD_HEIGHT / 2 }, // West of castle
                { x: WORLD_WIDTH * 3 / 4, y: WORLD_HEIGHT / 2 }, // East of castle
            ];

            // Main roads to castle
            // From spawn area to castle (main path)
            drawRoadSegment(FOREST_BORDER + 300, FOREST_BORDER + 300, WORLD_WIDTH / 4, WORLD_HEIGHT / 4);
            drawRoadSegment(WORLD_WIDTH / 4, WORLD_HEIGHT / 4, castleCenterX, castleCenterY);

            // North road to castle
            drawRoadSegment(WORLD_WIDTH / 2, FOREST_BORDER + 200, WORLD_WIDTH / 2, WORLD_HEIGHT / 4);
            drawRoadSegment(WORLD_WIDTH / 2, WORLD_HEIGHT / 4, castleCenterX, castleCenterY);

            // South road to castle
            drawRoadSegment(WORLD_WIDTH / 2, WORLD_HEIGHT - FOREST_BORDER - 200, WORLD_WIDTH / 2, WORLD_HEIGHT * 3 / 4);
            drawRoadSegment(WORLD_WIDTH / 2, WORLD_HEIGHT * 3 / 4, castleCenterX, castleCenterY);

            // West road to castle
            drawRoadSegment(FOREST_BORDER + 200, WORLD_HEIGHT / 2, WORLD_WIDTH / 4, WORLD_HEIGHT / 2);
            drawRoadSegment(WORLD_WIDTH / 4, WORLD_HEIGHT / 2, castleCenterX, castleCenterY);

            // East road to castle
            drawRoadSegment(WORLD_WIDTH - FOREST_BORDER - 200, WORLD_HEIGHT / 2, WORLD_WIDTH * 3 / 4, WORLD_HEIGHT / 2);
            drawRoadSegment(WORLD_WIDTH * 3 / 4, WORLD_HEIGHT / 2, castleCenterX, castleCenterY);

            // NE corner road
            drawRoadSegment(WORLD_WIDTH - FOREST_BORDER - 200, FOREST_BORDER + 200, WORLD_WIDTH * 3 / 4, WORLD_HEIGHT / 4);
            drawRoadSegment(WORLD_WIDTH * 3 / 4, WORLD_HEIGHT / 4, castleCenterX, castleCenterY);

            // SE corner road
            drawRoadSegment(WORLD_WIDTH - FOREST_BORDER - 200, WORLD_HEIGHT - FOREST_BORDER - 200, WORLD_WIDTH * 3 / 4, WORLD_HEIGHT * 3 / 4);
            drawRoadSegment(WORLD_WIDTH * 3 / 4, WORLD_HEIGHT * 3 / 4, castleCenterX, castleCenterY);

            // SW corner road
            drawRoadSegment(FOREST_BORDER + 200, WORLD_HEIGHT - FOREST_BORDER - 200, WORLD_WIDTH / 4, WORLD_HEIGHT * 3 / 4);
            drawRoadSegment(WORLD_WIDTH / 4, WORLD_HEIGHT * 3 / 4, castleCenterX, castleCenterY);

            // Cross roads connecting intersections
            drawRoadSegment(WORLD_WIDTH / 4, WORLD_HEIGHT / 4, WORLD_WIDTH / 2, WORLD_HEIGHT / 4);
            drawRoadSegment(WORLD_WIDTH / 2, WORLD_HEIGHT / 4, WORLD_WIDTH * 3 / 4, WORLD_HEIGHT / 4);
            drawRoadSegment(WORLD_WIDTH / 4, WORLD_HEIGHT * 3 / 4, WORLD_WIDTH / 2, WORLD_HEIGHT * 3 / 4);
            drawRoadSegment(WORLD_WIDTH / 2, WORLD_HEIGHT * 3 / 4, WORLD_WIDTH * 3 / 4, WORLD_HEIGHT * 3 / 4);
            drawRoadSegment(WORLD_WIDTH / 4, WORLD_HEIGHT / 4, WORLD_WIDTH / 4, WORLD_HEIGHT / 2);
            drawRoadSegment(WORLD_WIDTH / 4, WORLD_HEIGHT / 2, WORLD_WIDTH / 4, WORLD_HEIGHT * 3 / 4);
            drawRoadSegment(WORLD_WIDTH * 3 / 4, WORLD_HEIGHT / 4, WORLD_WIDTH * 3 / 4, WORLD_HEIGHT / 2);
            drawRoadSegment(WORLD_WIDTH * 3 / 4, WORLD_HEIGHT / 2, WORLD_WIDTH * 3 / 4, WORLD_HEIGHT * 3 / 4);

            // Draw intersections
            intersections.forEach(int => drawIntersection(int.x, int.y, 60));

            // Draw large castle plaza
            drawIntersection(castleCenterX, castleCenterY + 70, 130);

            // Fence Boundary
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 10;
            ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

            // Render List (Sort by Y)
            const renderList = [...state.entities, {
                id: -999, type: 'capy', x: state.capy.x, y: state.capy.y, width: 32, height: 32
            } as Entity];

            renderList.sort((a, b) => (a.y + a.height) - (b.y + b.height));

            renderList.forEach(e => {
                const { x, y } = e;
                // Cull offscreen (accounting for scale)
                if (x + e.width < state.camera.x - 100 || x > state.camera.x + viewWidth + 100 ||
                    y + e.height < state.camera.y - 100 || y > state.camera.y + viewHeight + 100) return;

                if (e.type === 'capy') {
                    drawCapybara(ctx, x, y, state.capy.direction, state.capy.frame, state.capy.moving, state.damageFlash > 0, state.phase === 'FIGHT', state.capy.isAttacking > 0);
                }
                else if (e.type === 'tree') drawTree(ctx, x, y, e.data?.variant, e.data?.dark);
                else if (e.type === 'rock') drawRock(ctx, x, y);
                else if (e.type === 'castle') drawCastle(ctx, x, y);
                else if (e.type === 'princess') drawPrincess(ctx, x, y);
                else if (e.type === 'dragon') drawDragon(ctx, x, y, state.dragonDamageFlash > 0, state.phase);
                else if (e.type === 'signpost') drawSignpost(ctx, x, y, e.data?.text);
                else if (e.type === 'apple') drawApple(ctx, x, y);
                else if (e.type === 'house') drawHouse(ctx, x, y, e.data?.variant);
                else if (e.type === 'mountain') drawMountain(ctx, x, y, e.width, e.height);
                else if (e.type === 'farm') drawFarm(ctx, x, y);
                else if (e.type === 'lake') drawLake(ctx, x, y, e.width, e.height);
                else if (e.type === 'well') drawWell(ctx, x, y);
                else if (e.type === 'windmill') drawWindmill(ctx, x, y);
                else if (e.type === 'campfire') drawCampfire(ctx, x, y);
                else if (e.type === 'bridge') drawBridge(ctx, x, y, e.width, e.height);
                else if (e.type === 'fence') drawFence(ctx, x, y, e.width);
                else if (e.type === 'bush') drawBush(ctx, x, y, e.data?.variant);
                else if (e.type === 'mushroom') drawMushroom(ctx, x, y, e.data?.variant);
            });

            // Particles
            state.particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, 4, 4);
            });

            ctx.restore();

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);

        // Input Listeners
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent default scrolling for game keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key)) {
                e.preventDefault();
            }

            if (e.key === 'Escape') {
                setShowMenu(prev => !prev);
                gameState.current.mode = gameState.current.mode === 'MENU' ? 'PLAYING' : 'MENU'; // Simple toggle
            }
            if (e.key === ' ' || e.key === 'Enter') {
                if (gameState.current.mode === 'DIALOGUE') {
                    advanceDialogue();
                }
            }
            state.keys[e.key] = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => state.keys[e.key] = false;

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // --- Draw Helpers (Embedded for simplicity) ---

    const drawShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number) => {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + w / 2 + 5, w / 2, w / 4, 0, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawCapybara = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, frame: number, moving: boolean, damaged: boolean = false, powered: boolean = false, isAttacking: boolean = false) => {
        ctx.save();
        ctx.translate(Math.floor(x), Math.floor(y));

        // Damage flash effect
        if (damaged) {
            ctx.filter = 'brightness(2) saturate(0.5)';
        }
        // Attack animation - lunce forward and glow
        if (isAttacking) {
            ctx.shadowColor = '#FF6600';
            ctx.shadowBlur = 30;
            ctx.translate(dir * 10, -5); // Lunge forward
        }
        // Powered up glow
        else if (powered) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 20;
        }

        // Размер пикселя для pixel art - УВЕЛИЧЕН для более толстой капибары!
        const p = 2.5;

        if (dir === -1) { ctx.translate(40 * p, 0); ctx.scale(-1, 1); }

        const bounce = (moving && frame % 20 < 10) ? -p * 1.2 : 0;

        // ===== МИЛАЯ И ТОЛСТАЯ КАПИБАРА =====

        // Цветовая палитра - более тёплые и милые тона
        const c1 = '#F5A84A'; // Светлый оранжевый (блики) - теплее
        const c2 = '#E89940'; // Основной оранжевый - мягче
        const c3 = '#D08035'; // Средний коричневый
        const c4 = '#A86830'; // Тёмный коричневый
        const c5 = '#7A4620'; // Очень тёмный (тени, контур)
        const c6 = '#4D3020'; // Нос - более мягкий
        const c7 = '#1A1A1A'; // Глаз
        const c8 = '#FFFFFF'; // Блик глаза
        const c9 = '#5DADE2'; // Очки - голубые
        const cBlush = '#FF9999'; // Румянец!
        const cPink = '#FFB6C1'; // Розовый для ушек

        // Функция для рисования пикселя
        const px = (cx: number, cy: number, color: string) => {
            ctx.fillStyle = color;
            ctx.fillRect(cx * p, (cy * p) + bounce, p, p);
        };

        // === ТЕНЬ (больше для толстой капибары) ===
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(18 * p, 30 * p, 16 * p, 4 * p, 0, 0, Math.PI * 2);
        ctx.fill();

        // === ЗАДНИЕ ТОЛСТЫЕ ЛАПКИ ===
        const legOff = (moving && frame % 10 < 5) ? 1 : 0;
        // Левая задняя - толще!
        for (let ly = 0; ly < 5; ly++) {
            px(3, 22 + ly + legOff, c4);
            px(4, 22 + ly + legOff, c3);
            px(5, 22 + ly + legOff, c2);
            px(6, 22 + ly + legOff, c3);
            px(7, 22 + ly + legOff, c4);
        }
        // Правая задняя - толще!
        for (let ly = 0; ly < 5; ly++) {
            px(24 - legOff, 22 + ly, c4);
            px(25 - legOff, 22 + ly, c3);
            px(26 - legOff, 22 + ly, c2);
            px(27 - legOff, 22 + ly, c3);
            px(28 - legOff, 22 + ly, c4);
        }

        // === ТОЛСТОЕ ПУЗИКО (очень округлое!) ===
        // Верхняя часть тела
        for (let tx = 7; tx <= 25; tx++) px(tx, 9, c3);
        for (let tx = 5; tx <= 27; tx++) px(tx, 10, tx < 8 || tx > 24 ? c3 : c2);

        // Основное толстое тело - много рядов!
        for (let ty = 11; ty <= 20; ty++) {
            // Расширяется к середине, сужается к краям (форма капли)
            const offset = ty < 14 ? (ty - 11) : (ty > 17 ? (20 - ty) : 3);
            const startX = 3 - offset;
            const endX = 29 + offset;

            for (let tx = startX; tx <= endX; tx++) {
                if (tx === startX || tx === endX) px(tx, ty, c4);
                else if (tx < startX + 3 || tx > endX - 3) px(tx, ty, c3);
                else if (ty >= 12 && ty <= 14) px(tx, ty, c1); // Блик на пузике сверху
                else px(tx, ty, c2);
            }
        }

        // Нижняя часть пузика
        for (let tx = 6; tx <= 26; tx++) px(tx, 21, c4);

        // === МИЛЫЕ ЩЁЧКИ НА ТЕЛЕ ===
        px(8, 15, c1); px(9, 15, c1); px(10, 15, c1);
        px(22, 15, c1); px(23, 15, c1); px(24, 15, c1);

        // === КРУГЛАЯ МИЛАЯ ГОЛОВА ===
        // Ушки - более округлые и с розовинкой внутри
        // Левое ушко
        px(22, 2, c3); px(23, 2, c2); px(24, 2, c3);
        px(21, 3, c3); px(22, 3, c2); px(23, 3, cPink); px(24, 3, c2); px(25, 3, c3);
        px(22, 4, c2); px(23, 4, cPink); px(24, 4, c2);

        // Правое ушко
        px(30, 2, c3); px(31, 2, c2); px(32, 2, c3);
        px(29, 3, c3); px(30, 3, c2); px(31, 3, cPink); px(32, 3, c2); px(33, 3, c3);
        px(30, 4, c2); px(31, 4, cPink); px(32, 4, c2);

        // Голова - большая и круглая
        for (let tx = 21; tx <= 33; tx++) px(tx, 5, c3);
        for (let tx = 20; tx <= 34; tx++) px(tx, 6, tx < 22 || tx > 32 ? c3 : c2);

        for (let ty = 7; ty <= 10; ty++) {
            for (let tx = 19; tx <= 35; tx++) {
                if (tx === 19 || tx === 35) px(tx, ty, c4);
                else if (tx < 21 || tx > 33) px(tx, ty, c3);
                else if (ty <= 8) px(tx, ty, c1); // Блик на лбу
                else px(tx, ty, c2);
            }
        }

        // Толстые щёчки!
        for (let ty = 11; ty <= 14; ty++) {
            for (let tx = 18; tx <= 36; tx++) {
                if (tx === 18 || tx === 36) px(tx, ty, c4);
                else if (tx >= 32 && ty >= 12) px(tx, ty, c3); // Морда
                else px(tx, ty, c2);
            }
        }

        // Подбородок
        for (let tx = 20; tx <= 34; tx++) px(tx, 15, c4);

        // === РУМЯНЕЦ НА ЩЁЧКАХ (очень милый!) ===
        px(20, 11, cBlush); px(21, 11, cBlush);
        px(20, 12, cBlush); px(21, 12, cBlush);

        // === БОЛЬШОЙ МИЛЫЙ НОС ===
        px(32, 11, c6); px(33, 11, c6); px(34, 11, c6);
        px(32, 12, c6); px(33, 12, c5); px(34, 12, c6);
        px(33, 13, c6);

        // === БОЛЬШИЕ МИЛЫЕ ГЛАЗА ===
        // Глаз больше - 3x3 с большим бликом
        px(25, 8, c7); px(26, 8, c7); px(27, 8, c7);
        px(25, 9, c7); px(26, 9, c7); px(27, 9, c7);
        px(25, 10, c7); px(26, 10, c7); px(27, 10, c7);
        // Большой блик в глазу
        px(25, 8, c8); px(26, 8, c8);
        px(25, 9, c8);

        // === СТИЛЬНЫЕ ОЧКИ ===
        px(23, 7, c9); px(24, 7, c9); px(25, 7, c9); px(26, 7, c9); px(27, 7, c9); px(28, 7, c9);
        px(23, 11, c9); px(24, 11, c9); px(28, 11, c9); px(29, 11, c9);

        // === ТОЛСТЫЕ ПЕРЕДНИЕ ЛАПКИ ===
        for (let ly = 0; ly < 5; ly++) {
            px(9 + (moving ? -legOff : 0), 22 + ly, c4);
            px(10 + (moving ? -legOff : 0), 22 + ly, c3);
            px(11 + (moving ? -legOff : 0), 22 + ly, c2);
            px(12 + (moving ? -legOff : 0), 22 + ly, c3);
            px(13 + (moving ? -legOff : 0), 22 + ly, c4);
        }
        for (let ly = 0; ly < 5; ly++) {
            px(17, 22 + ly, c4);
            px(18, 22 + ly, c3);
            px(19, 22 + ly, c2);
            px(20, 22 + ly, c3);
            px(21, 22 + ly, c4);
        }

        // === МАЛЕНЬКИЙ МИЛЫЙ ХВОСТИК ===
        px(0, 14, c4);
        px(1, 13, c3); px(1, 14, c2); px(1, 15, c3);
        px(2, 14, c4);

        ctx.filter = 'none'; // Reset filter
        ctx.restore();
    };

    const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number, variant: number, dark?: boolean) => {
        ctx.save();
        ctx.translate(x, y);

        // Dark forest trees are much bigger and darker
        const scale = dark ? 1.5 : 1;
        ctx.scale(scale, scale);

        drawShadow(ctx, 0, 25 / scale, 50);

        // Trunk
        ctx.fillStyle = dark ? '#1a1510' : '#5D4037';
        ctx.fillRect(12, 0, 14, 28);

        // Trunk detail
        ctx.fillStyle = dark ? '#0f0a05' : '#4E342E';
        ctx.fillRect(14, 5, 3, 18);
        ctx.fillRect(20, 10, 2, 12);

        // Leaves - multiple layers
        const leafColor1 = dark ? '#0a1a0a' : (variant === 0 ? '#43A047' : variant === 1 ? '#388E3C' : '#2E7D32');
        const leafColor2 = dark ? '#051005' : (variant === 0 ? '#388E3C' : variant === 1 ? '#2E7D32' : '#1B5E20');
        const leafColor3 = dark ? '#020502' : (variant === 0 ? '#2E7D32' : variant === 1 ? '#1B5E20' : '#1B5E20');

        // Bottom layer
        ctx.fillStyle = leafColor1;
        ctx.beginPath();
        ctx.moveTo(-15, 5);
        ctx.lineTo(19, -35);
        ctx.lineTo(53, 5);
        ctx.fill();

        // Middle layer
        ctx.fillStyle = leafColor2;
        ctx.beginPath();
        ctx.moveTo(-8, -10);
        ctx.lineTo(19, -45);
        ctx.lineTo(46, -10);
        ctx.fill();

        // Top layer  
        ctx.fillStyle = leafColor3;
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(19, -55);
        ctx.lineTo(38, -25);
        ctx.fill();

        ctx.restore();
    };

    const drawRock = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.save(); ctx.translate(x, y);
        drawShadow(ctx, 0, 12, 30);

        // Main rock body
        ctx.fillStyle = '#78909C';
        ctx.beginPath();
        ctx.moveTo(5, 18);
        ctx.lineTo(0, 8);
        ctx.lineTo(8, 0);
        ctx.lineTo(22, 0);
        ctx.lineTo(30, 8);
        ctx.lineTo(28, 18);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#90A4AE';
        ctx.beginPath();
        ctx.moveTo(8, 5);
        ctx.lineTo(15, 2);
        ctx.lineTo(20, 5);
        ctx.lineTo(15, 10);
        ctx.closePath();
        ctx.fill();

        // Shadow detail
        ctx.fillStyle = '#546E7A';
        ctx.fillRect(10, 12, 12, 4);

        ctx.restore();
    };

    const drawCastle = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.save(); ctx.translate(x, y);
        // Base
        ctx.fillStyle = '#90A4AE'; ctx.fillRect(0, 40, 200, 120);
        // Towers
        ctx.fillStyle = '#546E7A';
        ctx.fillRect(-20, 0, 40, 160); // Left
        ctx.fillRect(180, 0, 40, 160); // Right
        // Door
        ctx.fillStyle = '#3E2723'; ctx.fillRect(70, 100, 60, 60);
        ctx.fillStyle = '#FFC107'; ctx.fillRect(0, 0, 20, 20); // Flag L
        ctx.fillRect(180, 0, 20, 20); // Flag R
        ctx.restore();
    };

    const drawPrincess = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.save(); ctx.translate(x, y);
        drawShadow(ctx, 0, 20, 20);
        // Dress
        ctx.fillStyle = '#F48FB1';
        ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(25, 30); ctx.lineTo(-5, 30); ctx.fill();
        // Head
        ctx.fillStyle = '#FFCCBC'; ctx.fillRect(5, -20, 12, 12);
        // Hair
        ctx.fillStyle = '#FFF59D'; ctx.fillRect(3, -22, 16, 8);
        ctx.restore();
    };

    const drawDragon = (ctx: CanvasRenderingContext2D, x: number, y: number, damaged: boolean = false, phase: GamePhase = 'COLLECT') => {
        ctx.save();
        ctx.translate(x, y);

        // Damage flash effect
        if (damaged) {
            ctx.filter = 'brightness(2) hue-rotate(30deg)';
        }

        // Angry glow in fight phase
        if (phase === 'FIGHT') {
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 15;
        }

        // Bigger shadow for menacing dragon
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(50, 95, 45, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        const bob = Math.sin(Date.now() / 200) * 6;
        const wingFlap = Math.sin(Date.now() / 100) * (phase === 'FIGHT' ? 25 : 15); // Faster wing flap when angry

        // DETAILED MENACING DRAGON

        // Tail
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.moveTo(30, 70 + bob);
        ctx.quadraticCurveTo(-20, 80 + bob, -30, 60 + bob);
        ctx.quadraticCurveTo(-25, 55 + bob, 25, 65 + bob);
        ctx.fill();

        // Tail spikes
        ctx.fillStyle = '#4A0000';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-10 + i * 12, 60 + bob);
            ctx.lineTo(-5 + i * 12, 50 + bob);
            ctx.lineTo(0 + i * 12, 62 + bob);
            ctx.fill();
        }

        // Left Wing
        ctx.fillStyle = '#B71C1C';
        ctx.beginPath();
        ctx.moveTo(40, 30 + bob);
        ctx.lineTo(-10, -20 + bob + wingFlap);
        ctx.lineTo(-5, 10 + bob + wingFlap / 2);
        ctx.lineTo(10, -10 + bob + wingFlap);
        ctx.lineTo(20, 20 + bob + wingFlap / 2);
        ctx.lineTo(25, 0 + bob + wingFlap);
        ctx.lineTo(35, 30 + bob);
        ctx.fill();

        // Wing membrane detail
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, 30 + bob);
        ctx.lineTo(0, -5 + bob + wingFlap);
        ctx.moveTo(40, 30 + bob);
        ctx.lineTo(15, 5 + bob + wingFlap / 2);
        ctx.stroke();

        // Right Wing
        ctx.fillStyle = '#B71C1C';
        ctx.beginPath();
        ctx.moveTo(60, 30 + bob);
        ctx.lineTo(110, -20 + bob + wingFlap);
        ctx.lineTo(105, 10 + bob + wingFlap / 2);
        ctx.lineTo(90, -10 + bob + wingFlap);
        ctx.lineTo(80, 20 + bob + wingFlap / 2);
        ctx.lineTo(75, 0 + bob + wingFlap);
        ctx.lineTo(65, 30 + bob);
        ctx.fill();

        // Body
        ctx.fillStyle = '#D32F2F';
        ctx.beginPath();
        ctx.ellipse(50, 55 + bob, 28, 35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly scales
        ctx.fillStyle = '#FF8A65';
        ctx.beginPath();
        ctx.ellipse(50, 60 + bob, 18, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Scale pattern on belly
        ctx.strokeStyle = '#E57373';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(50, 45 + i * 8 + bob, 12 - i, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }

        // Legs
        ctx.fillStyle = '#C62828';
        // Back legs
        ctx.fillRect(30, 75 + bob, 12, 18);
        ctx.fillRect(58, 75 + bob, 12, 18);
        // Claws
        ctx.fillStyle = '#3E2723';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(32 + i * 4, 93 + bob);
            ctx.lineTo(34 + i * 4, 98 + bob);
            ctx.lineTo(36 + i * 4, 93 + bob);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(60 + i * 4, 93 + bob);
            ctx.lineTo(62 + i * 4, 98 + bob);
            ctx.lineTo(64 + i * 4, 93 + bob);
            ctx.fill();
        }

        // Neck
        ctx.fillStyle = '#C62828';
        ctx.beginPath();
        ctx.moveTo(40, 30 + bob);
        ctx.quadraticCurveTo(45, 10 + bob, 50, 5 + bob);
        ctx.quadraticCurveTo(55, 10 + bob, 60, 30 + bob);
        ctx.fill();

        // Back spikes
        ctx.fillStyle = '#4A0000';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(42 + i * 4, 25 + bob - i * 5);
            ctx.lineTo(45 + i * 4, 12 + bob - i * 6);
            ctx.lineTo(48 + i * 4, 25 + bob - i * 5);
            ctx.fill();
        }

        // Head
        ctx.fillStyle = '#B71C1C';
        ctx.beginPath();
        ctx.ellipse(50, 0 + bob, 22, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = '#C62828';
        ctx.beginPath();
        ctx.ellipse(50, -12 + bob, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nostrils with smoke effect
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.ellipse(45, -18 + bob, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(55, -18 + bob, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Smoke particles
        ctx.fillStyle = 'rgba(100,100,100,0.4)';
        const smokeTime = Date.now() / 300;
        for (let i = 0; i < 3; i++) {
            const smokeY = -22 + bob - (smokeTime + i * 2) % 15;
            const smokeX = 45 + Math.sin(smokeTime + i) * 3;
            ctx.beginPath();
            ctx.arc(smokeX, smokeY, 3 - i * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(smokeX + 10, smokeY - 2, 2.5 - i * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Horns
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.moveTo(35, -5 + bob);
        ctx.lineTo(25, -25 + bob);
        ctx.lineTo(38, -8 + bob);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(65, -5 + bob);
        ctx.lineTo(75, -25 + bob);
        ctx.lineTo(62, -8 + bob);
        ctx.fill();

        // Eyes - Glowing menacing!
        ctx.fillStyle = '#FF6F00';
        ctx.beginPath();
        ctx.ellipse(40, -3 + bob, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(60, -3 + bob, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing effect
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.ellipse(40, -3 + bob, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(60, -3 + bob, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Evil pupils
        ctx.fillStyle = '#000';
        ctx.fillRect(39, -5 + bob, 2, 5);
        ctx.fillRect(59, -5 + bob, 2, 5);

        ctx.filter = 'none';
        ctx.restore();
    };

    const drawSignpost = (ctx: CanvasRenderingContext2D, x: number, y: number, text?: string) => {
        ctx.save(); ctx.translate(x, y);
        drawShadow(ctx, 0, 15, 10);
        // Post
        ctx.fillStyle = '#795548';
        ctx.fillRect(8, 0, 4, 25);
        // Sign board
        ctx.fillStyle = '#D7CCC8';
        ctx.fillRect(-5, -15, 30, 18);
        // Sign border
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(-5, -15, 30, 18);
        // Arrow or text on sign
        ctx.fillStyle = '#3E2723';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        if (text) {
            ctx.fillText(text.substring(0, 8), 10, -3);
        } else {
            ctx.fillText('→', 10, -3);
        }
        ctx.restore();
    };

    const drawApple = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.save(); ctx.translate(x, y);
        drawShadow(ctx, 5, 15, 15);
        // Apple body
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(10, 10, 10, 0, Math.PI * 2);
        ctx.fill();
        // Stem
        ctx.fillStyle = '#795548';
        ctx.fillRect(8, -2, 4, 6);
        // Leaf
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.ellipse(14, 0, 4, 2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(6, 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    // === NEW DRAW FUNCTIONS ===

    const drawHouse = (ctx: CanvasRenderingContext2D, x: number, y: number, variant: number = 0) => {
        ctx.save(); ctx.translate(x, y);
        drawShadow(ctx, 10, 45, 50);

        // Wall colors per variant
        const wallColors = ['#E8D4B8', '#D4A574', '#C9B896'];
        const roofColors = ['#8B4513', '#A0522D', '#CD853F'];

        // Main wall
        ctx.fillStyle = wallColors[variant % 3];
        ctx.fillRect(5, 20, 50, 30);

        // Roof
        ctx.fillStyle = roofColors[variant % 3];
        ctx.beginPath();
        ctx.moveTo(0, 22);
        ctx.lineTo(30, -5);
        ctx.lineTo(60, 22);
        ctx.closePath();
        ctx.fill();

        // Roof outline
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Door
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(22, 30, 16, 20);

        // Door handle
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(32, 40, 3, 3);

        // Window
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(10, 28, 10, 10);
        ctx.fillRect(40, 28, 10, 10);

        // Window frame
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 28, 10, 10);
        ctx.strokeRect(40, 28, 10, 10);

        // Chimney
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(42, 2, 10, 12);

        ctx.restore();
    };

    const drawMountain = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
        ctx.save(); ctx.translate(x, y);

        // Main mountain body
        ctx.fillStyle = '#6B7B8C';
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(width * 0.5, 0);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // Snow cap
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(width * 0.35, height * 0.3);
        ctx.lineTo(width * 0.5, 0);
        ctx.lineTo(width * 0.65, height * 0.3);
        ctx.closePath();
        ctx.fill();

        // Shadow side
        ctx.fillStyle = '#4A5568';
        ctx.beginPath();
        ctx.moveTo(width * 0.5, 0);
        ctx.lineTo(width * 0.65, height * 0.3);
        ctx.lineTo(width * 0.75, height);
        ctx.lineTo(width * 0.5, height);
        ctx.closePath();
        ctx.fill();

        // Detail rocks
        ctx.fillStyle = '#5A6577';
        ctx.beginPath();
        ctx.moveTo(width * 0.2, height * 0.7);
        ctx.lineTo(width * 0.25, height * 0.5);
        ctx.lineTo(width * 0.3, height * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    };

    const drawFarm = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.save(); ctx.translate(x, y);
        drawShadow(ctx, 20, 55, 70);

        // Barn main
        ctx.fillStyle = '#B71C1C';
        ctx.fillRect(10, 15, 80, 45);

        // Barn roof
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(5, 17);
        ctx.lineTo(50, -10);
        ctx.lineTo(95, 17);
        ctx.closePath();
        ctx.fill();

        // Barn doors
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(35, 30, 30, 30);

        // Door cross pattern
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(35, 30);
        ctx.lineTo(65, 60);
        ctx.moveTo(65, 30);
        ctx.lineTo(35, 60);
        ctx.stroke();

        // Hay bales
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(0, 50, 15, 10);
        ctx.fillRect(85, 50, 15, 10);

        // Field rows
        ctx.fillStyle = '#8B7355';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-20, 65 + i * 8, 140, 3);
        }

        ctx.restore();
    };

    const drawLake = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
        ctx.save(); ctx.translate(x, y);

        // Water body
        ctx.fillStyle = '#4FC3F7';
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Darker edge
        ctx.strokeStyle = '#0288D1';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Waves/ripples
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        const time = Date.now() / 1000;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(width / 2 + Math.sin(time + i) * 10, height / 2, (width / 4) * (i + 1) / 3, 0, Math.PI);
            ctx.stroke();
        }

        // Lily pads
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.ellipse(width * 0.3, height * 0.6, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(width * 0.7, height * 0.4, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const drawWell = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.save(); ctx.translate(x, y);
        drawShadow(ctx, 5, 22, 20);

        // Stone base
        ctx.fillStyle = '#78909C';
        ctx.beginPath();
        ctx.ellipse(12, 20, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Well hole (dark)
        ctx.fillStyle = '#1A237E';
        ctx.beginPath();
        ctx.ellipse(12, 18, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Support posts
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(0, 0, 3, 20);
        ctx.fillRect(22, 0, 3, 20);

        // Roof
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(-2, 2);
        ctx.lineTo(12, -8);
        ctx.lineTo(27, 2);
        ctx.closePath();
        ctx.fill();

        // Rope and bucket
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(12, -2);
        ctx.lineTo(12, 10);
        ctx.stroke();

        ctx.fillStyle = '#5D4037';
        ctx.fillRect(9, 8, 6, 5);

        ctx.restore();
    };

    const drawWindmill = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.save(); ctx.translate(x, y);
        drawShadow(ctx, 10, 75, 40);

        // Tower
        ctx.fillStyle = '#D7CCC8';
        ctx.beginPath();
        ctx.moveTo(10, 80);
        ctx.lineTo(20, 20);
        ctx.lineTo(30, 20);
        ctx.lineTo(40, 80);
        ctx.closePath();
        ctx.fill();

        // Tower lines
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(12 + i * 3, 70 - i * 12);
            ctx.lineTo(38 - i * 3, 70 - i * 12);
            ctx.stroke();
        }

        // Blades center
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.arc(25, 25, 5, 0, Math.PI * 2);
        ctx.fill();

        // Rotating blades
        const rotation = Date.now() / 1000;
        ctx.save();
        ctx.translate(25, 25);
        ctx.rotate(rotation);

        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate((Math.PI / 2) * i);
            ctx.beginPath();
            ctx.moveTo(-3, 0);
            ctx.lineTo(-8, -35);
            ctx.lineTo(8, -35);
            ctx.lineTo(3, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();

        // Door
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(20, 65, 10, 15);

        ctx.restore();
    };

    const drawCampfire = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.save(); ctx.translate(x, y);

        // Logs
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(3, 22, 25, 6);
        ctx.fillRect(8, 18, 15, 6);

        // Fire glow
        const time = Date.now() / 200;
        const flicker = Math.sin(time) * 3;

        ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(15, 15, 20 + flicker, 0, Math.PI * 2);
        ctx.fill();

        // Fire flames
        ctx.fillStyle = '#FF6F00';
        ctx.beginPath();
        ctx.moveTo(15, 5 + flicker);
        ctx.quadraticCurveTo(5, 15, 10, 22);
        ctx.lineTo(20, 22);
        ctx.quadraticCurveTo(25, 15, 15, 5 + flicker);
        ctx.fill();

        // Inner flame
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.moveTo(15, 10 + flicker);
        ctx.quadraticCurveTo(10, 16, 12, 20);
        ctx.lineTo(18, 20);
        ctx.quadraticCurveTo(20, 16, 15, 10 + flicker);
        ctx.fill();

        // Sparks
        ctx.fillStyle = '#FF9800';
        for (let i = 0; i < 3; i++) {
            const sparkY = 5 - ((time * 20 + i * 10) % 20);
            const sparkX = 12 + Math.sin(time + i * 2) * 5;
            ctx.fillRect(sparkX, sparkY, 2, 2);
        }

        ctx.restore();
    };

    const drawBridge = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
        ctx.save(); ctx.translate(x, y);

        // Bridge planks
        ctx.fillStyle = '#8D6E63';
        for (let i = 0; i < width / 10; i++) {
            ctx.fillRect(i * 10, 0, 8, height);
        }

        // Side rails
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(0, -5, width, 3);
        ctx.fillRect(0, height + 2, width, 3);

        // Rail posts
        ctx.fillRect(0, -8, 4, height + 16);
        ctx.fillRect(width - 4, -8, 4, height + 16);
        ctx.fillRect(width / 2 - 2, -8, 4, height + 16);

        ctx.restore();
    };

    const drawFence = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number) => {
        ctx.save(); ctx.translate(x, y);

        // Horizontal bars
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(0, 3, width, 3);
        ctx.fillRect(0, 10, width, 3);

        // Vertical posts
        ctx.fillStyle = '#5D4037';
        const numPosts = Math.floor(width / 15) + 1;
        for (let i = 0; i < numPosts; i++) {
            ctx.fillRect(i * 15, 0, 4, 15);
        }

        ctx.restore();
    };

    const drawBush = (ctx: CanvasRenderingContext2D, x: number, y: number, variant: number = 0) => {
        ctx.save(); ctx.translate(x, y);
        drawShadow(ctx, 8, 20, 20);

        const colors = ['#43A047', '#2E7D32', '#388E3C'];
        ctx.fillStyle = colors[variant % 3];

        // Main bush shape
        ctx.beginPath();
        ctx.arc(8, 15, 10, 0, Math.PI * 2);
        ctx.arc(18, 12, 12, 0, Math.PI * 2);
        ctx.arc(28, 15, 10, 0, Math.PI * 2);
        ctx.fill();

        // Highlights
        ctx.fillStyle = '#66BB6A';
        ctx.beginPath();
        ctx.arc(12, 10, 5, 0, Math.PI * 2);
        ctx.arc(22, 8, 4, 0, Math.PI * 2);
        ctx.fill();

        // Berries (random based on variant)
        if (variant === 1) {
            ctx.fillStyle = '#E53935';
            ctx.beginPath();
            ctx.arc(10, 12, 2, 0, Math.PI * 2);
            ctx.arc(20, 10, 2, 0, Math.PI * 2);
            ctx.arc(25, 14, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    const drawMushroom = (ctx: CanvasRenderingContext2D, x: number, y: number, variant: number = 0) => {
        ctx.save(); ctx.translate(x, y);

        // Stem
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(5, 8, 5, 8);

        // Cap colors per variant
        const capColors = ['#E53935', '#8B4513', '#FF9800'];
        ctx.fillStyle = capColors[variant % 3];

        // Cap
        ctx.beginPath();
        ctx.arc(7.5, 6, 8, Math.PI, 0);
        ctx.fill();

        // Spots (for red mushroom)
        if (variant === 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(4, 4, 2, 0, Math.PI * 2);
            ctx.arc(10, 3, 1.5, 0, Math.PI * 2);
            ctx.arc(7, 1, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    return (
        <div className="w-full relative group overflow-hidden select-none border-4 border-capy-teal rounded-xl shadow-2xl" style={{ height: CANVAS_HEIGHT, background: '#000' }}>
            {/* Canvas */}
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="block w-full h-full object-cover cursor-none outline-none"
                style={{ imageRendering: 'pixelated' }}
            />

            {/* UI Overlays */}

            {/* HP BARS - Always visible during gameplay */}
            {(gameMode === 'PLAYING' || gameMode === 'BOSS_FIGHT') && (
                <div className="absolute top-4 left-4 z-40 flex flex-col gap-3">
                    {/* Capy HP Bar */}
                    <div className="bg-black/70 border border-green-500/50 rounded-lg px-3 py-2 backdrop-blur-sm min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">🦫</span>
                            <span className="text-sm font-bold text-green-400">CAPYBARA</span>
                            <span className="text-xs text-white/60 ml-auto">{capyHP}/100</span>
                        </div>
                        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-green-900">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                                style={{ width: `${Math.max(0, capyHP)}%` }}
                            />
                        </div>
                    </div>

                    {/* Dragon HP Bar - only in fight phase or when boss is active */}
                    {(gamePhase === 'FIGHT' || showBossUI) && dragonHP > 0 && (
                        <div className="bg-black/70 border border-red-500/50 rounded-lg px-3 py-2 backdrop-blur-sm min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">🐲</span>
                                <span className="text-sm font-bold text-red-400">
                                    {dragonsRemaining > 0 ? `DRAGON (${dragonsRemaining} left)` : 'DRAGON'}
                                </span>
                                <span className="text-xs text-white/60 ml-auto">{dragonHP}/{dragonsRemaining > 0 ? 80 : 100}</span>
                            </div>
                            <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-red-900">
                                <div
                                    className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-150"
                                    style={{ width: `${Math.max(0, (dragonHP / (dragonsRemaining > 0 ? 80 : 100)) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* GAME PHASE INDICATOR */}
            {(gameMode === 'PLAYING' || gameMode === 'BOSS_FIGHT') && (
                <div className="absolute top-4 right-4 z-40 flex flex-col gap-2">
                    {/* Wave Display - show when waves are active */}
                    {waveNumber > 0 && gameState.current.waveInProgress && (
                        <div className="bg-purple-900/70 border-2 border-purple-400 rounded-xl px-4 py-3 backdrop-blur-sm animate-pulse">
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🐲</span>
                                    <span className="text-lg font-bold text-purple-300">WAVE {waveNumber}</span>
                                    <span className="text-2xl">⚔️</span>
                                </div>
                                <div className="text-sm text-purple-200">
                                    Dragons remaining: {dragonsRemaining}
                                </div>
                                <div className="flex gap-1 mt-1">
                                    {Array.from({ length: dragonsRemaining }).map((_, i) => (
                                        <span key={i} className="text-xl">🐲</span>
                                    ))}
                                </div>
                                <div className="text-xs text-cyan-400 mt-2">💡 SPACE = attack</div>
                            </div>
                        </div>
                    )}

                    {/* Phase Display - only show when NOT in wave mode */}
                    {!gameState.current.waveInProgress && (
                        <div className={`border rounded-xl px-4 py-3 backdrop-blur-sm ${gamePhase === 'COLLECT' ? 'bg-yellow-900/60 border-yellow-500/50' :
                            gamePhase === 'EATING' ? 'bg-green-900/60 border-green-500/50' :
                                'bg-red-900/60 border-red-500/50 animate-pulse'
                            }`}>
                            <div className="flex flex-col items-center gap-1">
                                {gamePhase === 'COLLECT' && !gameState.current.dragonDefeated && !gameState.current.princessMet && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">🍎</span>
                                            <span className="text-lg font-bold text-yellow-400">COLLECT APPLES!</span>
                                        </div>
                                        <div className="text-sm text-yellow-200">
                                            {score}/{APPLES_TO_WIN} apples
                                        </div>
                                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-1">
                                            <div
                                                className="h-full bg-yellow-400 transition-all duration-300"
                                                style={{ width: `${(score / APPLES_TO_WIN) * 100}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-white/50 mt-1">⚠️ Dragon is chasing you!</div>
                                        <div className="text-xs text-cyan-400 mt-1">💡 SPACE = weak attack</div>
                                    </>
                                )}
                                {gamePhase === 'EATING' && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl animate-bounce">🍎</span>
                                            <span className="text-lg font-bold text-green-400">EATING...</span>
                                            <span className="text-2xl animate-bounce">⚡</span>
                                        </div>
                                        <div className="text-sm text-green-200">Gaining power!</div>
                                    </>
                                )}
                                {gamePhase === 'FIGHT' && !gameState.current.waveInProgress && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">⚔️</span>
                                            <span className="text-lg font-bold text-red-400">FIGHT!</span>
                                        </div>
                                        <div className="text-sm text-red-200">Press SPACE to attack!</div>
                                        <div className="text-xs text-white/50 mt-1">Get close to the dragon!</div>
                                    </>
                                )}
                                {gameState.current.dragonDefeated && !gameState.current.princessMet && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">👸</span>
                                            <span className="text-lg font-bold text-yellow-400">FIND PRINCESS!</span>
                                        </div>
                                        <div className="text-sm text-yellow-200">Go to the castle! 🏰</div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Menu (ESC) */}
            {showMenu && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-50 backdrop-blur-sm">
                    <h2 className="text-4xl font-bold mb-8 text-capy-mint font-sequel uppercase">Paused</h2>
                    <div className="flex flex-col gap-4 w-64">
                        <button
                            onClick={() => { setShowMenu(false); setGameMode('PLAYING'); }}
                            className="bg-white/10 hover:bg-capy-teal text-white py-3 px-6 rounded-lg transition-colors uppercase tracking-widest font-bold"
                        >
                            Resume
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-white/10 hover:bg-red-500 text-white py-3 px-6 rounded-lg transition-colors uppercase tracking-widest font-bold"
                        >
                            Restart
                        </button>
                    </div>
                    <p className="mt-8 text-white/40 text-sm">Press ESC to Close</p>
                </div>
            )}

            {/* Dialogue Box */}
            {gameMode === 'DIALOGUE' && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] bg-[#1a1a1a]/95 border-2 border-white/20 p-6 rounded-xl shadow-2xl z-40 backdrop-blur-md">
                    <div className="flex gap-4">
                        {/* Portrait Placeholder */}
                        <div className="w-16 h-16 bg-capy-teal/20 rounded-lg shrink-0 border border-white/10 flex items-center justify-center">
                            <div className="text-2xl">🦫</div>
                        </div>
                        <div className="flex-1">
                            <p className="text-white text-lg font-mono leading-relaxed typewriter">{dialogueText}</p>
                            <p className="text-right text-xs text-white/30 mt-4 uppercase tracking-widest animate-pulse">Press Space to Continue</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Victory Screen */}
            {gameMode === 'VICTORY' && gameState.current.dialogueQueue.length === 0 && (
                <div className="absolute inset-0 bg-gradient-to-b from-green-900/80 to-yellow-900/80 flex flex-col items-center justify-center text-white z-50 animate-in fade-in duration-1000">
                    <div className="text-8xl mb-4">👸🦫🏆</div>
                    <h1 className="text-5xl font-bold text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] text-center">GAME WIN!</h1>
                    <p className="text-3xl mb-2 font-bold text-green-400 animate-pulse">GO AND BUY TOKEN NOW! 🚀</p>
                    <p className="text-lg text-white/70 mb-8">You are a true Capybara hero! 💎</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-capy-mint text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
                        >
                            Play Again
                        </button>
                        <a
                            href="#buy"
                            className="bg-yellow-500 text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
                        >
                            BUY TOKEN 💰
                        </a>
                    </div>
                </div>
            )}

            {/* Game Over Screen */}
            {gameMode === 'GAME_OVER' && (
                <div className="absolute inset-0 bg-gradient-to-b from-red-900/80 to-black/90 flex flex-col items-center justify-center text-white z-50 animate-in fade-in duration-1000">
                    <div className="text-8xl mb-4">💀🐲</div>
                    <h1 className="text-6xl font-bold text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">GAME OVER</h1>
                    <p className="text-xl mb-2">The dragon caught you!</p>
                    <p className="text-lg text-white/70 mb-4">You collected {score}/{APPLES_TO_WIN} apples</p>
                    {score < APPLES_TO_WIN && (
                        <p className="text-md text-yellow-400 mb-4">Tip: Collect {APPLES_TO_WIN} apples to fight back!</p>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-500 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
                    >
                        Try Again
                    </button>
                </div>
            )}



            {/* Hints */}
            <div className="absolute bottom-2 right-4 text-white/30 text-[10px] font-mono pointer-events-none">
                WASD to Move • SPACE to Attack • ESC for Menu
            </div>
        </div>
    );
};
