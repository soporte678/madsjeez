-- Restore stock when an order is cancelled or refunded.
CREATE OR REPLACE FUNCTION restore_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('cancelled', 'refunded')
       AND OLD.status NOT IN ('cancelled', 'refunded') THEN
        UPDATE products
        SET
            stock = stock + oi.quantity,
            sold_count = GREATEST(sold_count - oi.quantity, 0)
        FROM order_items oi
        WHERE products.id = oi.product_id
        AND oi.order_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
