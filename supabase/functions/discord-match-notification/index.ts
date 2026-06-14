const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Replace with your frontend domain in production (e.g., 'https://yourdomain.com')
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, X-Client-Info',
};

Deno.serve(async (req) => {
  // Handle CORS preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse the incoming request body
    const { match_id, team_a_name, team_b_name, score_a, score_b, reporter_name } = await req.json();

    // Get the Discord webhook URL from environment variables
    const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_MATCH_WEBHOOK');

    if (!DISCORD_WEBHOOK_URL) {
      console.error('DISCORD_MATCH_WEBHOOK environment variable not set');
      return new Response(
        JSON.stringify({ error: 'Webhook URL missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the Discord message content
    const content = `**⚔️ New Match Reported**\n**${team_a_name}** ${score_a} – ${score_b} **${team_b_name}**\nReported by: ${reporter_name}\nMatch ID: ${match_id}`;

    // Send the message to Discord webhook
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord webhook failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Discord webhook failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Success
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});