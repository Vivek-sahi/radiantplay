// The sheet record the footer lists (from klimt-grid-prototype host/useHost.ts).
export interface Sheet {
  name: string;
  kind: 'answer' | 'input';
  state: '' | 'booting' | 'error';
}
