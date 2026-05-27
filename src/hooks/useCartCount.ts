import { useState, useEffect } from "react";

export function useCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const data = await res.json();
          setCount(data.items?.length || data.count || 0);
        }
      } catch {
        // Silenciar error - el usuario puede no estar autenticado
      }
    };

    fetchCount();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchCount, 30000);

    // Tambien escuchar eventos de storage para actualizaciones en tiempo real
    const handleStorageChange = () => fetchCount();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cart-updated", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cart-updated", handleStorageChange);
    };
  }, []);

  return count;
}
