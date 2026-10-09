import React, { useState, useEffect } from 'react';

const GameLobby = ({ user, socket, onRoomJoined, initialGameState }) => {
  const [mode, setMode] = useState(initialGameState ? 'waiting' : null); // null | 'create' | 'join'
  const [joinCode, setJoinCode] = useState('');
  const [roomCode, setRoomCode] = useState(initialGameState?.roomCode || null);
  const [players, setPlayers] = useState(initialGameState?.players || {});
  const [hostId, setHostId] = useState(initialGameState?.hostId || null);
  const [error, setError] = useState('');

  // If mounted with an existing room, immediately start listening for events
  useEffect(() => {
    if (initialGameState && socket) {
      listenForUpdates(initialGameState.roomCode);
    }
  }, [initialGameState, socket]);

  const handleCreate = () => {
    if (!socket) return;
    
    socket.emit('game:create-room', { username: user.username });
    
    socket.once('game:room-created', ({ roomCode: code, gameState }) => {
      setRoomCode(code);
      setPlayers(gameState.players);
      setHostId(gameState.hostId);
      setMode('waiting');
      listenForUpdates(code);
    });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!socket || !joinCode.trim()) return;

    socket.emit('game:join-room', { roomCode: joinCode, username: user.username });

    socket.once('game:player-joined', ({ gameState }) => {
      setRoomCode(gameState.roomCode);
      setPlayers(gameState.players);
      setHostId(gameState.hostId);
      setMode('waiting');
      listenForUpdates(gameState.roomCode);
    });
  };

  const listenForUpdates = (code) => {
    socket.on('game:player-joined', ({ gameState }) => {
      setPlayers(gameState.players);
    });

    socket.on('game:player-left', ({ gameState }) => {
      setPlayers(gameState.players);
      setHostId(gameState.hostId);
    });

    socket.on('game:started', ({ gameState }) => {
      onRoomJoined(gameState);
    });

    socket.on('game:error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    });
  };

  const handleStart = () => {
    if (!socket || !roomCode) return;
    socket.emit('game:start', { roomCode });
  };

  const handleLeave = () => {
    if (socket && roomCode) {
      socket.emit('game:leave-room', { roomCode });
      socket.off('game:player-joined');
      socket.off('game:player-left');
      socket.off('game:started');
      socket.off('game:error');
    }
    setMode(null);
    setRoomCode(null);
    setPlayers({});
    setHostId(null);
  };

  const playerList = Object.values(players);
  const isHost = hostId === user._id;

  // ── Waiting Room ─────────────────────────────────────────────────────
  if (mode === 'waiting' && roomCode) {
    return (
      <div className="th-lobby">
        <div className="th-lobby-card">
          <h2>🏴‍☠️ Treasure Hunt Room</h2>
          
          <div className="th-room-code">{roomCode}</div>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(245,238,220,0.5)', marginBottom: 16 }}>
            Share this code with friends to join
          </p>

          <div className="th-hud-title">Players ({playerList.length}/6)</div>
          <div className="th-player-list">
            {playerList.map(player => (
              <div key={player.id} className="th-player-item">
                <div className="th-player-avatar" style={{ backgroundColor: player.color }}>
                  {player.username.charAt(0).toUpperCase()}
                </div>
                <span className="th-player-name">{player.username}</span>
                {player.id === hostId && <span className="th-host-badge">Host</span>}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            {isHost && (
              <button 
                className="th-btn th-btn-primary" 
                style={{ flex: 1 }}
                onClick={handleStart}
                disabled={playerList.length < 2}
              >
                {playerList.length < 2 ? 'Need 2+ Players' : '⚔️ Start Game'}
              </button>
            )}
            <button className="th-btn th-btn-danger" onClick={handleLeave}>
              Leave
            </button>
          </div>
        </div>

        {error && <div className="th-error-toast">{error}</div>}
      </div>
    );
  }

  // ── Create / Join Selection ──────────────────────────────────────────
  return (
    <div className="th-lobby">
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🏴‍☠️</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg, #f39c12, #e67e22)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Treasure Hunt
        </h1>
        <p style={{ color: 'rgba(245,238,220,0.5)', fontSize: '0.9rem', marginTop: 4 }}>
          Race to find treasures, grab the key, and escape!
        </p>
      </div>

      <div className="th-lobby-card">
        <button 
          className="th-btn th-btn-primary" 
          style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: '1rem' }}
          onClick={handleCreate}
        >
          🗺️ Create Room
        </button>

        <div className="th-or-divider">OR</div>

        <form className="th-join-form" onSubmit={handleJoin}>
          <input
            className="th-input"
            placeholder="CODE"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={4}
          />
          <button type="submit" className="th-btn th-btn-secondary" disabled={joinCode.length < 4}>
            Join
          </button>
        </form>
      </div>

      {error && <div className="th-error-toast">{error}</div>}
    </div>
  );
};

export default GameLobby;
