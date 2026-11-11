"use client";

import { useState } from "react";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { MapMarker, MarkerContent, useMap } from "@/components/ui/map";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Zoom y ubicación con el mismo esmalte de la carcasa. */
export function MapButtons({ className }: { className?: string }) {
  const { map } = useMap();
  const { t } = useLang();
  const [me, setMe] = useState<{ lon: number; lat: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lon: p.coords.longitude, lat: p.coords.latitude };
        setMe(pos);
        setLocating(false);
        map?.flyTo({ center: [pos.lon, pos.lat], zoom: 15, duration: 900 });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  const btn =
    "bg-enamel text-porcelain border-enamel-line hover:bg-enamel-raised grid size-10 place-items-center border transition-colors disabled:opacity-50";

  return (
    <>
      <div className={cn("flex flex-col", className)}>
        <div className="flex flex-col overflow-hidden rounded-[4px]">
          <button
            type="button"
            className={cn(btn, "rounded-t-[4px] border-b-0")}
            aria-label={t.zoomIn}
            onClick={() => map?.zoomIn()}
          >
            <Plus className="size-[18px]" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className={cn(btn, "rounded-b-[4px]")}
            aria-label={t.zoomOut}
            onClick={() => map?.zoomOut()}
          >
            <Minus className="size-[18px]" strokeWidth={1.75} />
          </button>
        </div>
        <button
          type="button"
          className={cn(btn, "mt-2 rounded-[4px]")}
          aria-label={t.locate}
          disabled={locating}
          onClick={locate}
        >
          <LocateFixed className={cn("size-[18px]", locating && "animate-pulse")} strokeWidth={1.75} />
        </button>
      </div>
      {me && (
        <MapMarker longitude={me.lon} latitude={me.lat}>
          <MarkerContent>
            {/* «Usted está aquí»: área de precisión + disco con punto central, forma que ningún bus usa */}
            <span className="grid size-7 place-items-center rounded-full bg-[rgba(19,32,58,0.12)]">
              <span className="border-enamel bg-porcelain grid size-4 place-items-center rounded-full border-2 shadow-[0_1px_3px_rgba(19,32,58,0.4)]">
                <span className="bg-enamel block size-1.5 rounded-full" />
              </span>
            </span>
          </MarkerContent>
        </MapMarker>
      )}
    </>
  );
}
