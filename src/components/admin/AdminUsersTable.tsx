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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Users, Store, Shield, User, Plus, Minus, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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

type AppRole = "admin" | "tailor" | "customer";

const ALL_ROLES: AppRole[] = ["admin", "tailor", "customer"];

const AdminUsersTable = ({ profiles, tailors, userRoles }: AdminUsersTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const usersWithRoles = profiles.map((profile) => {
    const roles = userRoles
      .filter((r) => r.user_id === profile.user_id)
      .map((r) => r.role);
    const tailor = tailors.find((t) => t.user_id === profile.user_id);
    return { ...profile, roles, tailor };
  });

  const filteredUsers = usersWithRoles.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === "all" || user.roles.includes(roleFilter as AppRole);
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="w-3 h-3" />;
      case "tailor": return <Store className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default" as const;
      case "tailor": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  const addRole = async (userId: string, role: AppRole) => {
    const key = `${userId}-add-${role}`;
    setLoadingAction(key);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
      toast.success(`Added ${role} role successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to add role");
    } finally {
      setLoadingAction(null);
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const key = `${userId}-remove-${role}`;
    setLoadingAction(key);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
      toast.success(`Removed ${role} role successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove role");
    } finally {
      setLoadingAction(null);
    }
  };

  const getMissingRoles = (currentRoles: AppRole[]) =>
    ALL_ROLES.filter((r) => !currentRoles.includes(r));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            {["all", "admin", "tailor", "customer"].map((filter) => (
              <Button
                key={filter}
                variant={roleFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter(filter)}
              >
                {filter === "all" ? "All" : `${filter.charAt(0).toUpperCase()}${filter.slice(1)}s`}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const missingRoles = getMissingRoles(user.roles);
                  return (
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
                          {user.roles.length === 0 && (
                            <span className="text-sm text-muted-foreground">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.tailor ? (
                          <div>
                            <p className="font-medium">{user.tailor.store_name}</p>
                            {user.tailor.is_verified && (
                              <Badge variant="default" className="text-xs mt-1">Verified</Badge>
                            )}
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {missingRoles.length > 0 && missingRoles.map((role) => (
                              <DropdownMenuItem
                                key={`add-${role}`}
                                onClick={() => addRole(user.user_id, role)}
                                disabled={loadingAction === `${user.user_id}-add-${role}`}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add {role} role
                              </DropdownMenuItem>
                            ))}
                            {user.roles.map((role) => (
                              <DropdownMenuItem
                                key={`remove-${role}`}
                                onClick={() => removeRole(user.user_id, role)}
                                disabled={loadingAction === `${user.user_id}-remove-${role}`}
                                className="text-destructive"
                              >
                                <Minus className="w-4 h-4 mr-2" />
                                Remove {role} role
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
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
