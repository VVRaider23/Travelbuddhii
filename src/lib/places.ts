// Google Places API (New) — server-side only
// Uses GOOGLE_PLACES_API_KEY (unrestricted, server-only)

export interface PlaceResult {
  placeId: string;
  displayName: string;
  lat: number;
  lng: number;
  photoName: string | null;
}

export async function searchPlace(query: string, destination: string): Promise<PlaceResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.photos",
        },
        body: JSON.stringify({
          textQuery: `${query} ${destination} India`,
          maxResultCount: 1,
        }),
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return null;

    return {
      placeId: place.id,
      displayName: place.displayName?.text ?? query,
      lat: place.location?.latitude ?? 0,
      lng: place.location?.longitude ?? 0,
      photoName: place.photos?.[0]?.name ?? null,
    };
  } catch {
    return null;
  }
}

export function buildPhotoUrl(photoName: string, maxWidth = 800): string {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${apiKey}`;
}

export async function validatePlaces(
  places: { name: string }[],
  destination: string
): Promise<(PlaceResult | null)[]> {
  return Promise.all(places.map((p) => searchPlace(p.name, destination)));
}
