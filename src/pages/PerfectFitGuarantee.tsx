import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerAlterationTickets } from "@/hooks/useAlterationTickets";
import { Shield, CheckCircle, Clock, Scissors, MessageSquare, Star, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending Review", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  rejected: { label: "Rejected", variant: "destructive" },
};

const issueTypeLabels: Record<string, string> = {
  fit_too_tight: "Fit too tight",
  fit_too_loose: "Fit too loose",
  length_adjustment: "Length adjustment",
  sleeve_adjustment: "Sleeve adjustment",
  waist_adjustment: "Waist adjustment",
  shoulder_adjustment: "Shoulder adjustment",
  other: "Other issue",
};

const PerfectFitGuarantee = () => {
  const { user } = useAuth();
  const { tickets, isLoading } = useCustomerAlterationTickets();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Perfect Fit Guarantee
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We stand behind every stitch. If your garment doesn't fit perfectly, 
            we'll make it right — absolutely free.
          </p>
        </div>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-2xl font-serif font-bold text-center mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: CheckCircle,
                title: "Receive Your Order",
                description: "Try on your custom garment within 14 days of delivery",
              },
              {
                icon: MessageSquare,
                title: "Submit a Request",
                description: "If adjustments are needed, submit an alteration request",
              },
              {
                icon: Scissors,
                title: "Free Alterations",
                description: "Ship your garment back for professional alterations",
              },
              {
                icon: Star,
                title: "Perfect Fit",
                description: "Receive your perfectly fitted garment",
              },
            ].map((step, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Coverage Section */}
        <section className="mb-16">
          <Card className="bg-muted/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-serif font-bold mb-6">What's Covered</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Fit adjustments (too tight or loose)",
                  "Length modifications",
                  "Sleeve adjustments",
                  "Waist alterations",
                  "Shoulder adjustments",
                  "Minor style modifications",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* My Alteration Requests */}
        {user && (
          <section className="mb-16">
            <h2 className="text-2xl font-serif font-bold mb-6">
              My Alteration Requests
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !tickets?.length ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted any alteration requests yet.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You can request alterations from your{" "}
                    <Link to="/my-orders" className="text-primary hover:underline">
                      order history
                    </Link>{" "}
                    for any delivered orders.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => {
                  const status = statusConfig[ticket.status] || statusConfig.pending;
                  return (
                    <Card key={ticket.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-semibold">
                              Order: {ticket.order?.order_number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {ticket.order?.product?.name}
                            </p>
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="font-medium">Issue: </span>
                            {issueTypeLabels[ticket.issue_type] || ticket.issue_type}
                          </p>
                          <p className="text-muted-foreground">{ticket.description}</p>
                          
                          {ticket.resolution && (
                            <div className="bg-muted/50 p-3 rounded mt-3">
                              <span className="font-medium">Tailor's Response: </span>
                              {ticket.resolution}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Submitted {format(new Date(ticket.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* CTA Section */}
        <section className="text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-12">
              <h2 className="text-2xl font-serif font-bold mb-4">
                Need Help With Your Order?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Visit your order history to request alterations for any delivered items, 
                or contact our support team for assistance.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link to="/my-orders">View My Orders</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/catalog">Browse Catalog</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PerfectFitGuarantee;
