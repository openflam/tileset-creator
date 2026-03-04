# Reference Mapserver responses

We expect some particular JSON fields from mapserver endpoints. 
Here are examples with authentication:

## /capabilities
```
{
  "commonName": "CMU-Mapserver",
  "iconURL": "https://i.imgur.com/XdvbTYs.png",
  "multipleMaps": true,
  "services": [
    {
      "name": "discovery",
      "url": "https://cmu-mapserver.open-flame.com/discover/"
    },
    {
      "name": "tileserver"
    }
  ],
  "auth": {
    "loginUrl": "/manage",
    "authCheckUrl": "/api/auth/user_state"
  },
  "credentialsCookiesRequired": true
}
```

## /maps/public/CICFloorOne/capabilities

```aiignore
{
  "commonName": "CICFloorOne",
  "nameSpace": "public",
  "iconURL": "https://i.imgur.com/XdvbTYs.png",
  "services": [
    {
      "url": "/tileset",
      "name": "tileserver",
      "credentialsCookiesRequired": true
    }
  ]
}
```
