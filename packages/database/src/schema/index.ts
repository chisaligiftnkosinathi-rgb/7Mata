import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  jsonb,
  integer,
  bigint,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const organisations = pgTable('organisations', {
  id: uuid('id').defaultRandom().primaryKey(),
  legalName: varchar('legal_name', { length: 255 }).notNull(),
  tradingName: varchar('trading_name', { length: 255 }),
  registrationNumber: varchar('registration_number', { length: 100 }),
  organisationType: varchar('organisation_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const actors = pgTable('actors', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorType: varchar('actor_type', { length: 30 }).notNull(),
  email: varchar('email', { length: 320 }),
  phone: varchar('phone', { length: 40 }),
  displayName: varchar('display_name', { length: 255 }),
  status: varchar('status', { length: 30 }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('actors_email_idx').on(table.email),
]);

export const organisationMembers = pgTable('organisation_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').notNull().references(() => organisations.id),
  actorId: uuid('actor_id').notNull().references(() => actors.id),
  role: varchar('role', { length: 80 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id').references(() => organisations.id),
  registrationNumber: varchar('registration_number', { length: 30 }).notNull(),
  vin: varchar('vin', { length: 100 }),
  make: varchar('make', { length: 100 }),
  model: varchar('model', { length: 100 }),
  year: integer('year'),
  passengerCapacity: integer('passenger_capacity').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const drivers = pgTable('drivers', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').notNull().references(() => actors.id),
  organisationId: uuid('organisation_id').references(() => organisations.id),
  status: varchar('status', { length: 30 }).notNull().default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerType: varchar('owner_type', { length: 50 }).notNull(),
  ownerId: uuid('owner_id').notNull(),
  documentType: varchar('document_type', { length: 100 }).notNull(),
  documentNumber: varchar('document_number', { length: 150 }),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  storageKey: text('storage_key'),
  verificationStatus: varchar('verification_status', { length: 40 }).notNull().default('PENDING'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const complianceDecisions = pgTable('compliance_decisions', {
  id: uuid('id').defaultRandom().primaryKey(),
  subjectType: varchar('subject_type', { length: 50 }).notNull(),
  subjectId: uuid('subject_id').notNull(),
  regulatoryProfile: varchar('regulatory_profile', { length: 150 }).notNull(),
  ruleVersion: varchar('rule_version', { length: 80 }).notNull(),
  decision: varchar('decision', { length: 30 }).notNull(),
  reasons: jsonb('reasons').notNull(),
  evidence: jsonb('evidence').notNull(),
  evaluatedAt: timestamp('evaluated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const trips = pgTable('trips', {
  id: uuid('id').defaultRandom().primaryKey(),
  passengerActorId: uuid('passenger_actor_id').notNull().references(() => actors.id),
  driverId: uuid('driver_id').references(() => drivers.id),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id),
  state: varchar('state', { length: 40 }).notNull().default('REQUESTED'),
  serviceType: varchar('service_type', { length: 50 }).notNull(),
  pickup: jsonb('pickup').notNull(),
  destination: jsonb('destination').notNull(),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const fares = pgTable('fares', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id').notNull().references(() => trips.id),
  currency: varchar('currency', { length: 3 }).notNull().default('ZAR'),
  totalMinor: bigint('total_minor', { mode: 'bigint' }).notNull(),
  breakdown: jsonb('breakdown').notNull(),
  pricingRuleVersion: varchar('pricing_rule_version', { length: 80 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ledgerTransactions = pgTable('ledger_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  referenceType: varchar('reference_type', { length: 80 }).notNull(),
  referenceId: uuid('reference_id').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id').notNull().references(() => ledgerTransactions.id),
  accountCode: varchar('account_code', { length: 100 }).notNull(),
  direction: varchar('direction', { length: 10 }).notNull(),
  amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('ZAR'),
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

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').references(() => actors.id),
  eventType: varchar('event_type', { length: 150 }).notNull(),
  aggregateType: varchar('aggregate_type', { length: 100 }).notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  reason: text('reason'),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  evidence: jsonb('evidence'),
  correlationId: varchar('correlation_id', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
