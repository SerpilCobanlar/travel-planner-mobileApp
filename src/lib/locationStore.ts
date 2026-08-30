let pickedLocation: { lat: number; lng: number } | null = null;

export const setPickedLocation = (location: { lat: number; lng: number } | null) => {
  pickedLocation = location;
};

export const getPickedLocation = () => {
  const loc = pickedLocation;
  pickedLocation = null; // consume
  return loc;
};
