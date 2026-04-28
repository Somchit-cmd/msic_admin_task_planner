"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useTaskStore, type Task } from "@/store/task-store";
import { CheckCircle2, Loader2, Undo2 } from "lucide-react";

interface CompleteTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompleteTaskDialog({
  task,
  open,
  onOpenChange,
}: CompleteTaskDialogProps) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const [submitting, setSubmitting] = useState(false);

  const isCompleting = task?.status !== "Completed";

  async function handleConfirm() {
    if (!task) return;

    setSubmitting(true);
    try {
      await updateTask(task.id, {
        status: isCompleting ? "Completed" : "Pending",
      });
      onOpenChange(false);
    } catch {
      // Error is already logged in the store
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isCompleting ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <Undo2 className="h-5 w-5 text-amber-600" />
            )}
            {isCompleting ? "Mark as Completed" : "Reopen Task"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCompleting ? (
              <>
                Are you sure you want to mark &ldquo;{task?.taskName}&rdquo; as
                completed? The task will be moved to the completed list.
              </>
            ) : (
              <>
                Are you sure you want to reopen &ldquo;{task?.taskName}&rdquo;?
                The task status will be changed back to Pending.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={submitting}
            className={
              isCompleting
                ? buttonVariants({ variant: "default" })
                : buttonVariants({ variant: "secondary" })
            }
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : isCompleting ? (
              "Mark Complete"
            ) : (
              "Reopen"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
