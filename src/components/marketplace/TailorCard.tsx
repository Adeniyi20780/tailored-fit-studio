import { Link } from "react-router-dom";
import { Store, MapPin, Star, Package, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TailorListing } from "@/hooks/useTailorsMarketplace";

interface TailorCardProps {
  tailor: TailorListing;
}

export const TailorCard = ({ tailor }: TailorCardProps) => {
  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-all duration-300 group">
      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
        {tailor.banner_url && (
          <img
            src={tailor.banner_url}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        {/* Logo */}
        <div className="absolute -bottom-8 left-4">
          <div className="w-16 h-16 rounded-full border-4 border-background bg-background overflow-hidden shadow-lg">
            {tailor.logo_url ? (
              <img
                src={tailor.logo_url}
                alt={tailor.store_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <Store className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>
        </div>
        {/* Verified badge */}
        {tailor.is_verified && (
          <div className="absolute top-3 right-3">
            <Badge className="gap-1 bg-blue-500 hover:bg-blue-600">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="pt-12 pb-6">
        {/* Store name and rating */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg text-foreground line-clamp-1">
            {tailor.store_name}
          </h3>
          {tailor.rating > 0 && (
            <div className="flex items-center gap-1 text-amber-500 shrink-0">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">{tailor.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">
                ({tailor.total_reviews})
              </span>
            </div>
          )}
        </div>

        {/* Location */}
        {tailor.location && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
            <MapPin className="h-3.5 w-3.5" />
            {tailor.location}
          </p>
        )}

        {/* Description */}
        {tailor.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {tailor.description}
          </p>
        )}

        {/* Specialties */}
        {tailor.specialties && tailor.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tailor.specialties.slice(0, 3).map((specialty) => (
              <Badge key={specialty} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {tailor.specialties.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tailor.specialties.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Stats and CTA */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{tailor.product_count} products</span>
          </div>
          <Button asChild size="sm">
            <Link to={`/tailor/${tailor.store_slug}`}>Visit Store</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
