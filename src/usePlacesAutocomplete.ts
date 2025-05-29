import { useState, useRef, useCallback, useEffect } from "react";

import useLatest from "./useLatest";
import _debounce from "./debounce";
import createAutocompleteRequest from "./createAutocompleteRequest";

export interface HookArgs {
  requestOptions?: Omit<google.maps.places.AutocompletionRequest, "input">;
  debounce?: number;
  cache?: number | false;
  cacheKey?: string;
  googleMaps?: any;
  callbackName?: string;
  defaultValue?: string;
  initOnMount?: boolean;
  usePlaces2025?: boolean;
}

type Suggestion =
  | google.maps.places.AutocompletePrediction
  | google.maps.places.AutocompleteSuggestion;

type Status = `${google.maps.places.PlacesServiceStatus}` | "";

interface Suggestions {
  readonly loading: boolean;
  readonly status: Status;
  data: Suggestion[];
}

interface SetValue {
  (val: string, shouldFetchData?: boolean): void;
}

interface HookReturn {
  ready: boolean;
  value: string;
  suggestions: Suggestions;
  setValue: SetValue;
  clearSuggestions: () => void;
  clearCache: (key?: string) => void;
  init: () => void;
}

export const loadApiErr =
  "💡 use-places-autocomplete: Google Maps Places API library must be loaded. See: https://github.com/wellyshen/use-places-autocomplete#load-the-library";

const usePlacesAutocomplete = ({
  requestOptions,
  debounce = 200,
  cache = 24 * 60 * 60,
  cacheKey = "upa",
  googleMaps,
  callbackName,
  defaultValue = "",
  initOnMount = true,
  usePlaces2025 = false,
}: HookArgs = {}): HookReturn => {
  const [ready, setReady] = useState(false);
  const [value, setVal] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestions>({
    loading: false,
    status: "",
    data: [],
  });
  const asRef = useRef<
    | google.maps.places.AutocompleteService
    | google.maps.places.AutocompleteSuggestion
  >();
  const requestOptionsRef = useLatest(requestOptions);
  const googleMapsRef = useLatest(googleMaps);

  const init = useCallback(() => {
    if (asRef.current) return;

    const { google } = window;
    const { current: gMaps } = googleMapsRef;
    const placesLib = gMaps?.places || google?.maps?.places;

    if (!placesLib) {
      console.error(loadApiErr);
      return;
    }

    if (
      usePlaces2025 &&
      typeof placesLib.AutocompleteSuggestion === "function"
    ) {
      asRef.current = {} as google.maps.places.AutocompleteSuggestion;
    } else if (typeof placesLib.AutocompleteService === "function") {
      asRef.current = new placesLib.AutocompleteService();
    } else {
      console.error(loadApiErr);
      return;
    }
    setReady(true);
  }, [googleMapsRef, usePlaces2025]);

  const clearSuggestions = useCallback(() => {
    setSuggestions({ loading: false, status: "", data: [] });
  }, []);

  const clearCache = useCallback(
    (key = cacheKey) => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        // Skip exception
      }
    },
    [cacheKey]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchPredictions = useCallback(
    _debounce((val: string) => {
      if (!val) {
        clearSuggestions();
        return;
      }

      setSuggestions((prevState) => ({ ...prevState, loading: true }));

      let cachedData: Record<string, { data: Suggestion[]; maxAge: number }> =
        {};

      try {
        cachedData = JSON.parse(sessionStorage.getItem(cacheKey) || "{}");
      } catch (error) {
        // Skip exception
      }

      if (cache) {
        cachedData = Object.keys(cachedData).reduce(
          (acc: typeof cachedData, key) => {
            if (cachedData[key].maxAge - Date.now() >= 0)
              acc[key] = cachedData[key];
            return acc;
          },
          {}
        );

        if (cachedData[val]) {
          setSuggestions({
            loading: false,
            status: "OK",
            data: cachedData[val].data,
          });
          return;
        }
      }
      if (usePlaces2025 && google.maps.places.AutocompleteSuggestion) {
        // TODO: need to update the request for new API
        const request = createAutocompleteRequest(
          requestOptionsRef.current,
          val
        );
        google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
          request
        )
          .then(({ suggestions: suggestionData }) => {
            setSuggestions({
              loading: false,
              status: "OK",
              data: suggestionData,
            });
            if (cache) {
              cachedData[val] = {
                data: suggestionData,
                maxAge: Date.now() + cache * 1000,
              };
              try {
                sessionStorage.setItem(cacheKey, JSON.stringify(cachedData));
              } catch (error) {
                // Skip exception
              }
            }
            return suggestionData;
          })
          .catch(() => {
            // skipping exception
          });
      } else if (
        asRef.current &&
        asRef.current instanceof google.maps.places.AutocompleteService
      ) {
        asRef.current?.getPlacePredictions(
          { ...requestOptionsRef.current, input: val },
          (data: Suggestion[] | null, status: Status) => {
            setSuggestions({ loading: false, status, data: data || [] });

            if (cache && status === "OK") {
              cachedData[val] = {
                data: data as Suggestion[],
                maxAge: Date.now() + cache * 1000,
              };

              try {
                sessionStorage.setItem(cacheKey, JSON.stringify(cachedData));
              } catch (error) {
                // Skip exception
              }
            }
          }
        );
      }
    }, debounce),
    [cache, cacheKey, clearSuggestions, requestOptionsRef]
  );

  const setValue: SetValue = useCallback(
    (val, shouldFetchData = true) => {
      setVal(val);
      if (asRef.current && shouldFetchData) fetchPredictions(val);
    },
    [fetchPredictions]
  );

  useEffect(() => {
    if (!initOnMount) return () => null;

    const { google } = window;

    if (!googleMapsRef.current && !google?.maps && callbackName) {
      (window as any)[callbackName] = init;
    } else {
      init();
    }

    return () => {
      // @ts-ignore
      if ((window as any)[callbackName]) delete (window as any)[callbackName];
    };
  }, [callbackName, googleMapsRef, init, initOnMount]);

  return {
    ready,
    value,
    suggestions,
    setValue,
    clearSuggestions,
    clearCache,
    init,
  };
};

export default usePlacesAutocomplete;
