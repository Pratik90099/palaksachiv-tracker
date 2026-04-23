// Parichay SSO callback stub.
// In production this will validate the Parichay OAuth payload, look up the
// matching officer via external_identities, and return a session token.
// Until the government issues the OAuth client credentials, this returns
// a clear "not yet wired" response.
import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      success: false,
      message:
        "Parichay SSO is awaiting production OAuth credentials. " +
        "Officers can be added with their Parichay UID in the Officer Directory; " +
        "they will be auto-mapped once SSO is enabled.",
    }),
    {
      status: 501,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
