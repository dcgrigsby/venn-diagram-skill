import { link, lstat, mkdir, open, rename, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

const owned = new Map();
const overwriteAllowed = new Set();

function sameFile(first, second) {
  return first.dev === second.dev && first.ino === second.ino;
}

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function reservePair(svgPath, pngPath, lockPath) {
  const handle = await open(lockPath, 'wx');
  const identity = await handle.stat();
  let remaining = 2;
  const releaseLock = async () => {
    await handle.close();
    try {
      if (sameFile(await lstat(lockPath), identity)) await unlink(lockPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  };
  const makeReservation = (path) => {
    let active = true;
    const reservation = {
      path,
      async release() {
        if (!active) return;
        active = false;
        owned.delete(path);
        remaining -= 1;
        if (remaining === 0) await releaseLock();
      },
    };
    owned.set(path, reservation);
    return reservation;
  };
  return { svgPath, pngPath, svgReservation: makeReservation(svgPath),
    pngReservation: makeReservation(pngPath) };
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
    let pair;
    try {
      const lockPath = join(output.directory, `.${basename}.venn-reservation`);
      pair = await reservePair(svgPath, pngPath, lockPath);
      if (await exists(svgPath) || await exists(pngPath)) {
        await pair.svgReservation.release();
        await pair.pngReservation.release();
        continue;
      }
      return pair;
    } catch (error) {
      if (pair) {
        await pair.svgReservation.release();
        await pair.pngReservation.release();
      }
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
    if (reservation) {
      await link(tempPath, path);
      await unlink(tempPath);
      await reservation.release();
    } else {
      await rename(tempPath, path);
    }
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
