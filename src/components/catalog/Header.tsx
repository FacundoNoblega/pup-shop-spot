import { useState } from 'react';
import { Music, ShoppingCart, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/header.css';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(false);

  const handleMusicToggle = () => {
    setIsMusicOn(!isMusicOn);
  };

  return (
    <header className="cosmic-header">
      <div className="header-container">
        {/* Logo - Izquierda */}
        <Link to="/" className="header-logo">
          <div className="logo-icon">🐾</div>
          <span className="logo-text">La Perricueva</span>
        </Link>

        {/* Navigation - Centro */}
        <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/alimentos" className="nav-link">
            Alimentos
          </Link>
          <Link to="/accesorios" className="nav-link">
            Accesorios
          </Link>
          <Link to="/higiene" className="nav-link">
            Higiene
          </Link>
          <Link to="/venenos" className="nav-link">
            Defensa
          </Link>
        </nav>

        {/* Actions - Derecha */}
        <div className="header-actions">
          {/* Botón de Música */}
          <button
            onClick={handleMusicToggle}
            className={`header-btn music-btn ${isMusicOn ? 'active' : ''}`}
            title={isMusicOn ? 'Música activada' : 'Música desactivada'}
          >
            <Music size={20} />
            <span className="btn-label">{isMusicOn ? 'On' : 'Off'}</span>
          </button>

          {/* Carrito de Compras */}
          <button
            className="header-btn cart-btn"
            title="Carrito de compras"
          >
            <ShoppingCart size={20} />
            <span className="cart-badge">0</span>
          </button>

          {/* Menu Mobile */}
          <button
            className="header-btn mobile-menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Indicador visual de música activa */}
      {isMusicOn && (
        <div className="music-indicator">
          <div className="music-bar"></div>
          <div className="music-bar"></div>
          <div className="music-bar"></div>
        </div>
      )}
    </header>
  );
}
