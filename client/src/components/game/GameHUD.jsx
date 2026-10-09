import React, { useState, useEffect } from 'react';

const GameHUD = ({ gameState, currentUserId }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const player = gameState?.players?.[currentUserId];
  const players = gameState?.players ? Object.values(gameState.players) : [];
  const requiredTreasures = gameState?.requiredTreasures || 3;

  // ── Countdown timer derived from server's endsAt timestamp ─────────
  useEffect(() => {
    if (!gameState?.endsAt) return;

    const update = () => {
      const remaining = Math.max(0, gameState.endsAt - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      setIsUrgent(remaining < 60000); // last 60 seconds
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [gameState?.endsAt]);

  if (!player) return null;

  // Sort players by score for leaderboard
  const leaderboard = [...players]
    .map(p => ({ ...p, score: p.coins + (p.treasures || 0) * 100 }))
    .sort((a, b) => b.score - a.score);

  // Mission checklist
  const missions = [
    { label: `Find ${requiredTreasures} 💎 treasures`, done: player.treasures >= requiredTreasures, detail: `${player.treasures}/${requiredTreasures}` },
    { label: 'Find 🔑 key', done: player.hasKey },
    { label: 'Reach 🚪 exit', done: player.atExit },
  ];

  return (
    <div className="th-hud">
      {/* Timer */}
      <div className="th-timer">
        <div className="th-timer-label">Time Remaining</div>
        <div className={`th-timer-value ${isUrgent ? 'th-timer-urgent' : ''}`}>
          ⏱️ {timeLeft}
        </div>
      </div>

      {/* Player Stats */}
      <div className="th-hud-section">
        <div className="th-hud-title">Your Stats</div>
        <div className="th-stats">
          <div className="th-stat-item">
            <span className="th-stat-icon">🪙</span>
            <span className="th-stat-value">{player.coins}</span>
          </div>
          <div className="th-stat-item">
            <span className="th-stat-icon">💎</span>
            <span className="th-stat-value">{player.treasures}/{requiredTreasures}</span>
          </div>
          <div className="th-stat-item">
            <span className="th-stat-icon">🔑</span>
            <span className="th-stat-value">{player.hasKey ? '✓' : '✗'}</span>
          </div>
          <div className="th-stat-item">
            <span className="th-stat-icon">❤️</span>
            <div className="th-hearts">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`th-heart ${i < player.health ? '' : 'th-heart-empty'}`}>
                  ♥
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="th-hud-section">
        <div className="th-hud-title">Mission</div>
        {missions.map((m, i) => (
          <div key={i} className="th-mission-item">
            <div className={`th-mission-check ${m.done ? 'th-mission-done' : 'th-mission-pending'}`}>
              {m.done ? '✓' : ''}
            </div>
            <span style={{ opacity: m.done ? 0.6 : 1, textDecoration: m.done ? 'line-through' : 'none' }}>
              {m.label}
            </span>
            {m.detail && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#f39c12' }}>{m.detail}</span>}
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="th-hud-section">
        <div className="th-hud-title">Leaderboard</div>
        {leaderboard.map((p, i) => (
          <div key={p.id} className="th-leaderboard-item" style={{ opacity: p.isAlive ? 1 : 0.4 }}>
            <span className="th-leaderboard-rank">#{i + 1}</span>
            <div className="th-player-avatar" style={{ backgroundColor: p.color, width: 22, height: 22, fontSize: '0.6rem' }}>
              {p.username.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: p.id === currentUserId ? 700 : 400 }}>
              {p.username} {!p.isAlive ? '💀' : ''}
            </span>
            <span className="th-leaderboard-score">{p.score}</span>
          </div>
        ))}
      </div>

      {/* Event Log */}
      <div className="th-hud-section" style={{ flex: 1 }}>
        <div className="th-hud-title">Events</div>
        <div className="th-event-log">
          {(gameState?.eventLog || []).slice().reverse().map((evt, i) => (
            <div key={i} className="th-event-item">{evt.text}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
