export const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8025';

type MailpitSummary = { ID: string; Created: string };

export async function deleteAllMails() {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' });
}

export async function deleteMails(ids: string[]) {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ IDs: ids }),
  });
}

export async function waitForCode(
  to: string,
  since: number,
  options: { exclude?: string[]; timeout?: number } = {},
): Promise<string> {
  const { exclude = [], timeout = 20_000 } = options;
  const deadline = Date.now() + timeout;
  const query = encodeURIComponent(`to:"${to}"`);

  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${query}&limit=10`);
    if (res.ok) {
      const { messages = [] } = (await res.json()) as { messages?: MailpitSummary[] };
      for (const summary of messages) {
        if (new Date(summary.Created).getTime() < since - 2_000) continue;
        const message = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${summary.ID}`)).json()) as {
          Text?: string;
          HTML?: string;
        };
        const code = message.Text?.match(/\b\d{6}\b/)?.[0] ?? message.HTML?.match(/>\s*(\d{6})\s*</)?.[1];
        if (code && !exclude.includes(code)) {
          await deleteMails([summary.ID]);
          return code;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Keine E-Mail mit 6-stelligem Code an ${to} gefunden.`);
}
