import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import "./styles.css";

interface Subtitle {
  src: string;
  lang: string;
  label: string;
}

interface VideoPlayerProps {
  src: string; // HLS video source
  width?: string; // Player width
  height?: string; // Player height
  subtitles?: Subtitle[]; // Optional subtitles
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  width = "640px",
  height = "360px",
  subtitles = [],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qualityLevels, setQualityLevels] = useState<{ label: string; index: number }[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 means auto
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    if (Hls.isSupported() && videoRef.current) {
      const hls = new Hls();

      hls.loadSource(src);
      hls.attachMedia(videoRef.current);

      // Populate quality levels when available
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map((level, index) => ({
          label: `${level.height}p`,
          index,
        }));
        setQualityLevels(levels);
      });

      // Adaptive bitrate adjustment
      hls.on(Hls.Events.FRAG_LOADED, () => {
        const bandwidthEstimate = hls.bandwidthEstimate;
        console.log("Estimated Bandwidth:", bandwidthEstimate, "bps");

        // Optional: Add custom logic to adjust quality dynamically
        if (bandwidthEstimate < 1000000) {
          hls.currentLevel = 0; // Force low quality
        } else if (bandwidthEstimate < 3000000) {
          hls.currentLevel = 1; // Medium quality
        } else {
          hls.currentLevel = -1; // Auto quality
        }
      });

      // Buffering indication
      hls.on(Hls.Events.BUFFER_APPENDING, () => {
        console.log("Buffering in progress...");
        setIsBuffering(true); // Show buffering indicator
      });

      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        console.log("Buffering completed.");
        setIsBuffering(false); // Hide buffering indicator
      });

      hls.on(Hls.Events.BUFFER_EOS, () => {
        console.log("No more data will be added to the buffer.");
      });

      hls.on(Hls.Events.BACK_BUFFER_REACHED, (event, data) => {
        console.log(`Back buffer reached at buffer end: ${data.bufferEnd}`);
      });


      return () => {
        hls.destroy();
      };
    }
  }, [src]);

  // Handle manual quality change
  const handleQualityChange = (level: number) => {
    setSelectedQuality(level);
    if (videoRef.current && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
      hls.currentLevel = level; // Update the current level
    }
  };

  return (
    <div style={{ width, height, position: "relative", background: "black" }}>
      <video
        ref={videoRef}
        style={{ width: "100%", height: "100%" }}
        controls
        crossOrigin="anonymous"
      >
        {subtitles.map((subtitle, index) => (
          <track
            key={index}
            src={subtitle.src}
            kind="subtitles"
            srcLang={subtitle.lang}
            label={subtitle.label}
          />
        ))}
      </video>

      {/* Quality Selector */}
      {qualityLevels.length > 0 && (
        <select
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            background: "rgba(0, 0, 0, 0.5)",
            color: "white",
            border: "none",
            padding: "5px",
          }}
          value={selectedQuality}
          onChange={(e) => handleQualityChange(parseInt(e.target.value))}
        >
          <option value={-1}>Auto</option>
          {qualityLevels.map((level) => (
            <option key={level.index} value={level.index}>
              {level.label}
            </option>
          ))}
        </select>
      )}

      {/* Buffering Indicator */}
      {isBuffering && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            background: "rgba(0, 0, 0, 0.8)",
            padding: "10px",
            borderRadius: "5px",
          }}
        >
          Buffering...
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
