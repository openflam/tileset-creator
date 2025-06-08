# OpenFLAME 3D interactive map

## Development

The OpenFLAME interactive map application is a static site generated using [Vite](https://vite.dev/) build tool and uses [React](https://react.dev/). The generated static site is hosted at [map.open-flame.com](https://map.open-flame.com/) using Github Pages.

### Install dependencies

```
cd tileset-creator
npm install
```

### Google 3D Tiles API Key

The map shows [Google Photorealistic 3D Tiles](https://developers.google.com/maps/documentation/tile/3d-tiles) by default. This needs an API key. For development, change API key in `.env.development` to your Map Tiles API key. Stop Github from tracking and accidentally committing your key using:

```
git update-index --assume-unchanged .env.development
```

The production key in `.env.production` is restricted to the `map.open-flame.com` hostname and cannot be used for development.

### Build

There are two build modes: Development and Production. They differ with respect to the browser console logs and the API key used. Development build logs more messages to the console and uses the development API key.

Development build:
```
npm run build:dev
```

Production build:
```
npm run build:prod
```

### See map

The static webpage files are written to the `dist/` directory. Run any HTTP server to see the generated site. For example:

```
python3 -m http.server 
```

### Deploy

Deploy to Github Pages using `npm run deploy`.

