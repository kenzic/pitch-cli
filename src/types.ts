export type GenericFieldType = Record<string, unknown>;

export interface Config {
    hiddenFields?: string[];
    loadingMessage?: string;
    successMessage?: string;
}
