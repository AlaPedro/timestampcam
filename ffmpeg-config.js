import { FFmpeg } from "@ffmpeg/ffmpeg";
import coreURL from "@ffmpeg/core/dist/ffmpeg-core.js?url";
import wasmURL from "@ffmpeg/core/dist/ffmpeg-core.wasm?url";

let ffmpeg;

export async function getFFmpeg() {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL,
      wasmURL,
    });
  }
  return ffmpeg;
}
