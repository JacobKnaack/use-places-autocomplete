export type PlacesLib = {
  AutocompleteSuggestion?: {
    fetchAutocompleteSuggestions: (
      request: google.maps.places.AutocompleteRequest
    ) => Promise<{ suggestions: google.maps.places.AutocompleteSuggestion[] }>;
  };
};

/**
 * Extracts place predictions from the AutocompleteSuggestion results.
 * @param suggestions The array of AutocompleteSuggestion objects.
 * @returns An array of PlacePrediction objects.
 */
export const getPlacePredictions = (
  suggestions: google.maps.places.AutocompleteSuggestion[]
): google.maps.places.PlacePrediction[] => {
  const places: google.maps.places.PlacePrediction[] = [];
  suggestions.forEach((suggestion) => {
    const { placePrediction } = suggestion;
    if (placePrediction) {
      places.push(placePrediction);
    }
  });
  return places;
};

/**
 * Creates an object of relavant fields from PlacePrediction
 * @param placePrediction The PlacePrediction object.
 * @returns An object containing place_id, description, and name.
 * @throws Error if the placePrediction is invalid or missing required fields.
 */
export type PlaceDetails = {
  place_id: string;
  description: string;
  name: string | null;
};
export const PlaceDetailsError = `Invalid PlacePrediction object provided.`;
export const getPlaceDetails = (
  placePrediction: google.maps.places.PlacePrediction
): PlaceDetails => {
  try {
    return {
      place_id: placePrediction.placeId,
      description: placePrediction.text.text,
      name: placePrediction.mainText ? placePrediction.mainText.text : null,
    };
  } catch (error) {
    throw new Error(PlaceDetailsError, { cause: error });
  }
};

/**
 * Calls the new Google Places AutocompleteSuggestion API and throws on error.
 * @param request The AutocompleteSuggestionInput request object.
 * @returns Promise resolving to the suggestions array.
 * @throws Error if the API is unavailable or the call fails.
 */
export default async function fetchAutocompleteSuggestions(
  request: google.maps.places.AutocompleteRequest,
  placesLib: PlacesLib
): Promise<google.maps.places.AutocompleteSuggestion[]> {
  if (
    !placesLib ||
    typeof placesLib.AutocompleteSuggestion?.fetchAutocompleteSuggestions !==
      "function"
  ) {
    throw new Error(
      "Google Maps AutocompleteSuggestion API is not available. Make sure the Maps JavaScript API is loaded with the correct libraries."
    );
  }

  try {
    const result =
      await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(
        request
      );
    if (!result || !Array.isArray(result.suggestions)) {
      throw new Error("Invalid response from fetchAutocompleteSuggestions.");
    }
    return result.suggestions;
  } catch (err) {
    throw new Error(
      `Failed to fetch autocomplete suggestions: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}
