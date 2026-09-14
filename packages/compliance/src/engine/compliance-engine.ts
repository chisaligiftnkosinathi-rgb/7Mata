export type OperatingSubject = {
  organisationId?: string;
  platformId?: string;
  driverId: string;
  vehicleId: string;
  serviceArea: string;
  serviceType: string;
  dateTime?: Date;
  documents: Array<{
    documentType: string;
    documentNumber?: string | null;
    verificationStatus: string;
    expiresAt?: Date | string | null;
  }>;
  capabilities: string[];
  evidence?: Record<string, unknown>;
};

export type ComplianceDecision = {
  allowed: boolean;
  profile: string;
  version: string;
  reasons: string[];
  requirementsPassed: string[];
  evidence: Record<string, unknown>;
  evaluatedAt: string;
};

export interface RegulatoryRule {
  code: string;
  description: string;
  evaluate(input: OperatingSubject): {
    passed: boolean;
    reason?: string;
  };
}

export class ComplianceEngine {
  constructor(
    private readonly profile: {
      name: string;
      version: string;
      rules: RegulatoryRule[];
    },
  ) {}

  canOperate(input: OperatingSubject): ComplianceDecision {
    const passedRequirements: string[] = [];
    const failures: string[] = [];

    for (const rule of this.profile.rules) {
      const res = rule.evaluate(input);
      if (res.passed) {
        passedRequirements.push(rule.code);
      } else {
        failures.push(`${rule.code}: ${res.reason ?? 'failed'}`);
      }
    }

    return {
      allowed: failures.length === 0,
      profile: this.profile.name,
      version: this.profile.version,
      reasons: failures,
      requirementsPassed: passedRequirements,
      evidence: input.evidence ?? {},
      evaluatedAt: new Date().toISOString(),
    };
  }
}
