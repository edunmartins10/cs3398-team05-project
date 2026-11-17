import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { validLocation } from '../lib/location.js';

export default function RestaurantMap({ name, location, distance, onClose }) {
  const dialog = useRef(null);
  const container = useRef(null);
  const [tileError, setTileError] = useState(false);
  const hasPin = validLocation(location);
  const latitude = location?.latitude;
  const longitude = location?.longitude;

  useEffect(() => {
    const element = dialog.current;
    if (!element.open) element.showModal();
    let map;
    if (hasPin) {
      const point = [latitude, longitude];
      map = L.map(container.current).setView(point, 15);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).on('tileerror', () => setTileError(true)).addTo(map);
      L.marker(point, {
        title: name, alt: name,
        icon: L.divIcon({ className: 'restaurant-pin', iconSize: [24, 24], iconAnchor: [12, 24] }),
      }).addTo(map);
    }
    return () => {
      map?.remove();
      element.close();
    };
  }, [hasPin, latitude, longitude, name]);

  return (
    <dialog ref={dialog} className="restaurant-map" aria-labelledby="map-title" onCancel={onClose}>
      <div className="dialoghead">
        <h2 id="map-title">{name}</h2>
        <button type="button" onClick={onClose} aria-label="Close map">×</button>
      </div>
      {hasPin ? <>
        <div ref={container} className="map-canvas" aria-label={`Map of ${name}`} />
        {tileError && <p role="status">Some map tiles could not load.</p>}
        <p>{location.locationLabel ? 'Approximate imported ZIP-code location' : 'Illustrative San Marcos location'}
          {Number.isFinite(distance) && ` · ${distance.toFixed(1)} miles away`}
        </p>
        <a href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`} target="_blank" rel="noreferrer">Open full map</a>
      </> : <p>No coordinates are available for this restaurant.</p>}
    </dialog>
  );
}
