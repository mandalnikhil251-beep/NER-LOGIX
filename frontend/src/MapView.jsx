import { useState, useEffect } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
} from "react-leaflet";

import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";


function MapView({
  onRoadBlockChange,
  onVehicleMove,
  incidentLocation,
  recommendedRoute,
}) {

  const [roadBlocked, setRoadBlocked] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("Route A");


  const start = [26.1445, 91.7362]; // Guwahati
  const end = [25.5788, 91.8933];   // Shillong


  // Distance calculation
  function calculateDistance(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c =
      2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  }


  // ROUTE A - Shortest
  const routeA = [
    start,
    [26.05, 91.80],
    [25.85, 91.85],
    [25.70, 91.88],
    end
  ];


  // ROUTE B - Reliable Alternate
  const routeB = [
    start,
    [26.10, 91.78],
    [26.00, 91.86],
    [25.80, 91.95],
    [25.65, 91.92],
    end
  ];


  // ROUTE C - Backup
  const routeC = [
    start,
    [26.12, 91.75],
    [26.03, 91.82],
    [25.88, 91.90],
    [25.72, 91.96],
    end
  ];


  // ROUTE D - Long Safe Corridor
  const routeD = [
    start,
    [26.08, 91.72],
    [25.98, 91.78],
    [25.82, 91.84],
    [25.68, 91.88],
    end
  ];


  const routes = {
    "Route A": routeA,
    "Route B": routeB,
    "Route C": routeC,
    "Route D": routeD,
  };


  // Vehicle position
  const [vehiclePosition, setVehiclePosition] =
    useState(routeA[0]);


  // Vehicle movement
  useEffect(() => {

  let index = 0;

  const currentRoute =
    roadBlocked
      ? routeB
      : routes[recommendedRoute || selectedRoute];

  setSelectedRoute(recommendedRoute || selectedRoute);
  setVehiclePosition(currentRoute[0]);

  const timer = setInterval(() => {

    index++;

    if (index >= currentRoute.length) {
      index = 0;
    }

    setVehiclePosition(currentRoute[index]);

    const distance =
      calculateDistance(
        currentRoute[index][0],
        currentRoute[index][1],
        end[0],
        end[1]
      );

    const eta =
      Math.ceil((distance / 40) * 60);

    onVehicleMove({
      position: currentRoute[index],
      distance: distance,
      eta: eta
    });

  }, 2000);

  return () =>
    clearInterval(timer);

}, [roadBlocked, selectedRoute, recommendedRoute]);

  // Truck icon
  const vehicleIcon = divIcon({
    html: "🚚",
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });


  return (

    <MapContainer
      center={routeA[0]}
      zoom={9}
      style={{
        height: "500px",
        width: "100%"
      }}
    >

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />


      {/* ROUTE A */}
      <Polyline
        positions={routeA}
        pathOptions={{
          color:
            selectedRoute === "Route A"
              ? "blue"
              : "gray",
          weight:
            selectedRoute === "Route A"
              ? 6
              : 3
        }}
      >
        <Popup>
          🛣️ <b>Route A</b>
          <br />
          Shortest Route
        </Popup>
      </Polyline>


      {/* ROUTE B */}
      <Polyline
        positions={routeB}
        pathOptions={{
          color:
            selectedRoute === "Route B"
              ? "green"
              : "gray",
          weight:
            selectedRoute === "Route B"
              ? 6
              : 3,
          dashArray:
            selectedRoute === "Route B"
              ? undefined
              : "8 8"
        }}
      >
        <Popup>
          🛣️ <b>Route B</b>
          <br />
          Reliable Alternate Route
        </Popup>
      </Polyline>


      {/* ROUTE C */}
      <Polyline
        positions={routeC}
        pathOptions={{
          color:
            selectedRoute === "Route C"
              ? "orange"
              : "gray",
          weight:
            selectedRoute === "Route C"
              ? 6
              : 2,
          dashArray:
            selectedRoute === "Route C"
              ? undefined
              : "6 8"
        }}
      >
        <Popup>
          🛣️ <b>Route C</b>
          <br />
          Backup Route
        </Popup>
      </Polyline>


      {/* ROUTE D */}
      <Polyline
        positions={routeD}
        pathOptions={{
          color:
            selectedRoute === "Route D"
              ? "purple"
              : "gray",
          weight:
            selectedRoute === "Route D"
              ? 6
              : 2,
          dashArray:
            selectedRoute === "Route D"
              ? undefined
              : "5 10"
        }}
      >
        <Popup>
          🛣️ <b>Route D</b>
          <br />
          Long Safe Corridor
        </Popup>
      </Polyline>


      {/* ROUTE SELECTOR */}

      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1000,
          background: "white",
          padding: "12px",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
        }}
      >

        <strong>
          🧠 Route Selection
        </strong>

        <br />

        <select
          value={selectedRoute}
          onChange={(e) =>
            setSelectedRoute(e.target.value)
          }
          style={{
            marginTop: "8px",
            padding: "7px",
            borderRadius: "6px"
          }}
        >

          <option value="Route A">
            Route A - Shortest
          </option>

          <option value="Route B">
            Route B - Reliable
          </option>

          <option value="Route C">
            Route C - Backup
          </option>

          <option value="Route D">
            Route D - Safe Corridor
          </option>

        </select>

      </div>


      {/* ROAD BLOCK */}

      <button
        onClick={() => {

          const newStatus =
            !roadBlocked;

          setRoadBlocked(
            newStatus
          );

          onRoadBlockChange(
            newStatus
              ? "High"
              : "Low"
          );

          if (newStatus) {
            setSelectedRoute(
              "Route B"
            );
          }

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
          ? "🔄 Restore Routes"
          : "🚧 Simulate Road Block"}

      </button>


      {/* RISK ZONE */}

      <Circle
        center={
          incidentLocation ||
          [25.85, 91.85]
        }

        radius={3000}

        pathOptions={{
          color: "red",
          fillColor: "red",
          fillOpacity: 0.5
        }}
      >

        <Popup>

          ⚠️ <b>Road Risk Zone</b>

          <br />

          Possible disruption

        </Popup>

      </Circle>


      {/* VEHICLE */}

      <Marker
        position={vehiclePosition}
        icon={vehicleIcon}
      >

        <Popup>

          🚚 <b>MED-01</b>

          <br />

          Essential Medicine Delivery

          <br />

          Route: {roadBlocked
            ? "Route B"
            : selectedRoute}

          <br />

          Status: Moving

        </Popup>

      </Marker>


      {/* DESTINATION */}

      <Marker
        position={end}
      >

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