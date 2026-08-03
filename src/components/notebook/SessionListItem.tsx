import Link from "next/link";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type Status = "pending" | "generating" | "ready" | "failed";

interface SessionListItemProps {
  id: string;
  title: string;
  paperTitle: string;
  status: Status;
  updatedAt: number;
}

const statusStyles: Record<Status, string> = {
  pending: "bg-stone-100 text-stone-600",
  generating: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

/** One row in the dashboard's session ("chat") list. */
export function SessionListItem({ id, title, paperTitle, status, updatedAt }: SessionListItemProps) {
  return (
    <Link href={`/sessions/${id}`}>
      <Card className="flex flex-row items-center justify-between transition-shadow hover:shadow-md">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{paperTitle}</CardDescription>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}>
            {status}
          </span>
          <span className="text-xs text-stone-400">{formatDate(updatedAt)}</span>
        </div>
      </Card>
    </Link>
  );
}
