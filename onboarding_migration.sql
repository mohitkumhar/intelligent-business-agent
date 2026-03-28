BEGIN;

-- 1. Update public.businesses table
ALTER TABLE public.businesses 
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS business_age VARCHAR(50),
    ADD COLUMN IF NOT EXISTS employees_range VARCHAR(20),
    ADD COLUMN IF NOT EXISTS biggest_challenge VARCHAR(255), -- Increased size to store multiple selections
    ADD COLUMN IF NOT EXISTS finance_tracking_method VARCHAR(50),
    ADD COLUMN IF NOT EXISTS onboarding_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.businesses.city IS 'City/location of the business collected at onboarding';
COMMENT ON COLUMN public.businesses.business_age IS 'Owner-stated age of the business (e.g. 1-3 years)';
COMMENT ON COLUMN public.businesses.employees_range IS 'Binned employee count from onboarding form';
COMMENT ON COLUMN public.businesses.biggest_challenge IS 'Primary business challenges (can be multiple)';
COMMENT ON COLUMN public.businesses.finance_tracking_method IS 'Current tools used for financial tracking';
COMMENT ON COLUMN public.businesses.onboarding_notes IS 'Optional qualitative feedback provided during signup';

-- Add check constraints for single-value fields
ALTER TABLE public.businesses 
    ADD CONSTRAINT businesses_finance_tracking_method_check
    CHECK (finance_tracking_method IN ('Excel/Sheets', 'App like Tally/Zoho', 'Notebook/Manual', 'Don''t track')),
    ADD CONSTRAINT businesses_employees_range_check
    CHECK (employees_range IN ('Just me', '2–5', '6–15', '16–50', '51–100', '100+'));

-- 2. Update public.users table
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

COMMENT ON COLUMN public.users.phone IS 'User contact number/WhatsApp collected during onboarding';

COMMIT;
