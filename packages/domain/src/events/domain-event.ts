export type DomainEvent = {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  actorId: string;
  occurredAt: string;
  payload: unknown;
  correlationId?: string;
};
