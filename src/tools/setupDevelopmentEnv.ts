const denoLayerVersion = "1.20.6";
await Deno.run({ cmd: [
  "curl",
  "-L",
  `https://github.com/hayd/deno-lambda/releases/download/${denoLayerVersion}/deno-lambda-layer.zip`,
  "-o",
  "./tmp/deno-lambda-layer.zip"
] }).status();
await Deno.run({ cmd: [
  "unzip",
  "./tmp/deno-lambda-layer.zip",
  "-d",
  "./tmp/deno-lambda-layer"
] });
