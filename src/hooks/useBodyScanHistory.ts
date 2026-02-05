 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 
 export interface BodyScanJob {
   id: string;
   status: "pending" | "processing" | "completed" | "failed";
   height_cm: number;
   gender: string;
   result: any | null;
   error_message: string | null;
   created_at: string;
   completed_at: string | null;
 }
 
 export function useBodyScanHistory() {
   const { user } = useAuth();
   const [jobs, setJobs] = useState<BodyScanJob[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const fetchJobs = async () => {
     if (!user) {
       setJobs([]);
       setLoading(false);
       return;
     }
 
     try {
       const { data, error: fetchError } = await supabase
         .from("body_scan_jobs")
         .select("id, status, height_cm, gender, result, error_message, created_at, completed_at")
         .eq("user_id", user.id)
         .order("created_at", { ascending: false })
         .limit(20);
 
       if (fetchError) throw fetchError;
       setJobs((data as BodyScanJob[]) || []);
     } catch (err: any) {
       setError(err.message);
     } finally {
       setLoading(false);
     }
   };
 
   useEffect(() => {
     fetchJobs();
   }, [user]);
 
   return { jobs, loading, error, refetch: fetchJobs };
 }