import React from 'react';

const GameBoard = ({ board, players, currentUserId, boardSize }) => {
  if (!board || !players) return null;

  // Build a map of players by position for quick lookup
  const playersByPos = {};
  Object.values(players).forEach(player => {
    if (!player.isAlive) return;
    const key = `${player.position.x},${player.position.y}`;
    if (!playersByPos[key]) playersByPos[key] = [];
    playersByPos[key].push(player);
  });

  return (
    <div className="th-board">
      {board.map((row, y) =>
        row.map((tile, x) => {
          const posKey = `${x},${y}`;
          const playersHere = playersByPos[posKey] || [];
          const isHidden = !tile.revealed;
          
          // Build tile class
          const tileClasses = [
            'th-tile',
            isHidden ? 'th-tile-hidden' : 'th-tile-revealed',
            !isHidden && `th-tile-${tile.type}`,
            !isHidden && tile.collected && 'th-tile-collected',
          ].filter(Boolean).join(' ');

          return (
            <div key={`${x}-${y}`} className={tileClasses}>
              {/* Tile emoji (only shown if revealed) */}
              {!isHidden && (
                <span className="th-tile-emoji">
                  {tile.emoji}
                </span>
              )}

              {/* Player tokens */}
              {playersHere.length > 0 && (
                <div className="th-players-on-tile">
                  {playersHere.map(p => (
                    <div
                      key={p.id}
                      className={`th-player-token ${p.id === currentUserId ? 'th-player-token-self' : ''}`}
                      style={{ backgroundColor: p.color }}
                      title={p.username}
                    >
                      {p.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default GameBoard;
