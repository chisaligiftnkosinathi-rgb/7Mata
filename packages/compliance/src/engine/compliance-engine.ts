export type ComplianceInput = {
  vehicleId: string;
  driverId: string;
  serviceArea: string;
  serviceType: string;
  evidence: Record<string, unknown>;
};

export type ComplianceDecision = {
  allowed: boolean;
  profile: string;
  version: string;
  reasons: string[];
  evidence: Record<string, unknown>;
};

export interface RegulatoryRule {
  code: string;
  description: string;
  evaluate(input: ComplianceInput): {
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

  canOperate(input: ComplianceInput): ComplianceDecision {
    const results = this.profile.rules.map(rule => ({
      rule,
      result: rule.evaluate(input),
    }));

    const failures = results
      .filter(x => !x.result.passed)
      .map(x => `${x.rule.code}: ${x.result.reason ?? 'failed'}`);

    return {
      allowed: failures.length === 0,
      profile: this.profile.name,
      version: this.profile.version,
      reasons: failures,
      evidence: input.evidence,
    };
  }
}
