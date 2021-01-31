# Canopy, for Entwined Meadow

Canopy is the interactivity layer for the Entwined Meadow installation (by Charles Gadeken). Its lightweight client and server, deployed to the cloud, allow participants to interact with the sculpture. Participants can scan QR codes affixed to each shrub, which take them to a control page for each shrub, allowing them limited control over the shrub's lighting while the global light patterns continue to play.

(Canopy has formerly been known as "the interactivity server", "the node server", or "the man in the middle".)

## Project setup
Install core dependencies:
* [Node 14.x](https://nodejs.org/en/download/)
* Yarn 1.x (`npm install -g yarn`)

Install JS dependencies:
```
yarn install
```

## Running for developmnet

Compile and serve client, plus run and auto-restart Socket.IO server on changes:
```
yarn dev
```

Access the client at: http://localhost:8080/

To get a valid list of shrub URLs, run:
```
node generate-valid-shrub-urls.js
```

### Lint and fix client files
```
yarn lint
```

## Running in production

### Compile and minify client for production
```
yarn build
```

The client can be served from any static web host once built. However, we must add a rule at the web host that redirects all unknown paths to `index.html`, and returns a 200 response. This lets it work with [Vue Router's "history mode"](https://router.vuejs.org/guide/essentials/history-mode.html).

### Run server (SocketIO) in production
```
yarn start
```

### Deploy to production
```
yarn deploy-client # Deploy client only (to Netlify)
yarn deploy-server # Deploy server only (to Heroku)
yarn deploy # Deploy client and server in one command
```

Currently the static Canopy client is deployed to [Netlify](https://www.netlify.com/), and the Node server (which mostly just runs Socket.IO) is deployed to [Heroku](https://www.heroku.com/).

Contact [Charlie Stigler](https://github.com/cstigler) if you need access to cloud deployments.

## Code Primer

### Client

The client is written in plain JavaScript with Vue 3, using Vue Router to run as a Single-Page Application (SPA) out of `index.html`.

All client files are in the `client` subdirectory, which has its own `package.json` file and can be thought of as its own sub-project.

### Server

The server is written in plain JavaScript using Node.js, largely serving HTTP/WebSocket requests with [Socket.IO](https://socket.io/).

All server files are in the `server` subdirectory, which has its own `package.json` file and can be thought of as its own sub-project.
