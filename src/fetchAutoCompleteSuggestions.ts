/**
 * Calls the new Google Places AutocompleteSuggestion API and throws on error.
 * @param request The AutocompleteSuggestionInput request object.
 * @returns Promise resolving to the suggestions array.
 * @throws Error if the API is unavailable or the call fails.
 */
export default async function fetchAutocompleteSuggestionsSafe(
  request: google.maps.places.AutocompleteRequest
): Promise<google.maps.places.AutocompleteSuggestion[]> {
  if (
    !window.google ||
    !window.google.maps ||
    !window.google.maps.places ||
    typeof window.google.maps.places.AutocompleteSuggestion
      ?.fetchAutocompleteSuggestions !== "function"
  ) {
    throw new Error(
      "Google Maps AutocompleteSuggestion API is not available. Make sure the Maps JavaScript API is loaded with the correct libraries."
    );
  }

  try {
    const result =
      await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
        request
      );
    if (!result || !Array.isArray(result.suggestions)) {
      throw new Error("Invalid response from fetchAutocompleteSuggestions.");
    }
    return result.suggestions;
  } catch (err) {
    throw new Error(
      `Failed to fetch autocomplete suggestions: ${ 
        err instanceof Error ? err.message : String(err)}`
    );
  }
}
