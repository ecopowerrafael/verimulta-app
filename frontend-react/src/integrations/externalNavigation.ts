export interface ExternalNavigation {
  open(url: string): void;
}

export const webExternalNavigation: ExternalNavigation = {
  open(url) { window.open(url, '_blank', 'noopener,noreferrer'); }
};
