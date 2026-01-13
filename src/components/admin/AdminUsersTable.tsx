import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Users, Store, Shield, User } from "lucide-react";
import { format } from "date-fns";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

interface Tailor {
  id: string;
  user_id: string;
  store_name: string;
  is_active: boolean;
  is_verified: boolean;
}

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "tailor" | "customer";
}

interface AdminUsersTableProps {
  profiles: Profile[];
  tailors: Tailor[];
  userRoles: UserRole[];
}

const AdminUsersTable = ({ profiles, tailors, userRoles }: AdminUsersTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Combine user data
  const usersWithRoles = profiles.map((profile) => {
    const roles = userRoles
      .filter((r) => r.user_id === profile.user_id)
      .map((r) => r.role);
    const tailor = tailors.find((t) => t.user_id === profile.user_id);
    return {
      ...profile,
      roles,
      tailor,
    };
  });

  // Filter users
  const filteredUsers = usersWithRoles.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "all" ||
      user.roles.includes(roleFilter as any);

    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-3 h-3" />;
      case "tailor":
        return <Store className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default" as const;
      case "tailor":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={roleFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("all")}
            >
              All
            </Button>
            <Button
              variant={roleFilter === "admin" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("admin")}
            >
              Admins
            </Button>
            <Button
              variant={roleFilter === "tailor" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("tailor")}
            >
              Tailors
            </Button>
            <Button
              variant={roleFilter === "customer" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("customer")}
            >
              Customers
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant={getRoleBadgeVariant(role)} className="flex items-center gap-1">
                            {getRoleIcon(role)}
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.tailor ? (
                        <div>
                          <p className="font-medium">{user.tailor.store_name}</p>
                          <div className="flex gap-1 mt-1">
                            {user.tailor.is_verified && (
                              <Badge variant="default" className="text-xs">Verified</Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.tailor ? (
                        <Badge variant={user.tailor.is_active ? "default" : "destructive"}>
                          {user.tailor.is_active ? "Active" : "Inactive"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Customer</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {profiles.length} users
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminUsersTable;
