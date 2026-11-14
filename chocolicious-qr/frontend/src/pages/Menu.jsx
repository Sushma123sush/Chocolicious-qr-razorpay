import { useEffect, useState } from "react";
import { fetchMenu } from "../services/api.js";
import CategoryNav from "../components/CategoryNav.jsx";
import CategorySection from "../components/CategorySection.jsx";
import CartBar from "../components/CartBar.jsx";
import OrderSummary from "../components/OrderSummary.jsx";
import OrderConfirmation from "../components/OrderConfirmation.jsx";

export default function Menu() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    fetchMenu()
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setActiveId(data[0].id);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!categories) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = Number(visible[0].target.id.replace("category-", ""));
          setActiveId(id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    document.querySelectorAll('[id^="category-"]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  const handleSelectCategory = (id) => {
    setActiveId(id);
    const el = document.getElementById(`category-${id}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (confirmedOrder) {
    return (
      <OrderConfirmation
        order={confirmedOrder}
        onOrderAgain={() => setConfirmedOrder(null)}
      />
    );
  }

  if (error) {
    return (
      <div className="state-message state-message--error">
        <p>Couldn&rsquo;t load the menu.</p>
        <p className="state-message__detail">{error}</p>
      </div>
    );
  }

  if (!categories) {
    return (
      <div className="state-message">
        <p>Loading the menu&hellip;</p>
      </div>
    );
  }

  return (
    <>
      <header className="shop-header">
        <p className="shop-header__eyebrow">Vegetarian &middot; Eggless Desserts</p>
        <h1 className="shop-header__title">Chocolicious</h1>
        <p className="shop-header__subtitle">Davangere</p>
      </header>

      <div className="category-nav-sticky">
        <CategoryNav categories={categories} activeId={activeId} onSelect={handleSelectCategory} />
      </div>

      <main className="menu-list">
        {categories.map((category) => (
          <CategorySection category={category} key={category.id} />
        ))}
      </main>

      <CartBar onView={() => setSummaryOpen(true)} />
      <OrderSummary
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        onOrderPlaced={(order) => {
          setSummaryOpen(false);
          setConfirmedOrder(order);
        }}
      />
    </>
  );
}
