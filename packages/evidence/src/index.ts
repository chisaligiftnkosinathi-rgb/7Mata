export type EvidenceRecord = {
  evidenceId: string;
  actorId: string;
  action: string;
  aggregateType: string;
  aggregateId: string;
  reason?: string;
  rule?: string;
  documentRefs?: string[];
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export function createEvidence(
  record: Omit<EvidenceRecord, 'timestamp'>,
): EvidenceRecord {
  return {
    ...record,
    timestamp: new Date().toISOString(),
  };
}
