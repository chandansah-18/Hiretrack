export interface RowSyncPlan<T extends { id: string }> {
  upserts: T[];
  deletes: string[];
}

function rowSignature(row: unknown) {
  return JSON.stringify(row);
}

export function computeRowSyncPlan<T extends { id: string }>(
  previousRows: T[] | undefined,
  nextRows: T[]
): RowSyncPlan<T> {
  const prev = previousRows ?? [];
  const prevById = new Map(prev.map((row) => [row.id, row]));
  const nextById = new Map(nextRows.map((row) => [row.id, row]));

  const upserts = nextRows.filter((row) => {
    const previous = prevById.get(row.id);
    return !previous || rowSignature(previous) !== rowSignature(row);
  });

  const deletes = prev.filter((row) => !nextById.has(row.id)).map((row) => row.id);

  return { upserts, deletes };
}
