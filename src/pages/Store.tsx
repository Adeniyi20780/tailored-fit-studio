import { useAuth } from "@/contexts/AuthContext";

const Store = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold text-foreground mb-4">Store Dashboard</h1>
      <p className="text-muted-foreground">Welcome to your tailor store management area.</p>
    </div>
  );
};

export default Store;
