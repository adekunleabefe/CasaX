-- Align CasaX package pricing with the managed property operations model.

UPDATE "subscription_plans"
SET
  "name" = 'Essential',
  "description" = 'Essential managed property operations for focused portfolios.',
  "monthly_price" = 15000,
  "annual_price" = NULL,
  "max_properties" = 3,
  "max_units" = 20,
  "max_caretakers" = NULL,
  "includes_vacancy_listing" = true,
  "is_custom" = false,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "type" = 'starter';

UPDATE "subscription_plans"
SET
  "name" = 'Growth',
  "description" = 'Managed operations for growing rental portfolios.',
  "monthly_price" = 50000,
  "annual_price" = NULL,
  "max_properties" = 10,
  "max_units" = 100,
  "max_caretakers" = NULL,
  "includes_vacancy_listing" = true,
  "is_custom" = false,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "type" = 'growth';

UPDATE "subscription_plans"
SET
  "name" = 'Enterprise',
  "description" = 'Custom limits, onboarding, integrations, and support.',
  "monthly_price" = NULL,
  "annual_price" = NULL,
  "max_properties" = NULL,
  "max_units" = NULL,
  "max_caretakers" = NULL,
  "includes_vacancy_listing" = true,
  "is_custom" = true,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "type" = 'enterprise';
