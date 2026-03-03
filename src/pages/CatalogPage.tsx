import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useProducts, getMinPrice, getTotalStock } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
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
  const { addItem } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVariation, setSelectedVariation] = useState<Record<string, number>>({});

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

  const handleAddToCart = (product: Product) => {
    if (!product.variaciones || product.variaciones.length === 0) {
      toast.error("Este producto no tiene variaciones disponibles");
      return;
    }

    const selectedVarIndex = selectedVariation[product.id] ?? 0;
    const variation = product.variaciones[selectedVarIndex];

    if (!variation) {
      toast.error("Por favor selecciona una variación");
      return;
    }

    if (variation.stock === 0) {
      toast.error("Producto sin stock");
      return;
    }

    addItem({
      id: `${product.id}-${variation.key}`,
      name: `${product.nombre} - ${variation.value}`,
      price: variation.precio,
      quantity: 1,
      image: product.imagen_url || "/img/default.png",
      category: product.categoria,
      stock: variation.stock,
    });

    toast.success(`Agregado al carrito: ${product.nombre}`);
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

              const selectedVarIndex = selectedVariation[prod.id] ?? 0;
              const selectedVar = prod.variaciones?.[selectedVarIndex];

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
                  {selectedVar && (
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                      Stock: {selectedVar.stock}
                    </div>
                  )}
                  {prod.variaciones && prod.variaciones.length > 1 && (
                    <select
                      value={selectedVarIndex}
                      onChange={(e) =>
                        setSelectedVariation({
                          ...selectedVariation,
                          [prod.id]: parseInt(e.target.value),
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "6px",
                        marginTop: "8px",
                        marginBottom: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        fontSize: "12px",
                      }}
                    >
                      {prod.variaciones.map((v, i) => (
                        <option key={i} value={i}>
                          {v.value}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => handleAddToCart(prod)}
                    disabled={!selectedVar || selectedVar.stock === 0}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "8px",
                      backgroundColor: !selectedVar || selectedVar.stock === 0 ? "#ccc" : "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: !selectedVar || selectedVar.stock === 0 ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    Agregar al carrito
                  </button>
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
