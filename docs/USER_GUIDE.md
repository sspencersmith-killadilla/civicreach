# CivicReach city user guide

## 1. Resident requests

Residents do not need accounts.

1. Open the city-specific URL: `https://YOUR_HOST/c/YOUR_CITY_SLUG`.
2. Choose **I need help staying housed** or **Request a compassionate wellness check**.
3. Complete the form and save the six-character tracking code.
4. For immediate danger, call 911. For crisis support in the United States, call or text 988.

Wellness requests route to civilian outreach, never police. The 45-minute timer is a target configured in the interface, not a guaranteed response time. A city must publish its own actual coverage and escalation policy before launch.

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
- A ride dispatch record does not contact a transport provider until a real provider integration is configured.

### Field encounters and offline work

- Open the console while online before entering a low-signal area.
- Select services and log the encounter. GPS is captured when the browser grants permission.
- Without signal, entries remain in local browser storage and show **Queued for Sync**.
- When signal returns, sync starts automatically or use **Sync Now**.
- Entries are tagged with the active city and only that city’s entries sync under the current account.
- Use city-managed, locked devices. Browser data remains on the device until synchronized and cleared from the queue.
- This release does not cache every application page for a cold start with no connection.

### Flexible diversion grants

- Requests accept $50–$1,000.
- Outreach workers can approve grants up to $250.
- Grants from $251–$1,000 require a diversion supervisor.
- Supervisors can directly approve amounts within the maximum.
- Approved amounts are deducted from the active fund belonging to that city.
- Always verify the payee and payment method through city procurement and financial controls.

### Document vault

- Obtain and record informed consent before every upload.
- Use a client alias, not a full legal name.
- Supported document categories are ID, birth certificate, DD-214, and disability verification.
- Images and PDFs are accepted.
- Viewing links expire after 60 seconds.
- Expired documents and documents expiring within 60 days are highlighted.

## 4. Go-live checklist

- Assign dispatch ownership, operating hours, after-hours coverage, and emergency escalation.
- Replace the sample service-hub list with real local destinations.
- Configure actual transport and notification integrations; the base app only records those actions.
- Test housing and wellness submissions from unmanaged resident devices.
- Test every staff role and confirm staff cannot open another city’s data.
- Test offline encounter capture and reconciliation on city-managed devices.
- Adopt local consent, retention, public-records, privacy, security, and accessibility procedures.
- Configure backups, monitoring, email delivery, and incident response.
- Publish accurate response targets and emergency instructions.
- Run a limited pilot before publishing the city link widely.

## 5. Self-hosting

See [SELF_HOSTING.md](./SELF_HOSTING.md) for environment, schema, storage, email, deployment, and verification steps.
