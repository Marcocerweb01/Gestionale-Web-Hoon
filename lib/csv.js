const CSV_HEADERS = [
  "Nome",
  "Indirizzo",
  "Telefono",
  "Rating",
  "Numero recensioni",
  "Google Maps",
  "Status attivita"
];

const escapeCsvValue = (value) => {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
};

export const placesToCsv = (places) => {
  const rows = places.map((place) => [
    place.name,
    place.address,
    place.phone,
    place.rating,
    place.userRatingCount,
    place.googleMapsUri,
    place.businessStatus
  ]);

  return [CSV_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
};
