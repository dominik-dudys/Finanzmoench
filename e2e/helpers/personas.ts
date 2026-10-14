import path from 'node:path';

export const PASSWORD = 'E2e-Passwort-123!';

export const personas = {
  anna: { email: 'anna@e2e.test', first: 'Anna', last: 'Admin' },
  max: { email: 'max@e2e.test', first: 'Max', last: 'Mitbewohner' },
  kosten: { email: 'kosten@e2e.test', first: 'Karla', last: 'Kosten' },
  einkommen: { email: 'einkommen@e2e.test', first: 'Erika', last: 'Einkommen' },
  ilse: { email: 'ilse@e2e.test', first: 'Ilse', last: 'Mitbewohnerin' },
  kategorie: { email: 'kategorie@e2e.test', first: 'Kai', last: 'Kategorie' },
  ben: { email: 'ben@e2e.test', first: 'Ben', last: 'Neu' },
  dora: { email: 'dora@e2e.test', first: 'Dora', last: 'Gastgeberin' },
  clara: { email: 'clara@e2e.test', first: 'Clara', last: 'Gast' },
  edith: { email: 'edith@e2e.test', first: 'Edith', last: 'Editor' },
  lena: { email: 'lena@e2e.test', first: 'Lena', last: 'Leaver' },
  leo: { email: 'leo@e2e.test', first: 'Leo', last: 'Bleiber' },
  dieter: { email: 'dieter@e2e.test', first: 'Dieter', last: 'Delete' },
  paula: { email: 'paula@e2e.test', first: 'Paula', last: 'Profil' },
  peter: { email: 'peter@e2e.test', first: 'Peter', last: 'Passwort' },
  vera: { email: 'vera@e2e.test', first: 'Vera', last: 'Vergessen' },
  tom: { email: 'tom@e2e.test', first: 'Tom', last: 'Totp' },
  logout: { email: 'logout@e2e.test', first: 'Lou', last: 'Logout' },
  jonas: { email: 'jonas@e2e.test', first: 'Jonas', last: 'Jeremy' },
  jule: { email: 'jule@e2e.test', first: 'Jule', last: 'Limit' },
  prem: { email: 'prem@e2e.test', first: 'Pia', last: 'Premium' },
  frei: { email: 'frei@e2e.test', first: 'Fritz', last: 'Free' },
  karl: { email: 'karl@e2e.test', first: 'Karl', last: 'Konsent' },
} as const;

export type PersonaKey = keyof typeof personas;

export const STORED_PERSONAS: PersonaKey[] = [
  'anna',
  'kosten',
  'einkommen',
  'kategorie',
  'ben',
  'dora',
  'clara',
  'edith',
  'lena',
  'dieter',
  'paula',
  'jonas',
  'jule',
  'prem',
  'frei',
  'karl',
];

export const HOUSEHOLD_IDS = {
  dashboard: '10000000-0000-0000-0000-000000000001',
  kosten: '10000000-0000-0000-0000-000000000002',
  einkommen: '10000000-0000-0000-0000-000000000003',
  kategorien: '10000000-0000-0000-0000-000000000004',
  beitritt: '10000000-0000-0000-0000-000000000005',
  bearbeiten: '10000000-0000-0000-0000-000000000006',
  verlassen: '10000000-0000-0000-0000-000000000007',
  aufloesen: '10000000-0000-0000-0000-000000000008',
} as const;

export const authFile = (key: PersonaKey) => path.resolve(__dirname, '..', '.auth', `${key}.json`);

export const NO_SESSION = { cookies: [], origins: [] };

export const unique = (prefix: string) => `${prefix} ${Date.now().toString(36)}`;
