# Setup

---

1. Créer le repo GitHub

cd /Users/me/dev/ferre-order
git init
git add .
git commit -m "init: ferre order slack bot"

# Crée un repo sur github.com puis :

git remote add origin
git@github.com:TON_USER/ferre-order.git
git push -u origin main

---

2. Créer la Slack App

Va sur api.slack.com/apps → "Create New App"
→ "From scratch"

Basic Information

- App Name : Ferré Order
- Note le Signing Secret →
  SLACK_SIGNING_SECRET

Basic Information

- App Name : Ferré Order
- Note le Signing Secret → SLACK_SIGNING_SECRET

OAuth & Permissions → Scopes (Bot Token)
Ajoute ces 3 scopes :

- chat:write
- im:write
- commands

OAuth & Permissions → Redirect URLs
Ajoute (provisoire, tu mettras l'URL Railway après) :
https://PLACEHOLDER.railway.app/slack/oauth_redirect

Slash Commands → Create New Command

┌──────────────┬──────────────────────────────────────────────┬─────────────────────────┐
│ Command │ Request URL │ Description │
├──────────────┼──────────────────────────────────────────────┼─────────────────────────┤
│ /salade │ https://PLACEHOLDER.railway.app/slack/events │ S'inscrire aux │
│ │ │ suggestions │
├──────────────┼──────────────────────────────────────────────┼─────────────────────────┤
│ /salade-stop │ https://PLACEHOLDER.railway.app/slack/events │ Se désinscrire │
└──────────────┴──────────────────────────────────────────────┴─────────────────────────┘

Event Subscriptions → Enable Events

- Request URL : https://PLACEHOLDER.railway.app/slack/events
- Subscribe to bot events : app_home_opened

Interactivity & Shortcuts → Enable

- Request URL : https://PLACEHOLDER.railway.app/slack/events

→ "App Distribution" → "Manage Distribution" → Active la distribution publique si tu veux
que des amis d'autres workspaces installent l'app.

Note ton Client ID et Client Secret (onglet "Basic Information").

---

3. Déployer sur Railway

1. Va sur railway.app → "New Project" → "Deploy from GitHub repo"
1. Sélectionne ferre-order
1. Railway détecte Node.js, le déploiement démarre

Variables d'environnement (Settings → Variables) :

SLACK*CLIENT_ID = (depuis Slack)
SLACK_CLIENT_SECRET = (depuis Slack)
SLACK_SIGNING_SECRET = (depuis Slack)
SLACK_STATE_SECRET = un-secret-aleatoire-long
ANTHROPIC_API_KEY = sk-ant-...
RESEND_API_KEY = re*...
FROM_EMAIL = commandes@emails.fabera.fr
RESTAURANT_EMAIL = fruitsnantes@gmail.com
BASE_URL = https://PLACEHOLDER.railway.app ← à mettre après

PORT est injecté automatiquement par Railway, ne le mets pas.

4. Settings → Networking → "Generate Domain" → copie l'URL (ex:
   ferre-order-production.up.railway.app)
5. Remplace BASE_URL avec cette URL

---

4. Mettre à jour la Slack App avec l'URL Railway

Retourne sur api.slack.com/apps et remplace tous les PLACEHOLDER par ton URL Railway dans :

- OAuth Redirect URLs
- Event Subscriptions Request URL
- Slash Commands Request URLs
- Interactivity Request URL

---

5. Installer le bot

- Autres workspaces : envoie le lien https://ton-app.railway.app/slack/install

---

6. Vérifier

Dans ton workspace Slack, ouvre l'app home du bot → bouton "S'inscrire" → entre ton nom →
tu recevras le premier DM le prochain lundi à 10h00.

Pour tester sans attendre :

# En local avec le tunnel ngrok (optionnel)

npx ngrok http 3000

# Puis remplace temporairement les URLs Slack par l'URL ngrok
