-- Stripe: add order status used while checkout payment is pending
ALTER TYPE public.marketplace_order_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
