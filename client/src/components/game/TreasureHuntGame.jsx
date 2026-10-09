import React, { useState, useEffect, useCallback, useContext } from 'react';
import { SocketContext } from '../../contexts/SocketContext';
import GameLobby from './GameLobby';
import GameBoard from './GameBoard';
import GameHUD from './GameHUD';
import GameResults from './GameResults';
import './treasure-hunt.css';

const TreasureHuntGame = ({ user }) => {
  const socket = useContext(SocketContext);
  const [phase, setPhase] = useState('lobby'); // lobby | playing | completed
  const [gameState, setGameState] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // ── Listen for game events ──────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onStateUpdated = ({ gameState: newState }) => {
      setGameState(newState);
    };

    const onCompleted = ({ gameState: finalState, results: gameResults }) => {
      setGameState(finalState);
      setResults(gameResults);
      setPhase('completed');
    };

    const onRoomReset = ({ gameState: newState }) => {
      setGameState(newState);
      setResults(null);
      setPhase('lobby');
    };

    const onError = ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    };

    socket.on('game:state-updated', onStateUpdated);
    socket.on('game:completed', onCompleted);
    socket.on('game:room-reset', onRoomReset);
    socket.on('game:error', onError);

    return () => {
      socket.off('game:state-updated', onStateUpdated);
      socket.off('game:completed', onCompleted);
      socket.off('game:room-reset', onRoomReset);
      socket.off('game:error', onError);
    };
  }, [socket]);

  // ── Keyboard controls ───────────────────────────────────────────────
  const handleMove = useCallback((direction) => {
    if (!socket || !gameState || phase !== 'playing') return;
    socket.emit('game:move', { roomCode: gameState.roomCode, direction });
  }, [socket, gameState, phase]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (phase !== 'playing') return;
      
      const keyMap = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
        W: 'up', S: 'down', A: 'left', D: 'right',
      };

      const direction = keyMap[e.key];
      if (direction) {
        e.preventDefault();
        handleMove(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, phase]);

  // ── Transition from lobby to playing ────────────────────────────────
  const handleRoomJoined = (initialGameState) => {
    setGameState(initialGameState);
    setPhase('playing');
  };

  // ── Play again / back to lobby ──────────────────────────────────────
  const handlePlayAgain = () => {
    // Just tell the server we want to reset the room.
    // The server will broadcast 'game:room-reset' to everyone!
    if (socket && gameState) {
      socket.emit('game:play-again', { roomCode: gameState.roomCode });
    }
  };

  const handleBackToLobby = () => {
    if (socket && gameState) {
      socket.emit('game:leave-room', { roomCode: gameState.roomCode });
      socket.off('game:player-joined');
      socket.off('game:player-left');
      socket.off('game:started');
    }
    setPhase('lobby');
    setGameState(null);
    setResults(null);
  };

  // ── Render by phase ─────────────────────────────────────────────────
  return (
    <div className="th-container">
      {/* Header (during game) */}
      {phase === 'playing' && gameState && (
        <div className="th-header">
          <div className="th-header-title">
            🏴‍☠️ Treasure Hunt
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(245,238,220,0.5)' }}>
            Room: <span style={{ color: '#f39c12', fontWeight: 700 }}>{gameState.roomCode}</span>
          </div>
        </div>
      )}

      {/* Lobby Phase */}
      {phase === 'lobby' && (
        <GameLobby 
          user={user} 
          socket={socket} 
          onRoomJoined={handleRoomJoined} 
          initialGameState={gameState}
        />
      )}

      {/* Playing Phase */}
      {phase === 'playing' && gameState && (
        <div className="th-game-area">
          <div className="th-board-wrapper">
            <GameBoard
              board={gameState.board}
              players={gameState.players}
              currentUserId={user._id}
              boardSize={gameState.boardSize}
            />

            {/* Movement controls */}
            <div className="th-controls">
              <button className="th-ctrl-btn th-ctrl-up" onClick={() => handleMove('up')}>↑</button>
              <button className="th-ctrl-btn th-ctrl-left" onClick={() => handleMove('left')}>←</button>
              <button className="th-ctrl-btn th-ctrl-right" onClick={() => handleMove('right')}>→</button>
              <button className="th-ctrl-btn th-ctrl-down" onClick={() => handleMove('down')}>↓</button>
            </div>

            <div style={{ fontSize: '0.7rem', color: 'rgba(245,238,220,0.3)', textAlign: 'center' }}>
              Use arrow keys or WASD to move
            </div>
          </div>

          <GameHUD gameState={gameState} currentUserId={user._id} />
        </div>
      )}

      {/* Completed Phase */}
      {phase === 'completed' && (
        <GameResults 
          results={results} 
          onPlayAgain={handlePlayAgain} 
          onBackToLobby={handleBackToLobby} 
        />
      )}

      {/* Error Toast */}
      {error && <div className="th-error-toast">{error}</div>}
    </div>
  );
};

export default TreasureHuntGame;
