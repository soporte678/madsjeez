-- Migration: Create product_wholesale_prices table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS product_wholesale_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    min_quantity INTEGER NOT NULL CHECK (min_quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, min_quantity)
);

CREATE INDEX IF NOT EXISTS idx_wholesale_product ON product_wholesale_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_wholesale_qty ON product_wholesale_prices(min_quantity);

-- Enable Row Level Security
ALTER TABLE product_wholesale_prices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all reads (products are public)
CREATE POLICY "Allow public read access" ON product_wholesale_prices
    FOR SELECT USING (true);

-- Create policy to allow sellers to manage their own product wholesale prices
CREATE POLICY "Allow sellers to manage wholesale prices" ON product_wholesale_prices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_wholesale_prices.product_id 
            AND products.seller_id = auth.uid()
        )
    );
