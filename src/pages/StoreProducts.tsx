import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import ProductsTable from "@/components/store/ProductsTable";
import ProductEditModal from "@/components/store/ProductEditModal";
import { useTailorProducts, type TailorProduct } from "@/hooks/useTailorProducts";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "shirts", label: "Shirts" },
  { value: "suits", label: "Suits" },
  { value: "kaftans", label: "Kaftans" },
  { value: "jeans", label: "Jeans" },
  { value: "traditional", label: "Traditional Wear" },
];

const StoreProducts = () => {
  const {
    tailor,
    products,
    isLoading,
    toggleActive,
    updateProduct,
    deleteProduct,
    isUpdating,
  } = useTailorProducts();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [editProduct, setEditProduct] = useState<TailorProduct | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && product.is_active) ||
      (statusFilter === "inactive" && !product.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleEdit = (product: TailorProduct) => {
    setEditProduct(product);
    setEditModalOpen(true);
  };

  const handleSave = (id: string, data: Partial<TailorProduct>) => {
    updateProduct({ id, data });
  };

  // Stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_active).length;
  const inactiveProducts = products.filter((p) => !p.is_active).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <div className="border-b bg-card mt-20">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link to="/store">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold text-foreground">
                Products
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage your {tailor?.store_name || "store"} product catalog
              </p>
            </div>
            <Link to="/store/products/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold">{totalProducts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold text-green-600">{activeProducts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactive
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold text-muted-foreground">{inactiveProducts}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            <ProductsTable
              products={filteredProducts}
              onEdit={handleEdit}
              onToggleActive={(id, isActive) => toggleActive({ id, isActive })}
              onDelete={deleteProduct}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <ProductEditModal
        product={editProduct}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={handleSave}
        isSaving={isUpdating}
      />
    </div>
  );
};

export default StoreProducts;
