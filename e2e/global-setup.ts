import fs from 'node:fs';
import path from 'node:path';
import { MAILPIT_URL, deleteAllMails } from './helpers/mailpit';

export default async function globalSetup() {
  try {
    const res = await fetch(`${MAILPIT_URL}/api/v1/info`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (error) {
    throw new Error(
      `Mailpit ist unter ${MAILPIT_URL} nicht erreichbar. Starte es mit "npm run mail:up". (${String(error)})`,
    );
  }
  await deleteAllMails();
  fs.mkdirSync(path.resolve(__dirname, '.auth'), { recursive: true }); // delete all old mails so no old mail can be read
}
