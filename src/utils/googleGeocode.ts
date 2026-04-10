import { GOOGLE_MAPS_API_KEY } from '../config/env';

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  shortLabel: string;
};

type GoogleGeocodeResponse = {
  status: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: { location?: { lat: number; lng: number } };
    address_components?: Array<{ long_name?: string; types?: string[] }>;
  }>;
};

function buildShortLabel(
  components: Array<{ long_name?: string; types?: string[] }>,
  formatted: string,
): string {
  const pick = (type: string) =>
    components.find((c) => Array.isArray(c.types) && c.types.includes(type))?.long_name;
  const parts = [
    pick('premise'),
    pick('neighborhood'),
    pick('sublocality'),
    pick('sublocality_level_1'),
    pick('locality'),
    pick('administrative_area_level_2'),
  ].filter(Boolean) as string[];
  const uniq = [...new Set(parts)];
  if (uniq.length) return uniq.slice(0, 2).join(', ');
  if (formatted.length > 44) return `${formatted.slice(0, 41)}…`;
  return formatted;
}

function parseResult(
  r: NonNullable<GoogleGeocodeResponse['results']>[number],
): GeocodeResult | null {
  const lat = r.geometry?.location?.lat;
  const lng = r.geometry?.location?.lng;
  const formatted = r.formatted_address?.trim();
  if (lat == null || lng == null || !formatted) return null;
  const components = Array.isArray(r.address_components) ? r.address_components : [];
  return {
    latitude: lat,
    longitude: lng,
    formattedAddress: formatted,
    shortLabel: buildShortLabel(components, formatted),
  };
}

async function fetchGeocodeJson(url: string): Promise<GoogleGeocodeResponse | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (__DEV__) {
        console.warn('[geocode] HTTP', res.status, res.statusText);
      }
      return null;
    }
    return (await res.json()) as GoogleGeocodeResponse;
  } catch (e) {
    if (__DEV__) {
      console.warn('[geocode] network error', e);
    }
    return null;
  }
}

function logGeocodeFailure(context: string, data: GoogleGeocodeResponse | null) {
  if (!__DEV__) return;
  if (!data) {
    console.warn(`[geocode] ${context}: no response`);
    return;
  }
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.warn(`[geocode] ${context}:`, data.status, data.error_message ?? '');
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeocodeResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    if (__DEV__) {
      console.warn('[geocode] GOOGLE_MAPS_API_KEY is empty — add it to .env and restart Metro with cache reset');
    }
    return null;
  }
  const q = `latlng=${encodeURIComponent(`${latitude},${longitude}`)}&language=en&region=IN&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;
  const data = await fetchGeocodeJson(`https://maps.googleapis.com/maps/api/geocode/json?${q}`);
  if (!data?.results?.length) {
    logGeocodeFailure('reverse', data);
    return null;
  }
  const first = data.results[0];
  return parseResult(first);
}

/** Forward geocode a free-text address (biased to India). */
export async function geocodeSearch(query: string): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (!GOOGLE_MAPS_API_KEY) {
    if (__DEV__) {
      console.warn('[geocode] GOOGLE_MAPS_API_KEY is empty — add it to .env and restart Metro with cache reset');
    }
    return [];
  }
  if (q.length < 3) return [];

  const tryFetch = async (withCountryFilter: boolean) => {
    const params = new URLSearchParams({
      address: q,
      region: 'in',
      language: 'en',
      key: GOOGLE_MAPS_API_KEY,
    });
    if (withCountryFilter) {
      params.set('components', 'country:IN');
    }
    return fetchGeocodeJson(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    );
  };

  let data = await tryFetch(true);
  if (!data?.results?.length && data?.status === 'ZERO_RESULTS') {
    data = await tryFetch(false);
  }
  if (!data?.results?.length) {
    logGeocodeFailure('forward', data);
    return [];
  }
  const out: GeocodeResult[] = [];
  for (const r of data.results) {
    const parsed = parseResult(r);
    if (parsed) out.push(parsed);
  }
  return out;
}
