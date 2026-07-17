export type IdGenerator = () => string;

export const createId: IdGenerator = () => crypto.randomUUID();
