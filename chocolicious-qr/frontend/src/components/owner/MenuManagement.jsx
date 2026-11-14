import { useEffect, useState, useCallback } from "react";
import { getOwnerMenu, setProductAvailability } from "../../services/menuAdminService.js";
import { formatPrice } from "../../utils/formatPrice.js";
import ProductForm from "./ProductForm.jsx";

function priceLabel(product) {
  if (product.variants.length > 0) {
    const prices = product.variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatPrice(min) : `${formatPrice(min)} \u2013 ${formatPrice(max)}`;
  }
  return formatPrice(product.price);
}

export default function MenuManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState(null); // product object, or {} for "new"
  const [togglingId, setTogglingId] = useState(null);

  const refresh = useCallback(() => {
    return getOwnerMenu()
      .then((data) => {
        setCategories(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const handleToggleAvailability = async (product) => {
    setTogglingId(product.id);
    try {
      await setProductAvailability(product.id, !product.is_available);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaved = () => {
    setEditingProduct(null);
    refresh();
  };

  if (loading) {
    return (
      <div className="state-message">
        <p>Loading menu&hellip;</p>
      </div>
    );
  }

  if (editingProduct !== null) {
    const allCategories = categories.map(({ id, name }) => ({ id, name }));
    return (
      <div className="menu-management">
        <div className="menu-management__form-header">
          <h2>{editingProduct.id ? "Edit Item" : "Add New Item"}</h2>
        </div>
        <ProductForm
          product={editingProduct.id ? editingProduct : null}
          categories={allCategories}
          onSaved={handleSaved}
          onCancel={() => setEditingProduct(null)}
        />
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      products: query ? cat.products.filter((p) => p.name.toLowerCase().includes(query)) : cat.products,
    }))
    .filter((cat) => cat.products.length > 0);

  return (
    <div className="menu-management">
      {error && <p className="owner-error">{error}</p>}

      <input
        type="search"
        className="menu-management__search"
        placeholder="Search products\u2026"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button type="button" className="menu-management__add-btn" onClick={() => setEditingProduct({})}>
        + Add New Item
      </button>

      {filteredCategories.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">No products found</p>
          <p className="empty-state__subtitle">Try a different search.</p>
        </div>
      ) : (
        filteredCategories.map((cat) => (
          <div className="menu-management__category" key={cat.id}>
            <h3 className="menu-management__category-title">{cat.name}</h3>
            <div className="menu-management__list">
              {cat.products.map((product) => (
                <div className="menu-item-row" key={product.id}>
                  <div className="menu-item-row__image">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" />
                    ) : (
                      <span className="menu-item-row__no-image">No photo</span>
                    )}
                  </div>
                  <div className="menu-item-row__info">
                    <div className="menu-item-row__name">{product.name}</div>
                    <div className="menu-item-row__price">{priceLabel(product)}</div>
                    <button
                      type="button"
                      className={`menu-item-row__availability${product.is_available ? " menu-item-row__availability--on" : " menu-item-row__availability--off"}`}
                      onClick={() => handleToggleAvailability(product)}
                      disabled={togglingId === product.id}
                    >
                      {product.is_available ? "\u{1F7E2} Available" : "\u{1F534} Unavailable"}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="menu-item-row__edit"
                    onClick={() => setEditingProduct(product)}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
