import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_MATCH_WEBHOOK')!;

Deno.serve(async (req) => {
  try {
    const { match_id, team_a_name, team_b_name, score_a, score_b, reporter_name } = await req.json();

    // Build a clean Discord message
    const content = `**⚔️ New Match Reported**\n` +
                    `**${team_a_name}** ${score_a} – ${score_b} **${team_b_name}**\n` +
                    `Reported by: ${reporter_name}\n` +
                    `Match ID: ${match_id}\n` +
                    `<@&ROLE_ID_FOR_MANAGERS>`;   // optional @mention

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});