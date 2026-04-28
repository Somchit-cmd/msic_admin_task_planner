'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  UserPlus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Shield,
  Users,
  UserCircle,
  Ban,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserRecord {
  id: string;
  username: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  username: string;
  name: string;
  password: string;
  role: string;
}

const EMPTY_FORM: UserFormData = { username: '', name: '', password: '', role: 'user' };

// ─── Component ───────────────────────────────────────────────────────────────

// ── Helper: always get fresh token from storage ─────────────────────────────
function getAuthHeaders(): Record<string, string> {
  // Auth token is now in httpOnly cookie — sent automatically by browser
  return {};
}

export function UsersView() {
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch users ─────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/users${params}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Search debounce ─────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Create user ────────────────────────────────────────────────────────

  const handleCreate = async () => {
    setFormError('');
    if (!form.username.trim() || !form.password) {
      setFormError('Username and password are required');
      return;
    }
    if (form.username.trim().length < 3) {
      setFormError('Username must be at least 3 characters');
      return;
    }
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setFormError('Password must be at least 8 characters, with 1 uppercase letter and 1 number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          name: form.name.trim() || undefined,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create user');
        return;
      }
      setIsCreateOpen(false);
      setForm(EMPTY_FORM);
      fetchUsers();
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit user ──────────────────────────────────────────────────────────

  const handleEdit = async () => {
    if (!selectedUser) return;
    setFormError('');

    const updateData: Record<string, unknown> = {
      username: form.username.trim(),
      name: form.name.trim() || null,
      role: form.role,
    };
    if (form.password) updateData.password = form.password;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to update user');
        return;
      }
      setIsEditOpen(false);
      setSelectedUser(null);
      setForm(EMPTY_FORM);
      fetchUsers();
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete user ────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
        return;
      }
      setIsDeleteOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch {
      alert('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle user status ─────────────────────────────────────────────────

  const handleToggleStatus = async (user: UserRecord) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update status');
        return;
      }
      fetchUsers();
    } catch {
      alert('Network error');
    }
  };

  // ── Open edit dialog ───────────────────────────────────────────────────

  const openEdit = (user: UserRecord) => {
    setSelectedUser(user);
    setForm({ username: user.username, name: user.name || '', password: '', role: user.role });
    setFormError('');
    setIsEditOpen(true);
  };

  // ── Stats ───────────────────────────────────────────────────────────────

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold">{totalUsers}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold">{activeUsers}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold">{adminCount}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Users Table Card ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">User Management</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Create, edit, and manage user accounts
              </CardDescription>
            </div>
            <Button onClick={() => { setForm(EMPTY_FORM); setFormError(''); setIsCreateOpen(true); }} size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add User</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or username..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          {/* Table (desktop) / Cards (mobile) */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserCircle className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No users found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {search ? 'Try a different search term' : 'Create your first user to get started'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.name || '—'}
                          {u.id === currentUser?.id && (
                            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">You</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">@{u.username}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                            {u.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.status === 'active' ? 'default' : 'outline'} className={`text-xs ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200' : 'bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-200'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {u.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleStatus(u)} title={u.status === 'active' ? 'Deactivate' : 'Activate'}>
                              {u.status === 'active' ? <Ban className="h-4 w-4 text-muted-foreground" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => { setSelectedUser(u); setIsDeleteOpen(true); }}
                              disabled={u.id === currentUser?.id}
                              title={u.id === currentUser?.id ? "Can't delete yourself" : 'Delete'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {(u.name || u.username).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{u.name || 'No name'}</p>
                            {u.id === currentUser?.id && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">You</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                        </div>
                      </div>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs shrink-0">
                        {u.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                        {u.role}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={u.status === 'active' ? 'default' : 'outline'} className={`text-xs ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' : 'bg-red-500/10 text-red-700 border-red-200'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {u.status}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleStatus(u)}>
                          {u.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => { setSelectedUser(u); setIsDeleteOpen(true); }}
                          disabled={u.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Create User Dialog ───────────────────────────────────────────── */}
      <UserFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create New User"
        description="Add a new user to the system"
        form={form}
        setForm={setForm}
        error={formError}
        submitting={submitting}
        onSubmit={handleCreate}
        onCancel={() => { setIsCreateOpen(false); setForm(EMPTY_FORM); setFormError(''); }}
        requirePassword
        currentUser={currentUser}
      />

      {/* ── Edit User Dialog ─────────────────────────────────────────────── */}
      <UserFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit User"
        description={selectedUser ? `Editing @${selectedUser.username}` : ''}
        form={form}
        setForm={setForm}
        error={formError}
        submitting={submitting}
        onSubmit={handleEdit}
        onCancel={() => { setIsEditOpen(false); setSelectedUser(null); setForm(EMPTY_FORM); setFormError(''); }}
        requirePassword={false}
        currentUser={currentUser}
        editingUserId={selectedUser?.id}
      />

      {/* ── Delete Confirmation ──────────────────────────────────────────── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>@{selectedUser?.username}</strong>? This action cannot be undone. All data associated with this user will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── User Form Dialog (shared for create & edit) ─────────────────────────────

function UserFormDialog({
  open,
  onOpenChange,
  title,
  description,
  form,
  setForm,
  error,
  submitting,
  onSubmit,
  onCancel,
  requirePassword,
  currentUser,
  editingUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  form: UserFormData;
  setForm: React.Dispatch<React.SetStateAction<UserFormData>>;
  error: string;
  submitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  requirePassword: boolean;
  currentUser: { id: string; role: string } | null;
  editingUserId?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isSelf = editingUserId === currentUser?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="form-name" className="text-sm font-medium">Display Name</Label>
            <Input
              id="form-name"
              placeholder="Optional display name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="form-username" className="text-sm font-medium">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="form-username"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="form-password" className="text-sm font-medium">
              Password {requirePassword && <span className="text-destructive">*</span>}
              {!requirePassword && <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>}
            </Label>
            <div className="relative">
              <Input
                id="form-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={requirePassword ? 'Password (min. 8 chars, 1 uppercase, 1 number)' : 'New password (optional)'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required={requirePassword}
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <span className="flex items-center gap-2"><UserCircle className="h-4 w-4" /> User</span>
                </SelectItem>
                <SelectItem value="admin">
                  <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Admin</span>
                </SelectItem>
              </SelectContent>
            </Select>
            {isSelf && form.role === 'user' && (
              <p className="text-xs text-destructive">You cannot remove your own admin role.</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none" disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting} className="flex-1 sm:flex-none">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {requirePassword ? 'Create User' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
