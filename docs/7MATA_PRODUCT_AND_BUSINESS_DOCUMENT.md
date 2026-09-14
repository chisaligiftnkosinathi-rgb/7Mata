# 7MATA Mobility Operating System (MOS)
## Product Specification, Regulatory Architecture & Business Model Documentation

---

### Executive Summary

**7MATA** is a **compliance-first Mobility Operating System (MOS)** engineered for regulated passenger road transport. Unlike conventional consumer ride-hailing networks that treat government regulation, permit verifications, and licensing as auxiliary operations, 7MATA embeds statutory compliance directly into the core dispatch execution loop.

The name **7MATA** originates from the colloquial South African designation for **7-seater passenger vehicles** (*"Seven-matas"* or *"Seven-seaters"*), which represent a critical mid-tier transit mode bridging traditional 15-to-22-seater minibus taxis, metered taxis, and private app-based passenger dispatch.

7MATA transforms fragmented, informally organized passenger fleets into verified, legally compliant, financially auditable, and digitally scheduled transport infrastructure.

---

## 1. Why 7MATA Exists (The Problem & Opportunity)

### 1.1 The Regulatory Crisis in Emerging & Shared Mobility
In South Africa and across wider sub-Saharan Africa, urban passenger transportation is governed by comprehensive statutes such as the **National Land Transport Act (Act No. 5 of 2009 / NLTA)** and the **National Land Transport Amendment Act (NLTAA 2024/2026)**. Under these laws:
- Vehicles cannot transport fee-paying passengers without valid **Operating Licences (OLs)** issued by the **NPTR (National Public Transport Regulator)** or Provincial Regulatory Entities (PREs).
- Drivers must carry a verified **Professional Driving Permit (PrDP)** with criminal record clearances and medical fitness certifications.
- Vehicles must undergo regular roadworthiness testing and carry dedicated commercial passenger liability cover.
- Aggregators and e-hailing application providers must register as legitimate digital transport platforms with the regulator and comply with spatial, pricing, and operating conditions.

### 1.2 The Failure of Legacy Platforms
Global ride-hailing platforms entered the market using an "ask for forgiveness, not permission" playbook:
1. **Unregulated Onboarding**: Thousands of unpermitted vehicles were put on public roads, sparking violent conflicts with existing metered taxi and minibus taxi associations.
2. **Impoundment Risk**: Drivers faced regular vehicle impoundments by metropolitan police and traffic departments due to absent or delayed operating permits.
3. **Predatory Commission Swings**: Fluctuating 25%–30% platform take rates left vehicle owners and operators economically insecure, leading to poorly maintained vehicles failing roadworthiness standards.
4. **Lack of Verifiable Audit Trails**: Municipalities and transport authorities had no real-time telemetry, audit trails, or verifiable proof that dispatched vehicles adhered to permitted geographic routes.

### 1.3 The 7MATA Solution
7MATA serves as the digital operating system for **fleet operators, vehicle owners, driver cooperatives, and transport authorities**. Every trip, every driver dispatch, and every transaction is cryptographically tied to verifiable statutory compliance.

---

## 2. Core Operational Philosophy & Primitives

7MATA replaces the naive *`Request -> Match -> Pay`* flow with a strict **Deterministic Compliance & Evidence Loop**:

$$\text{Actor} \longrightarrow \text{Capability} \longrightarrow \text{Action} \longrightarrow \text{Event} \longrightarrow \text{State} \longrightarrow \text{Evidence}$$

```
+---------------+     +--------------------+     +-------------------+
|     Actor     | --> | Compliance Engine  | --> | Execution / State |
| Driver/Vehicle|     | (NLTA/NPTR Rules)  |     | Machine (Trip/Job)|
+---------------+     +--------------------+     +-------------------+
                               |                           |
                               v                           v
                       [DECISION TOKEN]           [TRANSACTIONAL OUTBOX]
                        Passed / Denied           [IMMUTABLE AUDIT LOG]
```

### The Seven Primitives:
1. **Actor**: A verified entity in the system (Person, Driver, Organisation, Fleet Operator, Platform, or Regulatory Authority).
2. **Intent**: The stated operation (e.g. Passenger requests transport along a specific corridor).
3. **Capability**: Explicitly granted regulatory or operational capabilities (e.g., `SEVEN_SEATER`, `LONG_DISTANCE_CHARTER`, `CROSS_BORDER`).
4. **Action**: The transition attempt (e.g. `ACCEPT_DISPATCH`, `START_TRIP`).
5. **Event**: An immutable fact written to an append-only event stream upon action execution.
6. **State**: The current lifecycle state of a domain entity managed via explicit state machines.
7. **Evidence**: Permanent, auditable proof (cryptographic hash, document snapshot, GPS breadcrumb) verifying compliance at execution time.

---

## 3. Regulatory Rules & The NPTR Framework

7MATA's compliance architecture is powered by versioned, immutable compliance profiles (currently baseline **`ZA-NLTA-2026.1`**).

### 3.1 Statutory Framework
The platform directly enforces requirements from:
- **National Land Transport Act (Act 5 of 2009)**
- **NLTA Amendment Act (2024/2026)**
- **National Public Transport Regulator (NPTR)** regulations
- **Road Traffic Act (Act 93 of 1996)**
- **South African Revenue Service (SARS)** statutory requirements

### 3.2 Executable Compliance Rules in 7MATA

| Rule Code | Authority / Regulation | Verification Criteria | Platform Enforcement |
|---|---|---|---|
| **`DRIVER_PDP_VALID`** | NLTA §42; RTA §32 | Driver holds valid, unexpired PrDP (Professional Driving Permit - Category P for Passengers). Verified status. | Pre-dispatch hard block: driver cannot go online or receive trip requests without an active PrDP. |
| **`VEHICLE_ROADWORTHY`** | RTA Reg 142; NLTA §50 | Vehicle possesses an active Certificate of Roadworthiness (CRW) renewed annually. | Automated expiration alerts; hard lockdown of vehicle dispatch upon expiration date. |
| **`INSURANCE_VALID`** | NLTA §50(e) | Commercial Passenger Liability Insurance (minimum policy limit per passenger seat). | Trip requests rejected if policy status is expired or unverified. |
| **`OPERATING_AUTHORITY_VALID`** | NLTA §50–66 (NPTR/PRE) | Platform Operator and Fleet Vehicle hold valid Operating Licence or registered NPTR application receipt. | Cross-checked against authorized service area and vehicle registration number. |
| **`SEVEN_SEATER_CAPABILITY_GRANTED`** | NLTA Vehicle Class Regs | Vehicle is registered and certified as a passenger transport vehicle carrying 4–7 passengers. | Only certified vehicles receive `SEVEN_SEATER` capacity dispatch requests. |

---

## 4. NPTR Pricing Framework & The Financial Model

### 4.1 Statutory Pricing Principles for NPTR Compliance
Under the amended transport regulations, digital platforms operating e-hailing and shared passenger services must adhere to:
1. **Fare Transparency**: Upfront pricing where distance, time, and base components are disclosed prior to passenger commitment.
2. **Anti-Predatory Pricing Controls**: Dynamic pricing cannot fall below the statutory floor (which covers fuel, maintenance, insurance, and statutory living wages) nor exceed anti-gouging caps.
3. **Transparent Commission Limits**: Clear separation of platform commission fees from carrier fares.

### 4.2 Fare Calculation Engine
Fares are calculated with zero-drift integer arithmetic (stored in minor units / cents):

$$\text{Total Fare} = \left( \text{Base} + (\text{Distance}_{\text{km}} \times \text{Rate}_{\text{km}}) + (\text{Duration}_{\text{min}} \times \text{Rate}_{\text{min}}) \right) \times \text{Multiplier}$$

- **Base Minor**: Fixed flagfall fee for vehicle mobilization.
- **Distance Minor**: Distance-based charge calculated along authorized routes.
- **Time Minor**: Operating time allowance.
- **Multiplier**: Scaled dynamic rate factor within statutory boundaries (default 100 = 1.0x).

### 4.3 Double-Entry Financial Ledger
7MATA eliminates financial discrepancies and guarantees compliance with tax and licensing audits via an **immutable double-entry ledger** (`packages/ledger`).

All monies collected are partitioned at the exact moment of payment clearance:

```
                  [ Gross Passenger Fare: R100.00 (10000 minor) ]
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
[ Platform Commission ]         [ Fleet Operator ]               [ Driver Payout ]
     10% (R10.00)                 10% (R10.00)                     80% (R80.00)
 Account:                        Account:                         Account:
 7MATA_PLATFORM_COMMISSION       FLEET_OWNER_PAYABLE              DRIVER_PAYABLE
```

#### Strict Invariant Check:
Every ledger transaction must satisfy the balanced double-entry equation before writing to disk:
$$\sum \text{Debits} \equiv \sum \text{Credits}$$

```typescript
// Debit Clearing
DEBIT   PAYMENT_GATEWAY_CLEARING:  10000 minor
// Credit Distribution
CREDIT  7MATA_PLATFORM_COMMISSION:  1000 minor
CREDIT  FLEET_OWNER_PAYABLE:       1000 minor
CREDIT  DRIVER_PAYABLE:            8000 minor
```

---

## 5. 7MATA Business Model

7MATA operates a **B2B / B2G Enterprise SaaS + Transactional Take-Rate** model:

### 5.1 Revenue Streams
1. **Transaction Take Rate (Platform Commission)**:
   - 7MATA charges an efficient **8% to 12%** platform fee per completed trip.
   - Contrast this with traditional rideshare platforms charging **25%–30%**, leaving more margin for fleet maintenance and driver sustainability.
2. **Fleet Management SaaS Subscriptions**:
   - Monthly subscription fee charged per active vehicle to fleet owners and taxi cooperatives for enterprise dispatch, live telematics, maintenance scheduling, and fuel tracking.
3. **Compliance & Licensing-as-a-Service (LaaS)**:
   - Digital verification and automated filing pipeline for NPTR operating licence renewals, PrDP tracking, and document verification fees.
4. **Corporate & Public Sector Shuttles**:
   - Scheduled commuting, airport transfers, and corporate fleet dispatch using verified 7-seater vehicles with guaranteed compliance certificates for corporate ESG reporting.

### 5.2 Stakeholder Value Propositions
- **For Drivers**: Fair take-rates (80% net share), legal security against vehicle impoundment, predictable shifts, and verified insurance protection.
- **For Fleet Owners**: Complete transparency, automated double-entry ledger payouts, real-time vehicle monitoring, and protection of operating capital.
- **For Regulators & Municipalities**: Access to authorized transit data, automated compliance auditing, elimination of illegal unpermitted operations, and reduced route disputes.
- **For Passengers**: Safe, verified drivers and roadworthy vehicles with guaranteed commercial passenger liability coverage and transparent pricing.

---

## 6. Product Architecture & Technology Stack

7MATA is architected as a **Modular Monolith** optimized for developer ergonomics, absolute transactional consistency, and straightforward future service extraction:

```
7MATA Workspace
├── apps/
│   ├── api/             # Fastify REST & WebSocket gateway
│   └── dispatcher/      # Real-time dispatch matching service
├── packages/
│   ├── compliance/      # Regulatory profiles, rule engine, verification
│   ├── database/        # Drizzle ORM schema, PostgreSQL migrations
│   ├── ledger/          # Double-entry integer ledger & settlement split
│   ├── types/           # Shared TypeScript domain types
│   └── events/          # Domain events & transactional outbox
├── regulatory/          # Controlled legal propositions & statutory records
└── tests/
    ├── e2e/             # 19-step operational core acceptance tests
    └── integration/     # State machine & ledger integration tests
```

### Key Technical Choices:
- **Runtime**: Node.js 22 + TypeScript + pnpm workspaces.
- **Database**: PostgreSQL 16 (single source of truth for ACID compliance).
- **ORM**: Drizzle ORM with explicit SQL schema and automated migrations.
- **Messaging & Background Workers**: Redis + BullMQ for asynchronous jobs.
- **Validation**: Zod runtime schema contracts.
- **Audit Trails**: Durable transactional outbox and append-only event tables.

---

## 7. The 19-Step Operational Lifecycle

7MATA implements an explicit 19-step operational workflow verified in automated acceptance tests (`tests/e2e/m1-operational-core.test.ts`):

1. **System Boot**: Verification of active regulatory profile (`ZA-NLTA-2026.1`).
2. **Organisation Creation**: Platform and fleet operators registered.
3. **Platform NPTR Registration**: Operating authority numbers recorded.
4. **Fleet Definition**: Fleet groups created under managing organization.
5. **Operating Agreement**: Legal terms ratified between platform and fleet operator.
6. **Actor Enrollment**: Driver, passenger, and dispatcher accounts provisioned.
7. **Role Assignment**: Permissions granted with role-based access control.
8. **Vehicle Onboarding**: VIN, registration number, and capacity registered.
9. **Document Ingestion**: PrDP, CRW, Insurance, and Operating Licence captured.
10. **Document Verification**: Independent compliance check marks documents `VERIFIED`.
11. **Driver Assignment**: Verified driver assigned to verified vehicle.
12. **Capability Grant**: Vehicle/driver granted `SEVEN_SEATER` operational rights.
13. **Trip Request**: Passenger requests 7-seater dispatch within authorized zone.
14. **Pre-Dispatch Compliance Evaluation**: Compliance engine issues `PASSED` decision token.
15. **Trip Acceptance & Assignment**: Driver accepts ride; state machine advances.
16. **Trip Execution**: Driver arrives, picks up passenger, and transitions to `STARTED`.
17. **Trip Completion**: Vehicle reaches destination; trip marked `COMPLETED`.
18. **Fare Calculation**: Integer pricing engine generates transparent fare breakdown.
19. **Payment & Ledger Posting**: Funds captured, settlement splits calculated, and balanced double-entry ledger lines committed.

---

## 8. Summary & Roadmap

7MATA brings order, statutory compliance, and economic transparency to passenger transportation. By codifying transport legislation directly into software, it unlocks safe, predictable, and legally sound public mobility for emerging markets.
