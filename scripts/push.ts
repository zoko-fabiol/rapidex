import fs from 'fs';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

async function push() {
  const token = process.argv[2] || process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('\n⚠️ Pour pousser sur GitHub, un Personal Access Token (PAT) est requis.');
    console.error('Usage : bun run push <VOTRE_TOKEN_GITHUB>');
    console.error('Exemple : bun run push ghp_xxxxxxxxxxxxxxxxxxxx\n');
    console.error('Pour générer un token en 30 secondes :');
    console.error('https://github.com/settings/tokens/new (cochez la case "repo")\n');
    process.exit(1);
  }

  console.log('[Rapidex] Envoi vers https://github.com/zoko-fabiol/rapidex.git (branche main)...');
  try {
    const result = await git.push({
      fs,
      http,
      dir: process.cwd(),
      remote: 'origin',
      ref: 'main',
      url: 'https://github.com/zoko-fabiol/rapidex.git',
      onAuth: () => ({ username: token, password: '' }),
    });

    if (result.ok) {
      console.log('🎉 Push réussi avec succès sur https://github.com/zoko-fabiol/rapidex.git !');
    } else {
      console.error('❌ Erreur lors du push:', result);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Échec du push :', message);
  }
}

push();
