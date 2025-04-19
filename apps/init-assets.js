import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyAssets(targetDir) {
  const sourceDir = path.join(__dirname, 'assets');
  const assetsTargetDir = path.join(targetDir, 'assets');

  try {
    if (await fs.pathExists(assetsTargetDir)) {
      await fs.remove(assetsTargetDir);
      console.log(`Successfully removed existing assets directory: ${assetsTargetDir}`);
    }

    await fs.copy(sourceDir, assetsTargetDir, { recursive: true });
    console.log(`Successfully copied assets from ${sourceDir} to ${assetsTargetDir}`);
  } catch (err) {
    console.error(`Failed to copy assets: ${err}`);
  }
}

const targetDir = process.argv[2];

if (!targetDir) {
  console.error('Please provide a target directory as a command line argument.');
  process.exit(1);
}

copyAssets(targetDir);
