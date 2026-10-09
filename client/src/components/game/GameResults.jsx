import React from 'react';

const GameResults = ({ results, onPlayAgain, onBackToLobby }) => {
  if (!results) return null;

  const { winner, reason, duration, players } = results;
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <div className="th-results">
      <div className="th-results-card">
        <div className="th-winner-crown">👑</div>
        
        {winner ? (
          <>
            <div className="th-winner-name">{winner.username}</div>
            <div className="th-winner-reason">{reason}</div>
          </>
        ) : (
          <>
            <div className="th-winner-name">Game Over</div>
            <div className="th-winner-reason">{reason}</div>
          </>
        )}

        <table className="th-results-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>🪙</th>
              <th>💎</th>
              <th>🔑</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 700, color: i === 0 ? '#f39c12' : 'inherit' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="th-player-avatar" style={{ backgroundColor: p.color, width: 24, height: 24, fontSize: '0.6rem' }}>
                      {p.username.charAt(0).toUpperCase()}
                    </div>
                    {p.username}
                  </div>
                </td>
                <td>{p.coins}</td>
                <td>{p.treasures}</td>
                <td>{p.hasKey ? '✓' : '✗'}</td>
                <td style={{ fontWeight: 700, color: '#f39c12' }}>{p.score}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="th-results-duration">
          ⏱️ Duration: {mins}m {String(secs).padStart(2, '0')}s
        </div>

        <div className="th-results-actions">
          <button className="th-btn th-btn-primary" onClick={onPlayAgain}>
            🔄 Play Again
          </button>
          <button className="th-btn th-btn-secondary" onClick={onBackToLobby}>
            🏠 Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResults;
