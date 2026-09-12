import MapView from "./MapView";
import { useState, useEffect } from "react";
import { getWeather } from "./weather";

function App() {

  const [riskLevel, setRiskLevel] = useState("Low");
  const [roadRisk, setRoadRisk] = useState("Low");
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [highRiskRoads, setHighRiskRoads] = useState(0);

  const [deliveryStatus, setDeliveryStatus] = useState("In Transit");
  const [vehicleRiskStatus, setVehicleRiskStatus] = useState("Safe");
  const [rerouteRecommended, setRerouteRecommended] = useState(false);
  const [deliveryPriority, setDeliveryPriority] = useState("Emergency");

  const [vehicleLocation, setVehicleLocation] = useState("Guwahati");
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [eta, setEta] = useState(0);

  const [routeReliability, setRouteReliability] = useState(92);
  const [accessibilityScore, setAccessibilityScore] = useState(92);

  const [weatherRisk, setWeatherRisk] = useState("Low");
  const [temperature, setTemperature] = useState("--");
  const [rainfall, setRainfall] = useState("--");
  const [weatherLoaded, setWeatherLoaded] = useState(false);
  const [incidentType, setIncidentType] = useState("Road Block");
  const [incidentSeverity, setIncidentSeverity] = useState("High");
  const [fieldReport, setFieldReport] = useState("");
  const [submittedReport, setSubmittedReport] = useState(null);
  const [incidentLocation, setIncidentLocation] = useState([25.85, 91.85]);


  useEffect(() => {

    async function loadWeather() {

      try {

        const weather = await getWeather();

        setTemperature(weather.temperature_2m);
        setRainfall(weather.rain);

        if (weather.rain >= 10) {
          setWeatherRisk("High");
        } else if (weather.rain > 0) {
          setWeatherRisk("Medium");
        } else {
          setWeatherRisk("Low");
        }

        setWeatherLoaded(true);

      } catch (error) {

        console.error("Weather error:", error);

      }

    }

    loadWeather();

  }, []);

  useEffect(() => {

  let score = 92;

  // Delivery priority ka impact
if (deliveryPriority === "Emergency") {
  score += 0;
} else if (deliveryPriority === "High") {
  score -= 5;
} else if (deliveryPriority === "Normal") {
  score -= 10;
}

  // Weather ka impact
  if (weatherRisk === "High") {
    score -= 30;
  } else if (weatherRisk === "Medium") {
    score -= 15;
  }

  // Road risk ka impact
  if (roadRisk === "High") {
    score -= 30;
  } else if (roadRisk === "Medium") {
    score -= 15;
  }

  // Score limit
  score = Math.max(0, Math.min(100, score));

  setAccessibilityScore(score);
  setRouteReliability(score);

  // Overall Risk
  if (score < 50) {
    setRiskLevel("High");
  } else if (score < 80) {
    setRiskLevel("Medium");
  } else {
    setRiskLevel("Low");
  }

}, [weatherRisk, roadRisk]);



  return (
    <div className="app">

      <header className="header">

        <div>
          <h1>NER-LOGIX</h1>

          <p>
            AI-Powered Logistics Intelligence Platform
          </p>
        </div>

        <div className="status">
          🟢 System Online
        </div>

      </header>


      <main className="dashboard">

        <section className="welcome">

          <h2>
            North Eastern Region Logistics Dashboard
          </h2>

          <p>
            Most Reliable Route, Not Simply the Shortest Route.
          </p>

        </section>


        {/* Dashboard Cards */}

        <section className="cards">

          <div className="card">

            <h3>🚚 Vehicles Tracked</h3>

            <strong>1</strong>

            <p>Active vehicles</p>

          </div>


          <div className="card">

            <h3>🚨 Active Alerts</h3>

            <strong>{activeAlerts}</strong>

            <p>Current alerts</p>

          </div>


          <div className="card">

            <h3>⚠️ High Risk Roads</h3>

            <strong>{highRiskRoads}</strong>

            <p>Roads requiring attention</p>

          </div>


          <div className="card">

            <h3>📦 Essential Deliveries</h3>

            <strong>1</strong>

            <p>Priority shipments</p>

            <p>
              Status: <b>{deliveryStatus}</b>
            </p>

            <div className="delivery-buttons">

              <button
                onClick={() => setDeliveryStatus("In Transit")}
              >
                🟢 In Transit
              </button>

              <button
                onClick={() => setDeliveryStatus("Delayed")}
              >
                🟡 Delayed
              </button>

              <button
                onClick={() => setDeliveryStatus("Delivered")}
              >
                🔵 Delivered
              </button>

            </div>

          </div>

        </section>


        {/* Route Reliability */}

        <section className="reliability-panel">

          <h2>🛣️ Route Reliability</h2>

          <div className="reliability-score">

            <strong>
              {routeReliability}/100
            </strong>

            <span>

              {routeReliability >= 80
                ? "🟢 Reliable Route"
                : "🔴 High Risk Route"}

            </span>

          </div>

          <p>

            {routeReliability >= 80
              ? "Current route is suitable for essential delivery."
              : "Route disruption detected. Alternate route recommended."}

          </p>

        </section>

        {/* Accessibility Score */}

        <section className="accessibility-panel">

          <h2>🗺️ Road Accessibility Score</h2>

          <div className="accessibility-score">

            <strong>
              {accessibilityScore}/100
            </strong>

            <span>

              {accessibilityScore >= 80 &&
                "🟢 Good Accessibility"}

              {accessibilityScore >= 50 &&
                accessibilityScore < 80 &&
                "🟡 Moderate Accessibility"}

              {accessibilityScore < 50 &&
                "🔴 Poor Accessibility"}

            </span>

          </div>

          <p>
            Score is calculated using current weather and road risk conditions.
          </p>

        </section>


        {/* Weather */}

        <section className="weather-panel">

          <h2>🌦️ Weather & Accessibility Risk</h2>

          {!weatherLoaded ? (

            <div className="no-alert">
              ⏳ Loading weather data...
            </div>

          ) : (

            <div className="weather-info">

              <div className="weather-card">

                <h3>🌡️ Temperature</h3>

                <strong>
                  {temperature} °C
                </strong>

              </div>


              <div className="weather-card">

                <h3>🌧️ Rainfall</h3>

                <strong>
                  {rainfall} mm
                </strong>

              </div>


              <div className="weather-card">

                <h3>⚠️ Weather Risk</h3>

                <strong>

                  {weatherRisk === "Low" && "🟢 Low"}

                  {weatherRisk === "Medium" && "🟡 Medium"}

                  {weatherRisk === "High" && "🔴 High"}

                </strong>

              </div>

            </div>

          )}

        </section>


        {/* Live Vehicle Status */}

        <section className="vehicle-status">

          <h2>🚚 Live Vehicle Status</h2>

          <div className="vehicle-info">

            <div>

              <span>Vehicle</span>

              <strong>MED-01</strong>

            </div>


            <div>

              <span>Cargo</span>

              <strong>Essential Medicine</strong>
              <p>
                🚨 Priority:
                <b className={`priority-${deliveryPriority.toLowerCase()}`}>
                  {deliveryPriority}
                </b>
              </p>
              <div className="delivery-buttons">
                <button onClick={() => setDeliveryPriority("Emergency")}>
                  🚨 Emergency
                </button>

                <button onClick={() => setDeliveryPriority("High")}>
                  🔴 High
                </button>

                <button onClick={() => setDeliveryPriority("Normal")}>
                  🟢 Normal
                </button>
              </div>

            </div>


            <div>

              <span>Status</span>

              <strong>🟢 Moving</strong>

            </div>

            <div>
              <span>Vehicle Risk</span>

              <strong>
                {vehicleRiskStatus === "Safe" && "🟢 Safe"}

                {vehicleRiskStatus === "Caution" && "🟡 Caution"}

                {vehicleRiskStatus === "At Risk" && "🔴 At Risk"}
              </strong>
            </div>


            <div>

              <span>GPS</span>

              <strong>🟢 Active</strong>

              <p>
                📍 {vehicleLocation}
              </p>

              <p>
                📏 Distance: <b>{distanceRemaining} km</b>
              </p>

              <p>
                ⏱️ ETA: <b>{eta} min</b>
              </p>

            </div>


            <div>

              <span>Risk Level</span>

              <strong>

                {riskLevel === "Low" && "🟢 Low"}

                {riskLevel === "Medium" && "🟡 Medium"}

                {riskLevel === "High" && "🔴 High"}

              </strong>


              <div className="risk-buttons">

                <button
                  onClick={() => setRiskLevel("Low")}
                >
                  Low Risk
                </button>

                <button
                  onClick={() => setRiskLevel("Medium")}
                >
                  Medium Risk
                </button>

                <button
                  onClick={() => setRiskLevel("High")}
                >
                  High Risk
                </button>

              </div>

            </div>

          </div>

        </section>


        {/* Alert Panel */}

        <section className="alert-panel">

          <h2>🚨 Active Alerts</h2>

          {activeAlerts > 0 ? (

            <div className="alert-box">

              <div className="alert-title">
                🚨 ROAD BLOCK DETECTED
              </div>

              <p>
                📍 Guwahati → Shillong Corridor
              </p>

              <p>
                ⚠️ Risk Level: <strong>High</strong>
              </p>

              <p>
                🔄 Alternate Route Recommended
              </p>

            </div>

          ) : (

            <div className="no-alert">
              🟢 No active disruptions
            </div>

          )}

        </section>

        {/* Field Report */}

<section className="field-report-panel">

  <h2>📋 Field Incident Report</h2>

  <label>Incident Type</label>

  <select
    value={incidentType}
    onChange={(e) => setIncidentType(e.target.value)}
  >
    <option>Road Block</option>
    <option>Flood</option>
    <option>Landslide</option>
    <option>Road Damage</option>
    <option>Heavy Traffic</option>
  </select>


  <label>Severity</label>

  <select
    value={incidentSeverity}
    onChange={(e) => setIncidentSeverity(e.target.value)}
  >
    <option>High</option>
    <option>Medium</option>
    <option>Low</option>
  </select>


  <label>Field Report</label>

  <textarea
    value={fieldReport}
    onChange={(e) => setFieldReport(e.target.value)}
    placeholder="Describe the incident..."
  />


  <button
    onClick={() => {
      setSubmittedReport({
        type: incidentType,
        severity: incidentSeverity,
        description: fieldReport
      });

      setActiveAlerts((prev) => prev + 1);

      if (incidentSeverity === "High") {
        setRoadRisk("High");
      if (incidentSeverity === "High") {
        setVehicleRiskStatus("At Risk");
        setRerouteRecommended(incidentSeverity !== "Low");  
      } else if (incidentSeverity === "Medium") {
        setVehicleRiskStatus("Caution");
      } else {
        setVehicleRiskStatus("Safe");
      }  
      if (incidentSeverity === "High") {
        setHighRiskRoads((prev) => prev + 1);
      }  
      } else if (incidentSeverity === "Medium") {
        setRoadRisk("Medium");
      } else {
        setRoadRisk("Low");
      }

      alert(
        `Field Report Submitted!\n\nIncident: ${incidentType}\nSeverity: ${incidentSeverity}\nReport: ${fieldReport}`
      );
    }}
  >
    📤 Submit Field Report
  </button>

</section>
{/* Latest Field Incident */}

{submittedReport && (
  <section className="field-report-panel">

    <h2>📍 Latest Field Incident</h2>

    <p>
      🚧 Incident:
      <b> {submittedReport.type}</b>
    </p>

    <p>
      ⚠️ Severity:
      <b> {submittedReport.severity}</b>
    </p>

    <p>
      📝 Report:
      <b> {submittedReport.description || "No description provided"}</b>
    </p>

  </section>
)}

{rerouteRecommended && (
  <section className="alert-panel">
    <h2>🔄 Route Recommendation</h2>

    <div className="alert-box">
      <div className="alert-title">
        🔄 ALTERNATE ROUTE RECOMMENDED
      </div>

      <p>⚠️ Current route has an accessibility risk.</p>
      <p>🚚 Vehicle: <b>MED-01</b></p>
      <p>🛣️ Recommendation: <b>Use Alternate Route</b></p>
    </div>
  </section>
)}


        {/* Regional Map */}

        <section className="map-box">

          <h2>🗺️ Regional Accessibility Map</h2>

          <div className="map-placeholder">

            <MapView
            incidentLocation={incidentLocation}

              onRoadBlockChange={(status) => {

                setRoadRisk(status);

                setActiveAlerts(
                  status === "High" ? 1 : 0
                );

                setHighRiskRoads(
                  status === "High" ? 1 : 0
                );

                setRouteReliability(
                  status === "High" ? 48 : 92
                );

              }}

              onVehicleMove={(data) => {

                setVehicleLocation(
                  `${data.position[0].toFixed(4)}, ${data.position[1].toFixed(4)}`
                );

                setDistanceRemaining(
                  data.distance.toFixed(1)
                );

                setEta(data.eta);

              }}

            />

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;