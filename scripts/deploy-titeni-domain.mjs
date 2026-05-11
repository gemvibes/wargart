import { spawnSync } from "node:child_process";

const DOMAIN = "titeni.vercel.app";
const NPX_COMMAND = process.platform === "win32" ? "npx.cmd" : "npx";

function runCommand(args) {
  const result = spawnSync(NPX_COMMAND, args, {
    encoding: "utf8",
    stdio: "pipe"
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function extractProductionUrl(output) {
  const match = output.match(/Production:\s+(https:\/\/[^\s]+)/);
  if (!match) {
    throw new Error(
      "URL deployment produksi tidak ditemukan dari output Vercel. Jalankan alias set manual jika diperlukan."
    );
  }
  return match[1];
}

try {
  const deployOutput = runCommand(["vercel", "--prod", "--yes"]);
  const deploymentUrl = extractProductionUrl(deployOutput);

  console.log(`\nMenautkan ${DOMAIN} ke ${deploymentUrl}...\n`);
  runCommand(["vercel", "alias", "set", deploymentUrl, DOMAIN]);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Deploy Titeni gagal diproses.");
  process.exit(1);
}
