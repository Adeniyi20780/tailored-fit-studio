import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Store, SlidersHorizontal, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TailorCard } from "@/components/marketplace/TailorCard";
import { useTailorsMarketplace, useAllSpecialties } from "@/hooks/useTailorsMarketplace";

const TailorsMarketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: tailors = [], isLoading } = useTailorsMarketplace(debouncedSearch, specialtyFilter);
  const { data: specialties = [] } = useAllSpecialties();

  // Simple debounce for search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-16">
          <div className="container text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Discover Expert Tailors
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Browse our curated selection of skilled tailors, compare their work, 
                and find the perfect craftsman for your custom clothing needs.
              </p>

              {/* Search and Filters */}
              <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, location, or specialty..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] h-12">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Specialties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty.toLowerCase()}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Tailors Grid */}
        <section className="container py-12">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tailors.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Store className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tailors found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || specialtyFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Check back soon for new tailors"}
              </p>
              {(searchQuery || specialtyFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedSearch("");
                    setSpecialtyFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </motion.div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  {tailors.length} tailor{tailors.length !== 1 ? "s" : ""} found
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tailors.map((tailor, index) => (
                  <motion.div
                    key={tailor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <TailorCard tailor={tailor} />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TailorsMarketplace;
