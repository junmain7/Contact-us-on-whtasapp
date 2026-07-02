# Slot Bot — Setup (Mobile-only, Vercel)

## 1. GitHub pe push karo
- Naya repo banao GitHub pe (empty)
- In sab files ko upload karo (GitHub app / web se "Add file" > "Upload files")
- Folder structure exactly aise honi chahiye:
  ```
  app/layout.js
  app/page.js
  app/api/webhook/route.js
  package.json
  ```

## 2. Vercel pe import karo
- vercel.com pe GitHub se login karo
- "Add New Project" → apna repo select karo → Deploy

## 3. Environment Variables (Vercel Project Settings → Environment Variables)
| Key | Value |
|---|---|
| `WEBHOOK_VERIFY_TOKEN` | koi bhi random string tum khud banao, e.g. `my_secret_123` |
| `WHATSAPP_TOKEN` | Meta se mila access token (permanent token banana better hoga baad me) |
| `PHONE_NUMBER_ID` | tumhara Phone Number ID (Meta dashboard se) |
| `ADMIN_NUMBER` | tumhara WhatsApp number, format: `91XXXXXXXXXX` (no +, no spaces) |

Env vars add karne ke baad "Redeploy" zaroor karo (Deployments tab → ... → Redeploy).

## 4. Meta Webhook Setup
- Meta App Dashboard → WhatsApp → Configuration
- Callback URL: `https://your-project.vercel.app/api/webhook`
- Verify Token: wahi jo tumne `WEBHOOK_VERIFY_TOKEN` mein daala
- "Verify and Save" dabao
- "Manage" pe jaake **messages** field ko subscribe karo (zaroori hai, warna incoming messages nahi aayenge)

## 5. Important: Admin notification ke liye
WhatsApp Cloud API rule: bina template ke koi bhi number ko free-text message tabhi bhej sakte ho jab wo number pehle tumhe (bot ko) message kar chuka ho — "24-hour window" khulta hai.

Isliye pehli baar setup ke baad, **apne (ADMIN_NUMBER) se bot ke test number ko ek baar "hi" message bhejo**. Usse window khul jaayega aur bot tumhe notification bhej payega.

## 6. Test karo
Kisi aur number se bot ke test number pe bhejo:
```
slot Phoenix Squad
```
- Buyer ko turant confirmation aana chahiye
- Admin number pe booking detail aani chahiye (agar window khula hai)

## Notes
- Test number sirf "verified recipient" numbers ko hi message bhej sakta hai jab tak Step 2 (production setup) complete na ho
- Access token 24 ghante mein expire hoga — permanent System User token banana padega production ke liye
