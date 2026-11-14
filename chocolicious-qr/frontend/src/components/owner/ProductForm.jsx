import { useState } from "react";
import { createProduct, updateProduct } from "../../services/menuAdminService.js";

function initialVariants(product) {
  if (product?.variants?.length) {
    return product.variants.map((v) => ({ name: v.name, price: String(v.price) }));
  }
  return [{ name: "", price: "" }];
}

export default function ProductForm({ product, categories, onSaved, onCancel }) {
  const isEdit = Boolean(product);
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [section, setSection] = useState(product?.section ?? "");
  const [isAvailable, setIsAvailable] = useState(product?.is_available ?? true);
  const [usesVariants, setUsesVariants] = useState(Boolean(product?.variants?.length));
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : "");
  const [variants, setVariants] = useState(initialVariants(product));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const updateVariant = (index, field, value) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addVariantRow = () => setVariants((prev) => [...prev, { name: "", price: "" }]);
  const removeVariantRow = (index) => setVariants((prev) => prev.filter((_, i) => i !== index));

  const validate = () => {
    if (!name.trim()) return "Product name is required.";
    if (!categoryId) return "Please choose a category.";
    if (usesVariants) {
      const cleaned = variants.filter((v) => v.name.trim() || v.price !== "");
      if (cleaned.length === 0) return "Add at least one variant.";
      for (const v of cleaned) {
        if (!v.name.trim()) return "Every variant needs a name.";
        const p = Number(v.price);
        if (Number.isNaN(p) || p < 0) return `"${v.name}" needs a valid, non-negative price.`;
      }
    } else {
      const p = Number(price);
      if (price === "" || Number.isNaN(p) || p < 0) return "Enter a valid, non-negative price.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("category_id", String(categoryId));
    formData.append("description", description.trim());
    formData.append("section", section.trim());
    formData.append("is_available", isAvailable ? "true" : "false");
    if (usesVariants) {
      const cleaned = variants
        .filter((v) => v.name.trim())
        .map((v) => ({ name: v.name.trim(), price: Number(v.price) }));
      formData.append("variants", JSON.stringify(cleaned));
    } else {
      formData.append("price", price);
    }
    if (imageFile) formData.append("image", imageFile);

    try {
      if (isEdit) {
        await updateProduct(product.id, formData);
      } else {
        await createProduct(formData);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="product-form__image-row">
        <div className="product-form__image-preview">
          {imagePreview ? (
            <img src={imagePreview} alt="" />
          ) : (
            <span className="product-form__image-placeholder">No image</span>
          )}
        </div>
        <label className="product-form__image-upload">
          Choose Photo
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} hidden />
        </label>
      </div>

      <label className="product-form__field">
        <span>Product Name</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <label className="product-form__field">
        <span>Category</span>
        <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="product-form__field">
        <span>Description (optional)</span>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <label className="product-form__field">
        <span>Section (optional, e.g. "Velvet Special")</span>
        <input type="text" value={section} onChange={(e) => setSection(e.target.value)} />
      </label>

      <div className="product-form__pricing-toggle">
        <button
          type="button"
          className={`product-form__toggle-option${!usesVariants ? " product-form__toggle-option--active" : ""}`}
          onClick={() => setUsesVariants(false)}
        >
          Single Price
        </button>
        <button
          type="button"
          className={`product-form__toggle-option${usesVariants ? " product-form__toggle-option--active" : ""}`}
          onClick={() => setUsesVariants(true)}
        >
          Has Variants
        </button>
      </div>

      {usesVariants ? (
        <div className="product-form__variants">
          {variants.map((v, i) => (
            <div className="product-form__variant-row" key={i}>
              <input
                type="text"
                placeholder="e.g. Single"
                value={v.name}
                onChange={(e) => updateVariant(i, "name", e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                value={v.price}
                onChange={(e) => updateVariant(i, "price", e.target.value)}
              />
              {variants.length > 1 && (
                <button
                  type="button"
                  className="product-form__remove-variant"
                  onClick={() => removeVariantRow(i)}
                  aria-label="Remove variant"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button type="button" className="product-form__add-variant" onClick={addVariantRow}>
            + Add Variant
          </button>
        </div>
      ) : (
        <label className="product-form__field">
          <span>Price (&#8377;)</span>
          <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
      )}

      <label className="product-form__availability">
        <span>Available to customers</span>
        <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
      </label>

      {error && <p className="owner-error">{error}</p>}

      <div className="product-form__actions">
        <button type="button" className="btn btn--outline" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Saving\u2026" : isEdit ? "Save Changes" : "Add Item"}
        </button>
      </div>
    </form>
  );
}
