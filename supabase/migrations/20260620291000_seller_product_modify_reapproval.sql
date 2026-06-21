-- Allow sellers to resubmit approved listings for admin review after editing.

CREATE OR REPLACE FUNCTION public.guard_seller_product_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.is_admin_account() THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_seller_account() OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to modify this product listing.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_warehouses w
    WHERE w.user_id = NEW.user_id
      AND w.is_completed = true
  ) THEN
    RAISE EXCEPTION 'Warehouse setup must be completed before product listing.';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.approval_status = 'pending' THEN
    RAISE EXCEPTION 'Product is pending admin review and cannot be edited.';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.approval_status = 'approved' AND NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    IF NEW.approval_status NOT IN ('approved', 'pending', 'draft') THEN
      RAISE EXCEPTION 'Approved listings can only be moved back to draft or pending for re-review.';
    END IF;
  END IF;

  IF NOT public.is_admin_account() AND NEW.approval_status IN ('approved', 'rejected') THEN
    IF TG_OP = 'INSERT' OR NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
      IF NEW.approval_status <> 'pending' OR (TG_OP = 'UPDATE' AND OLD.approval_status NOT IN ('draft', 'rejected', 'approved')) THEN
        IF NEW.approval_status IN ('approved', 'rejected') THEN
          RAISE EXCEPTION 'Only admins can approve or reject product listings.';
        END IF;
      END IF;
    END IF;
  END IF;

  IF NEW.approval_status = 'pending' AND (TG_OP = 'INSERT' OR OLD.approval_status IS DISTINCT FROM 'pending') THEN
    NEW.submitted_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

INSERT INTO public.app_route_access_rules (path_pattern, allowed_roles, redirect_path, priority)
VALUES
  ('/seller/products/new', ARRAY['seller'], '/seller/dashboard', 80),
  ('/seller/products/*/edit', ARRAY['seller'], '/seller/dashboard', 80)
ON CONFLICT (path_pattern) DO UPDATE
SET allowed_roles = EXCLUDED.allowed_roles,
    redirect_path = EXCLUDED.redirect_path,
    priority = EXCLUDED.priority;
