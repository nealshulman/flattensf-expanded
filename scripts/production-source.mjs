import { execFileSync } from 'node:child_process';

export function requireMain(branch, sourceSha, mainSha, isClean = true) {
  if (branch !== 'main' || !sourceSha || sourceSha !== mainSha || !isClean) {
    throw new Error('Production requires a clean checkout of the exact current origin/main commit.');
  }
  return sourceSha;
}

export function remoteMain(repository = 'origin') {
  return execFileSync('git', ['ls-remote', repository, 'refs/heads/main'], { encoding: 'utf8' }).trim().split(/\s/)[0];
}
