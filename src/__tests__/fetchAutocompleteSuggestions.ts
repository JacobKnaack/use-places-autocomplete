import fetchAutocompleteSuggestions from "../fetchAutocompleteSuggestions";

describe("fetchAutocompleteSuggestions", () => {
  const mockResponse = {
    suggestions: [
      {
        placeId: "test-place-id",
        description: "test-description",
      },
    ],
  };

  it("Should return an Autocomplete Suggestion response", async () => {
    const mockRequest = { input: "test-input" };
    const response = await fetchAutocompleteSuggestions(mockRequest, {
      AutocompleteSuggestion: {
        fetchAutocompleteSuggestions: jest.fn().mockResolvedValue(mockResponse),
      },
    });
    expect(response).toEqual(mockResponse.suggestions);
  });
  it("Should throw an error if AutocompleteSuggestion API is not available", async () => {
    const mockRequest = { input: "test-input" };
    await expect(fetchAutocompleteSuggestions(mockRequest, {})).rejects.toThrow(
      "Google Maps AutocompleteSuggestion API is not available. Make sure the Maps JavaScript API is loaded with the correct libraries."
    );
  });
});
