'use client';

import { useEffect, useCallback, useState } from 'react';
import { useTaskStore, type TaskView } from '@/store/task-store';
import { useAuthStore } from '@/store/auth-store';
import { DashboardView } from '@/components/views/dashboard-view';
import { AllTasksView } from '@/components/views/all-tasks-view';
import { TodayTasksView } from '@/components/views/today-tasks-view';
import { DeadlinesView } from '@/components/views/deadlines-view';
import { UsersView } from '@/components/views/users-view';
import { SettingsView } from '@/components/views/settings-view';
import TaskFormDialog from '@/components/task-form-dialog';
import AuthPage from '@/components/auth-page';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  CalendarCheck,
  ListTodo,
  AlarmClock,
  Users,
  Settings as SettingsIcon,
  Menu,
  X,
  ClipboardList,
  Plus,
  LogOut,
  User,
  Loader2,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// ─── Sidebar Navigation Items ─────────────────────────────────────────────────

interface NavItem {
  view: TaskView;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
  { view: 'today', label: "Today's Tasks", shortLabel: 'Today', icon: CalendarCheck },
  { view: 'all', label: 'All Tasks', shortLabel: 'Tasks', icon: ListTodo },
  { view: 'deadlines', label: 'Deadlines', shortLabel: 'Due Soon', icon: AlarmClock },
  { view: 'users', label: 'User Management', shortLabel: 'Users', icon: Users, adminOnly: true },
  { view: 'settings', label: 'System Settings', shortLabel: 'Settings', icon: SettingsIcon, adminOnly: true },
];

// ─── Mobile Sidebar (slide-over drawer) ───────────────────────────────────────

function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuthStore();
  const currentView = useTaskStore((s) => s.currentView);
  const setCurrentView = useTaskStore((s) => s.setCurrentView);

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin');

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-card border-r shadow-xl transform transition-transform duration-300 ease-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Task Planner</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Separator />
        <nav className="p-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => { setCurrentView(item.view); onClose(); }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.adminOnly && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30">Admin</Badge>}
              </button>
            );
          })}
        </nav>

        {/* User info in mobile sidebar */}
        <div className="absolute bottom-0 left-0 right-0 border-t p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || user?.username || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                @{user?.username || 'user'}
                {user?.role === 'admin' && <Shield className="h-3 w-3 text-primary" />}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { logout(); onClose(); }} className="h-9 w-9 text-muted-foreground hover:text-destructive" aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Mobile Bottom Tab Bar ────────────────────────────────────────────────────

function BottomTabBar() {
  const currentView = useTaskStore((s) => s.currentView);
  const setCurrentView = useTaskStore((s) => s.setCurrentView);
  const getTodayTasks = useTaskStore((s) => s.getTodayTasks);
  const getOverdueTasks = useTaskStore((s) => s.getOverdueTasks);
  const setIsDialogOpen = useTaskStore((s) => s.setIsDialogOpen);
  const setEditingTask = useTaskStore((s) => s.setEditingTask);
  const { user } = useAuthStore();

  const todayCount = getTodayTasks().length;
  const overdueCount = getOverdueTasks().length;

  // Only show non-admin tabs in bottom bar (max 4 + add button)
  const bottomItems = NAV_ITEMS.filter((item) => !item.adminOnly);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-1 py-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          const badge = item.view === 'today' ? todayCount : item.view === 'deadlines' ? overdueCount : undefined;

          return (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 min-w-[64px] min-h-[52px] transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 transition-all ${isActive ? 'scale-110' : ''}`} />
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] leading-tight font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.shortLabel}
              </span>
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />}
            </button>
          );
        })}
        {/* Floating Add button */}
        <button
          onClick={() => { setEditingTask(null); setIsDialogOpen(true); }}
          className="relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 min-w-[64px] min-h-[52px] text-primary active:text-primary/80 transition-colors"
          aria-label="Add Task"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 active:scale-95 transition-transform">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-[10px] leading-tight font-semibold">Add</span>
        </button>
      </div>
    </nav>
  );
}

// ─── Desktop Sidebar Content ──────────────────────────────────────────────────

function DesktopSidebarContent({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const currentView = useTaskStore((s) => s.currentView);
  const setCurrentView = useTaskStore((s) => s.setCurrentView);
  const getTodayTasks = useTaskStore((s) => s.getTodayTasks);
  const getOverdueTasks = useTaskStore((s) => s.getOverdueTasks);
  const { user, logout } = useAuthStore();

  const todayCount = getTodayTasks().length;
  const overdueCount = getOverdueTasks().length;

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin');

  return (
    <>
      <nav className="p-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          const badge = item.view === 'today' ? todayCount : item.view === 'deadlines' ? overdueCount : undefined;

          const button = (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`flex items-center w-full rounded-lg text-sm font-medium transition-colors ${
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <div className="relative shrink-0">
                <Icon className="h-4 w-4" />
                {badge !== undefined && badge > 0 && (
                  <span className={`absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-destructive text-white'
                  }`}>
                    {badge}
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
            </button>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.view}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </nav>

      {/* User profile section */}
      <div className="mt-auto p-3 border-t">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || user?.username || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                @{user?.username || 'user'}
                {user?.role === 'admin' && <Shield className="h-3 w-3 text-primary" />}
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>Sign Out</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                {user?.name || user?.username || 'User'}
                {user?.role === 'admin' && ' (Admin)'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>Sign Out</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
        <ClipboardList className="h-6 w-6 text-primary-foreground" />
      </div>
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

// ─── Main Application ─────────────────────────────────────────────────────────

function AppShell() {
  const {
    currentView,
    loading,
    tasks,
    fetchTasks,
    setIsDialogOpen,
    setEditingTask,
  } = useTaskStore();

  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAdd = useCallback(() => {
    setEditingTask(null);
    setIsDialogOpen(true);
  }, [setIsDialogOpen, setEditingTask]);

  const handleLogout = useCallback(async () => { await logout(); }, [logout]);

  // Seed admin on first load if no admin exists
  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/auth/seed-admin', { method: 'POST', credentials: 'include' }).catch(() => {});
    }
  }, [user?.role]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'today':
        return <TodayTasksView />;
      case 'all':
        return <AllTasksView />;
      case 'deadlines':
        return <DeadlinesView />;
      case 'users':
        return user?.role === 'admin' ? <UsersView /> : null;
      case 'settings':
        return user?.role === 'admin' ? <SettingsView /> : null;
      default:
        return <DashboardView />;
    }
  };

  const currentLabel = NAV_ITEMS.find((i) => i.view === currentView)?.label ?? 'Dashboard';

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col border-r bg-card shrink-0 sticky top-0 h-screen transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarCollapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        <div className={`flex items-center ${sidebarCollapsed ? 'px-4 py-5 justify-center' : 'px-5 py-5 justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg whitespace-nowrap">Task Planner</span>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const next = !sidebarCollapsed;
                  setSidebarCollapsed(next);
                  localStorage.setItem('sidebar-collapsed', String(next));
                }}
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={sidebarCollapsed ? "right" : "bottom"} sideOffset={8}>
              {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </TooltipContent>
          </Tooltip>
        </div>
        <Separator />
        <ScrollArea className="flex-1 py-2">
          <DesktopSidebarContent
            collapsed={sidebarCollapsed}
            onToggle={() => {
              const next = !sidebarCollapsed;
              setSidebarCollapsed(next);
              localStorage.setItem('sidebar-collapsed', String(next));
            }}
          />
        </ScrollArea>
        <div className={`p-3 border-t ${sidebarCollapsed ? 'px-2' : 'p-4'}`}>
          {!sidebarCollapsed ? (
            <Button onClick={handleAdd} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleAdd} size="icon" className="w-full h-10">
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>New Task</TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer ────────────────────────────────────────── */}
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-sm border-b lg:px-8 lg:py-4"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 rounded-full" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate lg:text-xl">{currentLabel}</h1>
          </div>

          {/* User avatar + dropdown on desktop */}
          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-10 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user?.name || user?.username || 'User'}</span>
                  {user?.role === 'admin' && <Badge variant="secondary" className="text-[10px] px-1.5"><Shield className="h-3 w-3 mr-0.5" />Admin</Badge>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground">@{user?.username}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile user avatar */}
          <button className="lg:hidden flex h-9 w-9 items-center justify-center rounded-full bg-primary/10" onClick={handleLogout} aria-label="Sign out">
            <span className="text-sm font-semibold text-primary">
              {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
            </span>
          </button>
        </header>

        {/* Page content */}
        <div className="flex-1 px-4 py-4 pb-24 lg:px-8 lg:py-6 lg:pb-6">
          {renderView()}
        </div>

        {/* Footer */}
        <footer className="hidden lg:block border-t px-8 py-3">
          <p className="text-xs text-muted-foreground text-center">
            Smart Task Planner &mdash; Stay organized, stay productive
          </p>
        </footer>
      </main>

      {/* ── Mobile Bottom Tab Bar ───────────────────────────────────────── */}
      <BottomTabBar />

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <TaskFormDialog />
    </div>
  );
}

// ─── Root Page with Auth Guard ────────────────────────────────────────────────

export default function Home() {
  const { user, loading, checkSession } = useAuthStore();

  useEffect(() => { checkSession(); }, [checkSession]);

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthPage />;
  return <AppShell />;
}
