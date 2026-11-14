import DrizzleDivider from "./DrizzleDivider.jsx";
import ProductRow from "./ProductRow.jsx";

function groupBySection(products) {
  const groups = [];
  const bySection = new Map();

  for (const product of products) {
    const key = product.section || null;
    if (!bySection.has(key)) {
      const group = { section: key, products: [] };
      bySection.set(key, group);
      groups.push(group);
    }
    bySection.get(key).products.push(product);
  }

  return groups;
}

export default function CategorySection({ category }) {
  const groups = groupBySection(category.products);

  return (
    <section className="category-section" id={`category-${category.id}`}>
      <header className="category-section__header">
        <span className="category-section__banner">
          <h2 className="category-section__title">{category.name}</h2>
        </span>
      </header>

      {groups.map((group) => (
        <div className="section-group" key={group.section ?? "default"}>
          {group.section && (
            <div className="section-group__header">
              <h3 className="section-group__title">{group.section}</h3>
              <DrizzleDivider />
            </div>
          )}
          <div className="product-list">
            {group.products.map((product) => (
              <ProductRow product={product} key={product.id} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
