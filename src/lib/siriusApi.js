import { supabase } from "./supabase";

/*
 * Sirius H&S
 * Capa de comunicación con Supabase.
 *
 * Este archivo NO reemplaza App.jsx.
 * Solo agrega funciones para que posteriormente
 * podamos conectar la aplicación con la base de datos.
 */

/* =========================================================
   USUARIO
   ========================================================= */

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  return data?.user ?? null;
}

/* =========================================================
   PROFILES
   ========================================================= */

export async function getProfile(userId) {
  const id = userId || (await getCurrentUser())?.id;

  if (!id) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function createProfile(userId, role = "user", plan = "free") {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      role,
      plan,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateProfile(userId, changes) {
  const { data, error } = await supabase
    .from("profiles")
    .update(changes)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/* =========================================================
   EVENTS
   ========================================================= */

export async function getEvents(userId) {
  const id = userId || (await getCurrentUser())?.id;

  if (!id) return [];

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function getEvent(eventId) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function createEvent(event) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  const payload = {
    user_id: user.id,
    name: event.name,
    date: event.date || null,
    time: event.time || null,
    location: event.location || null,
    passes: Number(event.passes) || 1,
    description: event.description || null,
    status: event.status || "active",
  };

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateEvent(eventId, changes) {
  const { data, error } = await supabase
    .from("events")
    .update(changes)
    .eq("id", eventId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteEvent(eventId) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (error) throw error;

  return true;
}

/* =========================================================
   GUESTS
   ========================================================= */

export async function getGuests(eventId, userId) {
  const id = userId || (await getCurrentUser())?.id;

  if (!id) return [];

  let query = supabase
    .from("guests")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

export async function getGuest(guestId) {
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("id", guestId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function createGuest(guest) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  const payload = {
    event_id: guest.event_id,
    user_id: user.id,
    name: guest.name,
    phone: guest.phone || null,
    email: guest.email || null,
    passes: Number(guest.passes) || 1,
    qr_token: guest.qr_token || null,
    qr_used: Boolean(guest.qr_used),
    notes: guest.notes || null,
  };

  const { data, error } = await supabase
    .from("guests")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateGuest(guestId, changes) {
  const { data, error } = await supabase
    .from("guests")
    .update(changes)
    .eq("id", guestId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteGuest(guestId) {
  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("id", guestId);

  if (error) throw error;

  return true;
}

/* =========================================================
   INVITATIONS
   ========================================================= */

export async function getInvitation(eventId) {
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function createInvitation(invitation) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  const payload = {
    event_id: invitation.event_id,
    user_id: user.id,
    slug: invitation.slug || null,
    title: invitation.title || null,
    subtitle: invitation.subtitle || null,
    message: invitation.message || null,
    theme: invitation.theme || null,
    background_url: invitation.background_url || null,
    cover_image_url: invitation.cover_image_url || null,
    music_url: invitation.music_url || null,
    voice_url: invitation.voice_url || null,
    animation_enabled:
      invitation.animation_enabled ?? true,
    interactive_enabled:
      invitation.interactive_enabled ?? true,
    published:
      invitation.published ?? false,
  };

  const { data, error } = await supabase
    .from("invitations")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateInvitation(invitationId, changes) {
  const { data, error } = await supabase
    .from("invitations")
    .update(changes)
    .eq("id", invitationId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/* =========================================================
   EVENT LOCATIONS
   ========================================================= */

export async function getEventLocation(eventId) {
  const { data, error } = await supabase
    .from("event_locations")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function saveEventLocation(location) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  const existing = await getEventLocation(location.event_id);

  const payload = {
    event_id: location.event_id,
    user_id: user.id,
    address: location.address || null,
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    map_url: location.map_url || null,
  };

  if (existing) {
    const { data, error } = await supabase
      .from("event_locations")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  const { data, error } = await supabase
    .from("event_locations")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/* =========================================================
   CONFIRMATIONS
   ========================================================= */

export async function getConfirmations(eventId, userId) {
  const id = userId || (await getCurrentUser())?.id;

  if (!id) return [];

  let query = supabase
    .from("confirmations")
    .select("*")
    .eq("user_id", id)
    .order("scanned_at", { ascending: false });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

export async function createConfirmation(confirmation) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  const payload = {
    event_id: confirmation.event_id,
    guest_id: confirmation.guest_id,
    user_id: user.id,
    status: confirmation.status || "confirmed",
    passes_used: Number(confirmation.passes_used) || 1,
    scanned_by: confirmation.scanned_by || user.id,
    notes: confirmation.notes || null,
  };

  const { data, error } = await supabase
    .from("confirmations")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/* =========================================================
   QR SCANS
   ========================================================= */

export async function createQRScan(scan) {
  const user = await getCurrentUser();

  const payload = {
    event_id: scan.event_id || null,
    guest_id: scan.guest_id || null,
    user_id: user?.id || null,
    qr_token: scan.qr_token || null,
    result: scan.result || null,
    scanned_at: new Date().toISOString(),
    device_info: scan.device_info || null,
  };

  const { data, error } = await supabase
    .from("qr_scans")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/* =========================================================
   SUBSCRIPTIONS
   ========================================================= */

export async function getSubscription(userId) {
  const id = userId || (await getCurrentUser())?.id;

  if (!id) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/* =========================================================
   PAYMENTS
   ========================================================= */

export async function getPayments(userId) {
  const id = userId || (await getCurrentUser())?.id;

  if (!id) return [];

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

/* =========================================================
   USER SETTINGS
   ========================================================= */

export async function getUserSettings(userId) {
  const id = userId || (await getCurrentUser())?.id;

  if (!id) return null;

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function saveUserSettings(settings) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  const existing = await getUserSettings(user.id);

  const payload = {
    user_id: user.id,
    language: settings.language || "es",
    timezone: settings.timezone || "America/Mexico_City",
    currency: settings.currency || "MXN",
    notifications_enabled:
      settings.notifications_enabled ?? true,
  };

  if (existing) {
    const { data, error } = await supabase
      .from("user_settings")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  const { data, error } = await supabase
    .from("user_settings")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/* =========================================================
   ESTADO PREMIUM
   ========================================================= */

export async function getPremiumStatus(userId) {
  const profile = await getProfile(userId);
  const subscription = await getSubscription(userId);

  const owner =
    profile?.role === "owner" ||
    profile?.role === "creator";

  const profilePremium =
    profile?.plan === "premium" ||
    profile?.plan === "pro" ||
    profile?.plan === "owner";

  const subscriptionPremium =
    subscription?.status === "active" &&
    (
      subscription?.plan === "premium" ||
      subscription?.plan === "pro" ||
      subscription?.plan === "owner"
    );

  return {
    profile,
    subscription,
    isOwner: owner,
    isPremium:
      owner ||
      profilePremium ||
      subscriptionPremium,
  };
}

/* =========================================================
   EXPORTACIÓN
   ========================================================= */

export default {
  getCurrentUser,

  getProfile,
  createProfile,
  updateProfile,

  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,

  getGuests,
  getGuest,
  createGuest,
  updateGuest,
  deleteGuest,

  getInvitation,
  createInvitation,
  updateInvitation,

  getEventLocation,
  saveEventLocation,

  getConfirmations,
  createConfirmation,

  createQRScan,

  getSubscription,

  getPayments,

  getUserSettings,
  saveUserSettings,

  getPremiumStatus,
};