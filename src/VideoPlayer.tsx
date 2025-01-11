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
  const hlsRef = useRef<Hls | null>(null); // Store the HLS instance
  const [qualityLevels, setQualityLevels] = useState<{ label: string; index: number }[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 means auto
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    console.log("VideoPlayer mounted. Checking HLS support...");
    if (Hls.isSupported() && videoRef.current) {
      console.log("HLS is supported. Initializing HLS...");
      const hls = new Hls();
      hlsRef.current = hls; // Save the instance for later use

      console.log("Loading source:", src);
      hls.loadSource(src);

      console.log("Attaching media...");
      hls.attachMedia(videoRef.current);

      // Populate quality levels when available
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("Manifest parsed. Quality levels available.");
        const levels = hls.levels.map((level, index) => ({
          label: `${level.height}p`,
          index,
        }));
        console.log("Available quality levels:", levels);
        setQualityLevels(levels);
      });

      // Adaptive bitrate adjustment and buffering events
      hls.on(Hls.Events.BUFFER_APPENDING, () => {
        console.log("Buffering in progress...");
        setIsBuffering(true);
      });

      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        console.log("Buffering completed.");
        setIsBuffering(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data);
      });

      return () => {
        console.log("Cleaning up HLS instance...");
        hls.destroy();
        hlsRef.current = null;
      };
    } else {
      console.warn("HLS is not supported on this browser.");
    }
  }, [src]);

  // Handle manual quality change
  const handleQualityChange = (level: number) => {
    console.log("Quality change requested. Selected level:", level);
    setSelectedQuality(level);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level; // Update the current level
      console.log("HLS current level set to:", level);
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
