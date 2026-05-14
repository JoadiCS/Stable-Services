# Customer Welcome Email Setup

## Overview

This document describes how to add a welcome/confirmation email that gets sent to customers when they submit any form on stablesvc.com (paid booking, estimate request, commercial inquiry, or repair request).

**Current state**: The owner (crawford@stablesvc.com and sales@stablesvc.com) receives notification emails via Zapier webhook + FormSubmit backup. The customer receives **nothing yet**.

**Goal**: Customer receives a warm welcome email confirming their request was received, with next steps and contact information.

---

## Phase 1: Zapier Quick Win (Recommended for immediate deployment)

### Time to complete: 5 minutes
### Cost: $0 (included in free Zapier tier)
### Pros:
- Zero setup friction
- No DNS configuration required
- No code changes to the website
- Works with your existing Zap

### Cons:
- Email will be sent from `zapier@zapiermail.com` (not `welcome@stablesvc.com`)
- Reply-To can be set to `welcome@stablesvc.com` so customer replies route correctly
- Less professional sender identity than Phase 2

### Step-by-step instructions:

1. **Log in to Zapier** at https://zapier.com/app/zaps

2. **Open your existing Zap** that catches the webhook from stablesvc.com
   - It should be named something like "Catch Hook → Filter → Email by Zapier"
   - Current URL: https://hooks.zapier.com/hooks/catch/27437506/4yk5gd0/

3. **Click "+ Add Step" after the existing Email by Zapier step**

4. **Choose "Email by Zapier"** as the app

5. **Choose "Send Outbound Email"** as the action

6. **Configure the action** with these exact settings:

   **To:**
   - Click "Insert Data" and select `Email` from the webhook trigger data
   - This ensures the customer's email address is used

   **From Name:**
   ```
   Stable Services
   ```

   **Reply To:**
   ```
   welcome@stablesvc.com
   ```

   **Subject:**
   ```
   Welcome to Stable Services — your request was received
   ```

   **Body:** (copy this template exactly, then customize if desired)
   ```
   Hi {{1. First Name}},

   Thank you for choosing Stable Services! We've received your request and we're excited to help you with your {{1. Service Label}} needs.

   Here's what we received:
   • Service: {{1. Service Label}}
   • Plan: {{1. Plan Label}}
   • Preferred Date: {{1. Preferred Date}}
   • Property: {{1. Full Address}}

   What happens next?
   We'll reach out within a few hours by phone, text, or email (whichever you prefer) to confirm your appointment details and answer any questions you have.

   In the meantime, if you have any immediate questions, feel free to reach us:
   📞 Phone: (480) 290-3596
   📧 Email: hello@stablesvc.com

   We're looking forward to serving you!

   Best regards,
   The Stable Services Team
   Scottsdale's trusted pool, lawn, and property care professionals

   ---
   Stable Services LLC
   (480) 290-3596
   hello@stablesvc.com
   https://stablesvc.com
   ```

   **Note on template fields:**
   - Zapier will show available fields from the webhook trigger in a dropdown when you click "Insert Data"
   - The fields above (First Name, Service Label, Plan Label, etc.) should all be available
   - Adjust the template as needed for commercial/repair requests (see note below)

7. **Test the Zap**
   - Click "Test & Continue" to send a test email to yourself
   - Verify the email arrives and formatting looks good

8. **Turn on the Zap**
   - Click "Publish" at the top right

9. **Optional: Add conditional logic for different email templates**

   If you want different welcome email content for commercial inquiries vs. paid bookings vs. repair requests:

   a. Before adding the Email step, add a "Filter by Zapier" step
   b. Set condition: `Stage` equals `paid` (or `commercial`, `repair`, etc.)
   c. Add a separate Email by Zapier step for each stage type
   d. Customize the email body for each

   Example:
   - If `Stage = paid` → send "Thank you for your booking!" email
   - If `Stage = estimate` → send "We'll prepare your free estimate" email
   - If `Stage = commercial` → send "Thanks for your commercial inquiry" email
   - If `Stage = repair` → send "We'll prioritize your repair request" email

### Testing Phase 1:

After publishing the Zap:

1. Go to https://stablesvc.com
2. Submit a test booking (use a real email you can check)
3. Verify you receive:
   - The owner notification email at crawford@/sales@ (existing flow)
   - The customer welcome email at the address you submitted (new flow)

---

## Phase 2: Professional Sender Identity via Resend (Future upgrade)

### Time to complete: 30-45 minutes
### Cost: $0/month for up to 3,000 emails (current volume: ~10-20/month)
### Pros:
- Email sent genuinely **from** `welcome@stablesvc.com`
- Professional deliverability (better inbox placement, less likely to hit spam)
- Full HTML email templates (richer formatting, branding, images)
- Email analytics (open rates, click rates)

### Cons:
- Requires DNS configuration (adding SPF/DKIM records to stablesvc.com)
- Requires writing a small server-side function (can't call Resend API from client-side JavaScript)
- More moving parts to maintain

### When to implement Phase 2:

Upgrade from Phase 1 to Phase 2 when:
- You're sending 50+ welcome emails per month (indicates growth)
- You want to add HTML branding (logo, colors, etc.) to the email
- You need analytics on email open/click rates
- You want genuine `welcome@stablesvc.com` sender identity for professionalism

### Implementation overview (DO NOT start this until ready to commit):

1. **Sign up for Resend**
   - Go to https://resend.com/signup
   - Create a free account (no credit card required)

2. **Verify your domain (stablesvc.com)**
   - In the Resend dashboard, go to "Domains" → "Add Domain"
   - Enter `stablesvc.com`
   - Resend will give you 3 DNS records to add:
     - SPF record (TXT)
     - DKIM record (TXT)
     - DMARC record (TXT, optional but recommended)
   - Add these records to your DNS provider (likely Cloudflare if that's where stablesvc.com is hosted)
   - Wait 10-30 minutes for DNS propagation
   - Click "Verify" in Resend dashboard

3. **Create an API key**
   - In Resend dashboard, go to "API Keys" → "Create API Key"
   - Give it a name like "stablesvc-welcome-emails"
   - Copy the API key (starts with `re_...`) and save it securely

4. **Create a server-side endpoint to call Resend**

   **Option A: PHP endpoint on Plesk (simplest)**

   Plesk natively supports PHP. Create a file at:
   ```
   /httpdocs/api/send-welcome-email.php
   ```

   PHP code:
   ```php
   <?php
   header('Content-Type: application/json');
   header('Access-Control-Allow-Origin: https://stablesvc.com');
   header('Access-Control-Allow-Methods: POST');

   if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
       http_response_code(405);
       echo json_encode(['error' => 'Method not allowed']);
       exit;
   }

   $input = json_decode(file_get_contents('php://input'), true);

   $to = $input['to'] ?? '';
   $firstName = $input['firstName'] ?? '';
   $service = $input['serviceLabel'] ?? '';
   $plan = $input['planLabel'] ?? '';
   $date = $input['preferredDate'] ?? '';
   $address = $input['fullAddress'] ?? '';

   if (empty($to)) {
       http_response_code(400);
       echo json_encode(['error' => 'Email address required']);
       exit;
   }

   $resendApiKey = 're_YOUR_API_KEY_HERE'; // Replace with actual key

   $emailBody = "Hi $firstName,\n\n";
   $emailBody .= "Thank you for choosing Stable Services! We've received your request and we're excited to help you with your $service needs.\n\n";
   $emailBody .= "Here's what we received:\n";
   $emailBody .= "• Service: $service\n";
   $emailBody .= "• Plan: $plan\n";
   $emailBody .= "• Preferred Date: $date\n";
   $emailBody .= "• Property: $address\n\n";
   $emailBody .= "What happens next?\n";
   $emailBody .= "We'll reach out within a few hours by phone, text, or email (whichever you prefer) to confirm your appointment details and answer any questions you have.\n\n";
   $emailBody .= "In the meantime, if you have any immediate questions, feel free to reach us:\n";
   $emailBody .= "📞 Phone: (480) 290-3596\n";
   $emailBody .= "📧 Email: hello@stablesvc.com\n\n";
   $emailBody .= "We're looking forward to serving you!\n\n";
   $emailBody .= "Best regards,\n";
   $emailBody .= "The Stable Services Team\n";
   $emailBody .= "Scottsdale's trusted pool, lawn, and property care professionals\n\n";
   $emailBody .= "---\n";
   $emailBody .= "Stable Services LLC\n";
   $emailBody .= "(480) 290-3596\n";
   $emailBody .= "hello@stablesvc.com\n";
   $emailBody .= "https://stablesvc.com\n";

   $data = [
       'from' => 'Stable Services <welcome@stablesvc.com>',
       'to' => [$to],
       'subject' => 'Welcome to Stable Services — your request was received',
       'text' => $emailBody
   ];

   $ch = curl_init('https://api.resend.com/emails');
   curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
   curl_setopt($ch, CURLOPT_POST, true);
   curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
   curl_setopt($ch, CURLOPT_HTTPHEADER, [
       'Content-Type: application/json',
       "Authorization: Bearer $resendApiKey"
   ]);

   $response = curl_exec($ch);
   $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
   curl_close($ch);

   http_response_code($httpCode);
   echo $response;
   ?>
   ```

   **Option B: Serverless function (Vercel/Netlify)**

   If you want to use a modern serverless platform instead of PHP:
   - Deploy a tiny Next.js or vanilla Node.js function to Vercel
   - Function URL: `https://your-project.vercel.app/api/send-welcome-email`
   - Function code calls Resend API server-side
   - Website POSTs to this URL

5. **Add client-side TypeScript to call the endpoint**

   Create `src/lib/welcomeEmail.ts`:

   ```typescript
   /**
    * Sends a welcome email to the customer via Resend.
    * Calls a server-side endpoint to protect the Resend API key.
    */

   export interface WelcomeEmailPayload {
     to: string;
     firstName: string;
     serviceLabel: string;
     planLabel: string;
     preferredDate: string;
     fullAddress: string;
   }

   export async function sendWelcomeEmail(
     payload: WelcomeEmailPayload,
   ): Promise<void> {
     // Change this URL to match your server-side endpoint
     const endpoint = 'https://stablesvc.com/api/send-welcome-email.php';
     // OR if using Vercel: const endpoint = 'https://your-project.vercel.app/api/send-welcome-email';

     try {
       await fetch(endpoint, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload),
         mode: 'cors',
       });
     } catch (err) {
       // eslint-disable-next-line no-console
       console.error('[WelcomeEmail] Failed to send welcome email', err);
       // Never block user flow on email failure
     }
   }
   ```

6. **Wire up the calls in the 4 submission points**

   In `src/components/funnel/FunnelModal.tsx`, `CommercialPanel.tsx`, `RepairModal.tsx`, and `ThankYou.tsx`:

   Add import:
   ```typescript
   import { sendWelcomeEmail } from '@/lib/welcomeEmail';
   ```

   Add call alongside `sendToZapier()` and `sendBackupEmail()`:
   ```typescript
   void sendWelcomeEmail({
     to: payload.email,
     firstName: payload.firstName,
     serviceLabel: payload.serviceLabel,
     planLabel: payload.planLabel,
     preferredDate: payload.preferredDate,
     fullAddress: payload.fullAddress,
   });
   ```

7. **Test end-to-end**
   - Rebuild the site (`npm run build`)
   - Deploy to Plesk
   - Submit a test booking with a real email address you can check
   - Verify the welcome email arrives from `welcome@stablesvc.com`

8. **Optional: Upgrade to HTML email template**

   Once the basic flow works, enhance the PHP endpoint to send HTML instead of plain text:

   ```php
   $emailHtml = "
   <!DOCTYPE html>
   <html>
   <head><style>
     body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
     .header { background: linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%); padding: 40px 20px; text-align: center; color: white; }
     .content { padding: 30px 20px; max-width: 600px; margin: 0 auto; }
     .summary { background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; }
     .summary li { list-style: none; padding: 8px 0; }
     .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
   </style></head>
   <body>
     <div class='header'>
       <h1>Welcome to Stable Services</h1>
     </div>
     <div class='content'>
       <p>Hi $firstName,</p>
       <p>Thank you for choosing Stable Services! We've received your request and we're excited to help you with your <strong>$service</strong> needs.</p>
       <div class='summary'>
         <h3>Request Summary</h3>
         <ul>
           <li><strong>Service:</strong> $service</li>
           <li><strong>Plan:</strong> $plan</li>
           <li><strong>Preferred Date:</strong> $date</li>
           <li><strong>Property:</strong> $address</li>
         </ul>
       </div>
       <h3>What happens next?</h3>
       <p>We'll reach out within a few hours by phone, text, or email (whichever you prefer) to confirm your appointment details and answer any questions you have.</p>
       <p>In the meantime, if you have any immediate questions, feel free to reach us:</p>
       <p>📞 Phone: <a href='tel:+14802903596'>(480) 290-3596</a><br>
       📧 Email: <a href='mailto:hello@stablesvc.com'>hello@stablesvc.com</a></p>
       <p>We're looking forward to serving you!</p>
       <p>Best regards,<br>
       <strong>The Stable Services Team</strong><br>
       Scottsdale's trusted pool, lawn, and property care professionals</p>
     </div>
     <div class='footer'>
       Stable Services LLC<br>
       (480) 290-3596 • hello@stablesvc.com • <a href='https://stablesvc.com'>stablesvc.com</a>
     </div>
   </body>
   </html>
   ";

   $data = [
       'from' => 'Stable Services <welcome@stablesvc.com>',
       'to' => [$to],
       'subject' => 'Welcome to Stable Services — your request was received',
       'html' => $emailHtml
   ];
   ```

---

## Recommendation

**Start with Phase 1 immediately.** It takes 5 minutes and gives customers instant confirmation emails with zero setup friction.

**Upgrade to Phase 2 when:**
- You're sending 50+ emails/month (indicates business growth)
- You want professional branding in emails
- You need email analytics
- You have 30-45 minutes to invest in DNS setup and server-side code

---

## Questions or Issues?

If you encounter any issues:
- Phase 1: Check that the webhook is receiving the `email` field correctly (test in Zapier's "Test Trigger" tool)
- Phase 2: Check DNS propagation at https://dnschecker.org/ and verify the Resend API key is correct
- Email not delivering: Check spam folder first
- FormSubmit activation: The first email sent to sales@stablesvc.com via FormSubmit requires a one-time confirmation click

Contact Claude Code for assistance or open an issue at https://github.com/anthropics/claude-code/issues.
