# Five Portals Map (FND-02.04)

Pharmacy console = **HomeoMeds** — **not** a 6th portal in the PDF count.  
Patient App and Doctor App are **mobile** clients of the same New-API shared keys — not extra web portals.

| # | Portal | Who | Home URL (web) | API host notes | Screens owned by |
|---|---|---|---|---|---|
| 1 | Patient Website | Patients / public | Later M10 | New-API for new work | M10 |
| 2 | Doctor Web Portal | Doctor | `/doctordashboard` | Dual-API: board + New clinical; login classic | M03–M05, M11+ |
| 3 | Reception Portal | Reception | `/doctordashboard` (shared shell) | Same as Doctor; JWT includes parent `DoctorID` | M06 |
| 4 | Admin Portal | Admin / Management | `/dashboard` + `/admin/*` | Masters frozen per M02 host map; AdminPortal ACL | M02 |
| 5 | Account Department | Account | `/account/home` (stub in S1 W1) | Money APIs on New-API in M08; `AccountPortal` policy | M08 |

### Pharmacy / HomeoMeds

| Surface | Who | Home URL | Notes |
|---|---|---|---|
| HomeoMeds console | PharmacyPartner | `/pharmacy/home` (stub in S1 W1) | Not counted as portal #6 in PDF |

## Separation of duties (SEC-04.03 / PDF §8)

- **Account** controls money menus (ledger, earnings, payouts, invoices, reports).
- **Admin** controls platform + clinical masters.
- Neither performs the other’s role: Account JWT → 403 on AdminPortal mutate; Admin menus must not include Account money items after seed.

## S1 Week 1 stubs only

Account and Pharmacy layouts are **placeholders**. No money tables or HomeoMeds CRUD in Week 1.
