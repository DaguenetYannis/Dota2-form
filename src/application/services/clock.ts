export type Clock = () => string;

export const isoClock: Clock = () => new Date().toISOString();
