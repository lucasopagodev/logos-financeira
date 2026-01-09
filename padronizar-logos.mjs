import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const INPUT_JSON = "instituicoes-br.json";
const OUTPUT_JSON = "instituicoes-br.padrao.json";
const OUTPUT_DIR = "logos";

const TARGET_SIZE = 512;
const PADDING_PERCENT = 18;
const INNER_SIZE = Math.round(TARGET_SIZE * (1 - (PADDING_PERCENT / 100)));

// Se quiser “reprocessar tudo”, mude para true (ou controle por env/args).
const FORCE_REPROCESS = false;

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function safeFilename(id) {
  return `${id}.png`;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadToBuffer(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Falha ao baixar: ${url} | status=${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function toStandardPng(inputBuffer) {
  const img = sharp(inputBuffer, { density: 600 });

  const rendered = await img
    .resize(INNER_SIZE, INNER_SIZE, { fit: "inside" })
    .png()
    .toBuffer();

  const canvas = sharp({
    create: {
      width: TARGET_SIZE,
      height: TARGET_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  const meta = await sharp(rendered).metadata();
  const left = Math.floor((TARGET_SIZE - (meta.width ?? INNER_SIZE)) / 2);
  const top = Math.floor((TARGET_SIZE - (meta.height ?? INNER_SIZE)) / 2);

  return await canvas
    .composite([{ input: rendered, left, top }])
    .png()
    .toBuffer();
}

function shouldProcess(inst, expectedOutPath, existsOnDisk) {
  // Regra 1: se FORCE=true, sempre processa
  if (FORCE_REPROCESS) return true;

  // Regra 2: se já existe um arquivo no destino, não processa
  if (existsOnDisk) return false;

  // Regra 3: se já tem localPath apontando para algo existente, não processa
  // (cobre cenários onde você mudou o nome do arquivo ou diretório)
  // Observação: se localPath existir mas o arquivo não existir, processa.
  return true;
}

async function main() {
  const raw = await fs.readFile(INPUT_JSON, "utf-8");
  const data = JSON.parse(raw);

  await ensureDir(OUTPUT_DIR);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const inst of data.institutions) {
    const url = inst.logo?.downloadUrl;
    if (!url) {
      skipped++;
      continue;
    }

    const filename = safeFilename(inst.id);
    const outPath = path.join(OUTPUT_DIR, filename);

    const outAlreadyExists = await fileExists(outPath);

    // Se localPath existir, checa também
    const localPathExists =
      inst.logo?.localPath ? await fileExists(inst.logo.localPath) : false;

    // Decide se processa
    if (!shouldProcess(inst, outPath, outAlreadyExists || localPathExists)) {
      // Opcional: garantir consistência no JSON (se existe no destino e localPath vazio)
      if (!inst.logo.localPath && outAlreadyExists) {
        inst.logo.localPath = outPath;
      }
      skipped++;
      continue;
    }

    try {
      const buf = await downloadToBuffer(url);
      const outPng = await toStandardPng(buf);

      await fs.writeFile(outPath, outPng);

      inst.logo.localPath = outPath;
      processed++;
      console.log(`OK: ${inst.name} -> ${outPath}`);
    } catch (err) {
      failed++;
      console.warn(`ERRO: ${inst.name} (${inst.id}) -> ${err.message}`);
    }
  }

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(data, null, 2), "utf-8");

  console.log("\nResumo:");
  console.log(`- Processadas: ${processed}`);
  console.log(`- Puladas:     ${skipped}`);
  console.log(`- Falharam:    ${failed}`);
  console.log(`\nGerado: ${OUTPUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
