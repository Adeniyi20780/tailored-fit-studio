import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ScanResult {
  measurements: Record<string, number>;
  confidence_scores: {
    overall: number;
    upper_body: number;
    lower_body: number;
    arms: number;
  };
  fit_recommendations: {
    shirt_size: string;
    pants_size: string;
    suit_size: string;
    body_type: string;
  };
  notes: string;
}

interface JobStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  result: ScanResult | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export function useBodyScanJob() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus["status"] | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const pollJob = useCallback(async (id: string) => {
    try {
      const { data, error: pollError } = await supabase.functions.invoke<JobStatus>(
        "poll-body-scan",
        { body: null, headers: {} },
      );

      // Use query params workaround - invoke doesn't support query params directly
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/poll-body-scan?job_id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to poll job status");
      }

      const job: JobStatus = await response.json();
      setStatus(job.status);

      if (job.status === "completed" && job.result) {
        setResult(job.result);
        stopPolling();
      } else if (job.status === "failed") {
        setError(job.error_message || "Analysis failed");
        stopPolling();
      }
    } catch (err) {
      console.error("Poll error:", err);
      setError(err instanceof Error ? err.message : "Failed to check job status");
      stopPolling();
    }
  }, [stopPolling]);

  const submitScan = useCallback(async (
    images: string[],
    height_cm: number,
    gender: "male" | "female"
  ) => {
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    setStatus(null);
    setJobId(null);
    stopPolling();

    try {
      const { data, error: submitError } = await supabase.functions.invoke<{ job_id: string; status: string }>(
        "submit-body-scan",
        {
          body: { images, height_cm, gender },
        }
      );

      if (submitError) throw submitError;
      if (!data?.job_id) throw new Error("No job ID returned");

      setJobId(data.job_id);
      setStatus("pending");

      // Start polling
      pollIntervalRef.current = setInterval(() => {
        pollJob(data.job_id);
      }, 2000);

      // Initial poll
      await pollJob(data.job_id);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : "Failed to submit scan");
    } finally {
      setIsSubmitting(false);
    }
  }, [pollJob, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setJobId(null);
    setStatus(null);
    setResult(null);
    setError(null);
    setIsSubmitting(false);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    jobId,
    status,
    result,
    error,
    isSubmitting,
    isProcessing: status === "pending" || status === "processing",
    submitScan,
    reset,
  };
}
