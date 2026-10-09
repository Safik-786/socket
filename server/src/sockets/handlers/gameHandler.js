/**
 * Treasure Hunt — Server-Side Game Handler
 * 
 * Authoritative server state for a 2–6 player multiplayer treasure hunt.
 * All game logic runs here; clients only send intents (move, collect).
 */

// In-memory store for active game rooms
const gameRooms = new Map();

// ── Tile types & distribution for a 5×5 board ──────────────────────────
const TILE_TYPES = {
  COIN:     { type: 'coin',     emoji: '🪙', effect: 'coins',    value: 10  },
  TREASURE: { type: 'treasure', emoji: '💎', effect: 'treasure', value: 100 },
  BOMB:     { type: 'bomb',     emoji: '💣', effect: 'damage',   value: -1  },
  HEALTH:   { type: 'health',   emoji: '❤️', effect: 'heal',     value: 1   },
  KEY:      { type: 'key',      emoji: '🔑', effect: 'key',      value: 0   },
  EMPTY:    { type: 'empty',    emoji: '🌴', effect: 'none',     value: 0   },
  MAP:      { type: 'map',      emoji: '🗺️', effect: 'reveal',   value: 0   },
  EXIT:     { type: 'exit',     emoji: '🚪', effect: 'exit',     value: 0   },
  START:    { type: 'start',    emoji: '🏠', effect: 'none',     value: 0   },
};

const GAME_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const BOARD_SIZE = 5;
const REQUIRED_TREASURES = 3;

// ── Helpers ─────────────────────────────────────────────────────────────

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Make sure code is unique
  if (gameRooms.has(code)) return generateRoomCode();
  return code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateBoard() {
  // Fixed tiles
  const fixedTiles = [
    { ...TILE_TYPES.START },   // start position (0,0)
    { ...TILE_TYPES.EXIT },    // exit position (4,4)
  ];

  // Pool of random tiles to fill the remaining 23 cells
  const pool = [
    // 3 treasures (required to win)
    ...Array(REQUIRED_TREASURES).fill(null).map(() => ({ ...TILE_TYPES.TREASURE })),
    // 1 key
    { ...TILE_TYPES.KEY },
    // 5 coins
    ...Array(5).fill(null).map(() => ({ ...TILE_TYPES.COIN })),
    // 3 bombs
    ...Array(3).fill(null).map(() => ({ ...TILE_TYPES.BOMB })),
    // 2 health
    ...Array(2).fill(null).map(() => ({ ...TILE_TYPES.HEALTH })),
    // 1 map
    { ...TILE_TYPES.MAP },
    // Rest are empty (23 - 3 - 1 - 5 - 3 - 2 - 1 = 8 empty)
    ...Array(8).fill(null).map(() => ({ ...TILE_TYPES.EMPTY })),
  ];

  const shuffled = shuffle(pool);

  // Build 5×5 board
  const board = [];
  let poolIndex = 0;

  for (let y = 0; y < BOARD_SIZE; y++) {
    const row = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (x === 0 && y === 0) {
        // Start tile — always revealed
        row.push({ ...TILE_TYPES.START, revealed: true, collected: false });
      } else if (x === BOARD_SIZE - 1 && y === BOARD_SIZE - 1) {
        // Exit tile — always revealed
        row.push({ ...TILE_TYPES.EXIT, revealed: true, collected: false });
      } else {
        row.push({ ...shuffled[poolIndex++], revealed: false, collected: false });
      }
    }
    board.push(row);
  }

  return board;
}

function getPlayerColors() {
  return ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
}

function sanitizeGameState(room, forPlayerId) {
  // Send full state but hide unrevealed tile types for fog-of-war
  const sanitizedBoard = room.board
    ? room.board.map(row =>
        row.map(tile => {
          if (tile.revealed) {
            return { ...tile };
          }
          return { type: 'hidden', emoji: '❓', revealed: false, collected: tile.collected };
        })
      )
    : null;

  return {
    roomCode: room.roomCode,
    status: room.status,
    hostId: room.hostId,
    players: room.players,
    board: sanitizedBoard,
    boardSize: BOARD_SIZE,
    endsAt: room.endsAt,
    startedAt: room.startedAt,
    requiredTreasures: REQUIRED_TREASURES,
    winner: room.winner || null,
    eventLog: room.eventLog.slice(-8),
  };
}

function checkWinCondition(player) {
  return (
    player.treasures >= REQUIRED_TREASURES &&
    player.hasKey &&
    player.atExit
  );
}

// ── Main handler ────────────────────────────────────────────────────────

export const handleGameEvents = (io, socket) => {
  const userId = socket.data.userId;

  // ── CREATE ROOM ─────────────────────────────────────────────────────
  socket.on('game:create-room', ({ username }) => {
    const roomCode = generateRoomCode();
    const colors = getPlayerColors();

    const room = {
      roomCode,
      hostId: userId,
      status: 'lobby', // lobby | countdown | playing | completed
      players: {
        [userId]: {
          id: userId,
          username: username || 'Player',
          position: { x: 0, y: 0 },
          coins: 0,
          health: 3,
          hasKey: false,
          treasures: 0,
          atExit: false,
          color: colors[0],
          isAlive: true,
        }
      },
      board: null,
      startedAt: null,
      endsAt: null,
      winner: null,
      eventLog: [],
      timer: null,
    };

    gameRooms.set(roomCode, room);
    socket.join(`game:${roomCode}`);

    socket.emit('game:room-created', {
      roomCode,
      gameState: sanitizeGameState(room, userId),
    });
  });

  // ── JOIN ROOM ───────────────────────────────────────────────────────
  socket.on('game:join-room', ({ roomCode, username }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = gameRooms.get(code);

    if (!room) {
      return socket.emit('game:error', { message: 'Room not found' });
    }
    if (room.status !== 'lobby') {
      return socket.emit('game:error', { message: 'Game already in progress' });
    }
    if (Object.keys(room.players).length >= 6) {
      return socket.emit('game:error', { message: 'Room is full (max 6 players)' });
    }
    if (room.players[userId]) {
      return socket.emit('game:error', { message: 'You are already in this room' });
    }

    const colors = getPlayerColors();
    const playerIndex = Object.keys(room.players).length;

    room.players[userId] = {
      id: userId,
      username: username || 'Player',
      position: { x: 0, y: 0 },
      coins: 0,
      health: 3,
      hasKey: false,
      treasures: 0,
      atExit: false,
      color: colors[playerIndex % colors.length],
      isAlive: true,
    };

    socket.join(`game:${code}`);

    // Notify everyone in the room
    io.to(`game:${code}`).emit('game:player-joined', {
      player: room.players[userId],
      gameState: sanitizeGameState(room, userId),
    });
  });

  // ── LEAVE ROOM ──────────────────────────────────────────────────────
  socket.on('game:leave-room', ({ roomCode }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = gameRooms.get(code);
    if (!room) return;

    delete room.players[userId];
    socket.leave(`game:${code}`);

    const remainingPlayers = Object.keys(room.players);

    if (remainingPlayers.length === 0) {
      // Clean up empty room
      if (room.timer) clearTimeout(room.timer);
      gameRooms.delete(code);
      return;
    }

    // If host left, transfer to next player
    if (room.hostId === userId) {
      room.hostId = remainingPlayers[0];
    }

    io.to(`game:${code}`).emit('game:player-left', {
      playerId: userId,
      gameState: sanitizeGameState(room),
    });
  });

  // ── START GAME ──────────────────────────────────────────────────────
  socket.on('game:start', ({ roomCode }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = gameRooms.get(code);

    if (!room) {
      return socket.emit('game:error', { message: 'Room not found' });
    }
    if (room.hostId !== userId) {
      return socket.emit('game:error', { message: 'Only the host can start the game' });
    }
    if (Object.keys(room.players).length < 2) {
      return socket.emit('game:error', { message: 'Need at least 2 players to start' });
    }
    if (room.status !== 'lobby') {
      return socket.emit('game:error', { message: 'Game already started' });
    }

    // Generate board
    room.board = generateBoard();
    room.status = 'playing';
    room.startedAt = Date.now();
    room.endsAt = Date.now() + GAME_DURATION_MS;
    room.eventLog = [{ text: '🏴‍☠️ The treasure hunt begins!', time: Date.now() }];

    // Reset all player positions
    Object.values(room.players).forEach(p => {
      p.position = { x: 0, y: 0 };
      p.coins = 0;
      p.health = 3;
      p.hasKey = false;
      p.treasures = 0;
      p.atExit = false;
      p.isAlive = true;
    });

    // Set server-side timeout for game end
    room.timer = setTimeout(() => {
      if (room.status === 'playing') {
        endGame(io, room, null, 'Time\'s up!');
      }
    }, GAME_DURATION_MS);

    io.to(`game:${code}`).emit('game:started', {
      gameState: sanitizeGameState(room),
    });
  });

  // ── PLAYER MOVE ─────────────────────────────────────────────────────
  socket.on('game:move', ({ roomCode, direction }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = gameRooms.get(code);

    if (!room || room.status !== 'playing') return;

    const player = room.players[userId];
    if (!player || !player.isAlive) return;

    const { x, y } = player.position;
    let newX = x, newY = y;

    switch (direction) {
      case 'up':    newY = y - 1; break;
      case 'down':  newY = y + 1; break;
      case 'left':  newX = x - 1; break;
      case 'right': newX = x + 1; break;
      default: return;
    }

    // Boundary check
    if (newX < 0 || newX >= BOARD_SIZE || newY < 0 || newY >= BOARD_SIZE) {
      return socket.emit('game:error', { message: 'Cannot move there' });
    }

    // Move player
    player.position = { x: newX, y: newY };

    // Get the tile
    const tile = room.board[newY][newX];

    // Reveal tile if hidden
    if (!tile.revealed) {
      tile.revealed = true;
    }

    // Process tile effect if not already collected
    let eventText = '';
    if (!tile.collected) {
      switch (tile.effect) {
        case 'coins':
          player.coins += tile.value;
          tile.collected = true;
          eventText = `${player.username} found ${tile.value} coins! 🪙`;
          break;

        case 'treasure':
          player.treasures += 1;
          player.coins += tile.value;
          tile.collected = true;
          eventText = `${player.username} found a treasure! 💎 (${player.treasures}/${REQUIRED_TREASURES})`;
          break;

        case 'damage':
          player.health += tile.value; // value is -1
          tile.collected = true;
          eventText = `${player.username} hit a bomb! 💣 Health: ${player.health}`;
          if (player.health <= 0) {
            player.isAlive = false;
            eventText = `${player.username} was eliminated! 💀`;
          }
          break;

        case 'heal':
          player.health = Math.min(player.health + tile.value, 5);
          tile.collected = true;
          eventText = `${player.username} found a health pack! ❤️`;
          break;

        case 'key':
          player.hasKey = true;
          tile.collected = true;
          eventText = `${player.username} found the key! 🔑`;
          break;

        case 'reveal': {
          tile.collected = true;
          // Reveal all adjacent tiles
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ry = newY + dy;
              const rx = newX + dx;
              if (ry >= 0 && ry < BOARD_SIZE && rx >= 0 && rx < BOARD_SIZE) {
                room.board[ry][rx].revealed = true;
              }
            }
          }
          eventText = `${player.username} found a map! Nearby tiles revealed! 🗺️`;
          break;
        }

        case 'exit':
          player.atExit = true;
          // Check win condition
          if (checkWinCondition(player)) {
            room.eventLog.push({ text: `🎉 ${player.username} escaped the island!`, time: Date.now() });
            endGame(io, room, userId, `${player.username} escaped!`);
            return;
          } else {
            eventText = `${player.username} reached the exit! 🚪`;
            if (!player.hasKey) eventText += ' (Need 🔑)';
            if (player.treasures < REQUIRED_TREASURES) eventText += ` (Need ${REQUIRED_TREASURES - player.treasures} more 💎)`;
          }
          break;

        case 'none':
        default:
          eventText = `${player.username} found an empty clearing 🌴`;
          tile.collected = true;
          break;
      }
    } else {
      // Tile already collected — check exit specifically
      if (tile.type === 'exit') {
        player.atExit = true;
        if (checkWinCondition(player)) {
          room.eventLog.push({ text: `🎉 ${player.username} escaped the island!`, time: Date.now() });
          endGame(io, room, userId, `${player.username} escaped!`);
          return;
        }
      }
    }

    // Update atExit flag
    if (tile.type !== 'exit') {
      player.atExit = false;
    }

    if (eventText) {
      room.eventLog.push({ text: eventText, time: Date.now() });
    }

    // Check if all players are eliminated
    const alivePlayers = Object.values(room.players).filter(p => p.isAlive);
    if (alivePlayers.length === 0) {
      endGame(io, room, null, 'All players eliminated!');
      return;
    }
    if (alivePlayers.length === 1 && Object.keys(room.players).length > 1) {
      endGame(io, room, alivePlayers[0].id, `${alivePlayers[0].username} is the last one standing!`);
      return;
    }

    // Broadcast updated state to everyone
    io.to(`game:${code}`).emit('game:state-updated', {
      gameState: sanitizeGameState(room),
    });
  });

  // ── PLAY AGAIN ──────────────────────────────────────────────────────
  socket.on('game:play-again', ({ roomCode }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = gameRooms.get(code);

    if (!room || room.status !== 'completed') return;

    room.status = 'lobby';
    room.board = null;
    room.startedAt = null;
    room.endsAt = null;
    room.winner = null;
    room.eventLog = [];

    // Reset all player stats
    Object.values(room.players).forEach(p => {
      p.position = { x: 0, y: 0 };
      p.coins = 0;
      p.health = 3;
      p.hasKey = false;
      p.treasures = 0;
      p.atExit = false;
      p.isAlive = true;
    });

    // Broadcast reset to everyone in the room
    io.to(`game:${code}`).emit('game:room-reset', {
      gameState: sanitizeGameState(room),
    });
  });

  // ── DISCONNECT CLEANUP ──────────────────────────────────────────────
  socket.on('disconnect', () => {
    // Clean up from any game rooms
    for (const [code, room] of gameRooms.entries()) {
      if (room.players[userId]) {
        delete room.players[userId];
        
        const remaining = Object.keys(room.players);
        if (remaining.length === 0) {
          if (room.timer) clearTimeout(room.timer);
          gameRooms.delete(code);
        } else {
          if (room.hostId === userId) {
            room.hostId = remaining[0];
          }
          io.to(`game:${code}`).emit('game:player-left', {
            playerId: userId,
            gameState: sanitizeGameState(room),
          });
        }
      }
    }
  });
};

// ── End Game ──────────────────────────────────────────────────────────

function endGame(io, room, winnerId, reason) {
  room.status = 'completed';
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }

  // Determine winner by score if no specific winner
  if (!winnerId) {
    const sorted = Object.values(room.players)
      .filter(p => p.isAlive)
      .sort((a, b) => (b.coins + b.treasures * 100) - (a.coins + a.treasures * 100));
    if (sorted.length > 0) {
      winnerId = sorted[0].id;
    }
  }

  room.winner = winnerId;
  const duration = room.startedAt ? Math.floor((Date.now() - room.startedAt) / 1000) : 0;

  const results = {
    winner: winnerId ? room.players[winnerId] : null,
    reason,
    duration,
    players: Object.values(room.players).map(p => ({
      id: p.id,
      username: p.username,
      coins: p.coins,
      treasures: p.treasures,
      health: p.health,
      hasKey: p.hasKey,
      score: p.coins + p.treasures * 100,
      color: p.color,
    })).sort((a, b) => b.score - a.score),
  };

  io.to(`game:${room.roomCode}`).emit('game:completed', {
    gameState: sanitizeGameState(room),
    results,
  });
}
