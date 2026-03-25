# Supabase Auth Configuration Guide

## 1. Disable Email Confirmations

Go to your Supabase project:

**Authentication → Providers → Email**

| Setting | Value |
|---|---|
| Enable Email Provider | ✅ ON |
| Confirm email | ❌ OFF |

> "Confirm email" must be **OFF** so users can log in immediately after signup with no verification step.

---

## 2. Set the Site URL

**Authentication → URL Configuration**

| Field | Value |
|---|---|
| Site URL | `https://yourdomain.com` (or `http://localhost:5173` for local dev) |
| Redirect URLs | `https://yourdomain.com/**` and `http://localhost:5173/**` |

---

## 3. Auth Flow Summary

| Action | Behaviour |
|---|---|
| Signup | Creates account, auto-logs in, redirects to `/dashboard` |
| Login | Authenticates with email + password, redirects to `/dashboard` |
| Suspended account | Blocked at `signIn()` with error message |
| Admin check | Runs on every session via `user_roles` table |
| Realtime | Profile + dashboard subscriptions remain active |

---

## 4. SMTP (Production Email)

If you need transactional emails (password reset, etc.) configure a custom SMTP provider:

**Project Settings → Auth → SMTP Settings**

Recommended: **Resend**, **SendGrid**, **Mailgun**

Example (Resend):
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: your Resend API key
- Sender: `noreply@yourdomain.com`

---

## 5. Database Reset (Dev Only)

See: `supabase/reset_dev_db.sql`

Run in **Supabase → SQL Editor**.
Deletes in FK-safe order: `transactions → investments → deposits → withdrawals → profiles → auth.users`
