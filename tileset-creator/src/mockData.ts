import CONFIG from "./config";

export const mockApiData: Record<string, any> = {
  [CONFIG.API_LIST_MAPS]: {
    items: [
      {
        id: 5,
        name: "GHCFloor5",
        description: "",
        namespace: "public",
        services: [
          {
            url: "/tileset",
            name: "tileserver",
            credentialsCookiesRequired: true,
          },
        ],
        published: true,
      },
      {
        id: 4,
        name: "GHCFloor4",
        description: "",
        namespace: "public",
        services: [
          {
            url: "/tileset",
            name: "tileserver",
            credentialsCookiesRequired: true,
          },
        ],
        published: true,
      },
      {
        id: 3,
        name: "CICFloorTwo",
        description: "",
        namespace: "public",
        services: [
          {
            url: "/tileset",
            name: "tileserver",
            credentialsCookiesRequired: true,
          },
        ],
        published: true,
      },
      {
        id: 1,
        name: "CICFloorOne",
        description: "CIC L floor",
        namespace: "public",
        services: [
          {
            url: "/tileset",
            name: "tileserver",
            credentialsCookiesRequired: true,
          },
        ],
        published: false,
      },
      {
        id: 9,
        name: "RMKH-construction",
        description: "",
        namespace: "hiliang",
        services: [
          {
            url: "/tileset",
            name: "tileserver",
            credentialsCookiesRequired: true,
          },
        ],
        published: true,
      },
    ],
    count: 5,
  },
  [CONFIG.API_LIST_MAPS + "/maps/public/GHCFloor5/tileset"]: {
    "name": "GHCFloor5",
    "description": "",
    "namespace": "public",
    "services": [
      {
        "url": "/tileset",
        "name": "tileserver",
        "credentialsCookiesRequired": true
      }
    ],
    "published": true,
    "footprint": {
      "type": "Polygon",
      "coordinates": [
        [
          [-79.9450889307174, 40.4432088727398],
          [-79.9447395808796, 40.4440293645366],
          [-79.9440864165033, 40.4440115376873],
          [-79.9441383746005, 40.4435889906852],
          [-79.9445473826967, 40.4430215103047],
          [-79.9450889307174, 40.4432088727398]
        ]
      ]
    },
    "level": null
  },
  [CONFIG.API_LIST_MAPS + "/maps/public/CICFloorOne/tileset"]:{
    "name": "CICFloorOne",
    "description": "CIC L floor",
    "namespace": "public",
    "services": [
      {
        "url": "/tileset",
        "name": "tileserver",
        "credentialsCookiesRequired": true
      }
    ],
    "published": true,
    "footprint": null,
  },
};
