import path from 'path';
import { getLogger } from 'appium-logger';
import { system, tempDir, fs } from 'appium-support';


const log = getLogger('WinAppDriver Install');
const CD_PLATS = ["win"];
const CD_ARCHS = ["32", "64"];

// XXYD TODO: update to use the npm install script exports which include get WAD install path

function getWinAppDriverDir () {
  return path.resolve("c://program files (x86)/Windows Application Driver");
}

async function getWinAppDriverBinaryPath (platform = null, arch = null) {
  const baseDir = getWinAppDriverDir();
  let ext = ".exe";
  return path.resolve(baseDir, `winappdriver${ext}`);
}

function validatePlatform (platform, arch) {
  if (!_.contains(CD_PLATS, platform)) {
    throw new Error(`Invalid platform: ${platform}`);
  }
  if (!_.contains(CD_ARCHS, arch)) {
    throw new Error(`Invalid arch: ${arch}`);
  }
}

export { getWinAppDriverBinaryPath };
