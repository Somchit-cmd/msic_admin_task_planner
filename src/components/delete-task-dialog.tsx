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
import { Trash2, Loader2 } from "lucide-react";

interface DeleteTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTaskDialog({
  task,
  open,
  onOpenChange,
}: DeleteTaskDialogProps) {
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!task) return;

    setDeleting(true);
    try {
      await deleteTask(task.id);
      onOpenChange(false);
    } catch {
      // Error is already logged in the store
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Task
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{task?.taskName}&rdquo;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className={buttonVariants({ variant: "destructive" })}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
