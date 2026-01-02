import { defineMock } from "vite-plugin-mock-dev-server";

export default defineMock([
  {
    url: "/api/maps",
    body: {
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
  },
  {
    url: "/api/maps/public/GHCFloor5/tileset",
    body: {
      root: {
        refine: "REPLACE",
        content: {
          uri: "https://cdn-maps.open-flame.com/public/GHCFloor5/tiles/{level}/{x}/{y}/{z}.glb?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4tbWFwcy5vcGVuLWZsYW1lLmNvbS9wdWJsaWMvR0hDRmxvb3I1LyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3NjE4NTQ5Mzd9fX1dfQ__&Signature=zxXPvTlKFgd1xC0Fjh0nvQiFK8Oh7JJ8vbthvz8XDDUpVYENdKCmjgotWAej5hqd02Ep7x0KRnc0xxeq0Ei1koXO2qoo600HrnF7T2fg58PS8TZt2KL0-8b~Ipr6~Oendr0C7X-91FpdzqaLwnP2aSlPP7wXrf7t70kn-oomIz9vU4mpPrz6cBfAObeBMdsF3~c21-BAEzR2a7ziJDQL6NBEjaobglnc7RM69kRxB45ZPzkk3u1N3Z28vuewpDDF5Y9oYb6q--g92BZJx7ld48dkFHCcdoXyoizWp07PWZIn0DTre0XgfbJ7OXalEwPaWITZOy4Z56VN30tFE3bItQ__&Key-Pair-Id=K24WX23OARZAT9",
        },
        metadata: {
          class: "tile",
          properties: {
            tightBoundingBox: [
              -9.1171817779541, -19.6948013305664, -0.634392261505127,
              26.5753269195557, 0, 0, 0, 30.3557510375977, 0, 0, 0,
              2.6815333366394,
            ],
          },
        },
        transform: [
          0.986671275822427, 0.0379883288131397, -0.158229833915508, 0,
          0.0939269074672536, 0.66108037213438, 0.744412840856676, 0,
          0.132881637258812, -0.749352806395395, 0.648700887949726, 0,
          848767.040694975, -4786409.74811223, 4115768.33223247, 1,
        ],
        boundingVolume: {
          box: [
            -5.33675765991211, -19.6948013305664, 27.0398254394531,
            30.3557510375977, 0, 0, 0, 30.3557510375977, 0, 0, 0,
            30.3557510375977,
          ],
        },
        geometricError: 1.51778755187988,
        implicitTiling: {
          subtrees: {
            uri: "https://cdn-maps.open-flame.com/public/GHCFloor5/subtrees/{level}/{x}/{y}/{z}.subtree?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9jZG4tbWFwcy5vcGVuLWZsYW1lLmNvbS9wdWJsaWMvR0hDRmxvb3I1LyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3NjE4NTQ5Mzd9fX1dfQ__&Signature=zxXPvTlKFgd1xC0Fjh0nvQiFK8Oh7JJ8vbthvz8XDDUpVYENdKCmjgotWAej5hqd02Ep7x0KRnc0xxeq0Ei1koXO2qoo600HrnF7T2fg58PS8TZt2KL0-8b~Ipr6~Oendr0C7X-91FpdzqaLwnP2aSlPP7wXrf7t70kn-oomIz9vU4mpPrz6cBfAObeBMdsF3~c21-BAEzR2a7ziJDQL6NBEjaobglnc7RM69kRxB45ZPzkk3u1N3Z28vuewpDDF5Y9oYb6q--g92BZJx7ld48dkFHCcdoXyoizWp07PWZIn0DTre0XgfbJ7OXalEwPaWITZOy4Z56VN30tFE3bItQ__&Key-Pair-Id=K24WX23OARZAT9",
          },
          subtreeLevels: 5,
          availableLevels: 6,
          subdivisionScheme: "OCTREE",
        },
      },
      asset: {
        extras: {
          ion: {
            movable: true,
            terrainId: 1,
            georeferenced: true,
          },
        },
        version: "1.1",
      },
      schema: {
        id: "cesium-tiling-pipeline",
        classes: {
          tile: {
            properties: {
              tightBoundingBox: {
                name: "Tight Bounding Box",
                type: "SCALAR",
                array: true,
                count: 12,
                semantic: "TILE_BOUNDING_BOX",
                componentType: "FLOAT64",
              },
            },
          },
        },
      },
      geometricError: 52.5777030990308,
    },
  },
  {
    url: "/capabilities",
    body: {
      commonName: "CMU-Mapserver",
      iconURL: "https://i.imgur.com/XdvbTYs.png",
      multipleMaps: true,
      services: [
        {
          name: "discovery",
          url: "https://cmu-mapserver.open-flame.com/discover/",
        },
        { name: "tileserver" },
      ],
      auth: {
        loginUrl: "http://localhost:5173/manage",
        authCheckUrl: "/api/auth/user_state",
      },
    },
  },
]);
