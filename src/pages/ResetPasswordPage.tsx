import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { updatePassword } from "@/lib/auth-adapter";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Supabase auth-js auto-parses the recovery tokens out of the URL hash and
  // emits a PASSWORD_RECOVERY event. We just need to wait for a session.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    setError("");
    if (pw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (pw !== pw2) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await updatePassword(pw);
      await supabase.auth.signOut();
      toast.success("Password updated. Please sign in.");
      navigate("/login");
    } catch (e: any) {
      setError(e?.message || "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display">Set a new password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a strong password (at least 8 characters).
          </p>
        </div>

        {!ready ? (
          <p className="text-sm text-muted-foreground text-center">
            Validating your reset link…
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>New password</Label>
              <Input
                type="password"
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(""); }}
                className="mt-1.5"
                maxLength={128}
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input
                type="password"
                value={pw2}
                onChange={(e) => { setPw2(e.target.value); setError(""); }}
                className="mt-1.5"
                maxLength={128}
                autoComplete="new-password"
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
            )}
            <Button onClick={submit} disabled={loading} className="w-full py-3">
              {loading ? "Updating…" : "Update password"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
