import { type NextRequest } from "next/server";
import { z } from "zod";
import { err, getAuth, json, rateLimit } from "@/lib/api";

/** GET → my conversations (+ latest message each). ?conversation=id → messages. */
export async function GET(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const convId = req.nextUrl.searchParams.get("conversation");
  if (convId) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at");
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", convId)
      .neq("sender_id", user.id)
      .is("read_at", null);
    return json({ messages: data ?? [] });
  }
  const { data } = await supabase
    .from("conversations")
    .select(
      "*, guest:profiles!conversations_guest_id_fkey(first_name,last_name,email), host:profiles!conversations_host_id_fkey(first_name,last_name,email), properties(title), messages(body,created_at,sender_id,read_at)",
    )
    .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
    .order("created_at", { ascending: false });
  return json({ conversations: data ?? [] });
}

/** POST → {property_id, body} start or continue a conversation. */
export async function POST(req: NextRequest) {
  if (!rateLimit("msg:send", 60, 60_000)) return err("rate limited", 429);
  const auth = await getAuth();
  if (!auth) return err("unauthorized", 401);
  const { supabase, user } = auth;
  const parsed = z
    .object({
      property_id: z.string().uuid().optional(),
      conversation_id: z.string().uuid().optional(),
      body: z.string().min(1).max(4000),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("invalid payload");

  let convId = parsed.data.conversation_id;
  if (!convId) {
    if (!parsed.data.property_id) return err("property_id required");
    const { data: prop } = await supabase
      .from("properties")
      .select("host_id,title")
      .eq("id", parsed.data.property_id)
      .single();
    if (!prop) return err("property not found", 404);
    const guestId = prop.host_id === user.id ? parsed.data.body && user.id : user.id;
    const { data: conv, error } = await supabase
      .from("conversations")
      .upsert(
        {
          guest_id: user.id,
          host_id: prop.host_id,
          property_id: parsed.data.property_id,
        },
        { onConflict: "guest_id,host_id,property_id" },
      )
      .select()
      .single();
    if (error) return err(error.message, 500);
    convId = conv.id;
    void guestId;
  }
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: convId, sender_id: user.id, body: parsed.data.body })
    .select()
    .single();
  if (error) return err(error.message, 500);
  // notify the other party
  const { data: conv } = await supabase
    .from("conversations")
    .select("guest_id,host_id")
    .eq("id", convId)
    .single();
  const other = conv?.guest_id === user.id ? conv?.host_id : conv?.guest_id;
  if (other) {
    await supabase.from("notifications").insert({
      user_id: other,
      kind: "message",
      title: "New message",
      body: parsed.data.body.slice(0, 120),
      link: "/profile?tab=messages",
    });
  }
  return json({ message: data, conversation_id: convId });
}
