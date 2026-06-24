-- Seller help ticket section labels for dashboard help dropdown.

UPDATE public.support_request_topics
SET display_label = 'KYC & VERIFICATION'
WHERE topic_key = 'seller_kyc';

UPDATE public.support_request_topics
SET display_label = 'PRODUCT LISTING'
WHERE topic_key = 'seller_listing';

UPDATE public.support_request_topics
SET display_label = 'PAYOUT & WALLET'
WHERE topic_key = 'seller_payout';

UPDATE public.support_request_topics
SET display_label = 'ORDER FULFILLMENT'
WHERE topic_key = 'seller_order';
