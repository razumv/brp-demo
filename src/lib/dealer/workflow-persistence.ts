export type DealerWorkflowStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export class DealerLocalPersistenceError extends Error {
  constructor() {
    super("Не вдалося зберегти зміни на пристрої.");
    this.name = "DealerLocalPersistenceError";
  }
}

export function readDealerWorkflowPayload(
  storage: DealerWorkflowStorage,
  key: string,
): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function removeDealerWorkflowPayload(
  storage: DealerWorkflowStorage,
  key: string,
) {
  try {
    storage.removeItem(key);
  } catch {
    // Storage can be unavailable while the dealer session remains viewable.
  }
}

export function writeDealerWorkflowPayload(
  storage: DealerWorkflowStorage,
  key: string,
  state: unknown,
) {
  try {
    storage.setItem(key, JSON.stringify(state));
  } catch {
    throw new DealerLocalPersistenceError();
  }
}
