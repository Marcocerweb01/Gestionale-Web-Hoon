const baseUrl = (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");

if (!baseUrl || !process.env.CRON_SECRET) {
  console.error("Mancano RAILWAY_PUBLIC_DOMAIN/NEXT_PUBLIC_APP_URL e CRON_SECRET");
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/cron/report-chiusure`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
});
const body = await response.text();
console.log(response.status, body);
if (!response.ok) process.exit(1);
