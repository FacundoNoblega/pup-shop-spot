import { Outlet } from "react-router-dom";
import "@/styles/catalog.css";

const WHATSAPP_NUMBER = "5493834701332";

export function PublicLayout() {
  return (
    <div className="public-site">
      {/* Meteors */}
      <div className="meteor-container">
        <div className="meteor"></div>
        <div className="meteor"></div>
        <div className="meteor"></div>
        <div className="meteor"></div>
      </div>

      <div className="main-content">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>📍 LA PERRICUEVA</h4>
            <p>Catamarca, Argentina</p>
            <p style={{ fontSize: "0.8rem", color: "#666" }}>
              Tu tienda de confianza
            </p>
          </div>
          <div className="footer-section">
            <h4>⏰ HORARIOS</h4>
            <p>Lunes a Sábado</p>
            <p className="highlight">9:00 - 13:00</p>
            <p className="highlight">17:00 - 21:00</p>
          </div>
          <div className="footer-section">
            <h4>📞 CONTACTO</h4>
            <p>¿Dudas? Escribinos</p>
            <button
              onClick={() =>
                window.open(`https://wa.me/${WHATSAPP_NUMBER}`, "_blank")
              }
              className="footer-btn"
            >
              WhatsApp
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} La Perricueva. Hecho con ❤️ y pelos de gato.</p>
        </div>
      </footer>
    </div>
  );
}
