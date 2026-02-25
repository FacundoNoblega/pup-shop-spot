import { Gamepad2, Zap } from 'lucide-react';
import '../../styles/game-card.css';

export function GameCard() {
  const handleGameClick = () => {
    alert('¡Juego próximamente! 🎮');
  };

  return (
    <div className="game-card-container">
      <button className="game-card" onClick={handleGameClick}>
        <div className="game-card-inner">
          {/* Glow Background */}
          <div className="game-glow"></div>

          {/* Content */}
          <div className="game-content">
            <div className="game-icon-wrapper">
              <Gamepad2 size={48} className="game-icon" />
              <div className="game-pulse"></div>
            </div>

            <h3 className="game-title">¿GAME?</h3>

            <p className="game-subtitle">Desafía tu ingenio</p>

            <div className="game-stars">
              <span className="star">✨</span>
              <span className="star">⭐</span>
              <span className="star">✨</span>
            </div>

            <button className="game-action-btn">
              <Zap size={16} />
              INGRESAR
            </button>
          </div>

          {/* Decorative elements */}
          <div className="game-decoration meteor-1"></div>
          <div className="game-decoration meteor-2"></div>
        </div>
      </button>

      {/* Floating particles around card */}
      <div className="particle-orbit">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="orbital-particle"
            style={{
              '--delay': `${i * 0.3}s`,
            } as React.CSSProperties}
          >
            {['🎮', '🎲', '🎯', '🎪', '🎨', '🎭'][i]}
          </div>
        ))}
      </div>
    </div>
  );
}
