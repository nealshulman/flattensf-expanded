import { execFileSync } from 'node:child_process';
import { requireMain, remoteMain } from './production-source.mjs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const branch = git('branch', '--show-current');
const sha = requireMain(branch, git('rev-parse', 'HEAD'), remoteMain(), git('status', '--porcelain') === '');
console.log(`Verified production source: ${branch} ${sha}, matching origin/main.`);
execFileSync('vercel', ['deploy', '--prod', '--yes', '--scope', 'neal-3955s-projects',
  '--build-env', `DEPLOY_SOURCE_BRANCH=${branch}`, '--build-env', `DEPLOY_SOURCE_SHA=${sha}`], { stdio: 'inherit' });
