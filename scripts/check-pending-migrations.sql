-- Cole no SQL Editor do Supabase (produção) para ver o que falta.
-- Não altera dados; só diagnostica.

-- Colunas críticas para criar pedido (Order)
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'shippingServiceId'
  ) AS has_shipping_service_id,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'shippingServiceName'
  ) AS has_shipping_service_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'paidAt'
  ) AS has_paid_at;

-- Colunas em OrderItem (checkout com variante)
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'OrderItem' AND column_name = 'variantId'
  ) AS has_order_item_variant_id,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'OrderItem' AND column_name = 'deductedStock'
  ) AS has_deducted_stock;

-- Tabelas usadas pelo app
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CartItem') AS has_cart_item,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SavedCard') AS has_saved_card,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ProductReview') AS has_product_review,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'WhatsappTemplate') AS has_whatsapp_template,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'StockMovement') AS has_stock_movement;

-- Colunas de frete em Product
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'shippingMode'
  ) AS has_product_shipping_mode;
