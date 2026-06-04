# CasaX Engineering Model

CasaX is a managed property operations, rent collection, vacancy management, maintenance coordination, and landlord remittance platform.

CasaX is managed-service-first, powered by software. The product should not be described as SaaS-first or as landlord self-serve property management software.

## Business Model

Landlords pay for CasaX management packages, not software subscriptions.

CasaX handles property operations. Landlords primarily monitor:

- properties
- occupancy
- rent collection
- remittances
- vacancies
- maintenance status

Landlords should not manage caretakers. Existing caretaker/internal operational concepts can remain where useful, but do not expose caretaker management as a landlord feature. Admin can temporarily handle operational coordination until future staff roles are introduced.

## Packages

Currency: NGN.

### Essential

- up to 3 properties
- up to 20 units
- ₦15,000/month
- rent collection included
- remittance tracking included
- vacancy management included
- maintenance status included

### Growth

- up to 10 properties
- up to 100 units
- ₦50,000/month
- rent collection included
- remittance tracking included
- vacancy management included
- maintenance status included

### Enterprise

- custom limits
- custom pricing
- dedicated onboarding
- dedicated support
- custom integrations

## Revenue Streams

Current:

- landlord management packages
- inspection fees
- rental success fees
- agreement processing fees
- renewal processing fees

Do not add rent processing fees. Rent collection and remittance are included in the management package.

## Product Copy Rules

Prefer:

- management package
- managed property operations
- CasaX operations
- rent collection
- landlord remittance
- vacancy management
- maintenance coordination/status

Avoid landlord-facing copy such as:

- SaaS subscription
- landlord software
- caretaker management
- caretaker limits
- landlords assigning/managing caretakers

## Architecture Notes

Keep the existing CasaX monorepo structure:

```txt
frontend/web
frontend/app
frontend/admin
frontend/packages
backend
```

Do not remove core payment, remittance, property, vacancy, maintenance, occupancy, or tenancy workflows while aligning copy and package logic with the managed operations model.
