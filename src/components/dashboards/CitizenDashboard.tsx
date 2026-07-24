import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, MapPin, Siren, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { createIncident, listMyIncidents } from "@/lib/incidents.functions";
import { IncidentsMap, type MapIncident } from "@/components/maps/IncidentsMap";
import { IncidentStatusBadge, IncidentTypeIcon, TYPE_LABEL, type IncidentType } from "./shared";

type SelectedImage = { file: File; preview: string };

export function CitizenDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const createFn = useServerFn(createIncident);
  const listFn = useServerFn(listMyIncidents);

  const [type, setType] = useState<IncidentType>("medical");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [locating, setLocating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const incidents = useQuery({ queryKey: ["my-incidents"], queryFn: () => listFn() });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      // 1. Upload images to storage under {userId}/{ts}-name
      const paths: string[] = [];
      for (const img of images) {
        const path = `${user.id}/${Date.now()}-${img.file.name.replace(/[^\w.-]+/g, "_")}`;
        const { error } = await supabase.storage
          .from("incident-media")
          .upload(path, img.file, { contentType: img.file.type });
        if (error) throw error;
        paths.push(path);
      }
      return createFn({
        data: {
          type,
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          lat: coords?.lat,
          lng: coords?.lng,
          mediaPaths: paths,
        },
      });
    },
    onSuccess: () => {
      toast.success("SOS sent. Responders have been alerted.");
      setDescription("");
      setAddress("");
      setImages([]);
      setCoords(null);
      qc.invalidateQueries({ queryKey: ["my-incidents"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function pickImages(files: FileList | null) {
    if (!files) return;
    const next: SelectedImage[] = [];
    for (const f of Array.from(files).slice(0, 6 - images.length)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} is too large (max 5MB)`);
        continue;
      }
      next.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setImages((prev) => [...prev, ...next]);
  }

  function locate() {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Location captured");
      },
      (err) => {
        setLocating(false);
        toast.error(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <Siren className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold">Report an emergency</h1>
            <p className="text-sm text-muted-foreground">
              Choose the type, add details, tap SOS. Responders get an alert instantly.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Emergency type
            </label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {(["medical", "fire", "police", "traffic", "other"] as IncidentType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition ${type === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/40"}`}
                >
                  <IncidentTypeIcon type={t} className="h-5 w-5" />
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              What's happening?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Briefly describe the situation…"
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              maxLength={2000}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Address / landmark
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12 Awolowo Rd, Ikoyi"
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                GPS
              </label>
              <button
                type="button"
                onClick={locate}
                disabled={locating}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Use my location"}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Photos ({images.length}/6)
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {images.map((img, i) => (
                <div key={img.preview} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                  <img src={img.preview} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 shadow"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                >
                  <Camera className="h-5 w-5" />
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                pickImages(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          <button
            onClick={() => submit.mutate()}
            disabled={submit.isPending}
            className="mt-2 flex h-16 items-center justify-center gap-3 rounded-2xl bg-destructive text-lg font-bold uppercase tracking-wider text-destructive-foreground shadow-lg transition hover:bg-destructive/90 disabled:opacity-70"
          >
            {submit.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Siren className="h-6 w-6" />}
            Send SOS
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Your reports</h2>
        <p className="text-sm text-muted-foreground">Latest first. Live-updated when responders act.</p>
        <div className="mt-4 grid gap-3">
          {incidents.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {incidents.data && incidents.data.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No reports yet. Your SOS history will appear here.
            </div>
          )}
          {incidents.data?.map((i) => (
            <div key={i.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <IncidentTypeIcon type={i.type as IncidentType} className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{TYPE_LABEL[i.type as IncidentType]}</span>
                </div>
                <IncidentStatusBadge status={i.status} />
              </div>
              {i.description && <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{i.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{new Date(i.created_at).toLocaleString()}</span>
                {i.address && <span>· {i.address}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
