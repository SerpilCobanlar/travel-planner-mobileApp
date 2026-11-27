/**
 * Hands the result of the location picker back to the plan form.
 * `name`/`address` are set only when the point came from a place search (#14)
 * and the map wasn't moved away from it.
 */
export interface PickedLocation {
  lat: number;
  lng: number;
  name?: string;
  address?: string | null;
}

let pickedLocation: PickedLocation | null = null;

export const setPickedLocation = (location: PickedLocation | null) => {
  pickedLocation = location;
};

export const getPickedLocation = () => {
  const loc = pickedLocation;
  pickedLocation = null; // consume
  return loc;
};
