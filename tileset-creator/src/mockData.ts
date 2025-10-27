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
        published: true,
        footprint: [1, 2, 3],
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
};
