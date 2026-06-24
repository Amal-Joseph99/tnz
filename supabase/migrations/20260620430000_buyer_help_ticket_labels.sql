-- Buyer help ticket section labels for help center dropdown.

UPDATE public.support_request_topics
SET display_label = 'ORDER & TRACKING'
WHERE topic_key = 'buyer_order';

UPDATE public.support_request_topics
SET display_label = 'RETURN & REFUND'
WHERE topic_key = 'buyer_return';

UPDATE public.support_request_topics
SET display_label = 'TRANSACTION FAILED'
WHERE topic_key = 'buyer_payment';

UPDATE public.support_request_topics
SET display_label = 'ACCOUNT RELATED'
WHERE topic_key = 'buyer_account';
