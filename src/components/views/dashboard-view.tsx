"use client";

import { useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  Clock,
  ListTodo,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { useTaskStore, type Task } from "@/store/task-store";
import { useSettingsStore } from "@/store/settings-store";
import { Progress } from "@/components/ui/progress";

// ─── Color helpers ──────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  red: "hsl(0, 72%, 51%)",
  rose: "hsl(350, 72%, 51%)",
  orange: "hsl(25, 95%, 53%)",
  amber: "hsl(38, 92%, 50%)",
  yellow: "hsl(48, 96%, 53%)",
  green: "hsl(160, 60%, 45%)",
  emerald: "hsl(160, 84%, 39%)",
  teal: "hsl(174, 72%, 46%)",
  cyan: "hsl(188, 94%, 43%)",
  blue: "hsl(200, 98%, 39%)",
  indigo: "hsl(239, 84%, 67%)",
  violet: "hsl(258, 90%, 66%)",
  purple: "hsl(270, 67%, 47%)",
  pink: "hsl(330, 81%, 60%)",
  gray: "hsl(220, 9%, 46%)",
};

const FALLBACK_COLORS = ["hsl(38, 92%, 50%)", "hsl(160, 60%, 45%)", "hsl(0, 72%, 51%)", "hsl(200, 98%, 39%)", "hsl(270, 67%, 47%)"];

// ─── Summary Card ────────────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string;
  count: number;
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
}

function SummaryCard({ title, count, icon: Icon, accentColor, accentBg }: SummaryCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">{title}</p>
            <p className="text-2xl font-bold sm:text-3xl">{count}</p>
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12"
            style={{ backgroundColor: accentBg }}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: accentColor }} />
          </div>
        </div>
      </CardContent>
      <div className="absolute bottom-0 left-0 h-1 w-full" style={{ backgroundColor: accentColor }} />
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardView() {
  const tasks = useTaskStore((s) => s.tasks);
  const getOverdueTasks = useTaskStore((s) => s.getOverdueTasks);
  const { fetchSettings, initialized, priorities, statuses, getSettingColor } = useSettingsStore();

  useEffect(() => {
    if (!initialized) fetchSettings();
  }, [initialized, fetchSettings]);



  const overdueTasks = useMemo(() => getOverdueTasks(), [tasks, getOverdueTasks]);

  const totalTasks = tasks.length;
  const completedStatus = statuses.find((s) => s.name === "Completed");
  const completedCount = completedStatus
    ? tasks.filter((t) => t.status === completedStatus.name).length
    : tasks.filter((t) => t.status === "Completed").length;
  const pendingCount = tasks.filter((t) => {
    if (!completedStatus) return t.status !== "Completed";
    return t.status !== completedStatus.name;
  }).length;
  const overdueCount = overdueTasks.length;
  const completionPercent =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const priorityData = useMemo(
    () =>
      priorities.map((p, i) => ({
        name: p.name,
        count: tasks.filter((t) => t.priority === p.name).length,
        fill: COLOR_MAP[p.color] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      })),
    [tasks, priorities]
  );

  const statusData = useMemo(
    () =>
      statuses.map((s, i) => ({
        name: s.name,
        count: tasks.filter((t) => t.status === s.name).length,
        fill: COLOR_MAP[s.color] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      })),
    [tasks, statuses]
  );

  const priorityChartConfig = useMemo(
    (): ChartConfig =>
      priorities.reduce((acc, p, i) => {
        acc[p.name] = {
          label: p.name,
          color: COLOR_MAP[p.color] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        };
        return acc;
      }, {} as ChartConfig),
    [priorities]
  );

  const statusChartConfig = useMemo(
    (): ChartConfig =>
      statuses.reduce((acc, s, i) => {
        acc[s.name] = {
          label: s.name,
          color: COLOR_MAP[s.color] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        };
        return acc;
      }, {} as ChartConfig),
    [statuses]
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          title="Total Tasks"
          count={totalTasks}
          icon={ListTodo}
          accentColor="var(--primary)"
          accentBg="var(--primary) / 10%"
        />
        <SummaryCard
          title="Completed"
          count={completedCount}
          icon={CheckCircle2}
          accentColor="hsl(160, 60%, 45%)"
          accentBg="hsl(160, 60%, 45% / 10%)"
        />
        <SummaryCard
          title="Pending"
          count={pendingCount}
          icon={Clock}
          accentColor="hsl(38, 92%, 50%)"
          accentBg="hsl(38, 92%, 50% / 10%)"
        />
        <SummaryCard
          title="Overdue"
          count={overdueCount}
          icon={AlertTriangle}
          accentColor="var(--destructive)"
          accentBg="var(--destructive) / 10%"
        />
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Bar Chart — Priority */}
        <Card>
          <CardHeader className="pb-2 sm:pb-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              Tasks by Priority
            </CardTitle>
            <CardDescription className="hidden sm:block">
              Distribution of tasks across priority levels
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 sm:pt-0">
            <ChartContainer config={priorityChartConfig} className="h-[200px] w-full sm:h-[280px]">
              <BarChart data={priorityData} accessibilityLayer>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pie Chart — Status */}
        <Card>
          <CardHeader className="pb-2 sm:pb-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              Tasks by Status
            </CardTitle>
            <CardDescription className="hidden sm:block">
              Breakdown of task statuses at a glance
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 sm:pt-0">
            <ChartContainer config={statusChartConfig} className="h-[200px] w-full sm:h-[280px]">
              <PieChart accessibilityLayer>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={4}
                  strokeWidth={2}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Completion Progress ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 sm:pb-0">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            Overall Completion
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {completedCount} of {totalTasks} tasks completed ({completionPercent}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercent} className="h-2.5 sm:h-3" />
        </CardContent>
      </Card>
    </div>
  );
}
