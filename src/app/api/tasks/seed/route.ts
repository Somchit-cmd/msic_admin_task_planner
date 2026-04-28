import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper: return a date string offset by N days from today in "YYYY-MM-DD"
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// POST /api/tasks/seed — seed the database with realistic sample tasks
export async function POST() {
  try {
    // Clear existing tasks first so seeding is idempotent
    await db.task.deleteMany();

    const today = daysFromNow(0);

    const sampleTasks = [
      // ── Today Tasks (startDate === today) ──
      {
        taskName: "Fix authentication token refresh bug",
        category: "Development",
        priority: "High",
        startDate: today,
        deadline: daysFromNow(1),
        assignedTo: "Alex Chen",
        note: "Users are getting logged out after 15 minutes. Check the refresh token rotation logic.",
        status: "In Progress",
        dateCreated: daysFromNow(-2),
      },
      {
        taskName: "Review pull request for payment module",
        category: "Development",
        priority: "Medium",
        startDate: today,
        deadline: daysFromNow(2),
        assignedTo: "Sarah Kim",
        note: "PR #482 — focus on error handling and edge cases for currency conversion.",
        status: "Pending",
        dateCreated: daysFromNow(-1),
      },
      {
        taskName: "Create onboarding wireframes for mobile app",
        category: "Design",
        priority: "Medium",
        startDate: today,
        deadline: daysFromNow(3),
        assignedTo: "Maya Patel",
        note: "Three screens: welcome, permissions, and profile setup.",
        status: "In Progress",
        dateCreated: daysFromNow(-1),
      },
      {
        taskName: "Prepare social media content calendar for Q3",
        category: "Marketing",
        priority: "Low",
        startDate: today,
        deadline: daysFromNow(5),
        assignedTo: "Jordan Lee",
        note: "Coordinate with the product team for feature launch dates.",
        status: "Pending",
        dateCreated: today,
      },
      {
        taskName: "Write unit tests for user service",
        category: "Testing",
        priority: "High",
        startDate: today,
        deadline: daysFromNow(1),
        assignedTo: "Liam Nguyen",
        note: "Cover all CRUD operations and validation edge cases.",
        status: "In Progress",
        dateCreated: daysFromNow(-3),
      },

      // ── Deadline Tasks (deadline within 72 hours) ──
      {
        taskName: "Finalize API documentation for v2 endpoints",
        category: "Development",
        priority: "High",
        startDate: daysFromNow(-5),
        deadline: daysFromNow(2),
        assignedTo: "Alex Chen",
        note: "Use OpenAPI 3.0 spec. Include request/response examples.",
        status: "In Progress",
        dateCreated: daysFromNow(-7),
      },
      {
        taskName: "Design email notification templates",
        category: "Design",
        priority: "Medium",
        startDate: daysFromNow(-3),
        deadline: daysFromNow(3),
        assignedTo: "Maya Patel",
        note: "Templates needed: welcome, password reset, weekly digest, and alert.",
        status: "In Progress",
        dateCreated: daysFromNow(-5),
      },
      {
        taskName: "Set up A/B test for landing page hero section",
        category: "Marketing",
        priority: "Medium",
        startDate: daysFromNow(-2),
        deadline: daysFromNow(1),
        assignedTo: "Jordan Lee",
        note: "Two variants: illustration-based vs. photo-based. Goal: increase sign-up rate.",
        status: "Pending",
        dateCreated: daysFromNow(-4),
      },
      {
        taskName: "Competitive analysis report for AI features",
        category: "Research",
        priority: "Low",
        startDate: daysFromNow(-10),
        deadline: daysFromNow(2),
        assignedTo: "Emma Wright",
        note: "Analyze top 5 competitors. Focus on pricing, feature parity, and UX patterns.",
        status: "In Progress",
        dateCreated: daysFromNow(-12),
      },
      {
        taskName: "Performance testing for search module",
        category: "Testing",
        priority: "High",
        startDate: daysFromNow(-2),
        deadline: daysFromNow(3),
        assignedTo: "Liam Nguyen",
        note: "Load test with 10k concurrent users. Measure P95 latency and error rate.",
        status: "Pending",
        dateCreated: daysFromNow(-3),
      },

      // ── Overdue Tasks (deadline in the past) ──
      {
        taskName: "Migrate database to PostgreSQL",
        category: "Development",
        priority: "High",
        startDate: daysFromNow(-20),
        deadline: daysFromNow(-3),
        assignedTo: "Alex Chen",
        note: "Blocked by third-party API compatibility. Need to escalate with vendor.",
        status: "In Progress",
        dateCreated: daysFromNow(-25),
      },
      {
        taskName: "Update brand guidelines document",
        category: "Design",
        priority: "Low",
        startDate: daysFromNow(-15),
        deadline: daysFromNow(-5),
        assignedTo: "Maya Patel",
        note: "Includes new color palette, typography scale, and icon set.",
        status: "Pending",
        dateCreated: daysFromNow(-18),
      },
      {
        taskName: "Quarterly blog post on product updates",
        category: "Marketing",
        priority: "Medium",
        startDate: daysFromNow(-12),
        deadline: daysFromNow(-2),
        assignedTo: "Jordan Lee",
        note: "Cover new features released in Q2: dashboard redesign, API v2, and team collaboration.",
        status: "Pending",
        dateCreated: daysFromNow(-14),
      },
      {
        taskName: "Accessibility audit for main dashboard",
        category: "Testing",
        priority: "Medium",
        startDate: daysFromNow(-10),
        deadline: daysFromNow(-4),
        assignedTo: "Liam Nguyen",
        note: "Run WCAG 2.1 AA checks. Fix any critical or major violations found.",
        status: "In Progress",
        dateCreated: daysFromNow(-12),
      },

      // ── Completed Tasks ──
      {
        taskName: "Set up CI/CD pipeline with GitHub Actions",
        category: "Development",
        priority: "High",
        startDate: daysFromNow(-30),
        deadline: daysFromNow(-14),
        assignedTo: "Alex Chen",
        note: "Automated lint, test, build, and deploy stages. Reduced deployment time by 60%.",
        status: "Completed",
        dateCreated: daysFromNow(-32),
      },
      {
        taskName: "Design system component library v1",
        category: "Design",
        priority: "High",
        startDate: daysFromNow(-45),
        deadline: daysFromNow(-10),
        assignedTo: "Maya Patel",
        note: "Delivered 24 components: buttons, inputs, cards, modals, navigation, and data display.",
        status: "Completed",
        dateCreated: daysFromNow(-50),
      },
      {
        taskName: "Launch email campaign for new users",
        category: "Marketing",
        priority: "Medium",
        startDate: daysFromNow(-20),
        deadline: daysFromNow(-8),
        assignedTo: "Jordan Lee",
        note: "Achieved 34% open rate and 12% click-through rate — above industry average.",
        status: "Completed",
        dateCreated: daysFromNow(-22),
      },
      {
        taskName: "User interview study — onboarding flow",
        category: "Research",
        priority: "Medium",
        startDate: daysFromNow(-25),
        deadline: daysFromNow(-12),
        assignedTo: "Emma Wright",
        note: "Interviewed 12 users. Key insight: 67% confused by the multi-step profile setup.",
        status: "Completed",
        dateCreated: daysFromNow(-28),
      },
      {
        taskName: "Regression test suite for checkout flow",
        category: "Testing",
        priority: "High",
        startDate: daysFromNow(-18),
        deadline: daysFromNow(-6),
        assignedTo: "Liam Nguyen",
        note: "48 test cases covering happy path, edge cases, and error states. All passing.",
        status: "Completed",
        dateCreated: daysFromNow(-20),
      },

      // ── Additional variety ──
      {
        taskName: "Implement real-time notifications with WebSocket",
        category: "Development",
        priority: "High",
        startDate: daysFromNow(-3),
        deadline: daysFromNow(10),
        assignedTo: "Sarah Kim",
        note: "Use Socket.io. Handle reconnection logic and message queuing when offline.",
        status: "Pending",
        dateCreated: daysFromNow(-5),
      },
      {
        taskName: "Create icon set for dark mode theme",
        category: "Design",
        priority: "Low",
        startDate: daysFromNow(-1),
        deadline: daysFromNow(7),
        assignedTo: "Maya Patel",
        note: "Adapt existing 24 icons. Ensure proper contrast ratios in dark mode.",
        status: "Pending",
        dateCreated: daysFromNow(-2),
      },
      {
        taskName: "Analyze user retention cohort data",
        category: "Research",
        priority: "Medium",
        startDate: daysFromNow(-7),
        deadline: daysFromNow(5),
        assignedTo: "Emma Wright",
        note: "Build cohort tables for last 6 months. Identify drop-off points in the funnel.",
        status: "In Progress",
        dateCreated: daysFromNow(-9),
      },
      {
        taskName: "Integration test for third-party payment SDK",
        category: "Testing",
        priority: "Medium",
        startDate: daysFromNow(-4),
        deadline: daysFromNow(8),
        assignedTo: "Liam Nguyen",
        note: "Test Stripe and PayPal integration. Cover webhook handling and refund flows.",
        status: "Pending",
        dateCreated: daysFromNow(-6),
      },
      {
        taskName: "Optimize database queries for dashboard",
        category: "Development",
        priority: "Medium",
        startDate: daysFromNow(-2),
        deadline: daysFromNow(6),
        assignedTo: "Sarah Kim",
        note: "Dashboard loads in 4.2s — target is under 1s. Add indexes and use materialized views.",
        status: "In Progress",
        dateCreated: daysFromNow(-3),
      },
    ];

    const result = await db.task.createMany({ data: sampleTasks });

    return NextResponse.json({
      message: `Seeded ${result.count} sample tasks successfully.`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error seeding tasks:", error);
    return NextResponse.json(
      { error: "Failed to seed tasks" },
      { status: 500 }
    );
  }
}
