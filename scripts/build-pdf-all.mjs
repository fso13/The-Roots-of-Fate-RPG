#!/usr/bin/env node
// Сборка всех PDF: книга игрока, хранителя, полное + Cairn-варианты
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const JOBS = [
  ["node", ["scripts/build-pdf.mjs", "--audience", "player"]],
  ["node", ["scripts/build-pdf.mjs", "--audience", "keeper"]],
  ["node", ["scripts/build-pdf.mjs", "--audience", "all"]],
  ["node", ["scripts/build-pdf-cairn.mjs", "--audience", "player"]],
  ["node", ["scripts/build-pdf-cairn.mjs", "--audience", "keeper"]],
  ["node", ["scripts/build-pdf-cairn.mjs", "--audience", "all"]],
  ["node", ["scripts/build-pdf-pack.mjs", "--all-modules"]],
  ["node", ["scripts/build-pdf-pack.mjs", "--all-adventures"]],
];

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        PLAYWRIGHT_BROWSERS_PATH: path.join(ROOT, ".playwright-browsers"),
      },
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`));
    });
  });
}

async function main() {
  console.log("Сборка PDF: книги + модули + приключения…\n");
  for (const [cmd, args] of JOBS) {
    await run(cmd, args);
    console.log("");
  }
  console.log("Обновление сайта (ссылки на скачивание)…");
  await run("node", ["website/build.mjs"]);
  console.log("Готово: public/*.pdf + index.html");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
