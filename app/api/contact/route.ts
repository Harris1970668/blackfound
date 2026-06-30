export async function POST(request: Request) {
  const body = await request.json() as { name?: string; email?: string; message?: string }

  const name    = body.name?.trim()
  const email   = body.email?.trim()
  const message = body.message?.trim()

  if (!name || !email || !message) {
    return Response.json({ error: 'Name, email, and message are all required.' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.error('RESEND_API_KEY is not set')
    return Response.json({ error: 'Mail not configured. Please try again later.' }, { status: 500 })
  }

  const htmlMessage = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'BlackFound <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL ?? 'pulsenetworkadmin@gmail.com',
      reply_to: email,
      subject: `Message via BlackFound contact form from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
        <p>${htmlMessage}</p>
      `,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('Resend contact error:', res.status, text)
    return Response.json({ error: 'Failed to send your message. Please try again.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
