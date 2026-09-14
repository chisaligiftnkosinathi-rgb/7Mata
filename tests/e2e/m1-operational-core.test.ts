import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { newDb } from 'pg-mem';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '@7mata/database';
import { ComplianceEngine, ZA_NLTA_2026 } from '@7mata/compliance';
import { calculateFare } from '@7mata/pricing';
import { calculateSettlementSplit, createTripPaymentLedgerLines, assertBalanced } from '@7mata/ledger';
import { createEvidence } from '@7mata/evidence';
import { canTransition } from '@7mata/domain';

describe('7MATA M1 — Operational Core End-to-End Acceptance Test', () => {
  it('executes the full 19-step operational mobility lifecycle against PostgreSQL', async () => {
    // 0. Setup in-memory PostgreSQL instance with migration DDL
    const memDb = newDb();
    memDb.public.registerFunction({
      name: 'gen_random_uuid',
      returns: memDb.public.getType('uuid'),
      implementation: () => crypto.randomUUID(),
    });
    const migrationSql = fs.readFileSync('packages/database/migrations/0000_curly_glorian.sql', 'utf8');
    
    // Clean comments and statement-breakpoints
    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const pg = memDb.adapters.createPg();
    (pg as any).types = {
      getTypeParser: () => (val: any) => val,
      setTypeParser: () => {},
    };
    const pgClient = new pg.Client();
    (pgClient as any).types = (pg as any).types;
    await pgClient.connect();

    for (const sql of statements) {
      await pgClient.query(sql);
    }

    const db = drizzle(pgClient, { schema });

    // =========================================================================
    // STEP 1: CREATE ORGANISATIONS (PLATFORM & FLEET OPERATOR)
    // =========================================================================
    // 7MATA as Platform and Subcontracting Fleet Operator
    const [platformOrg] = await db.insert(schema.organisations).values({
      legalName: '7MATA Mobility Platform (Pty) Ltd',
      tradingName: '7MATA',
      registrationNumber: '2026/007000/07',
      organisationType: 'PLATFORM',
      status: 'ACTIVE',
    }).returning();
    expect(platformOrg).toBeDefined();

    const [platform] = await db.insert(schema.platforms).values({
      organisationId: platformOrg.id,
      name: '7MATA National E-Hailing Platform',
      nptrRegistered: true,
      nptrLicenceNumber: 'NPTR/ZA/EH/2026/0014',
      status: 'ACTIVE',
    }).returning();
    expect(platform.nptrRegistered).toBe(true);

    const [fleetOperatorOrg] = await db.insert(schema.organisations).values({
      legalName: 'Witbank Premier 7-Seater Fleets (Pty) Ltd',
      tradingName: 'Premier 7s',
      registrationNumber: '2026/099888/07',
      organisationType: 'FLEET_OPERATOR',
      status: 'ACTIVE',
    }).returning();
    expect(fleetOperatorOrg).toBeDefined();

    // Operating agreement between 7MATA Platform and Fleet Operator
    const [agreement] = await db.insert(schema.operatingAgreements).values({
      platformId: platform.id,
      contractorOrganisationId: fleetOperatorOrg.id,
      agreementType: 'FLEET_MANAGEMENT',
      status: 'ACTIVE',
      validFrom: new Date('2026-01-01'),
      terms: { commissionRate: 0.10, fleetShare: 0.10 },
    }).returning();
    expect(agreement.status).toBe('ACTIVE');

    // =========================================================================
    // STEP 2: CREATE FLEET
    // =========================================================================
    const [fleet] = await db.insert(schema.fleets).values({
      organisationId: fleetOperatorOrg.id,
      name: 'Highveld 7-Seater Shuttles',
      code: 'HV-7S',
      status: 'ACTIVE',
    }).returning();
    expect(fleet.code).toBe('HV-7S');

    // =========================================================================
    // STEP 3: REGISTER 7-SEATER VEHICLE
    // =========================================================================
    const [vehicle] = await db.insert(schema.vehicles).values({
      organisationId: fleetOperatorOrg.id,
      fleetId: fleet.id,
      registrationNumber: '7MATA-01-GP',
      vin: 'AFM37MATA2026001',
      make: 'Toyota',
      model: 'Rumion 1.5 TX 7-Seater',
      year: 2026,
      passengerCapacity: 7,
      category: 'SEVEN_SEATER',
      status: 'PENDING',
    }).returning();
    expect(vehicle.passengerCapacity).toBe(7);

    // =========================================================================
    // STEP 4: REGISTER DRIVER & IDENTITY ACTOR
    // =========================================================================
    const [driverActor] = await db.insert(schema.actors).values({
      actorType: 'PERSON',
      displayName: 'Sipho Nkosi',
      email: 'sipho.nkosi@7mata.co.za',
      phone: '+27821112233',
      nationalId: '8505125555088',
      status: 'ACTIVE',
    }).returning();

    const [driver] = await db.insert(schema.drivers).values({
      actorId: driverActor.id,
      organisationId: fleetOperatorOrg.id,
      fleetId: fleet.id,
      licenseNumber: 'ZA-DL-9842104',
      status: 'PENDING',
    }).returning();
    expect(driver.status).toBe('PENDING');

    // Register Member
    await db.insert(schema.organisationMembers).values({
      organisationId: fleetOperatorOrg.id,
      actorId: driverActor.id,
      role: 'DRIVER',
    });

    // =========================================================================
    // STEP 5: UPLOAD REQUIRED COMPLIANCE DOCUMENTS
    // =========================================================================
    // 1. Driver PDP
    const [docPdp] = await db.insert(schema.documents).values({
      ownerType: 'DRIVER',
      ownerId: driver.id,
      documentType: 'PDP',
      documentNumber: 'PDP-ZA-2026-99',
      issuedAt: new Date('2026-01-01'),
      expiresAt: new Date('2028-01-01'),
      verificationStatus: 'PENDING',
    }).returning();

    // 2. Vehicle Roadworthy Certificate
    const [docCrw] = await db.insert(schema.documents).values({
      ownerType: 'VEHICLE',
      ownerId: vehicle.id,
      documentType: 'ROADWORTHY',
      documentNumber: 'CRW-GP-88321',
      issuedAt: new Date('2026-02-01'),
      expiresAt: new Date('2027-02-01'),
      verificationStatus: 'PENDING',
    }).returning();

    // 3. Commercial Passenger Insurance
    const [docIns] = await db.insert(schema.documents).values({
      ownerType: 'VEHICLE',
      ownerId: vehicle.id,
      documentType: 'INSURANCE',
      documentNumber: 'INS-OUT-77821',
      issuedAt: new Date('2026-01-01'),
      expiresAt: new Date('2027-01-01'),
      verificationStatus: 'PENDING',
    }).returning();

    // 4. NPTR Operating Licence
    const [docOl] = await db.insert(schema.documents).values({
      ownerType: 'VEHICLE',
      ownerId: vehicle.id,
      documentType: 'OPERATING_LICENCE',
      documentNumber: 'OL-NPTR-2026-1188',
      issuedAt: new Date('2026-01-01'),
      expiresAt: new Date('2031-01-01'),
      verificationStatus: 'PENDING',
    }).returning();

    // =========================================================================
    // STEP 6: VERIFY DOCUMENTS & CREATE AUDIT TRAIL
    // =========================================================================
    const complianceOfficerId = driverActor.id; // authorized officer
    for (const d of [docPdp, docCrw, docIns, docOl]) {
      await db.update(schema.documents)
        .set({
          verificationStatus: 'VERIFIED',
          verifiedByActorId: complianceOfficerId,
          verifiedAt: new Date(),
        })
        .where(eq(schema.documents.id, d.id));

      await db.insert(schema.auditEvents).values({
        actorId: complianceOfficerId,
        eventType: 'DOCUMENT_VERIFIED',
        aggregateType: 'DOCUMENT',
        aggregateId: d.id,
        action: 'VERIFY_DOCUMENT',
        reason: 'Authorized compliance inspection satisfied',
        afterState: { verificationStatus: 'VERIFIED' },
      });
    }

    // =========================================================================
    // STEP 7: GRANT CAPABILITIES (SEVEN_SEATER & E_HAILING)
    // =========================================================================
    await db.insert(schema.capabilityGrants).values([
      {
        subjectType: 'VEHICLE',
        subjectId: vehicle.id,
        capability: 'SEVEN_SEATER',
        serviceAreaCode: 'ZA_GP_MP',
        status: 'ACTIVE',
      },
      {
        subjectType: 'VEHICLE',
        subjectId: vehicle.id,
        capability: 'E_HAILING',
        serviceAreaCode: 'ZA_GP_MP',
        status: 'ACTIVE',
      },
      {
        subjectType: 'DRIVER',
        subjectId: driver.id,
        capability: 'DRIVE_PASSENGERS',
        serviceAreaCode: 'ZA_GP_MP',
        status: 'ACTIVE',
      }
    ]);

    // Activate Vehicle & Driver
    await db.update(schema.vehicles).set({ status: 'ACTIVE' }).where(eq(schema.vehicles.id, vehicle.id));
    await db.update(schema.drivers).set({ status: 'ACTIVE' }).where(eq(schema.drivers.id, driver.id));

    // =========================================================================
    // STEP 8: RUN DETERMINISTIC COMPLIANCE ENGINE (CAN_OPERATE)
    // =========================================================================
    const allDocs = await db.select().from(schema.documents);
    const vehicleCapabilities = await db.select().from(schema.capabilityGrants)
      .where(eq(schema.capabilityGrants.subjectId, vehicle.id));

    const engine = new ComplianceEngine(ZA_NLTA_2026);
    const complianceResult = engine.canOperate({
      organisationId: fleetOperatorOrg.id,
      platformId: platform.id,
      driverId: driver.id,
      vehicleId: vehicle.id,
      serviceArea: 'ZA_GP_MP',
      serviceType: 'SEVEN_SEATER_E_HAILING',
      documents: allDocs.map(d => ({
        documentType: d.documentType,
        documentNumber: d.documentNumber,
        verificationStatus: d.verificationStatus,
        expiresAt: d.expiresAt,
      })),
      capabilities: vehicleCapabilities.map(c => c.capability),
      evidence: { agreementId: agreement.id, vehicleReg: vehicle.registrationNumber },
    });

    expect(complianceResult.allowed).toBe(true);
    expect(complianceResult.requirementsPassed).toContain('DRIVER_PDP_VALID');
    expect(complianceResult.requirementsPassed).toContain('VEHICLE_ROADWORTHY');
    expect(complianceResult.requirementsPassed).toContain('INSURANCE_VALID');
    expect(complianceResult.requirementsPassed).toContain('OPERATING_AUTHORITY_VALID');
    expect(complianceResult.requirementsPassed).toContain('SEVEN_SEATER_CAPABILITY_GRANTED');

    // Record formal compliance decision in database
    await db.insert(schema.complianceDecisions).values({
      subjectType: 'OPERATIONAL_PAIR',
      driverId: driver.id,
      vehicleId: vehicle.id,
      organisationId: fleetOperatorOrg.id,
      platformId: platform.id,
      serviceAreaCode: 'ZA_GP_MP',
      serviceType: 'SEVEN_SEATER_E_HAILING',
      regulatoryProfile: complianceResult.profile,
      ruleVersion: complianceResult.version,
      decision: complianceResult.allowed ? 'ALLOWED' : 'DENIED',
      reasons: complianceResult.reasons,
      requirementsPassed: complianceResult.requirementsPassed,
      evidence: complianceResult.evidence,
    });

    // =========================================================================
    // STEP 9: CREATE PASSENGER
    // =========================================================================
    const [passengerActor] = await db.insert(schema.actors).values({
      actorType: 'PERSON',
      displayName: 'Kagiso Molefe',
      email: 'kagiso.m@example.com',
      phone: '+27839998877',
      status: 'ACTIVE',
    }).returning();

    const [passenger] = await db.insert(schema.passengers).values({
      actorId: passengerActor.id,
      status: 'ACTIVE',
    }).returning();
    expect(passenger).toBeDefined();

    // =========================================================================
    // STEP 10: REQUEST TRIP (Witbank to Pretoria 7-seater shuttle)
    // =========================================================================
    const [trip] = await db.insert(schema.trips).values({
      passengerActorId: passengerActor.id,
      platformId: platform.id,
      serviceType: 'SEVEN_SEATER_E_HAILING',
      serviceAreaCode: 'ZA_GP_MP',
      pickup: { address: 'Witbank Highveld Mall, eMalahleni', lat: -25.875, lng: 29.213 },
      destination: { address: 'Menlyn Maine, Pretoria', lat: -25.787, lng: 28.277 },
      distanceKm: 110,
      durationMinutes: 75,
      state: 'REQUESTED',
    }).returning();
    expect(trip.state).toBe('REQUESTED');

    await db.insert(schema.tripEvents).values({
      tripId: trip.id,
      fromState: null,
      toState: 'REQUESTED',
      actorId: passengerActor.id,
    });

    // =========================================================================
    // STEP 11: CALCULATE DETERMINISTIC FARE QUOTE
    // =========================================================================
    // Base R150 + R12/km (110km = R1320) + R2/min (75min = R150) = R1620.00
    const fareEstimate = calculateFare({
      distanceKm: 110,
      durationMinutes: 75,
      baseMinor: 15000n, // R150.00
      perKmMinor: 1200n,  // R12.00/km
      perMinuteMinor: 200n, // R2.00/min
      minimumFareMinor: 50000n, // R500.00
      multiplier: 1.0,
    });
    expect(fareEstimate.totalMinor).toBe(162000n); // R1,620.00

    const [fare] = await db.insert(schema.fares).values({
      tripId: trip.id,
      currency: 'ZAR',
      baseMinor: fareEstimate.baseMinor,
      distanceMinor: fareEstimate.distanceMinor,
      timeMinor: fareEstimate.timeMinor,
      subtotalMinor: fareEstimate.subtotalMinor,
      multiplier: 100,
      totalMinor: fareEstimate.totalMinor,
      breakdown: {
        distanceKm: 110,
        durationMinutes: 75,
        currency: 'ZAR',
        rateCard: 'ZA_INTERCITY_7SEATER_2026',
      },
      pricingRuleVersion: '2026.1',
    }).returning();
    expect(fare.totalMinor).toBe(162000n);

    // =========================================================================
    // STEP 12: DISPATCH & TRANSITION STATE MACHINE
    // =========================================================================
    expect(canTransition(trip.state as any, 'MATCHING')).toBe(true);
    await db.update(schema.trips).set({ state: 'MATCHING' }).where(eq(schema.trips.id, trip.id));

    expect(canTransition('MATCHING', 'OFFERED')).toBe(true);
    await db.update(schema.trips).set({
      state: 'OFFERED',
      driverId: driver.id,
      vehicleId: vehicle.id,
    }).where(eq(schema.trips.id, trip.id));

    // =========================================================================
    // STEP 13: DRIVER ACCEPTS
    // =========================================================================
    expect(canTransition('OFFERED', 'ACCEPTED')).toBe(true);
    const acceptedAt = new Date();
    await db.update(schema.trips).set({
      state: 'ACCEPTED',
      acceptedAt,
    }).where(eq(schema.trips.id, trip.id));

    await db.insert(schema.tripEvents).values({
      tripId: trip.id,
      fromState: 'OFFERED',
      toState: 'ACCEPTED',
      actorId: driverActor.id,
    });

    // =========================================================================
    // STEP 14: START TRIP
    // =========================================================================
    const startedAt = new Date();
    await db.update(schema.trips).set({
      state: 'TRIP_STARTED',
      startedAt,
    }).where(eq(schema.trips.id, trip.id));

    await db.insert(schema.tripEvents).values({
      tripId: trip.id,
      fromState: 'ACCEPTED',
      toState: 'TRIP_STARTED',
      actorId: driverActor.id,
    });

    // =========================================================================
    // STEP 15: COMPLETE TRIP
    // =========================================================================
    const completedAt = new Date();
    await db.update(schema.trips).set({
      state: 'TRIP_COMPLETED',
      completedAt,
    }).where(eq(schema.trips.id, trip.id));

    await db.insert(schema.tripEvents).values({
      tripId: trip.id,
      fromState: 'TRIP_STARTED',
      toState: 'TRIP_COMPLETED',
      actorId: driverActor.id,
    });

    // =========================================================================
    // STEP 16: CAPTURE PASSENGER PAYMENT
    // =========================================================================
    const [payment] = await db.insert(schema.payments).values({
      tripId: trip.id,
      passengerActorId: passengerActor.id,
      amountMinor: fare.totalMinor,
      currency: 'ZAR',
      provider: 'MOCK',
      providerRef: 'PAY-7MATA-2026-X889',
      status: 'CAPTURED',
      capturedAt: new Date(),
    }).returning();
    expect(payment.status).toBe('CAPTURED');

    // =========================================================================
    // STEP 17: CALCULATE SETTLEMENT SPLIT
    // =========================================================================
    // Total R1620.00
    // Platform fee (10%): R162.00 (16200 minor)
    // Fleet owner share (10%): R162.00 (16200 minor)
    // Driver payout (80%): R1296.00 (129600 minor)
    const split = calculateSettlementSplit(fare.totalMinor, { platformRate: 0.10, fleetRate: 0.10 });
    expect(split.platformFeeMinor).toBe(16200n);
    expect(split.fleetOwnerShareMinor).toBe(16200n);
    expect(split.driverPayoutMinor).toBe(129600n);

    const [settlement] = await db.insert(schema.settlements).values({
      tripId: trip.id,
      platformFeeMinor: split.platformFeeMinor,
      fleetOwnerShareMinor: split.fleetOwnerShareMinor,
      driverPayoutMinor: split.driverPayoutMinor,
      totalGrossMinor: split.totalGrossMinor,
      currency: 'ZAR',
      status: 'SETTLED',
    }).returning();
    expect(settlement.status).toBe('SETTLED');

    // =========================================================================
    // STEP 18: DOUBLE-ENTRY GENERAL LEDGER POSTING
    // =========================================================================
    const [ledgerTx] = await db.insert(schema.ledgerTransactions).values({
      referenceType: 'TRIP_PAYMENT',
      referenceId: trip.id,
      description: 'Passenger fare payment and settlement distribution for Trip ' + trip.id,
    }).returning();

    const lines = createTripPaymentLedgerLines(split);
    assertBalanced(lines);

    for (const line of lines) {
      await db.insert(schema.ledgerEntries).values({
        transactionId: ledgerTx.id,
        accountCode: line.accountCode,
        direction: line.direction,
        amountMinor: line.amountMinor,
        currency: 'ZAR',
      });
    }

    const recordedEntries = await db.select().from(schema.ledgerEntries)
      .where(eq(schema.ledgerEntries.transactionId, ledgerTx.id));
    expect(recordedEntries.length).toBe(4);

    // Sum of debits must match sum of credits
    const debits = recordedEntries
      .filter(e => e.direction === 'DEBIT')
      .reduce((acc, e) => acc + e.amountMinor, 0n);
    const credits = recordedEntries
      .filter(e => e.direction === 'CREDIT')
      .reduce((acc, e) => acc + e.amountMinor, 0n);
    expect(debits).toBe(162000n);
    expect(credits).toBe(162000n);
    expect(debits).toBe(credits);

    // =========================================================================
    // STEP 19: IMMUTABLE QMS EVIDENCE & AUDIT TRAIL VERIFICATION
    // =========================================================================
    const evidence = createEvidence({
      evidenceId: 'EV-M1-E2E-' + Date.now(),
      actorId: driverActor.id,
      action: 'OPERATIONAL_TRIP_SETTLED',
      aggregateType: 'TRIP',
      aggregateId: trip.id,
      reason: '7-seater intercity trip completed and fully settled with balanced ledger',
      rule: 'ZA_NLTA_2026_SEVEN_SEATER_COMPLIANCE',
      documentRefs: [docPdp.id, docCrw.id, docIns.id, docOl.id],
      metadata: {
        fareMinor: fare.totalMinor.toString(),
        settlementId: settlement.id,
        ledgerTransactionId: ledgerTx.id,
      }
    });
    expect(evidence.timestamp).toBeDefined();

    await db.insert(schema.auditEvents).values({
      actorId: driverActor.id,
      eventType: 'TRIP_COMPLETED_AND_SETTLED',
      aggregateType: 'TRIP',
      aggregateId: trip.id,
      action: 'COMPLETE_SETTLEMENT',
      reason: evidence.reason,
      ruleEvaluated: evidence.rule,
      evidence: evidence as any,
    });

    const finalAuditTrail = await db.select().from(schema.auditEvents);
    expect(finalAuditTrail.length).toBeGreaterThanOrEqual(5); // 4 docs verified + 1 final settlement
    console.log('✅ 7MATA M1 Operational Core — All 19 Steps Passed Successfully!');
  });
});
