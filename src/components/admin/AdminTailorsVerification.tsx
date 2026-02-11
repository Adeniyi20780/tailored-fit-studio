 import { useState } from "react";
 import { format } from "date-fns";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Textarea } from "@/components/ui/textarea";
 import { 
   Search, 
   Store, 
   MapPin,
   CheckCircle,
   XCircle,
   Eye,
   Clock,
   Loader2
 } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 
 interface Tailor {
   id: string;
   user_id: string;
   store_name: string;
   store_slug: string;
   location: string | null;
   description: string | null;
   specialties: string[] | null;
   is_verified: boolean | null;
   is_active: boolean | null;
   created_at: string;
 }
 
 export default function AdminTailorsVerification({ currentAdminLevel }: { currentAdminLevel: number | null }) {
   const queryClient = useQueryClient();
   const [search, setSearch] = useState("");
   const [selectedTailor, setSelectedTailor] = useState<Tailor | null>(null);
   const [showRejectDialog, setShowRejectDialog] = useState(false);
   const [rejectReason, setRejectReason] = useState("");
 
   // Fetch all tailors (including unverified ones for admin)
   const { data: tailors = [], isLoading } = useQuery({
     queryKey: ["admin-tailors-verification"],
     queryFn: async () => {
       // Admin needs to see all tailors including inactive ones
       // We'll use RPC or direct query - for now fetch all we can access
       const { data, error } = await supabase
         .from("tailors")
         .select("*")
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       return data as Tailor[];
     },
   });
 
   const verifyMutation = useMutation({
     mutationFn: async ({ tailorId, verified }: { tailorId: string; verified: boolean }) => {
       const { error } = await supabase
         .from("tailors")
         .update({ is_verified: verified })
         .eq("id", tailorId);
 
       if (error) throw error;
     },
     onSuccess: (_, { verified }) => {
       queryClient.invalidateQueries({ queryKey: ["admin-tailors-verification"] });
       toast.success(verified ? "Tailor verified successfully!" : "Tailor verification revoked");
       setSelectedTailor(null);
     },
     onError: (error: any) => {
       toast.error(error.message || "Failed to update tailor verification");
     },
   });
 
   const deactivateMutation = useMutation({
     mutationFn: async (tailorId: string) => {
       const { error } = await supabase
         .from("tailors")
         .update({ is_active: false, is_verified: false })
         .eq("id", tailorId);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["admin-tailors-verification"] });
       toast.success("Tailor application rejected");
       setShowRejectDialog(false);
       setSelectedTailor(null);
       setRejectReason("");
     },
     onError: (error: any) => {
       toast.error(error.message || "Failed to reject tailor");
     },
   });
 
   const filteredTailors = tailors.filter(
     (t) =>
       t.store_name.toLowerCase().includes(search.toLowerCase()) ||
       t.location?.toLowerCase().includes(search.toLowerCase()) ||
       t.store_slug.toLowerCase().includes(search.toLowerCase())
   );
 
   const pendingTailors = filteredTailors.filter((t) => !t.is_verified && t.is_active);
   const verifiedTailors = filteredTailors.filter((t) => t.is_verified);
   const rejectedTailors = filteredTailors.filter((t) => !t.is_active);
 
   const getStatusBadge = (tailor: Tailor) => {
     if (!tailor.is_active) {
       return <Badge variant="destructive">Rejected</Badge>;
     }
     if (tailor.is_verified) {
      return <Badge className="bg-primary">Verified</Badge>;
     }
     return <Badge variant="secondary">Pending</Badge>;
   };
 
   if (isLoading) {
     return (
       <Card>
         <CardContent className="py-12 flex items-center justify-center">
           <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="space-y-6">
       {/* Stats */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
                 <Clock className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-2xl font-semibold">{pendingTailors.length}</p>
                 <p className="text-sm text-muted-foreground">Pending Verification</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                 <CheckCircle className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-2xl font-semibold">{verifiedTailors.length}</p>
                 <p className="text-sm text-muted-foreground">Verified Tailors</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                 <XCircle className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-2xl font-semibold">{rejectedTailors.length}</p>
                 <p className="text-sm text-muted-foreground">Rejected</p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Tailors Table */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Store className="w-5 h-5" />
             Tailor Applications
           </CardTitle>
           <CardDescription>
             Review and verify tailor store applications
           </CardDescription>
         </CardHeader>
         <CardContent>
           {/* Search */}
           <div className="relative mb-4">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
               placeholder="Search by store name, location, or slug..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-9"
             />
           </div>
 
           {/* Table */}
           <div className="border rounded-lg overflow-hidden">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Store</TableHead>
                   <TableHead>Location</TableHead>
                   <TableHead>Specialties</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Applied</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredTailors.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                       No tailor applications found
                     </TableCell>
                   </TableRow>
                 ) : (
                   filteredTailors.map((tailor) => (
                     <TableRow key={tailor.id}>
                       <TableCell>
                         <div>
                           <p className="font-medium">{tailor.store_name}</p>
                           <p className="text-xs text-muted-foreground">/tailor/{tailor.store_slug}</p>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-1 text-sm">
                           <MapPin className="w-3 h-3" />
                           {tailor.location || "Not set"}
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex flex-wrap gap-1">
                           {tailor.specialties?.slice(0, 2).map((s) => (
                             <Badge key={s} variant="outline" className="text-xs">
                               {s}
                             </Badge>
                           ))}
                           {(tailor.specialties?.length || 0) > 2 && (
                             <Badge variant="outline" className="text-xs">
                               +{(tailor.specialties?.length || 0) - 2}
                             </Badge>
                           )}
                         </div>
                       </TableCell>
                       <TableCell>{getStatusBadge(tailor)}</TableCell>
                       <TableCell className="text-sm text-muted-foreground">
                         {format(new Date(tailor.created_at), "MMM d, yyyy")}
                       </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTailor(tailor)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {currentAdminLevel !== 3 && tailor.is_active && !tailor.is_verified && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => verifyMutation.mutate({ tailorId: tailor.id, verified: true })}
                                  disabled={verifyMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Verify
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTailor(tailor);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {currentAdminLevel !== 3 && tailor.is_verified && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => verifyMutation.mutate({ tailorId: tailor.id, verified: false })}
                                disabled={verifyMutation.isPending}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </div>
         </CardContent>
       </Card>
 
       {/* View Details Dialog */}
       <Dialog open={!!selectedTailor && !showRejectDialog} onOpenChange={() => setSelectedTailor(null)}>
         <DialogContent className="max-w-lg">
           <DialogHeader>
             <DialogTitle>Tailor Application Details</DialogTitle>
             <DialogDescription>
               Review the tailor store application
             </DialogDescription>
           </DialogHeader>
           {selectedTailor && (
             <div className="space-y-4">
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Store Name</label>
                 <p className="text-lg font-semibold">{selectedTailor.store_name}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Store URL</label>
                 <p>/tailor/{selectedTailor.store_slug}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Location</label>
                 <p>{selectedTailor.location || "Not provided"}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Description</label>
                 <p className="text-sm">{selectedTailor.description || "No description"}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Specialties</label>
                 <div className="flex flex-wrap gap-1 mt-1">
                   {selectedTailor.specialties?.map((s) => (
                     <Badge key={s} variant="secondary">{s}</Badge>
                   )) || <span className="text-muted-foreground">None</span>}
                 </div>
               </div>
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Applied On</label>
                 <p>{format(new Date(selectedTailor.created_at), "MMMM d, yyyy 'at' h:mm a")}</p>
               </div>
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Status</label>
                 <div className="mt-1">{getStatusBadge(selectedTailor)}</div>
               </div>
             </div>
           )}
           <DialogFooter>
             <Button variant="outline" onClick={() => setSelectedTailor(null)}>
               Close
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Reject Dialog */}
       <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Reject Tailor Application</DialogTitle>
             <DialogDescription>
               Are you sure you want to reject {selectedTailor?.store_name}'s application?
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             <div>
               <label className="text-sm font-medium">Reason (optional)</label>
               <Textarea
                 placeholder="Provide a reason for rejection..."
                 value={rejectReason}
                 onChange={(e) => setRejectReason(e.target.value)}
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
               Cancel
             </Button>
             <Button
               variant="destructive"
               onClick={() => selectedTailor && deactivateMutation.mutate(selectedTailor.id)}
               disabled={deactivateMutation.isPending}
             >
               {deactivateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
               Reject Application
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }