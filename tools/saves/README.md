# RetroArch Cloud Save Manager

PWA légère (HTML/CSS/JS pur, sans backend) pour envoyer vos fichiers de
sauvegarde RetroArch vers un dossier dédié de votre Google Drive, et les
récupérer depuis n'importe quel autre appareil.

Elle ne touche jamais à vos autres fichiers Drive : elle ne peut voir/modifier
que le dossier `RetroArch Saves` qu'elle crée elle-même (scope
`drive.file`).

## 1. Créer l'identifiant OAuth Google (obligatoire)

L'app tourne entièrement dans le navigateur : il faut un "Client ID" OAuth
pour l'autoriser à parler à l'API Google Drive avec votre compte.

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com/) et créez un projet (ou réutilisez-en un).
2. Menu **API et services → Bibliothèque** → cherchez **Google Drive API** → **Activer**.
3. Menu **API et services → Écran de consentement OAuth** :
   - Type : *External* (sauf si vous avez un Google Workspace).
   - Renseignez un nom d'app, un email de support, un email de contact.
   - Dans **Scopes**, vous pouvez ajouter `.../auth/drive.file`.
   - Dans **Test users** (tant que l'app n'est pas publiée), ajoutez votre propre adresse Gmail.
4. Menu **API et services → Identifiants → Créer des identifiants → ID client OAuth** :
   - Type d'application : **Application Web**.
   - **Origines JavaScript autorisées** : ajoutez l'URL exacte où l'app sera servie, par ex. :
     - `https://votre-compte.github.io` (GitHub Pages)
     - `https://votre-site.netlify.app`
     - `http://localhost:5500` (test local)
   - Pas besoin de "URI de redirection" (l'app utilise le flux "token" côté client).
5. Copiez le **Client ID** généré (`....apps.googleusercontent.com`).
6. Ouvrez `app.js` et remplacez la valeur de `CONFIG.CLIENT_ID` par ce Client ID.

Tant que l'écran de consentement reste en mode "Test", seuls les comptes que
vous avez ajoutés comme *Test users* pourront se connecter — c'est très bien
si l'app n'est que pour votre usage personnel.

## 2. Héberger l'app

Les APIs Google (et les PWA en général) exigent **HTTPS** (localhost excepté).
Options simples et gratuites :

- **GitHub Pages** : poussez ce dossier dans un dépôt, activez Pages sur la branche.
- **Netlify / Vercel** : glissez-déposez le dossier sur leur interface de déploiement.
- **Test local** : `npx serve .` ou l'extension "Live Server" de VS Code, puis ajoutez `http://localhost:PORT` dans les origines autorisées à l'étape 1.

N'oubliez pas d'ajouter chaque URL réelle utilisée aux **Origines JavaScript
autorisées** de l'identifiant OAuth, sinon la connexion échouera.

## 3. Utilisation

1. Ouvrez l'URL de l'app, cliquez sur **Se connecter avec Google**.
2. Sur l'appareil source (celui qui a les sauvegardes) :
   - Cliquez **Choisir des fichiers**, naviguez jusqu'à
     `Internal shared storage/RetroArch/saves` (et `.../states` pour les
     save states) et sélectionnez les fichiers voulus.
   - Cliquez **Envoyer vers Google Drive**.
3. Sur l'appareil de destination :
   - Connectez-vous avec le même compte Google.
   - Dans le panneau Drive, cliquez **Télécharger** sur chaque fichier voulu.
   - Le fichier atterrit dans le dossier **Téléchargements** de l'appareil ;
     déplacez-le ensuite dans `RetroArch/saves` avec un gestionnaire de
     fichiers (voir limitation ci-dessous).

## 4. Accès direct au dossier (ordinateur uniquement)

Sur Chrome ou Edge **de bureau**, un bouton **"Lier un dossier (accès
direct)"** apparaît dans le panneau "Cet appareil". Il utilise la
*File System Access API* :

- vous choisissez le dossier `saves` une seule fois, avec accès lecture/écriture ;
- l'app liste automatiquement son contenu (plus besoin de sélectionner les fichiers un par un) ;
- les téléchargements depuis le Drive sont **écrits directement dedans**, sans passer par le dossier "Téléchargements" ;
- le lien est mémorisé (IndexedDB) : à la prochaine visite, cliquez sur
  "Réautoriser l'accès" (le navigateur exige une confirmation explicite à
  chaque session pour des raisons de sécurité).

Ce bouton ne s'affiche pas si le navigateur ne supporte pas cette API :

| Navigateur | Support |
|---|---|
| Chrome / Edge (ordinateur) | ✅ complet, y compris le choix de dossier |
| Chrome (Android) | ⚠️ partiel : sélection de fichiers individuels seulement, pas de dossier (limitation volontaire de Chromium sur Android) |
| Firefox (ordinateur et Android) | ❌ non supporté (position de l'éditeur) |
| Safari (macOS et iOS) | ❌ non supporté (position de l'éditeur) |

Sur les navigateurs sans support, le sélecteur de fichiers classique
("Choisir des fichiers") reste le seul moyen d'envoyer des sauvegardes, et
les téléchargements atterrissent dans le dossier "Téléchargements" comme
décrit à la section 3.

## 5. Installer comme application (PWA)

- **Android (Chrome)** : menu ⋮ → *Ajouter à l'écran d'accueil* / *Installer l'application*.
- **Desktop (Chrome/Edge)** : icône d'installation dans la barre d'adresse.

## Limitations importantes à connaître

- **Accès au stockage partagé sur Android** : par sécurité, un navigateur ne
  peut pas lire ou écrire automatiquement dans
  `Internal shared storage/RetroArch/saves`. Vous devez sélectionner les
  fichiers manuellement à l'envoi, et déplacer manuellement les fichiers
  téléchargés (via un gestionnaire de fichiers, ou l'app "Fichiers") après
  réception. Une app native (ou une future version utilisant un composant
  d'accès au stockage Android type Storage Access Framework packagée en
  application, pas en PWA) serait nécessaire pour automatiser complètement
  ce déplacement.
- **"Choisir un dossier"** (sélection d'un dossier entier) ne fonctionne que
  sur les navigateurs de bureau basés sur Chromium ; sur mobile, utilisez
  "Choisir des fichiers" et sélectionnez-les un par un ou en groupe.
- Le jeton de connexion Google expire après environ 1 heure ; l'app tente une
  reconnexion silencieuse automatique, sinon recliquez simplement sur
  "Se connecter avec Google".
- Cette app ne modifie que son propre dossier Drive (`RetroArch Saves`),
  jamais le reste de votre Drive.

## Structure du projet

```
index.html      Interface
style.css       Styles (thème terminal rétro)
app.js          Logique : auth Google + appels Drive API + upload/download
manifest.json   Manifeste PWA (icônes, nom, couleurs)
sw.js           Service worker (cache de l'app shell pour usage hors-ligne)
icons/          Icônes de l'app
```
