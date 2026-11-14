"""
Loads MENU from seed_data.py into the database. Idempotent-ish: wipes
and re-inserts categories/products/variants each run, which is fine
for Phase 1 dev seeding (menu content, not customer/order data).
"""
from ..models import db, Category, Product, ProductVariant
from .seed_data import MENU


def run_seed():
    db.session.query(ProductVariant).delete()
    db.session.query(Product).delete()
    db.session.query(Category).delete()
    db.session.commit()

    for cat_order, category_data in enumerate(MENU, start=1):
        category = Category(
            name=category_data["name"],
            display_order=cat_order,
            is_active=True,
        )
        db.session.add(category)
        db.session.flush()  # get category.id

        for prod_order, product_data in enumerate(category_data["products"], start=1):
            variants_data = product_data.get("variants")
            product = Product(
                category_id=category.id,
                name=product_data["name"],
                description=product_data.get("description"),
                image_url=product_data.get("image_url"),
                price=None if variants_data else product_data.get("price"),
                section=product_data.get("section"),
                is_available=True,
                display_order=prod_order,
            )
            db.session.add(product)
            db.session.flush()

            if variants_data:
                for v_order, (variant_name, variant_price) in enumerate(variants_data, start=1):
                    db.session.add(
                        ProductVariant(
                            product_id=product.id,
                            name=variant_name,
                            price=variant_price,
                            is_available=True,
                            display_order=v_order,
                        )
                    )

    db.session.commit()

    category_count = Category.query.count()
    product_count = Product.query.count()
    variant_count = ProductVariant.query.count()
    print(
        f"Seeded {category_count} categories, {product_count} products, "
        f"{variant_count} variants."
    )
