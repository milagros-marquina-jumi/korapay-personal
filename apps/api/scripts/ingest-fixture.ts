import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const API = process.env.API_URL ?? '';
const TOKEN = process.env.KORAPAY_INGESTION_TOKEN;

const fixtures: Record<string, string> = {
  bcp: 'bcp-purchase-pen.json',
  'bcp-usd': 'bcp-purchase-usd.json',
  interbank: 'interbank-online.json',
  bbva: 'bbva-purchase.json',
  declined: 'declined.json',
  refund: 'refund.json',
};

async function main() {
  const key = process.argv[2];
  if (!key || !fixtures[key]) {
    console.error(`Uso: pnpm email:ingest:fixture <${Object.keys(fixtures).join('|')}>`);
    process.exit(1);
  }
  if (!TOKEN) {
    console.error('Falta KORAPAY_INGESTION_TOKEN. Crea una fuente de correo y exporta su token.');
    process.exit(1);
  }
  const path = join(__dirname, '..', 'fixtures', 'bank-emails', fixtures[key]);
  const body = readFileSync(path, 'utf-8');
  const res = await fetch(`${API}/email-ingestion/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body,
  });
  console.log(`HTTP ${res.status}`);
  console.log(await res.text());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
