import { useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useSignedUrl } from "@/lib/media";

export function VideoPlayer({ path }: { path: string }) {
  const { data: url } = useSignedUrl(path);
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  function toggle() {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  if (!url) return <div className="aspect-square w-full bg-muted" />;

  return (
    <div className="relative w-full overflow-hidden bg-black">
      <video
        ref={ref}
        src={url}
        className="max-h-[70vh] w-full object-contain"
        loop
        playsInline
        muted={muted}
        onClick={toggle}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar vídeo" : "Reproduzir vídeo"}
        className="absolute inset-0 grid place-items-center transition-opacity"
      >
        {!playing && (
          <span className="grid h-16 w-16 place-items-center rounded-full bg-background/60 backdrop-blur">
            <Play className="h-7 w-7 fill-current" />
          </span>
        )}
        {playing && <Pause className="h-0 w-0 opacity-0" />}
      </button>
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Ativar som" : "Silenciar"}
        className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-background/60 backdrop-blur"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
}