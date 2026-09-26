import { config, higgsfield, HiggsfieldError } from "@higgsfield/client/v2";

config({
  credentials: process.env.HF_CREDENTIALS,
});

async function main() {
  const result = await higgsfield.subscribe("bytedance/seedance-2.5/text-to-video", {
    input: {
      prompt: "A cinematic scene at sunset",
      duration: 5,
      resolution: "720p",
      aspect_ratio: "16:9",
    },
    withPolling: true,
  });

  switch (result.status) {
    case "completed":
      console.log("Video generated successfully:");
      console.log(result.video?.url);
      return;
    case "failed":
      console.error("Generation failed. Full response:", result);
      process.exitCode = 1;
      return;
    case "nsfw":
      console.error("Generation was moderated (flagged as NSFW). Full response:", result);
      process.exitCode = 1;
      return;
    default:
      console.error(`Unexpected terminal status "${result.status}". Full response:`, result);
      process.exitCode = 1;
  }
}

main().catch((error) => {
  if (error instanceof HiggsfieldError) {
    console.error(`${error.constructor.name}: ${error.message}`);
  } else {
    console.error("Unexpected error:", error);
  }
  process.exitCode = 1;
});
