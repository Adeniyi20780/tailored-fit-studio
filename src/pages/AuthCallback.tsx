import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthCallback = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle code exchange (PKCE flow)
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setStatus("success");
          setTimeout(() => navigate("/", { replace: true }), 1500);
          return;
        }

        // Handle token_hash (magic link / email verification)
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type") as any;
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (error) throw error;

          if (type === "recovery") {
            navigate("/auth?type=recovery", { replace: true });
            return;
          }

          setStatus("success");
          setTimeout(() => navigate("/", { replace: true }), 1500);
          return;
        }

        // Check hash fragment (implicit flow fallback)
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
          // Supabase client auto-handles hash tokens via onAuthStateChange
          setStatus("success");
          setTimeout(() => navigate("/", { replace: true }), 1500);
          return;
        }

        // Nothing to process
        navigate("/auth", { replace: true });
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setErrorMsg(err.message || "Verification failed. The link may have expired.");
        setStatus("error");
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Verifying your account...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">Email verified!</p>
            <p className="text-muted-foreground">Redirecting you now...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">Verification failed</p>
            <p className="text-muted-foreground mb-6">{errorMsg}</p>
            <Button onClick={() => navigate("/auth")} variant="outline">
              Back to Sign In
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
