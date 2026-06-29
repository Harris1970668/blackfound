const RESEND_API_URL = 'https://api.resend.com/emails'

// Update FROM to a blackfound.com address once the Resend domain is verified.
const FROM = 'BlackFound <onboarding@resend.dev>'

type NewApplicationArgs = {
  app_name: string
  builder_name: string
  contact_email: string
  requested_tier: string
  category: string
}

export async function sendNewApplicationEmail(args: NewApplicationArgs) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('RESEND_API_KEY not set — skipping notification email')
    return
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: 'pulsenetworkadmin@gmail.com',
      subject: `New partner application: ${args.app_name}`,
      html: `
        <p>A new partner application is waiting for your review.</p>
        <table cellpadding="6">
          <tr><td><strong>App</strong></td><td>${args.app_name}</td></tr>
          <tr><td><strong>Builder</strong></td><td>${args.builder_name}</td></tr>
          <tr><td><strong>Contact</strong></td><td>${args.contact_email}</td></tr>
          <tr><td><strong>Tier requested</strong></td><td>${args.requested_tier}</td></tr>
          <tr><td><strong>Category</strong></td><td>${args.category}</td></tr>
        </table>
        <p style="margin-top:16px">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin">Review in admin panel</a>
        </p>
      `,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('Resend error:', res.status, text)
  }
}

type ApprovalEmailArgs = {
  builder_name: string
  to_email: string
  app_name: string
  invite_url: string
}

export async function sendApprovalEmail(args: ApprovalEmailArgs) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('RESEND_API_KEY not set — skipping approval email')
    return
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: args.to_email,
      subject: `Your app "${args.app_name}" has been approved for BlackFound`,
      html: `
        <p>Hi ${args.builder_name},</p>
        <p>Your application for <strong>${args.app_name}</strong> has been approved.</p>
        <p>Use the link below to set up your account and manage your listing. This link expires in 7 days.</p>
        <p>
          <a href="${args.invite_url}" style="
            display:inline-block;padding:12px 24px;background:#2D8CFF;
            color:#fff;text-decoration:none;border-radius:6px;font-weight:600
          ">Set up your partner dashboard</a>
        </p>
        <p style="color:#8A97A8;font-size:13px">
          If you did not apply to BlackFound, you can ignore this email.
        </p>
      `,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('Resend error:', res.status, text)
  }
}

export async function sendDeclineEmail(args: { builder_name: string; to_email: string; app_name: string }) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('RESEND_API_KEY not set — skipping decline email')
    return
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: args.to_email,
      subject: `Your BlackFound application for "${args.app_name}"`,
      html: `
        <p>Hi ${args.builder_name},</p>
        <p>Thank you for applying to list <strong>${args.app_name}</strong> on BlackFound.</p>
        <p>After review, we are not moving forward with this application at this time.</p>
        <p>You are welcome to apply again in the future with an updated submission.</p>
      `,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('Resend error:', res.status, text)
  }
}
