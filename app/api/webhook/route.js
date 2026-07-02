const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const ADMIN_NUMBER = process.env.ADMIN_NUMBER; // format: 91XXXXXXXXXX (no +, no spaces)

// Webhook verification (Meta calls this once when you set up the webhook)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// Incoming messages land here
export async function POST(request) {
  const body = await request.json();

  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (message && message.type === 'text') {
      const text = message.text.body.trim();
      const from = message.from; // buyer's number, no + sign

      if (text.toLowerCase().startsWith('slot ')) {
        const teamName = text.slice(5).trim();

        if (!teamName) {
          await sendMessage(from, 'Team name likhna zaroori hai. Format: slot TeamName');
        } else {
          // Notify admin (works only if admin has messaged the bot at least once,
          // opening the 24-hour window — see README)
          await sendMessage(
            ADMIN_NUMBER,
            `🎮 New Slot Booking\n\nNumber: +${from}\nTeam: ${teamName}`
          );

          // Confirm to buyer
          await sendMessage(from, '✅ Slot confirmed! Details admin ko bhej diya gaya hai.');
        }
      }
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }

  // Always return 200 quickly, or Meta will retry/flag the webhook
  return new Response('EVENT_RECEIVED', { status: 200 });
}

async function sendMessage(to, text) {
  const res = await fetch(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    })
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('sendMessage failed:', errBody);
  }
}
