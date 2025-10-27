import CONFIG from "../config";
import { mockApiData } from "../mockData";

export async function fetchApi(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  if (CONFIG.USE_MOCK_DATA) {
    const mockResponse = mockApiData[url];
    if (mockResponse) {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }

  return fetch(url, options);
}
