import { submitSponsorLead } from "./ranking.js?v=7";

const $ = id => document.getElementById(id);
const pl = (navigator.language || "").toLowerCase().startsWith("pl");

async function sendLead() {
  const company = $("sponsorCompany").value.trim();
  const email = $("sponsorEmail").value.trim();
  const message = $("sponsorMessage").value.trim();
  const status = $("sponsorStatus");
  const btn = $("sponsorSend");
  if (!company || !email) return;
  try {
    btn.disabled = true;
    status.textContent = pl ? "Wysyłanie…" : "Sending…";
    await submitSponsorLead({ company, email, message });
    status.textContent = pl ? "Dziękujemy — zapytanie zostało zapisane." : "Thank you — your inquiry was saved.";
    $("sponsorLead").reset();
  } catch (err) {
    console.error(err);
    status.textContent = pl ? "Nie udało się wysłać. Spróbuj ponownie." : "Could not send. Try again.";
  } finally {
    btn.disabled = false;
  }
}
$("sponsorLead").addEventListener("submit", e => { e.preventDefault(); sendLead(); });
