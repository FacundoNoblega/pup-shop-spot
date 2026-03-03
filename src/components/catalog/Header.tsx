import { useState } from 'react';
import { Music, ShoppingCart, Menu, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import '../../styles/header.css';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { items, removeItem, updateQuantity, getTotalItems, getTotalPrice } = useCart();

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
            onClick={() => setIsCartOpen(!isCartOpen)}
            className="header-btn cart-btn"
            title="Carrito de compras"
          >
            <ShoppingCart size={20} />
            <span className="cart-badge">{getTotalItems()}</span>
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

      {/* Cart Drawer */}
      {isCartOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "100%",
            maxWidth: "400px",
            height: "100vh",
            backgroundColor: "white",
            boxShadow: "-2px 0 8px rgba(0,0,0,0.2)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px" }}>Mi Carrito</h2>
            <button
              onClick={() => setIsCartOpen(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
            }}
          >
            {items.length === 0 ? (
              <p style={{ textAlign: "center", color: "#999", marginTop: "32px" }}>
                Tu carrito está vacío
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "12px",
                      border: "1px solid #eee",
                      borderRadius: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "bold" }}>
                        {item.name}
                      </p>
                      <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#666" }}>
                        ${item.price.toLocaleString("es-AR")}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          alignItems: "center",
                          fontSize: "12px",
                        }}
                      >
                        <button
                          onClick={() =>
                            updateQuantity(item.id, Math.max(1, item.quantity - 1))
                          }
                          style={{
                            padding: "2px 6px",
                            border: "1px solid #ddd",
                            borderRadius: "3px",
                            cursor: "pointer",
                            backgroundColor: "#f5f5f5",
                          }}
                        >
                          -
                        </button>
                        <span style={{ minWidth: "20px", textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                          style={{
                            padding: "2px 6px",
                            border: "1px solid #ddd",
                            borderRadius: "3px",
                            cursor: item.quantity >= item.stock ? "not-allowed" : "pointer",
                            backgroundColor: item.quantity >= item.stock ? "#f0f0f0" : "#f5f5f5",
                            opacity: item.quantity >= item.stock ? 0.5 : 1,
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#999",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div
              style={{
                padding: "16px",
                borderTop: "1px solid #eee",
                backgroundColor: "#f9f9f9",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                <span>Total:</span>
                <span>${getTotalPrice().toLocaleString("es-AR")}</span>
              </div>
              <button
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                Proceder al pago
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isCartOpen && (
        <div
          onClick={() => setIsCartOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 999,
          }}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </header>
  );
}
