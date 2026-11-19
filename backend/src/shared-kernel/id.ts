declare const brand: unique symbol;

/** Opaque identifier: an `Id<'Lesson'>` cannot be passed where an `Id<'Kata'>` is expected. */
export type Id<Entity extends string> = string & { readonly [brand]: Entity };

export const toId = <Entity extends string>(value: string): Id<Entity> => value as Id<Entity>;
