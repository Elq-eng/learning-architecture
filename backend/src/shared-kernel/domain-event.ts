/** Immutable fact that happened in an aggregate (AGENTS.md §3.4). */
export interface DomainEvent<Type extends string = string, Payload = unknown> {
  readonly id: string;
  readonly type: Type;
  readonly occurredAt: string;
  readonly schemaVersion: number;
  readonly payload: Readonly<Payload>;
}
