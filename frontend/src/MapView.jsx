import { useState, useEffect } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  CircleMarker
} from "react-leaflet";

import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";


function MapView({ onRoadBlockChange, onVehicleMove }) {

  const [roadBlocked, setRoadBlocked] = useState(false);


  const start = [26.1445, 91.7362]; // Guwahati
  const end = [25.5788, 91.8933];   // Shillong

  function calculateDistance(lat1, lon1, lat2, lon2) {

  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}


  // Main Route
  const route = [
    start,
    [26.05, 91.80],
    [25.85, 91.85],
    [25.70, 91.88],
    end
  ];


  // Alternate Route
  const alternateRoute = [
    start,
    [26.10, 91.78],
    [26.00, 91.86],
    [25.80, 91.95],
    [25.65, 91.92],
    end
  ];


  // Vehicle ki current position
  const [vehiclePosition, setVehiclePosition] = useState(route[0]);


  useEffect(() => {

  let index = 0;

  const currentRoute = roadBlocked ? alternateRoute : route;

  const timer = setInterval(() => {

    index++;

    if (index >= currentRoute.length) {
      index = 0;
    }

    setVehiclePosition(currentRoute[index]);

    const distance = calculateDistance(
      currentRoute[index][0],
      currentRoute[index][1],
      end[0],
      end[1]
    );

    const eta = Math.ceil((distance / 40) * 60);

    onVehicleMove({
      position: currentRoute[index],
      distance: distance,
      eta: eta
    });

  }, 2000);

  return () => clearInterval(timer);

}, [roadBlocked]);


  // Truck icon
  const vehicleIcon = divIcon({
    html: "🚚",
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });


  return (

    <MapContainer
      center={route[0]}
      zoom={9}
      style={{ height: "500px", width: "100%" }}
    >

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />


      {/* Main Route */}
      {!roadBlocked && (
        <Polyline positions={route} />
      )}


      {/* Alternate Route */}
      <Polyline
        positions={alternateRoute}
        pathOptions={{ dashArray: "10 10" }}
      />


      {/* Road Block Button */}
      <button
        onClick={() => {
            const newStatus = !roadBlocked;

            setRoadBlocked(newStatus);

            onRoadBlockChange(newStatus ? "High" : "Low");
            }}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          padding: "10px 15px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer"
        }}
      >
        {roadBlocked
          ? "🔄 Restore Main Route"
          : "🚧 Simulate Road Block"}
      </button>


      {/* Risk Zone */}
      <Circle
        center={[25.85, 91.85]}
        radius={3000}
        pathOptions={{
          color: "red",
          fillColor: "red",
          fillOpacity: 0.5
        }}
      >

        <Popup>
          ⚠️ Road Risk Zone
          <br />
          Possible disruption
        </Popup>

      </Circle>


      {/* Moving Vehicle */}
      <Marker
        position={vehiclePosition}
        icon={vehicleIcon}
      >

        <Popup>
          🚚 <b>MED-01</b>
          <br />
          Essential Medicine Delivery
          <br />
          Status: Moving
        </Popup>

      </Marker>


      {/* Destination */}
      <Marker position={end}>

        <Popup>
          🏥 <b>Destination</b>
          <br />
          Shillong
        </Popup>

      </Marker>


    </MapContainer>

  );
}


export default MapView;