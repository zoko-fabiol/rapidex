import fs from 'fs';
import git from 'isomorphic-git';

async function commitChanges() {
  const dir = process.cwd();
  const statusMatrix = await git.statusMatrix({ fs, dir });
  console.log('Status:');
  let count = 0;
  for (const [filepath, head, workdir, stage] of statusMatrix) {
    if (head !== workdir || workdir !== stage) {
      console.log(' -', filepath, `head=${head}, workdir=${workdir}, stage=${stage}`);
      if (workdir === 0) {
        await git.remove({ fs, dir, filepath });
      } else {
        await git.add({ fs, dir, filepath });
      }
      count++;
    }
  }

  if (count === 0) {
    console.log('No changes to commit.');
    return;
  }

  const sha = await git.commit({
    fs,
    dir,
    message: 'fix: initialisation automatique et resilience base de donnees Vercel serverless',
    author: {
      name: 'zoko-fabiol',
      email: 'fabiolzoko@gmail.com',
    },
  });

  console.log('✅ New Commit SHA:', sha);
}

commitChanges().catch(console.error);
