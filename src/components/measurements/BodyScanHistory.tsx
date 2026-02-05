 import { format } from "date-fns";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { 
   History, 
   CheckCircle, 
   Clock, 
   Loader2, 
   XCircle,
   Eye,
   Ruler
 } from "lucide-react";
 import { useBodyScanHistory, BodyScanJob } from "@/hooks/useBodyScanHistory";
 
 const statusConfig = {
   pending: { icon: Clock, label: "Pending", variant: "secondary" as const },
   processing: { icon: Loader2, label: "Processing", variant: "default" as const },
   completed: { icon: CheckCircle, label: "Completed", variant: "default" as const },
   failed: { icon: XCircle, label: "Failed", variant: "destructive" as const },
 };
 
 function ScanResultDialog({ job }: { job: BodyScanJob }) {
   if (!job.result) return null;
 
   const measurements = job.result.measurements || {};
   const fitRecommendations = job.result.fit_recommendations || {};
   const confidenceScores = job.result.confidence_scores || {};
 
   return (
     <Dialog>
       <DialogTrigger asChild>
         <Button variant="outline" size="sm">
           <Eye className="w-4 h-4 mr-1" />
           View Results
         </Button>
       </DialogTrigger>
       <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Ruler className="w-5 h-5" />
             Scan Results
           </DialogTitle>
         </DialogHeader>
         
         <div className="space-y-4">
           {/* Fit Recommendations */}
           <div>
             <h4 className="text-sm font-medium mb-2">Size Recommendations</h4>
             <div className="grid grid-cols-2 gap-2">
               <div className="bg-muted/50 rounded p-2">
                 <span className="text-xs text-muted-foreground">Shirt</span>
                 <p className="font-medium">{fitRecommendations.shirt_size || "N/A"}</p>
               </div>
               <div className="bg-muted/50 rounded p-2">
                 <span className="text-xs text-muted-foreground">Pants</span>
                 <p className="font-medium">{fitRecommendations.pants_size || "N/A"}</p>
               </div>
               <div className="bg-muted/50 rounded p-2">
                 <span className="text-xs text-muted-foreground">Suit</span>
                 <p className="font-medium">{fitRecommendations.suit_size || "N/A"}</p>
               </div>
               <div className="bg-muted/50 rounded p-2">
                 <span className="text-xs text-muted-foreground">Body Type</span>
                 <p className="font-medium">{fitRecommendations.body_type || "N/A"}</p>
               </div>
             </div>
           </div>
 
           {/* Confidence */}
           <div>
             <h4 className="text-sm font-medium mb-2">Confidence Scores</h4>
             <div className="flex gap-2 flex-wrap">
               <Badge variant="outline">Overall: {Math.round((confidenceScores.overall || 0) * 100)}%</Badge>
               <Badge variant="outline">Upper: {Math.round((confidenceScores.upper_body || 0) * 100)}%</Badge>
               <Badge variant="outline">Lower: {Math.round((confidenceScores.lower_body || 0) * 100)}%</Badge>
               <Badge variant="outline">Arms: {Math.round((confidenceScores.arms || 0) * 100)}%</Badge>
             </div>
           </div>
 
           {/* Measurements */}
           <div>
             <h4 className="text-sm font-medium mb-2">Measurements (cm)</h4>
             <ScrollArea className="h-48">
               <div className="grid grid-cols-2 gap-1 text-sm">
                 {Object.entries(measurements).map(([key, value]) => (
                   <div key={key} className="flex justify-between py-1 px-2 bg-muted/30 rounded">
                     <span className="text-muted-foreground capitalize">
                       {key.replace(/_/g, " ")}
                     </span>
                     <span className="font-medium">{value as number}</span>
                   </div>
                 ))}
               </div>
             </ScrollArea>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }
 
 export function BodyScanHistory() {
   const { jobs, loading, error } = useBodyScanHistory();
 
   if (loading) {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <History className="w-5 h-5" />
             Scan History
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-3">
             {[1, 2, 3].map((i) => (
               <Skeleton key={i} className="h-16 w-full" />
             ))}
           </div>
         </CardContent>
       </Card>
     );
   }
 
   if (error) {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <History className="w-5 h-5" />
             Scan History
           </CardTitle>
         </CardHeader>
         <CardContent>
           <p className="text-sm text-muted-foreground">Failed to load scan history.</p>
         </CardContent>
       </Card>
     );
   }
 
   if (jobs.length === 0) {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <History className="w-5 h-5" />
             Scan History
           </CardTitle>
           <CardDescription>Your previous body scan results</CardDescription>
         </CardHeader>
         <CardContent>
           <p className="text-sm text-muted-foreground text-center py-4">
             No body scans yet. Start your first scan above!
           </p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <History className="w-5 h-5" />
           Scan History
         </CardTitle>
         <CardDescription>Your previous body scan results</CardDescription>
       </CardHeader>
       <CardContent>
         <ScrollArea className="h-64">
           <div className="space-y-3">
             {jobs.map((job) => {
               const config = statusConfig[job.status];
               const StatusIcon = config.icon;
               
               return (
                 <div
                   key={job.id}
                   className="flex items-center justify-between p-3 rounded-lg border bg-card"
                 >
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-full bg-muted">
                       <StatusIcon 
                         className={`w-4 h-4 ${
                           job.status === "processing" ? "animate-spin" : ""
                         } ${
                           job.status === "completed" ? "text-green-600" : ""
                         } ${
                           job.status === "failed" ? "text-destructive" : ""
                         }`} 
                       />
                     </div>
                     <div>
                       <p className="text-sm font-medium">
                         {job.height_cm}cm • {job.gender}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {format(new Date(job.created_at), "MMM d, yyyy h:mm a")}
                       </p>
                       {job.error_message && (
                         <p className="text-xs text-destructive mt-1">{job.error_message}</p>
                       )}
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                     <Badge variant={config.variant}>{config.label}</Badge>
                     {job.status === "completed" && job.result && (
                       <ScanResultDialog job={job} />
                     )}
                   </div>
                 </div>
               );
             })}
           </div>
         </ScrollArea>
       </CardContent>
     </Card>
   );
 }