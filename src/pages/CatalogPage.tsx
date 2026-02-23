import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useProducts, getMinPrice, getTotalStock } from "@/hooks/useProducts";
import type { Product } from "@/types/product";

const WHATSAPP_NUMBER = "5493834701332";

const CATEGORY_CONFIG: Record<string, { title: string; subtitle: string }> = {
  "/alimentos": { title: "Alimentos Balanceados", subtitle: "La mejor nutrición para perros, gatos, aves y más." },
  "/accesorios": { title: "Accesorios", subtitle: "Collares, camas, juguetes y más para tu mascota." },
  "/higiene": { title: "Higiene", subtitle: "Shampoos, perfumes y tratamientos para el bienestar de tu mascota." },
  "/venenos": { title: "Venenos y Control", subtitle: "Productos para el control de plagas y parásitos." },
};

const CATEGORY_MAP: Record<string, string> = {
  "/alimentos": "Alimentos",
  "/accesorios": "Accesorios",
  "/higiene": "Higiene",
  "/venenos": "Venenos",
};

const NAV_LINKS = [
  { path: "/alimentos", label: "Alimentos" },
  { path: "/higiene", label: "Higiene" },
  { path: "/accesorios", label: "Accesorios" },
  { path: "/venenos", label: "Venenos" },
];

const CatalogPage = () => {
  const location = useLocation();
  const { data: products, isLoading, error } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");

  const categoryName = CATEGORY_MAP[location.pathname] || "Alimentos";
  const config = CATEGORY_CONFIG[location.pathname] || CATEGORY_CONFIG["/alimentos"];

  const filtered = useMemo(() => {
    if (!products) return [];
    return products
      .filter((p) => p.categoria === categoryName)
      .filter((p) =>
        searchTerm
          ? p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.marca?.toLowerCase().includes(searchTerm.toLowerCase())
          : true
      );
  }, [products, categoryName, searchTerm]);

  if (isLoading) return <div className="loading-spinner">Cargando productos...</div>;
  if (error) return <div className="error-message">Error al cargar productos.</div>;

  const buildWhatsAppLink = (product: Product) => {
    const msg = encodeURIComponent(`Hola, quiero consultar por el producto: ${product.nombre}`);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  };

  return (
    <>
      <Link to="/" className="back-btn">
        ← Volver a inicio
      </Link>

      <h1 className="page-title">{config.title}</h1>
      <p className="page-subtitle">{config.subtitle}</p>

      {/* Quick Nav */}
      <div className="quick-nav">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={location.pathname === link.path ? "active" : ""}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="search-filter">
        <input
          className="search-input"
          placeholder={`Buscar en ${categoryName.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="category-container active">
        <div className="product-grid">
          {filtered.length > 0 ? (
            filtered.map((prod) => {
              const minPrice = getMinPrice(prod.variaciones);
              const totalStock = getTotalStock(prod.variaciones);
              const outOfStock = totalStock === 0;

              return (
                <div key={prod.id} className="product-card">
                  <img
                    src={prod.imagen_url || "/img/default.png"}
                    alt={prod.nombre}
                    loading="lazy"
                  />
                  {prod.marca && <div className="brand">{prod.marca}</div>}
                  <h3>{prod.nombre}</h3>
                  {outOfStock ? (
                    <div className="out-of-stock">Sin stock</div>
                  ) : minPrice !== null ? (
                    <div className="price">
                      Desde ${minPrice.toLocaleString("es-AR")}
                    </div>
                  ) : (
                    <div className="price">Consultar</div>
                  )}
                  <a
                    href={buildWhatsAppLink(prod)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-btn"
                  >
                    📲 Consultar
                  </a>
                </div>
              );
            })
          ) : (
            <p className="no-results-message">
              No se encontraron productos que coincidan con tu búsqueda.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default CatalogPage;
