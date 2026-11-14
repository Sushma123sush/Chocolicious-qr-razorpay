"""
Seed data transcribed from the uploaded Chocolicious Davangere menu PDF.

This is the source of truth for Phase 1. Nothing here is invented -
every product/price comes directly from the PDF pages. Where the PDF
groups items under a sub-heading inside one category (e.g. "Velvet
Special" inside Natural Ice Cream), that heading is carried on the
product as `section` so the frontend can render the same grouping.

A couple of judgment calls were required to turn menu artwork into
clean rows - each is called out inline with a `NOTE:` comment, and
summarized again in the README under "Assumptions".
"""

# Each category: name -> list of products.
# Each product: dict with name, optional description, optional section,
# and EITHER `price` (flat) OR `variants` (list of (variant_name, price)).

MENU = [
    {
        "name": "Bowl Cakes",
        "products": [
            {"name": "Oreo Bowl Cake", "price": 199},
            {"name": "Red Velvet Bowl Cake", "price": 219},
            {"name": "Nutella Bowl Cake", "price": 249},
            {"name": "KitKat Bowl Cake", "price": 249},
            {"name": "Biscoff Bowl Cake", "price": 249},
        ],
    },
    {
        "name": "Bites",
        "products": [
            {"name": "Strawberry Bite", "price": 25},
            {"name": "Muffin Bite", "price": 25},
            {"name": "Marshmallow Bite", "price": 25},
            {"name": "Chocolate Ball", "price": 25},
        ],
    },
    {
        "name": "Brownies",
        "products": [
            {"name": "Classic Brownie", "price": 100},
            {"name": "Brownie with Icecream", "price": 150},
            {"name": "Nutella Brownie", "price": 150},
            {"name": "Biscoff Brownie", "price": 150},
        ],
    },
    {
        "name": "Churros",
        "products": [
            {"name": "Churros with Chocolate", "price": 110},
            # NOTE: PDF lists "Any extra dip 30/-" as a general add-on
            # note under Churros, not a separate priced product. Carried
            # here as a description instead of inventing a menu item.
            {
                "name": "Churros with Nutella",
                "price": 160,
                "description": "Any extra dip +₹30",
            },
        ],
    },
    {
        "name": "Magnum & Cake Slices",
        "products": [
            {
                "name": "Cookie Cream Pie",
                "price": 220,
                "description": "Magnolia bakery inspired pudding",
            },
            {"name": "Magnum Chocolate Cake", "price": 150},
            {"name": "Magnum Biscoff Crumbs", "price": 180},
            {"name": "Magnum Redvelvet Cake", "price": 180},
            {"name": "Magnum Triple Chocolate Cake", "price": 150},
        ],
    },
    {
        "name": "Rare Treats",
        "products": [
            {"name": "Tres Leches Cake", "price": 150},
            {"name": "Tiramisu", "price": 150},
            {"name": "Nuts & Nutella", "price": 150},
            {"name": "Matilda Cake", "price": 150},
        ],
    },
    {
        "name": "Kid's Favourite",
        "products": [
            {"name": "Strawberry Stick", "price": 110},
            {"name": "Marshmallow Stick", "price": 100},
        ],
    },
    {
        "name": "Cakes",
        "products": [
            {"name": "Triple Delight", "price": 100},
            {"name": "Chocolate Cake", "price": 70},
            {"name": "Red Velvet Cake", "price": 80},
            {"name": "Plain Cake", "price": 50},
        ],
    },
    {
        "name": "Cheesecakes",
        "products": [
            {"name": "New York Cheesecake", "variants": [("No Bake", 130), ("Baked", 150)]},
            {"name": "Dark Cheese Cake", "variants": [("No Bake", 130), ("Baked", 150)]},
            {"name": "Blueberry Cheesecake", "variants": [("No Bake", 140), ("Baked", 160)]},
            {"name": "Strawberry Cheesecake", "variants": [("No Bake", 140), ("Baked", 160)]},
            {"name": "Biscoff Cheesecake", "variants": [("No Bake", 150), ("Baked", 170)]},
            {"name": "Nutella Cheesecake", "variants": [("No Bake", 150), ("Baked", 170)]},
        ],
    },
    {
        "name": "Shakes",
        "products": [
            {
                "name": "Hot Chocolate",
                "price": 90,
                "description": "Add on marshmallow / chocochip +₹30",
            },
            {
                "name": "Cold Coffee",
                "price": 90,
                "description": "Classic, Hazelnut, Vanilla or Butterscotch",
            },
            {"name": "Kitkat Blend", "price": 110},
            {"name": "Oreo Blend", "price": 110},
            {"name": "Nutella Blend", "price": 150},
            {"name": "Lotus Biscoff", "price": 150},
        ],
    },
    {
        "name": "Sweet Affairs",
        "products": [
            {"name": "Kunafa Pistachio", "price": 299},
            {"name": "Pistachio Cheesecake", "price": 199},
            {"name": "Viral Teddy Bear Chocolate Mousse", "price": 200},
            {"name": "London's Viral Chocolate Strawberry", "price": 200},
            # NOTE: "seasonal fruit" is listed on the page with no price
            # (it varies by season). Left out rather than inventing a
            # price - see README assumptions.
        ],
    },
    {
        "name": "New Arrivals",
        "products": [
            {"name": "6 Layer Cake with Icecream & Strawberry", "price": 250},
            {"name": "Coffee Mocha with Cashew", "price": 150},
            {"name": "Caramel Pudding", "price": 90, "description": "Pudding"},
            {"name": "Tender Coconut Pudding", "price": 90, "description": "Pudding"},
            {"name": "Mango Pudding", "price": 90, "description": "Pudding"},
            {"name": "Chocolate Cookies Tin", "price": 200},
            {"name": "Cookie with Icecream", "price": 90},
        ],
    },
    {
        "name": "Natural Ice Cream",
        "products": [
            {"name": "Redvelvet Velvet", "price": 90, "section": "Velvet Special"},
            {"name": "Coffee Velvet", "price": 90, "section": "Velvet Special"},
            {"name": "Pista Velvet", "price": 90, "section": "Velvet Special"},
            {"name": "Jackfruit Velvet", "price": 90, "section": "Velvet Special"},
            {"name": "DBC with Roasted Cashew", "price": 180, "section": "Chocolate Treat"},
            {"name": "Chocolate Overload", "price": 130, "section": "Chocolate Treat"},
            {"name": "Brownie Sundae", "price": 150, "section": "Chocolate Treat"},
            {"name": "Coffee Mocha with Cashew", "price": 150, "section": "Chocolate Treat"},
            {"name": "Lava Vanilla Sundae", "price": 80, "section": "Chocolate Treat"},
            {"name": "Lava Chocolate Sundae", "price": 90, "section": "Chocolate Treat"},
            {"name": "Belgian Chocolate", "variants": [("Single", 55), ("Double", 99)], "section": "Taste of Heaven"},
            {"name": "Lotus Biscoff", "variants": [("Single", 55), ("Double", 99)], "section": "Taste of Heaven"},
            {"name": "Hot Jamun", "price": 30, "section": "Classic"},
            {"name": "Jamun with Icecream", "price": 50, "section": "Classic"},
            {"name": "Gulkand with Icecream", "price": 50, "section": "Classic"},
            {"name": "Belgam Kunda", "price": 60, "section": "Classic"},
            {"name": "Triveni Special", "price": 70, "section": "Classic"},
            {"name": "Triveni with Hot Jamun", "price": 80, "section": "Classic"},
            {"name": "Vanilla", "price": 70, "section": "Sugar Free (Zero Sugar)"},
            {"name": "Chocolate", "price": 70, "section": "Sugar Free (Zero Sugar)"},
            {"name": "Coffee", "price": 70, "section": "Sugar Free (Zero Sugar)"},
        ],
    },
    {
        "name": "Tropical Scoops",
        "products": [
            {"name": "Black Current", "variants": [("Single", 55), ("Double", 99)]},
            {"name": "Muskmelon", "variants": [("Single", 55), ("Double", 99)]},
            {"name": "Pineapple", "variants": [("Single", 55), ("Double", 99)]},
            {"name": "Strawberry", "variants": [("Single", 55), ("Double", 99)]},
            {"name": "Kiwi", "variants": [("Single", 55), ("Double", 99)]},
            {"name": "Kesar Pista Badam", "variants": [("Single", 55), ("Double", 99)]},
            {"name": "Guava", "variants": [("Single", 55), ("Double", 99)]},
            {"name": "Jackfruit", "variants": [("Single", 55), ("Double", 99)]},
            {"name": "Blueberry", "variants": [("Single", 55), ("Double", 99)]},
            {"name": "Anjeer (Fig)", "variants": [("Single", 55), ("Double", 99)]},
            {"name": "Chikkoss", "variants": [("Single", 59), ("Double", 109)]},
            {"name": "Kesar Badam Kulfi", "variants": [("Single", 59), ("Double", 109)]},
            {"name": "Sitaphal", "variants": [("Single", 59), ("Double", 109)]},
            {"name": "Tender Coconut", "variants": [("Single", 59), ("Double", 109)]},
            {"name": "Avocado", "variants": [("Single", 59), ("Double", 109)]},
            {"name": "Pistachio", "variants": [("Single", 80), ("Double", 150)]},
        ],
    },
    {
        "name": "Classic Scoops",
        "products": [
            {"name": "Original Vanilla", "variants": [("Single", 40), ("Double", 70)]},
            {"name": "Royal Chocolate", "variants": [("Single", 40), ("Double", 70)]},
            {"name": "Hapus Mango", "variants": [("Single", 40), ("Double", 70)]},
            {"name": "Pista", "variants": [("Single", 40), ("Double", 70)]},
            {"name": "Butterscotch Bliss", "variants": [("Single", 40), ("Double", 70)]},
            {"name": "Tangy Orange", "variants": [("Single", 40), ("Double", 70)]},
        ],
    },
    {
        "name": "Brew Scoops",
        "products": [
            {"name": "Coffee Caffeine", "variants": [("Single", 55), ("Double", 99)]},
        ],
    },
    {
        "name": "Cakeocream",
        "products": [
            {"name": "Redvelvet", "variants": [("Single", 59), ("Double", 109)]},
        ],
    },
]
