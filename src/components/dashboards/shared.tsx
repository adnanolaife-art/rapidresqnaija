import { Heart, Flame, Shield, Car, AlertTriangle, type LucideIcon } from "lucide-react";

export type IncidentType = "medical" | "fire" | "police" | "traffic" | "other";

export const TYPE_LABEL: Record<IncidentType, string> = {
  medical: "Medical",
  fire: "Fire",
  police: "Police",
  traffic: "Traffic",
  other: "Other",
};

const ICONS: Record<IncidentType, LucideIcon> = {
  medical: Heart,
  fire: Flame,
  police: Shield,
  traffic: Car,
  other: AlertTriangle,
};

export function IncidentTypeIcon({ type, className }: { type: IncidentType; className?: string }) {
  const Icon = ICONS[type] ?? AlertTriangle;
  return <Icon className={className} />;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200",
  en_route: "bg-indigo-100 text-indigo-800 border-indigo-200",
  on_scene: "bg-purple-100 text-purple-800 border-purple-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export function IncidentStatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}
