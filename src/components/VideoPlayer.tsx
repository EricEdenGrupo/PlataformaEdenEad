import { useEffect, useRef } from "react";
import Player from "@vimeo/player";
import type { PlayerEventMap } from "@vimeo/player";

/** Todos os eventos expostos pelo Player.js (https://github.com/vimeo/player.js/#events) */
export type VimeoPlayerCallbacks = Partial<{
  [E in keyof PlayerEventMap]: (data: PlayerEventMap[E]) => void;
}>;

interface VideoPlayerProps {
  videoId: string;
  type?: "youtube" | "vimeo";
  /** Só aplicado quando `type === "vimeo"`. */
  vimeoCallbacks?: VimeoPlayerCallbacks;
}

const YoutubeFrame = ({ videoId }: { videoId: string }) => {
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  return (
    <div className="relative w-full pt-[56.25%] bg-black rounded-lg overflow-hidden">
      <iframe
        className="absolute inset-0 w-full h-full"
        src={embedUrl}
        title="Video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

const VimeoSdkPlayer = ({
  videoId,
  vimeoCallbacks,
}: {
  videoId: string;
  vimeoCallbacks?: VimeoPlayerCallbacks;
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const callbacksRef = useRef(vimeoCallbacks);
  callbacksRef.current = vimeoCallbacks;

  useEffect(() => {
    const el = hostRef.current;
    if (!el || !videoId) return;

    const numericId = Number(videoId);
    const useNumericId = Number.isFinite(numericId) && numericId > 0;
    const player = new Player(el, useNumericId ? { id: numericId } : { url: `https://vimeo.com/${videoId}` });
    playerRef.current = player;

    const cleanups: Array<() => void> = [];

    const register = <E extends keyof PlayerEventMap>(eventName: E) => {
      const handler = (data: PlayerEventMap[E]) => {
        const fn = (callbacksRef.current as VimeoPlayerCallbacks | undefined)?.[eventName];
        (fn as ((payload: PlayerEventMap[E]) => void) | undefined)?.(data);
      };
      player.on(eventName, handler as (d: PlayerEventMap[E]) => void);
      cleanups.push(() => {
        player.off(eventName, handler as (d: PlayerEventMap[E]) => void);
      });
    };

    const wired: (keyof PlayerEventMap)[] = [
      "play",
      "playing",
      "pause",
      "ended",
      "timeupdate",
      "progress",
      "seeking",
      "seeked",
      "loaded",
      "loadedmetadata",
      "volumechange",
      "error",
      "durationchange",
      "bufferstart",
      "bufferend",
      "fullscreenchange",
    ];

    for (const ev of wired) {
      register(ev);
    }

    return () => {
      cleanups.forEach((u) => u());
      void player.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  return (
    <div className="relative w-full pt-[56.25%] bg-black rounded-lg overflow-hidden">
      <div ref={hostRef} className="absolute inset-0 w-full h-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
    </div>
  );
};

const VideoPlayer = ({ videoId, type = "youtube", vimeoCallbacks }: VideoPlayerProps) => {
  if (!videoId) {
    return (
      <div className="relative w-full pt-[56.25%] bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
        Vídeo indisponível
      </div>
    );
  }

  if (type === "youtube") {
    return <YoutubeFrame videoId={videoId} />;
  }

  return <VimeoSdkPlayer videoId={videoId} vimeoCallbacks={vimeoCallbacks} />;
};

export default VideoPlayer;
