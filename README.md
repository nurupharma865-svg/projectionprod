# ProjeTexte — projection des prédications

Application React + Vite destinée à importer, classer et projeter les messages de William Marrion Branham.

## Architecture

- **Aucun compte utilisateur** : pas de page de connexion, pas d'inscription, pas de rôles et aucune authentification Firebase. L'application s'ouvre directement.
- **Cloud Firestore** : métadonnées des prédications et points de projection.
- **Firebase Storage** : contenu des documents importés au format JSON. Les documents ne sont pas stockés dans un seul document Firestore (limite Firestore de 1 Mio).
- **Cloudflare Pages** : hébergement du frontend React/Vite.
- **GitHub** : dépôt source et déclenchement du build Cloudflare à chaque push.

Les années des prédications sont les deux chiffres du début du titre : 46 = 1946, 47 = 1947, …, 65 = 1965. La bibliothèque trie les prédications par année décroissante.

## 1. Créer et configurer Firebase

1. Créer un projet dans [Firebase Console](https://console.firebase.google.com/).
2. Ajouter une application Web et récupérer les cinq valeurs de configuration Firebase indiquées dans `.env.example`.
3. Créer la base **Cloud Firestore**.
4. Activer **Firebase Storage**.
5. Copier `.env.example` vers `.env` et renseigner les valeurs `VITE_FIREBASE_*`.

**Important — application sans comptes :** pour que l'application fonctionne sans connexion, les règles Firestore et Storage autorisent la lecture, l'ajout, la modification et la suppression des données sans authentification. Cela signifie que toute personne qui accède à l'application peut potentiellement modifier ou supprimer les prédications. C'est cohérent avec une bibliothèque publique partagée, mais ce n'est pas adapté à des données privées ou à une application dont les modifications doivent être réservées à un administrateur. Pour protéger les modifications sans afficher d'écran de connexion, il faudra ajouter une API Cloudflare Worker avec une clé d'administration conservée côté serveur.

## 2. Déployer les règles Firebase

Installer les dépendances puis lancer :

```bash
npm install
npm run deploy:firebase-rules
```

La commande utilise Firebase CLI et demandera de se connecter à Firebase depuis le terminal de déploiement. Pour lier explicitement le projet, créer `.firebaserc` avec :

```json
{
  "projects": { "default": "VOTRE_FIREBASE_PROJECT_ID" }
}
```

## 3. Lancer en local

```bash
cp .env.example .env
# renseigner les variables Firebase
npm install
npm run dev
```

## 4. Déployer sur Cloudflare Pages depuis GitHub

1. Pousser ce dossier sur un dépôt GitHub.
2. Dans Cloudflare Dashboard, ouvrir **Workers & Pages > Create > Pages > Connect to Git**.
3. Choisir le dépôt GitHub.
4. Paramètres de build :
   - Framework preset : **Vite**
   - Build command : `npm run build`
   - Build output directory : `dist`
5. Dans **Settings > Environment variables**, ajouter les cinq variables `VITE_FIREBASE_*` pour Production et Preview.
6. Déployer. Chaque push sur la branche de production déclenchera un nouveau déploiement.

Le fichier `wrangler.toml` et `public/_redirects` sont déjà préparés pour Cloudflare Pages et le routage SPA.

## 5. Déploiement manuel Cloudflare (optionnel)

```bash
npm run deploy:cloudflare
```

La première exécution de Wrangler demandera une authentification Cloudflare et la sélection/création du projet Pages `projetexte`.

## Notes importantes

- Aucun secret Admin Firebase n'est placé dans le frontend.
- Firebase Authentication n'est ni importé ni utilisé par l'application.
- Le partage téléphone utilise un code à six caractères. Avec des règles publiques, ce code sert à retrouver une prédication mais ne constitue pas une protection d'accès.
- Si le projet Firebase est neuf, déployer les règles avant d'utiliser l'application.
