# CivicReach city user guide

CivicReach is free and open-source software under the MIT License (see `LICENSE`). Cities may use, modify, self-host, and share it, keeping the copyright notice.

## 1. Resident requests

Residents do not need accounts.

1. Open the city-specific URL: `https://YOUR_HOST/c/YOUR_CITY_SLUG`.
2. Choose **I need help staying housed** or **Request a compassionate wellness check**.
3. Complete the form and save the six-character tracking code.
   Use **Check status** (`/c/YOUR_CITY_SLUG/status`) with the code to see progress; it never shows request details. Pages can be switched to Spanish.
4. For immediate danger, call 911. For crisis support in the United States, call or text 988.

Wellness requests route to civilian outreach, never police. The response countdown uses the city's configured target and is a target, not a guaranteed response time. A city must publish its own actual coverage and escalation policy before launch.

## 2. Supervisor setup

1. Open `/city-signup` on the hosted app.
2. Enter the municipality, region, supervisor details, and starting diversion fund.
3. Use the confirmation link shown after signup (or the email confirmation when configured), then sign in at `/auth`.
4. Open **Console → Team**.
5. Create an invitation for each staff member. Choose outreach worker or diversion supervisor and assign a team/zone.
6. Send the invitation link privately. The recipient opens it, sets a password of at least 12 characters, and enters the console.

There is intentionally no open staff-registration form. Do not share supervisor passwords or reuse the demo accounts for a live city.

## 3. Daily operations

### Dispatch

- Open requests are sorted by urgency and, where available, distance.
- Use **Claim & En Route** to assign a wellness check.
- Use **Resolve** only after the local response protocol is complete.
- Directions open the device’s maps provider.
- The ride window shows the city's booking link, steps, and its own listed providers. Rides are not booked automatically.

### Field encounters and offline work

- Open the console while online before entering a low-signal area.
- Select services and log the encounter. GPS is captured when the browser grants permission.
- Without signal, entries remain in local browser storage and show **Queued for Sync**.
- When signal returns, sync starts automatically or use **Sync Now**.
- Entries are tagged with the active city and only that city’s entries sync under the current account.
- Use city-managed, locked devices. Browser data remains on the device until synchronized and cleared from the queue.
- This release does not cache every application page for a cold start with no connection.

### Flexible diversion grants

- Defaults: requests up to $1,000; outreach workers approve up to $250; $251–$1,000 needs a supervisor. Each city can change these in Settings.
- Staff see the city's payment method steps; payments are not sent automatically.
- Supervisors can directly approve amounts within the maximum.
- Approved amounts are deducted from the active fund belonging to that city.
- Always verify the payee and payment method through city procurement and financial controls.

### Document vault

- Obtain and record informed consent before every upload.
- Use a client alias, not a full legal name.
- Document categories default to ID, birth certificate, DD-214, and disability verification; cities can edit them.
- Images and PDFs are accepted.
- Viewing links expire after 60 seconds.
- Expired documents and documents expiring within 60 days are highlighted.

## 4. Go-live checklist

- Assign dispatch ownership, operating hours, after-hours coverage, and emergency escalation.
- Replace the sample service-hub list with real local destinations.
- Connect email (Resend) and text (Twilio) in **Console → Settings → Integrations** and send a test of each.
- Test housing and wellness submissions from unmanaged resident devices.
- Test every staff role and confirm staff cannot open another city’s data.
- Test offline encounter capture and reconciliation on city-managed devices.
- Adopt local consent, retention, public-records, privacy, security, and accessibility procedures.
- Configure backups, monitoring, email delivery, and incident response.
- Publish accurate response targets and emergency instructions.
- Run a limited pilot before publishing the city link widely.

## 5. Self-hosting

See [SELF_HOSTING.md](./SELF_HOSTING.md) for environment, schema, storage, email, deployment, and verification steps.

## 6. City settings and go-live

Supervisors open **Console → Settings** to configure the city: public contact details, outreach hours and after-hours message, emergency and crisis numbers, escalation rules, response targets, intake options (turn on/off or add your own), grant limits and payment methods, service hubs, zones, alert contacts, consent wording, and retention. The **Launch readiness** checklist tracks what is left. The resident link shows a pilot notice until a supervisor presses **Go live**. Every settings change and grant decision is recorded in the audit log.


## 7. Integrations

In **Console → Settings → Integrations**, supervisors connect the city's own accounts with step-by-step instructions: Resend for alert emails, Twilio for alert texts, plus ride (Uber Health, Lyft, paratransit), payment (Bill.com, prepaid cards, manual), and any local partners. Pasted keys cannot be viewed again, only replaced or removed. Staff invitations are still shared as links, and residents are not texted about status changes.

## 8. Reports, export, and retention

**Console → Reports** shows program totals, CSV downloads (clinical notes and contact details are excluded), the audit log, and **Run cleanup now**. Records older than the city's retention period are also removed nightly for live cities; anything linked to a grant is kept.
