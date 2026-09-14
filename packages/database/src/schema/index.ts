import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  jsonb,
  integer,
  bigint,
  boolean,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// 1. ORGANISATIONS & PLATFORMS
export const organisations = pgTable('organisations', {
  id: uuid('id').defaultRandom().primaryKey(),
  legalName: varchar('legal_name', { length: 255 }).notNull(),
  tradingName: varchar('trading_name', { length: 255 }),
  registrationNumber: varchar('registration_number', { length: 100 }),
  organisationType: varchar('organisation_type', { length: 50 }).notNull(), // PLATFORM | FLEET_OPERATOR | VEHICLE_OWNER | SUBCONTRACTOR
  status: varchar('status', { length: 30 }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const platforms = pgTable('platforms', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull().references(() => organisations.id),
  name: varchar('name', { length: 255 }).notNull(),
  nptrRegistered: boolean('nptr_registered').notNull().default(false),
  nptrLicenceNumber: varchar('nptr_licence_number', { length: 100 }),
  status: varchar('status', { length: 30 }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const operatingAgreements = pgTable('operating_agreements', {
  id: uuid('id').defaultRandom().primaryKey(),
  platformId: uuid('platform_id').notNull().references(() => platforms.id),
  contractorOrganisationId: uuid('contractor_organisation_id').notNull().references(() => organisations.id),
  agreementType: varchar('agreement_type', { length: 50 }).notNull(), // FLEET_MANAGEMENT | SUBCONTRACT_OPERATOR | VEHICLE_SUPPLY
  status: varchar('status', { length: 30 }).notNull().default('ACTIVE'),
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  terms: jsonb('terms'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const fleets = pgTable('fleets', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull().references(() => organisations.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. IDENTITY & ACTORS
export const actors = pgTable('actors', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorType: varchar('actor_type', { length: 30 }).notNull(), // PERSON | ORGANISATION | SYSTEM
  email: varchar('email', { length: 320 }),
  phone: varchar('phone', { length: 40 }),
  displayName: varchar('display_name', { length: 255 }),
  nationalId: varchar('national_id', { length: 50 }),
  status: varchar('status', { length: 30 }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('actors_email_idx').on(table.email),
  index('actors_phone_idx').on(table.phone),
]);

export const organisationMembers = pgTable('organisation_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull().references(() => organisations.id),
  actorId: uuid('actor_id').notNull().references(() => actors.id),
  role: varchar('role', { length: 80 }).notNull(), // FLEET_MANAGER | COMPLIANCE_OFFICER | DISPATCHER | FINANCE | OPERATOR
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const passengers = pgTable('passengers', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').notNull().references(() => actors.id),
  status: varchar('status', { length: 30 }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. FLEET: VEHICLES & DRIVERS
export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').references(() => organisations.id),
  fleetId: uuid('fleet_id').references(() => fleets.id),
  registrationNumber: varchar('registration_number', { length: 30 }).notNull(),
  vin: varchar('vin', { length: 100 }),
  make: varchar('make', { length: 100 }),
  model: varchar('model', { length: 100 }),
  year: integer('year'),
  passengerCapacity: integer('passenger_capacity').notNull(),
  category: varchar('category', { length: 50 }).notNull(), // SEVEN_SEATER | SEDAN | EXECUTIVE
  status: varchar('status', { length: 30 }).notNull().default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('vehicles_reg_idx').on(table.registrationNumber),
]);

export const drivers = pgTable('drivers', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').notNull().references(() => actors.id),
  organisationId: uuid('organisation_id').references(() => organisations.id),
  fleetId: uuid('fleet_id').references(() => fleets.id),
  licenseNumber: varchar('license_number', { length: 100 }),
  status: varchar('status', { length: 30 }).notNull().default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. SERVICE AREAS & CAPABILITIES
export const serviceAreas = pgTable('service_areas', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull(), // e.g. ZA_GP (Gauteng), ZA_MP (Mpumalanga)
  name: varchar('name', { length: 100 }).notNull(),
  jurisdiction: varchar('jurisdiction', { length: 50 }).notNull().default('South Africa'),
  boundaryGeoJson: jsonb('boundary_geo_json'),
  status: varchar('status', { length: 30 }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const capabilityGrants = pgTable('capability_grants', {
  id: uuid('id').defaultRandom().primaryKey(),
  subjectType: varchar('subject_type', { length: 50 }).notNull(), // VEHICLE | DRIVER | ORGANISATION
  subjectId: uuid('subject_id').notNull(),
  capability: varchar('capability', { length: 80 }).notNull(), // SEVEN_SEATER | E_HAILING | PASSENGER_TRANSPORT
  serviceAreaCode: varchar('service_area_code', { length: 50 }),
  status: varchar('status', { length: 30 }).notNull().default('ACTIVE'),
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  reason: text('reason'),
});

// 5. DOCUMENTS, EVIDENCE & COMPLIANCE
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerType: varchar('owner_type', { length: 50 }).notNull(), // DRIVER | VEHICLE | ORGANISATION | PLATFORM
  ownerId: uuid('owner_id').notNull(),
  documentType: varchar('document_type', { length: 100 }).notNull(), // PDP | OPERATING_LICENCE | ROADWORTHY | INSURANCE | VEHICLE_REG
  documentNumber: varchar('document_number', { length: 150 }),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  storageKey: text('storage_key'),
  verificationStatus: varchar('verification_status', { length: 40 }).notNull().default('PENDING'), // PENDING | VERIFIED | REJECTED | EXPIRED
  verifiedByActorId: uuid('verified_by_actor_id').references(() => actors.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const complianceDecisions = pgTable('compliance_decisions', {
  id: uuid('id').defaultRandom().primaryKey(),
  subjectType: varchar('subject_type', { length: 50 }).notNull(), // OPERATIONAL_PAIR
  driverId: uuid('driver_id').notNull().references(() => drivers.id),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicles.id),
  organisationId: uuid('organisation_id').references(() => organisations.id),
  platformId: uuid('platform_id').references(() => platforms.id),
  serviceAreaCode: varchar('service_area_code', { length: 50 }).notNull(),
  serviceType: varchar('service_type', { length: 50 }).notNull(),
  regulatoryProfile: varchar('regulatory_profile', { length: 150 }).notNull(),
  ruleVersion: varchar('rule_version', { length: 80 }).notNull(),
  decision: varchar('decision', { length: 30 }).notNull(), // ALLOWED | DENIED
  reasons: jsonb('reasons').notNull(),
  requirementsPassed: jsonb('requirements_passed').notNull(),
  evidence: jsonb('evidence').notNull(),
  evaluatedAt: timestamp('evaluated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. TRIPS, DISPATCH & PRICING
export const trips = pgTable('trips', {
  id: uuid('id').defaultRandom().primaryKey(),
  passengerActorId: uuid('passenger_actor_id').notNull().references(() => actors.id),
  platformId: uuid('platform_id').references(() => platforms.id),
  driverId: uuid('driver_id').references(() => drivers.id),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id),
  state: varchar('state', { length: 40 }).notNull().default('REQUESTED'),
  serviceType: varchar('service_type', { length: 50 }).notNull(), // SEVEN_SEATER_E_HAILING
  serviceAreaCode: varchar('service_area_code', { length: 50 }).notNull(),
  pickup: jsonb('pickup').notNull(),
  destination: jsonb('destination').notNull(),
  distanceKm: integer('distance_km'),
  durationMinutes: integer('duration_minutes'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelReason: text('cancel_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tripEvents = pgTable('trip_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id').notNull().references(() => trips.id),
  fromState: varchar('from_state', { length: 40 }),
  toState: varchar('to_state', { length: 40 }).notNull(),
  actorId: uuid('actor_id').references(() => actors.id),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const fares = pgTable('fares', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id').notNull().references(() => trips.id),
  currency: varchar('currency', { length: 3 }).notNull().default('ZAR'),
  baseMinor: bigint('base_minor', { mode: 'bigint' }).notNull(),
  distanceMinor: bigint('distance_minor', { mode: 'bigint' }).notNull(),
  timeMinor: bigint('time_minor', { mode: 'bigint' }).notNull(),
  subtotalMinor: bigint('subtotal_minor', { mode: 'bigint' }).notNull(),
  multiplier: integer('multiplier_scaled').notNull().default(100), // scaled by 100
  totalMinor: bigint('total_minor', { mode: 'bigint' }).notNull(),
  breakdown: jsonb('breakdown').notNull(),
  pricingRuleVersion: varchar('pricing_rule_version', { length: 80 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. PAYMENTS & DOUBLE-ENTRY FINANCIAL LEDGER
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id').notNull().references(() => trips.id),
  passengerActorId: uuid('passenger_actor_id').notNull().references(() => actors.id),
  amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('ZAR'),
  provider: varchar('provider', { length: 50 }).notNull().default('MOCK'),
  providerRef: varchar('provider_ref', { length: 150 }),
  status: varchar('status', { length: 30 }).notNull().default('CAPTURED'), // AUTHORISED | CAPTURED | FAILED | REFUNDED
  capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ledgerTransactions = pgTable('ledger_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  referenceType: varchar('reference_type', { length: 80 }).notNull(), // TRIP_PAYMENT | SETTLEMENT_PAYOUT
  referenceId: uuid('reference_id').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id').notNull().references(() => ledgerTransactions.id),
  accountCode: varchar('account_code', { length: 100 }).notNull(),
  direction: varchar('direction', { length: 10 }).notNull(), // DEBIT | CREDIT
  amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('ZAR'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const settlements = pgTable('settlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id').notNull().references(() => trips.id),
  platformFeeMinor: bigint('platform_fee_minor', { mode: 'bigint' }).notNull(),
  fleetOwnerShareMinor: bigint('fleet_owner_share_minor', { mode: 'bigint' }).notNull(),
  driverPayoutMinor: bigint('driver_payout_minor', { mode: 'bigint' }).notNull(),
  totalGrossMinor: bigint('total_gross_minor', { mode: 'bigint' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('ZAR'),
  settledAt: timestamp('settled_at', { withTimezone: true }).defaultNow().notNull(),
  status: varchar('status', { length: 30 }).notNull().default('SETTLED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 8. AUDIT, EVIDENCE & OUTBOX
export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').references(() => actors.id),
  eventType: varchar('event_type', { length: 150 }).notNull(),
  aggregateType: varchar('aggregate_type', { length: 100 }).notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  reason: text('reason'),
  ruleEvaluated: varchar('rule_evaluated', { length: 100 }),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  evidence: jsonb('evidence'),
  correlationId: varchar('correlation_id', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventType: varchar('event_type', { length: 150 }).notNull(),
  aggregateType: varchar('aggregate_type', { length: 100 }).notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 30 }).notNull().default('PENDING'),
  attempts: integer('attempts').notNull().default(0),
  availableAt: timestamp('available_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
