import { supabase } from './supabase';

/**
 * Send a DM from one user to another, creating the conversation if needed.
 * Matches the schema read by ChatWindow / MessageInbox.
 */
export async function sendDirectMessage({ senderId, recipientId, message }) {
    if (!senderId || !recipientId || !message?.trim()) {
        throw new Error('Missing sender, recipient, or message');
    }

    const { data: existing, error: findErr } = await supabase
    .from('conversations')
    .select('id')
    .or(
        `and(user1_id.eq.${senderId},user2_id.eq.${recipientId}),` +
        `and(user1_id.eq.${recipientId},user2_id.eq.${senderId})`
    )
    .maybeSingle();
    if (findErr) throw findErr;

    let convId = existing?.id;
    if (!convId) {
        const { data: newConv, error: createErr } = await supabase
        .from('conversations')
        .insert({ user1_id: senderId, user2_id: recipientId })
        .select('id')
        .single();
        if (createErr) throw createErr;
        convId = newConv.id;
    }

    const { error: msgErr } = await supabase
    .from('messages')
    .insert({
        conversation_id: convId,
        sender_id: senderId,
        receiver_id: recipientId,
        message: message.trim(),
    });
    if (msgErr) throw msgErr;

    return convId;
}
