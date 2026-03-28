import { CheckCircle, AlertCircle } from "lucide-react";

export type FeedbackMessage = { type: "success" | "error"; text: string };

export function FeedbackAlert({ feedback }: { feedback: FeedbackMessage }) {
  return (
    <div
      className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
        feedback.type === "error"
          ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
      }`}
    >
      {feedback.type === "success" ? (
        <CheckCircle className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      {feedback.text}
    </div>
  );
}
