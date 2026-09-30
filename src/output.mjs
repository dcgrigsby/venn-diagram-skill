import { mkdir, open, rename, stat, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

const owned = new Map();
const overwriteAllowed = new Set();

function sameFile(first, second) {
  return first.dev === second.dev && first.ino === second.ino;
}

async function reserve(path) {
  const handle = await open(path, 'wx');
  const identity = await handle.stat();
  let active = true;
  let closed = false;
  const close = async () => {
    if (closed) return;
    await handle.close();
    closed = true;
  };
  const reservation = {
    path,
    async release() {
      if (!active) return;
      active = false;
      owned.delete(path);
      await close();
      try {
        if (sameFile(await stat(path), identity)) await unlink(path);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    },
    async prepareCommit() {
      if (!active) throw new Error(`output reservation is no longer active: ${path}`);
      if (!sameFile(await stat(path), identity)) {
        throw new Error(`output reservation changed: ${path}`);
      }
      await close();
    },
    finishCommit() {
      active = false;
      owned.delete(path);
    },
  };
  owned.set(path, reservation);
  return reservation;
}

export async function reserveOutputPair(output) {
  await mkdir(output.directory, { recursive: true });
  for (let suffix = 1; ; suffix += 1) {
    const basename = suffix === 1 ? output.basename : `${output.basename}-${suffix}`;
    const svgPath = join(output.directory, `${basename}.svg`);
    const pngPath = join(output.directory, `${basename}.png`);
    if (output.overwrite) {
      overwriteAllowed.add(svgPath);
      overwriteAllowed.add(pngPath);
      return { svgPath, pngPath,
        svgReservation: { path: svgPath, release: async () => { overwriteAllowed.delete(svgPath); } },
        pngReservation: { path: pngPath, release: async () => { overwriteAllowed.delete(pngPath); } } };
    }
    let svgReservation;
    try {
      svgReservation = await reserve(svgPath);
      const pngReservation = await reserve(pngPath);
      return { svgPath, pngPath, svgReservation, pngReservation };
    } catch (error) {
      if (svgReservation) await svgReservation.release();
      if (error.code === 'EEXIST') continue;
      throw error;
    }
  }
}

export async function atomicWrite(path, bytes) {
  const reservation = owned.get(path);
  if (!reservation && !overwriteAllowed.has(path)) {
    throw new Error(`output path has not been reserved: ${path}`);
  }
  const tempPath = join(dirname(path), `.${randomUUID()}.venn-tmp`);
  let handle;
  try {
    handle = await open(tempPath, 'wx');
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = null;
    if (reservation) await reservation.prepareCommit();
    await rename(tempPath, path);
    if (reservation) reservation.finishCommit();
    overwriteAllowed.delete(path);
  } catch (error) {
    const cleanupErrors = [];
    if (handle) {
      try { await handle.close(); } catch (cleanupError) { cleanupErrors.push(cleanupError); }
    }
    try { await unlink(tempPath); } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') cleanupErrors.push(cleanupError);
    }
    if (reservation) {
      try { await reservation.release(); } catch (cleanupError) { cleanupErrors.push(cleanupError); }
    }
    if (cleanupErrors.length) error.cleanupErrors = cleanupErrors;
    throw error;
  }
}
