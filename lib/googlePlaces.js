const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "nextPageToken"
].join(",");

export const normalizePlace = (place) => ({
  id: place.id || "",
  name: place.displayName?.text || "Senza nome",
  address: place.formattedAddress || "",
  phone: place.nationalPhoneNumber || "",
  rating: typeof place.rating === "number" ? place.rating : null,
  userRatingCount:
    typeof place.userRatingCount === "number" ? place.userRatingCount : null,
  googleMapsUri: place.googleMapsUri || "",
  businessStatus: place.businessStatus || ""
});

export const hasNoWebsite = (place) =>
  !place.websiteUri || place.websiteUri.trim().length === 0;

export async function searchGooglePlacesPage({
  apiKey,
  keyword,
  location,
  languageCode,
  pageSize,
  pageToken
}) {
  const textQuery = [keyword, location].filter(Boolean).join(" ");
  const body = {
    textQuery,
    languageCode,
    pageSize
  };

  if (pageToken) {
    body.pageToken = pageToken;
  }

  const response = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Errore Google Places API");
  }

  return {
    places: data.places || [],
    nextPageToken: data.nextPageToken
  };
}
