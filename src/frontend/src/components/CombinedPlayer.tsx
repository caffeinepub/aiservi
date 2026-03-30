import { Button } from "@/components/ui/button";
import { Film, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import type { Scene } from "../backend";
import { SceneStatus } from "../backend";

interface CombinedPlayerProps {
  scenes: Scene[];
  sceneVideoUrls: Record<string, string>;
}

export function CombinedPlayer({
  scenes,
  sceneVideoUrls,
}: CombinedPlayerProps) {
  const readyScenes = scenes
    .filter((s) => {
      const url = sceneVideoUrls[s.id] || s.videoUrl;
      return url;
    })
    .sort((a, b) => Number(a.order) - Number(b.order));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentScene = readyScenes[currentIndex];
  const currentUrl = currentScene
    ? sceneVideoUrls[currentScene.id] || currentScene.videoUrl
    : undefined;

  const handleEnded = useCallback(() => {
    if (currentIndex < readyScenes.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      // autoplay next
      setTimeout(() => {
        videoRef.current?.play();
      }, 100);
    } else {
      setIsPlaying(false);
    }
  }, [currentIndex, readyScenes.length]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    videoRef.current?.play();
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    videoRef.current?.pause();
  }, []);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(false);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < readyScenes.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(false);
    }
  }, [currentIndex, readyScenes.length]);

  if (readyScenes.length === 0) {
    return (
      <div
        className="w-full rounded-xl border border-border bg-card/50 flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground"
        data-ocid="player.empty_state"
      >
        <Film className="w-12 h-12 opacity-30" />
        <div className="text-center">
          <p className="font-medium">No videos ready yet</p>
          <p className="text-sm mt-1 opacity-70">
            Generate scene videos to preview them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4" data-ocid="player.panel">
      {/* Main video */}
      <div className="relative rounded-xl overflow-hidden border border-primary/20 bg-black glow-violet">
        {currentUrl ? (
          <video
            ref={videoRef}
            key={currentUrl}
            src={currentUrl}
            className="w-full aspect-video"
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <track kind="captions" />
          </video>
        ) : (
          <div className="w-full aspect-video flex items-center justify-center bg-black">
            <Film className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Overlay controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                data-ocid="player.pagination_prev"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/20 bg-white/10"
                onClick={isPlaying ? handlePause : handlePlay}
                data-ocid="player.toggle"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={handleNext}
                disabled={currentIndex === readyScenes.length - 1}
                data-ocid="player.pagination_next"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
            <span className="text-white/70 text-sm">
              Scene {currentIndex + 1} / {readyScenes.length}
            </span>
          </div>
        </div>
      </div>

      {/* Scene timeline */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {readyScenes.map((scene, i) => {
          const url = sceneVideoUrls[scene.id] || scene.videoUrl;
          return (
            <motion.button
              key={scene.id}
              onClick={() => {
                setCurrentIndex(i);
                setIsPlaying(false);
              }}
              className={`shrink-0 w-24 h-16 rounded-md border overflow-hidden transition-all ${
                i === currentIndex
                  ? "border-primary ring-1 ring-primary/50"
                  : "border-border hover:border-primary/40"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-ocid={`player.item.${i + 1}`}
            >
              {url ? (
                <video src={url} className="w-full h-full object-cover" muted />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Film className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
