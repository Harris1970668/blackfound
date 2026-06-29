import { createServerClient } from '@/lib/supabase-server'
import { sendNewApplicationEmail } from '@/lib/resend'

const REQUIRED = [
  'app_name', 'tagline', 'description_long', 'problem_solved',
  'app_audience', 'app_url', 'category', 'contact_email',
  'builder_name', 'requested_tier',
] as const

export async function POST(request: Request) {
  try {
    const body = await request.json()

    for (const field of REQUIRED) {
      if (!body[field]?.toString().trim()) {
        return Response.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    const tags: string[] = Array.isArray(body.tags)
      ? body.tags.map((t: string) => t.trim()).filter(Boolean)
      : []

    if (tags.length < 3) {
      return Response.json({ error: 'At least 3 tags are required' }, { status: 400 })
    }

    const validTiers = ['free', 'standard', 'featured']
    if (!validTiers.includes(body.requested_tier)) {
      return Response.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase.from('partner_applications').insert({
      app_name: body.app_name.trim(),
      tagline: body.tagline.trim(),
      description_long: body.description_long.trim(),
      problem_solved: body.problem_solved.trim(),
      app_audience: body.app_audience.trim(),
      why_built: body.why_built?.trim() || null,
      app_url: body.app_url.trim(),
      category: body.category,
      subcategory: body.subcategory?.trim() || null,
      contact_email: body.contact_email.trim(),
      builder_name: body.builder_name.trim(),
      requested_tier: body.requested_tier,
      tags,
      platform: body.platform || null,
      pricing_model: body.pricing_model || null,
      app_status: body.app_status || null,
      status: 'pending',
    })

    if (error) {
      console.error('Supabase insert error:', error)
      return Response.json({ error: 'Failed to submit application. Please try again.' }, { status: 500 })
    }

    // Non-blocking — a Resend failure does not fail the submission
    sendNewApplicationEmail({
      app_name: body.app_name,
      builder_name: body.builder_name,
      contact_email: body.contact_email,
      requested_tier: body.requested_tier,
      category: body.category,
    }).catch(err => console.error('Notification email failed:', err))

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Apply route error:', err)
    return Response.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
