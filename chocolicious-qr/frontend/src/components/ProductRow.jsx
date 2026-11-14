import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/formatPrice.js";
import QuantityControl from "./QuantityControl.jsx";
import ProductImage from "./ProductImage.jsx";

export default function ProductRow({ product }) {
  const { getQuantity, setQuantity } = useCart();
  const hasVariants = product.variants && product.variants.length > 0;
  const unavailable = !product.is_available;

  if (hasVariants) {
    return (
      <div className={`product-row product-row--variants${unavailable ? " product-row--unavailable" : ""}`}>
        <ProductImage src={product.image_url} alt={product.name} unavailable={unavailable} />
        <div className="product-row__body">
          <div className="product-row__name">{product.name}</div>
          {product.description && <p className="product-row__desc">{product.description}</p>}
          <div className="variant-list">
            {product.variants.map((variant) => {
              const qty = getQuantity(product.id, variant.id);
              return (
                <div className="variant-line" key={variant.id}>
                  <div className="variant-line__info">
                    <span className="variant-line__label">{variant.name}</span>
                    <span className="variant-line__price">{formatPrice(variant.price)}</span>
                  </div>
                  {unavailable ? (
                    <span className="unavailable-pill">Unavailable</span>
                  ) : (
                    <QuantityControl
                      quantity={qty}
                      label={`${product.name} ${variant.name}`}
                      onIncrement={() =>
                        setQuantity(
                          {
                            productId: product.id,
                            productName: product.name,
                            variantId: variant.id,
                            variantName: variant.name,
                            unitPrice: variant.price,
                          },
                          qty + 1
                        )
                      }
                      onDecrement={() =>
                        setQuantity(
                          {
                            productId: product.id,
                            productName: product.name,
                            variantId: variant.id,
                            variantName: variant.name,
                            unitPrice: variant.price,
                          },
                          qty - 1
                        )
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const qty = getQuantity(product.id, null);

  return (
    <div className={`product-row${unavailable ? " product-row--unavailable" : ""}`}>
      <ProductImage src={product.image_url} alt={product.name} unavailable={unavailable} />
      <div className="product-row__body">
        <div className="product-row__info">
          <div className="product-row__name">{product.name}</div>
          {product.description && <p className="product-row__desc">{product.description}</p>}
          <div className="product-row__price">{formatPrice(product.price)}</div>
        </div>
        {unavailable ? (
          <span className="unavailable-pill">Unavailable</span>
        ) : (
          <QuantityControl
            quantity={qty}
            label={product.name}
            onIncrement={() =>
              setQuantity(
                {
                  productId: product.id,
                  productName: product.name,
                  variantId: null,
                  variantName: null,
                  unitPrice: product.price,
                },
                qty + 1
              )
            }
            onDecrement={() =>
              setQuantity(
                {
                  productId: product.id,
                  productName: product.name,
                  variantId: null,
                  variantName: null,
                  unitPrice: product.price,
                },
                qty - 1
              )
            }
          />
        )}
      </div>
    </div>
  );
}
