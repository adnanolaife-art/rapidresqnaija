import { useEffect, useRef } from "react";
import type { IncidentType } from "@/components/dashboards/shared";

export type MapIncident = {
  id: string;
  lat: number | null;
  lng: number | null;
  type: string;
  status: string;
  address?: string | null;
  description?: string | null;
  created_at?: string;
};

const TYPE_COLOR: Record<string, string> = {
  medical: "#e11d48",
  fire: "#ea580c",
  police: "#1d4ed8",
  traffic: "#7c3aed",
  other: "#525252",
};

export function IncidentsMap({
  incidents,
  height = 360,
  className = "",
}: {
  incidents: MapIncident[];
  height?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const layerRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;
      // @ts-expect-error runtime shape
      if (!mapRef.current) {
        // @ts-expect-error leaflet map
        mapRef.current = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
          [9.082, 8.6753],
          6,
        );
        // @ts-expect-error leaflet tile
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(mapRef.current);
      }
      // @ts-expect-error remove old layer
      if (layerRef.current) mapRef.current.removeLayer(layerRef.current);

      const points = incidents.filter(
        (i) => typeof i.lat === "number" && typeof i.lng === "number",
      );
      // @ts-expect-error leaflet group
      const group = L.layerGroup();
      for (const i of points) {
        const color = TYPE_COLOR[i.type] ?? "#525252";
        // @ts-expect-error leaflet
        const marker = L.circleMarker([i.lat!, i.lng!], {
          radius: 9,
          weight: 2,
          color: "#fff",
          fillColor: color,
          fillOpacity: 0.95,
        });
        const popup = `
          <div style="font-family:inherit;font-size:12px;min-width:160px">
            <div style="font-weight:600;text-transform:capitalize">${i.type} · ${i.status.replace("_", " ")}</div>
            ${i.address ? `<div style="color:#555;margin-top:2px">${escapeHtml(i.address)}</div>` : ""}
            ${i.description ? `<div style="margin-top:4px">${escapeHtml(i.description)}</div>` : ""}
            ${i.created_at ? `<div style="color:#888;margin-top:4px">${new Date(i.created_at).toLocaleString()}</div>` : ""}
          </div>`;
        marker.bindPopup(popup);
        // @ts-expect-error layer add
        group.addLayer(marker);
      }
      // @ts-expect-error map ref
      group.addTo(mapRef.current);
      layerRef.current = group;

      if (points.length > 0) {
        // @ts-expect-error latlng bounds
        const bounds = L.latLngBounds(points.map((p) => [p.lat!, p.lng!]));
        // @ts-expect-error fit
        mapRef.current.fitBounds(bounds.pad(0.25), { maxZoom: 14 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [incidents]);

  useEffect(() => {
    return () => {
      // @ts-expect-error cleanup on unmount
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className={`w-full overflow-hidden rounded-2xl border border-border ${className}`}
    />
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}
