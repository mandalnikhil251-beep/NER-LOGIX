import MapView from "./MapView";
import { useState, useEffect } from "react";
import { getWeather } from "./weather";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  // =========================
  // GLOBAL RISK STATES
  // =========================

  const [riskLevel, setRiskLevel] = useState("Low");
  const [roadRisk, setRoadRisk] = useState("Low");
  const [aiRecommendedRoute, setAiRecommendedRoute] = useState("Route A");
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [highRiskRoads, setHighRiskRoads] = useState(0);
  const [n8nResult, setN8nResult] = useState(null);

  // =========================
  // VEHICLE / DELIVERY
  // =========================

  const [deliveryStatus, setDeliveryStatus] = useState("In Transit");
  const [vehicleRiskStatus, setVehicleRiskStatus] = useState("Safe");
  const [rerouteRecommended, setRerouteRecommended] = useState(false);
  const [deliveryPriority, setDeliveryPriority] = useState("Emergency");

  const [vehicleLocation, setVehicleLocation] = useState("Guwahati");
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [eta, setEta] = useState(0);

  const [routeReliability, setRouteReliability] = useState(92);
  const [accessibilityScore, setAccessibilityScore] = useState(92);

  // =========================
  // WEATHER
  // =========================

  const [weatherRisk, setWeatherRisk] = useState("Low");
  const [temperature, setTemperature] = useState("--");
  const [rainfall, setRainfall] = useState("--");
  const [weatherLoaded, setWeatherLoaded] = useState(false);

  // =========================
  // FIELD REPORT
  // =========================

  const [incidentType, setIncidentType] = useState("Road Block");
  const [incidentSeverity, setIncidentSeverity] = useState("High");
  const [fieldReport, setFieldReport] = useState("");
  const [submittedReport, setSubmittedReport] = useState(null);

  // Map needs coordinates
  const [incidentLocation, setIncidentLocation] = useState([
    25.85,
    91.85,
  ]);

  // Field form needs text
  const [incidentLocationText, setIncidentLocationText] =
    useState("Guwahati → Shillong");

  // =========================
  // WEATHER DATA
  // =========================

  useEffect(() => {
    async function loadWeather() {
      try {
        const weather = await getWeather();

        const rain = Number(weather.rain);
        const temp = Number(weather.temperature_2m);

        setTemperature(temp);
        setRainfall(rain);

        if (rain >= 50) {
          setWeatherRisk("High");
        } else if (rain >= 20) {
          setWeatherRisk("Medium");
        } else {
          setWeatherRisk("Low");
        }

        setWeatherLoaded(true);
      } catch (error) {
        console.error("Weather error:", error);
        setWeatherLoaded(false);
      }
    }

    loadWeather();
  }, []);

  // =========================
  // ACCESSIBILITY + RISK ENGINE
  // =========================

  useEffect(() => {
    let score = 100;

    // Weather risk
    if (weatherRisk === "High") {
      score -= 35;
    } else if (weatherRisk === "Medium") {
      score -= 18;
    }

    // Road risk
    if (roadRisk === "High") {
      score -= 35;
    } else if (roadRisk === "Medium") {
      score -= 18;
    }

    // Vehicle risk
    if (
      vehicleRiskStatus === "At Risk" ||
      vehicleRiskStatus === "High Risk"
    ) {
      score -= 10;
    } else if (vehicleRiskStatus === "Caution") {
      score -= 5;
    }

    score = Math.max(0, Math.min(100, score));

    setAccessibilityScore(score);
    setRouteReliability(score);

    if (score < 50) {
      setRiskLevel("High");
    } else if (score < 80) {
      setRiskLevel("Medium");
    } else {
      setRiskLevel("Low");
    }
  }, [weatherRisk, roadRisk, vehicleRiskStatus]);

  useEffect(() => {
  const routeARiskPenalty =
    roadRisk === "High"
      ? 40
      : roadRisk === "Medium"
      ? 20
      : 5;

  const routeAWeatherPenalty =
    weatherRisk === "High"
      ? 25
      : weatherRisk === "Medium"
      ? 12
      : 3;

  const routeAAccessibility = Math.max(
    0,
    accessibilityScore - routeARiskPenalty
  );

  const routeAReliability = Math.max(
    0,
    routeReliability -
      Math.round(routeARiskPenalty / 2) -
      Math.round(routeAWeatherPenalty / 2)
  );

  const routeAScore = Math.round(
    routeAAccessibility * 0.45 +
      routeAReliability * 0.35 +
      65 * 0.20
  );

  const routeBAccessibility = Math.min(
    100,
    accessibilityScore + 25
  );

  const routeBReliability = Math.min(
    100,
    routeReliability + 25
  );

  const routeBScore = Math.round(
    routeBAccessibility * 0.45 +
      routeBReliability * 0.35 +
      55 * 0.20
  );

  const routeCAccessibility = Math.min(
    100,
    accessibilityScore + 15
  );

  const routeCReliability = Math.min(
    100,
    routeReliability + 15
  );

  const routeCScore = Math.round(
    routeCAccessibility * 0.45 +
      routeCReliability * 0.35 +
      50 * 0.20
  );

  const routeDAccessibility = Math.min(
    100,
    accessibilityScore + 10
  );

  const routeDReliability = Math.min(
    100,
    routeReliability + 10
  );

  const routeDScore = Math.round(
    routeDAccessibility * 0.45 +
      routeDReliability * 0.35 +
      40 * 0.20
  );

  const routeScores = {
    "Route A": routeAScore,
    "Route B": routeBScore,
    "Route C": routeCScore,
    "Route D": routeDScore,
  };

  const bestRoute = Object.keys(routeScores).reduce(
    (best, route) =>
      routeScores[route] > routeScores[best]
        ? route
        : best,
    "Route A"
  );

  setAiRecommendedRoute(bestRoute);
}, [
  roadRisk,
  weatherRisk,
  accessibilityScore,
  routeReliability,
]);

  // =========================
  // MAP ROAD STATUS HANDLER
  // =========================

  const handleRoadBlockChange = (status) => {
    setRoadRisk(status);

    if (status === "High") {
      setActiveAlerts(1);
      setHighRiskRoads(1);
      setRerouteRecommended(true);
      setVehicleRiskStatus("At Risk");
    } else if (status === "Medium") {
      setActiveAlerts(1);
      setHighRiskRoads(0);
      setRerouteRecommended(true);
      setVehicleRiskStatus("Caution");
    } else {
      setActiveAlerts(0);
      setHighRiskRoads(0);
      setRerouteRecommended(false);
      setVehicleRiskStatus("Safe");
    }
  };

  // =========================
  // VEHICLE MOVE HANDLER
  // =========================

  const handleVehicleMove = (data) => {
    if (data?.position) {
      setVehicleLocation(
        `${data.position[0].toFixed(4)}, ${data.position[1].toFixed(4)}`
      );
    }

    if (data?.distance !== undefined) {
      setDistanceRemaining(Number(data.distance).toFixed(1));
    }

    if (data?.eta !== undefined) {
      setEta(data.eta);
    }
  };

  // =========================
  // FIELD REPORT SUBMISSION
  // =========================

  const submitFieldReport = async () => {
  if (!fieldReport.trim()) {
    alert("Please enter a field report.");
    return;
  }

  const timestamp = new Date().toISOString();

  try {
    const response = await fetch(
      "http://localhost:5678/webhook/field-report",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incidentType,
          severity: incidentSeverity,
          description: fieldReport,
          location: incidentLocationText,
          timestamp,
        }),
      }
    );

    const result = await response.json();

    console.log("n8n response:", result);

    if (!response.ok) {
      throw new Error("Webhook request failed");
    }

    // Store n8n result
    setN8nResult(result);

    // Save submitted report
    setSubmittedReport({
      type: incidentType,
      severity: incidentSeverity,
      description: fieldReport,
      location: incidentLocationText,
      timestamp,
    });

    // Update dashboard from n8n risk result
    const workflowRisk = result.riskLevel;

    if (workflowRisk === "High") {
      setRoadRisk("High");
      setVehicleRiskStatus("At Risk");
      setRerouteRecommended(true);
      setActiveAlerts((prev) => prev + 1);
      setHighRiskRoads((prev) => prev + 1);
    } else if (workflowRisk === "Medium") {
      setRoadRisk("Medium");
      setVehicleRiskStatus("Caution");
      setRerouteRecommended(true);
      setActiveAlerts((prev) => prev + 1);
    } else {
      setRoadRisk("Low");
      setVehicleRiskStatus("Safe");
      setRerouteRecommended(false);
    }

    alert(
      `✅ Report processed by NER-LOGIX workflow.\nRisk Level: ${workflowRisk}`
    );

  } catch (error) {
    console.error("Field report error:", error);
    alert("❌ Could not connect to n8n.");
  }
};

  // =========================
  // PAGE RENDERING
  // =========================

  const renderPage = () => {
    // =========================
    // LIVE MAP
    // =========================

    if (activePage === "Live Map") {
      return (
        <>
          <section className="welcome">
            <h2>🗺️ Live Accessibility Map</h2>
            <p>
              Real-time view of vehicle movement, road risk and
              accessibility conditions.
            </p>
          </section>

          <section className="map-box">
            <h2>🚚 Vehicle & Road Monitoring</h2>

            <div className="vehicle-info">
              <div>
                <span>Vehicle</span>
                <strong>MED-01</strong>
              </div>

              <div>
                <span>Current Location</span>
                <strong>{vehicleLocation}</strong>
              </div>

              <div>
                <span>Distance Remaining</span>
                <strong>{distanceRemaining} km</strong>
              </div>

              <div>
                <span>ETA</span>
                <strong>{eta} min</strong>
              </div>

              <div>
                <span>Vehicle Risk</span>
                <strong>
                  {vehicleRiskStatus === "Safe" && "🟢 Safe"}
                  {vehicleRiskStatus === "Caution" && "🟡 Caution"}
                  {(vehicleRiskStatus === "At Risk" ||
                    vehicleRiskStatus === "High Risk") &&
                    "🔴 At Risk"}
                </strong>
              </div>
            </div>

            <div className="map-placeholder">
              <MapView
                incidentLocation={incidentLocation}
                onRoadBlockChange={handleRoadBlockChange}
                onVehicleMove={handleVehicleMove}
                recommendedRoute={aiRecommendedRoute}
              />
            </div>
          </section>

          <section className="alert-panel">
            <h2>⚠️ Current Road Risk</h2>

            <div className="alert-box">
              <p>
                Road Risk:
                <strong> {roadRisk}</strong>
              </p>

              <p>
                Accessibility:
                <strong> {accessibilityScore}/100</strong>
              </p>

              <p>
                Route Reliability:
                <strong> {routeReliability}/100</strong>
              </p>

              {rerouteRecommended && (
                <p>🔄 Alternate route recommended</p>
              )}
            </div>
          </section>
        </>
      );
    }

    // =========================
    // COMMAND CENTER
    // =========================

    if (activePage === "Command Center") {
      return (
        <>
          <section className="welcome">
            <h2>🏛️ NER Logistics Command Center</h2>
            <p>
              Centralized operational view of road accessibility,
              essential logistics, field incidents and network risks.
            </p>
          </section>

          <section className="cards">
            <div className="card">
              <h3>🛣️ Network Status</h3>
              <strong>Operational</strong>
              <p>NER corridors monitored</p>
            </div>

            <div className="card">
              <h3>🚨 High-Risk Roads</h3>
              <strong>{highRiskRoads}</strong>
              <p>Require attention</p>
            </div>

            <div className="card">
              <h3>🚚 Active Deliveries</h3>
              <strong>2</strong>
              <p>Essential logistics</p>
            </div>

            <div className="card">
              <h3>📡 Field Alerts</h3>
              <strong>{activeAlerts}</strong>
              <p>Active incidents</p>
            </div>
          </section>

          <section className="command-map-panel">
            <div className="command-map-header">
              <div>
                <span>LIVE NETWORK VIEW</span>
                <h2>🗺️ NER Accessibility & Risk Map</h2>
              </div>

              <div className="command-map-status">
                ● LIVE
              </div>
            </div>

            <MapView
              incidentLocation={incidentLocation}
              onRoadBlockChange={handleRoadBlockChange}
              onVehicleMove={handleVehicleMove}
            />
          </section>

          <section className="vehicle-status">
            <h2>🗺️ Corridor Risk Overview</h2>

            <div className="vehicle-info">
              <div>
                <span>Corridor</span>
                <strong>Guwahati → Shillong</strong>
              </div>

              <div>
                <span>Road Risk</span>
                <strong>{roadRisk}</strong>
              </div>

              <div>
                <span>Weather Risk</span>
                <strong>{weatherRisk}</strong>
              </div>

              <div>
                <span>Accessibility</span>
                <strong>{accessibilityScore}/100</strong>
              </div>

              <div>
                <span>Reliability</span>
                <strong>{routeReliability}/100</strong>
              </div>
            </div>
          </section>

          <section className="vehicle-status">
            <h2>🚚 Essential Logistics</h2>

            <div className="vehicle-info">
              <div>
                <span>Vehicle</span>
                <strong>MED-01</strong>
              </div>

              <div>
                <span>Cargo</span>
                <strong>Essential Medicine</strong>
              </div>

              <div>
                <span>Priority</span>
                <strong>{deliveryPriority}</strong>
              </div>

              <div>
                <span>Vehicle Status</span>
                <strong>{vehicleRiskStatus}</strong>
              </div>

              <div>
                <span>ETA</span>
                <strong>{eta} min</strong>
              </div>
            </div>
          </section>

          <section className="alert-panel">
            <h2>🤖 AI Operational Decision</h2>

            <div className="alert-box">
              {rerouteRecommended ? (
                <>
                  <p>
                    🔄 <strong>Rerouting Recommended</strong>
                  </p>

                  <p>
                    Current road conditions indicate increased
                    disruption risk for essential logistics.
                  </p>

                  <p>
                    NER-LOGIX recommends using a more reliable
                    alternate route.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    🟢 <strong>Current Route Recommended</strong>
                  </p>

                  <p>
                    Current route remains suitable based on
                    available risk and accessibility data.
                  </p>
                </>
              )}
            </div>
          </section>
        </>
      );
    }

    // =========================
    // VEHICLES
    // =========================

    if (activePage === "Vehicles") {
      return (
        <>
          <section className="welcome">
            <h2>🚚 Vehicle Monitoring</h2>
            <p>
              Monitor essential logistics vehicles, delivery status,
              route risk and real-time movement.
            </p>
          </section>

          <section className="cards">
            <div className="card">
              <h3>Total Vehicles</h3>
              <strong>3</strong>
              <p>Active logistics vehicles</p>
            </div>

            <div className="card">
              <h3>Vehicles At Risk</h3>
              <strong>
                {vehicleRiskStatus === "At Risk" ||
                vehicleRiskStatus === "High Risk"
                  ? "1"
                  : "0"}
              </strong>
              <p>Based on current road conditions</p>
            </div>

            <div className="card">
              <h3>Active Deliveries</h3>
              <strong>2</strong>
              <p>Essential goods in transit</p>
            </div>

            <div className="card">
              <h3>Reroute Required</h3>
              <strong>{rerouteRecommended ? "1" : "0"}</strong>
              <p>AI route recommendation</p>
            </div>
          </section>

          <section className="vehicle-status">
            <h2>📡 Live Vehicle Status</h2>

            <div className="vehicle-info">
              <div>
                <span>Vehicle ID</span>
                <strong>MED-01</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>{vehicleLocation}</strong>
              </div>

              <div>
                <span>Distance Remaining</span>
                <strong>{distanceRemaining} km</strong>
              </div>

              <div>
                <span>ETA</span>
                <strong>{eta} min</strong>
              </div>

              <div>
                <span>Vehicle Status</span>
                <strong>
                  {vehicleRiskStatus === "Safe" && "🟢 Safe"}
                  {vehicleRiskStatus === "Caution" && "🟡 Caution"}
                  {(vehicleRiskStatus === "At Risk" ||
                    vehicleRiskStatus === "High Risk") &&
                    "🔴 At Risk"}
                </strong>
              </div>
            </div>
          </section>

          <section className="vehicle-status">
            <h2>📦 Delivery Information</h2>

            <div className="vehicle-info">
              <div>
                <span>Vehicle</span>
                <strong>MED-01</strong>
              </div>

              <div>
                <span>Commodity</span>
                <strong>Medicines</strong>
              </div>

              <div>
                <span>Priority</span>
                <strong className="priority-emergency">
                  🚨 Emergency
                </strong>
              </div>

              <div>
                <span>Delivery Status</span>
                <strong>{deliveryStatus}</strong>
              </div>

              <div>
                <span>Road Risk</span>
                <strong>{roadRisk}</strong>
              </div>

              <div>
                <span>Route Reliability</span>
                <strong>{routeReliability}/100</strong>
              </div>
            </div>
          </section>

          <section className="alert-panel">
            <h2>🧠 AI Vehicle Recommendation</h2>

            <div className="alert-box">
              {rerouteRecommended ? (
                <>
                  <p>
                    🔄 <strong>Alternate route recommended.</strong>
                  </p>

                  <p>
                    Current road conditions indicate increased
                    disruption risk for MED-01.
                  </p>

                  <p>
                    <strong>
                      Route Reliability: {routeReliability}/100
                    </strong>
                  </p>
                </>
              ) : (
                <>
                  <p>
                    🟢 <strong>Current route is suitable.</strong>
                  </p>

                  <p>No immediate rerouting is required.</p>

                  <p>
                    <strong>
                      Route Reliability: {routeReliability}/100
                    </strong>
                  </p>
                </>
              )}
            </div>
          </section>

          <section className="vehicle-status">
            <h2>📍 Delivery Progress</h2>

            <div className="vehicle-info">
              <div>
                <span>Origin</span>
                <strong>Guwahati</strong>
              </div>

              <div>
                <span>Destination</span>
                <strong>Shillong</strong>
              </div>

              <div>
                <span>Current Location</span>
                <strong>{vehicleLocation}</strong>
              </div>

              <div>
                <span>Delivery Status</span>
                <strong>{deliveryStatus}</strong>
              </div>
            </div>
          </section>
        </>
      );
    }

    // =========================
    // ALERTS & RISK
    // =========================

    if (activePage === "Alerts & Risk") {
      return (
        <>
          <section className="welcome">
            <h2>⚠️ Alerts & Risk Intelligence</h2>
            <p>
              AI-based monitoring of road, weather and logistics risks.
            </p>
          </section>

          <section className="cards">
            <div className="card">
              <h3>Active Alerts</h3>
              <strong>{activeAlerts}</strong>
              <p>Current system alerts</p>
            </div>

            <div className="card">
              <h3>Road Risk</h3>
              <strong>{roadRisk}</strong>
              <p>Current accessibility condition</p>
            </div>

            <div className="card">
              <h3>Weather Risk</h3>
              <strong>{weatherRisk}</strong>
              <p>Weather-based disruption risk</p>
            </div>

            <div className="card">
              <h3>High Risk Roads</h3>
              <strong>{highRiskRoads}</strong>
              <p>Roads requiring attention</p>
            </div>
          </section>

          <section className="alert-panel">
            <h2>🚨 Current Risk Assessment</h2>

            <div className="alert-box">
              <p>
                <strong>Vehicle:</strong> MED-01
              </p>

              <p>
                <strong>Road Risk:</strong> {roadRisk}
              </p>

              <p>
                <strong>Weather Risk:</strong> {weatherRisk}
              </p>

              <p>
                <strong>Accessibility Score:</strong>{" "}
                {accessibilityScore}/100
              </p>

              <p>
                <strong>Route Reliability:</strong>{" "}
                {routeReliability}/100
              </p>

              <p>
                <strong>Vehicle Status:</strong>{" "}
                {vehicleRiskStatus}
              </p>
            </div>
          </section>

          <section className="vehicle-status">
            <h2>🧠 AI Risk Recommendation</h2>

            <div className="alert-box">
              {rerouteRecommended ? (
                <>
                  <p>
                    🔴 <strong>High-risk condition detected.</strong>
                  </p>

                  <p>
                    AI recommends an alternate route for the
                    essential logistics vehicle.
                  </p>

                  <p>
                    Current route reliability:
                    <strong> {routeReliability}/100</strong>
                  </p>
                </>
              ) : (
                <>
                  <p>
                    🟢{" "}
                    <strong>
                      No immediate high-risk condition.
                    </strong>
                  </p>

                  <p>
                    Vehicle can continue on the current
                    recommended route.
                  </p>
                </>
              )}
            </div>
          </section>

          <section className="field-report-panel">
            <h2>📍 Risk Simulation</h2>

            <p>
              Use these controls to simulate changing road
              conditions during the SIH demonstration.
            </p>

            <div className="risk-buttons">
              <button
                onClick={() => {
                  setRoadRisk("Low");
                  setActiveAlerts(0);
                  setHighRiskRoads(0);
                  setRerouteRecommended(false);
                  setVehicleRiskStatus("Safe");
                }}
              >
                🟢 Low Risk
              </button>

              <button
                onClick={() => {
                  setRoadRisk("Medium");
                  setActiveAlerts(1);
                  setHighRiskRoads(0);
                  setRerouteRecommended(true);
                  setVehicleRiskStatus("Caution");
                }}
              >
                🟡 Medium Risk
              </button>

              <button
                onClick={() => {
                  setRoadRisk("High");
                  setActiveAlerts(2);
                  setHighRiskRoads(2);
                  setRerouteRecommended(true);
                  setVehicleRiskStatus("At Risk");
                }}
              >
                🔴 High Risk
              </button>
            </div>
          </section>
        </>
      );
    }

    // =========================
    // FIELD REPORTS
    // =========================

    if (activePage === "Field Reports") {
      return (
        <>
          <section className="welcome">
            <h2>📍 Field Reports</h2>
            <p>
              Field officers can report road incidents and
              accessibility problems from remote locations.
            </p>
          </section>

          <section className="field-report-panel">
            <h2>📝 Submit New Field Report</h2>

            <label>Incident Type</label>

            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
            >
              <option value="Road Block">Road Block</option>
              <option value="Landslide">Landslide</option>
              <option value="Flood">Flood</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Traffic Blockage">
                Traffic Blockage
              </option>
              <option value="Bridge Damage">
                Bridge Damage
              </option>
              <option value="Other">Other</option>
            </select>

            <label>Severity</label>

            <select
              value={incidentSeverity}
              onChange={(e) =>
                setIncidentSeverity(e.target.value)
              }
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <label>Incident Location</label>

            <input
              type="text"
              value={incidentLocationText}
              onChange={(e) =>
                setIncidentLocationText(e.target.value)
              }
              placeholder="Example: NH-10, Sikkim"
              style={{
                width: "100%",
                padding: "11px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "7px",
                marginBottom: "10px",
              }}
            />

            <label>Description</label>

            <textarea
              value={fieldReport}
              onChange={(e) => setFieldReport(e.target.value)}
              placeholder="Describe the road condition or incident..."
            />

            <button onClick={submitFieldReport}>
              📤 Submit Field Report
            </button>
          </section>

          <section className="incident-history-panel">
            <div className="incident-history-header">
              <div>
                <span>FIELD INTELLIGENCE</span>
                <h2>📋 Incident History</h2>
              </div>

              <div className="incident-count">
                {submittedReport ? "1 Active" : "0 Active"}
              </div>
            </div>

            {submittedReport ? (
              <div className="incident-history-item">
                <div className="incident-icon">⚠️</div>

                <div className="incident-history-details">
                  <div className="incident-title-row">
                    <h3>{submittedReport.type}</h3>

                    <span
                      className={
                        submittedReport.severity === "High"
                          ? "severity high"
                          : submittedReport.severity === "Medium"
                          ? "severity medium"
                          : "severity low"
                      }
                    >
                      {submittedReport.severity}
                    </span>
                  </div>

                  <p>📍 {submittedReport.location}</p>

                  <p>
                    🕒{" "}
                    {new Date(
                      submittedReport.timestamp
                    ).toLocaleString()}
                  </p>

                  <p>{submittedReport.description}</p>
                </div>
              </div>
            ) : (
              <div className="no-incidents">
                <span>🛰️</span>
                <p>No field incidents reported yet.</p>
              </div>
            )}
          </section>

          <section className="command-map-panel">
            <div className="command-map-header">
              <div>
                <span>LIVE NETWORK VIEW</span>
                <h2>🗺️ NER Accessibility & Risk Map</h2>
              </div>

              <div className="command-map-status">
                ● LIVE
              </div>
            </div>

            <MapView
              incidentLocation={incidentLocation}
              onRoadBlockChange={handleRoadBlockChange}
              onVehicleMove={handleVehicleMove}
            />
          </section>

          <section className="vehicle-status">
            <h2>📋 Latest Field Report</h2>

            {submittedReport ? (
              <div className="alert-box">
                <p>
                  <strong>Incident:</strong>{" "}
                  {submittedReport.type}
                </p>

                <p>
                  <strong>Severity:</strong>{" "}
                  {submittedReport.severity}
                </p>

                <p>
                  <strong>Location:</strong>{" "}
                  {submittedReport.location}
                </p>

                <p>
                  <strong>Description:</strong>{" "}
                  {submittedReport.description}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  🟢 Report received by NER-LOGIX
                </p>
              </div>
            ) : (
              <div className="no-alert">
                No field report submitted yet.
              </div>
            )}
          </section>

          <section className="alert-panel">
            <h2>🤖 Automated Risk Response</h2>

            <div className="alert-box">
              {submittedReport ? (
                <>
                  <p>
                    ⚠️ Field incident detected:
                    <strong> {submittedReport.type}</strong>
                  </p>

                  <p>
                    Severity:
                    <strong> {submittedReport.severity}</strong>
                  </p>

                  <p>
                    Road Risk:
                    <strong> {roadRisk}</strong>
                  </p>

                  {rerouteRecommended && (
                    <p>
                      🔄 Alternate route recommended for
                      essential logistics.
                    </p>
                  )}
                </>
              ) : (
                <p>
                  Submit a field report to trigger automated
                  risk assessment.
                </p>
              )}
            </div>
          </section>
        </>
      );
    }

    // =========================
    // ESSENTIAL LOGISTICS
    // =========================

    if (activePage === "Essential Logistics") {
      return (
        <>
          <section className="welcome">
            <h2>📦 Essential Logistics</h2>
            <p>
              Monitor priority-based transportation of essential
              goods across difficult and disrupted routes.
            </p>
          </section>

          <section className="cards">
            <div className="card">
              <h3>Emergency Deliveries</h3>
              <strong>1</strong>
              <p>Critical medical supplies</p>
            </div>

            <div className="card">
              <h3>High Priority</h3>
              <strong>1</strong>
              <p>Food and essential supplies</p>
            </div>

            <div className="card">
              <h3>In Transit</h3>
              <strong>2</strong>
              <p>Active deliveries</p>
            </div>

            <div className="card">
              <h3>At Risk</h3>
              <strong>
                {rerouteRecommended ? "1" : "0"}
              </strong>
              <p>Deliveries affected by route risk</p>
            </div>
          </section>

          <section className="vehicle-status">
            <h2>🚚 Active Essential Deliveries</h2>

            <div className="vehicle-info">
              <div>
                <span>Vehicle ID</span>
                <strong>MED-01</strong>
              </div>

              <div>
                <span>Commodity</span>
                <strong>Medicines</strong>
              </div>

              <div>
                <span>Priority</span>
                <strong className="priority-emergency">
                  🚨 {deliveryPriority}
                </strong>
              </div>

              <div>
                <span>Distance</span>
                <strong>{distanceRemaining} km</strong>
              </div>

              <div>
                <span>ETA</span>
                <strong>{eta} min</strong>
              </div>
            </div>
          </section>

          <section className="vehicle-status">
            <h2>📦 Delivery Priority System</h2>

            <div className="vehicle-info">
              <div>
                <span>Emergency</span>
                <strong className="priority-emergency">
                  🚨 Medicines
                </strong>
              </div>

              <div>
                <span>High</span>
                <strong className="priority-high">
                  🟠 Food Supplies
                </strong>
              </div>

              <div>
                <span>Normal</span>
                <strong className="priority-normal">
                  🟢 Construction Materials
                </strong>
              </div>
            </div>
          </section>

          <section className="alert-panel">
            <h2>🧠 Logistics Decision</h2>

            <div className="alert-box">
              {rerouteRecommended ? (
                <>
                  <p>
                    🔴 <strong>Delivery route at risk.</strong>
                  </p>

                  <p>
                    MED-01 is carrying emergency medical
                    supplies.
                  </p>

                  <p>
                    NER-LOGIX recommends prioritizing this
                    delivery and using an alternate accessible
                    route.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    🟢{" "}
                    <strong>
                      Delivery proceeding normally.
                    </strong>
                  </p>

                  <p>
                    Current route is suitable for the selected
                    delivery priority.
                  </p>
                </>
              )}
            </div>
          </section>

          <section className="field-report-panel">
            <h2>🎯 Priority Simulation</h2>

            <p>
              Change delivery priority to demonstrate how the
              logistics system handles essential goods.
            </p>

            <div className="delivery-buttons">
              <button
                onClick={() =>
                  setDeliveryPriority("Emergency")
                }
              >
                🚨 Emergency
              </button>

              <button
                onClick={() => setDeliveryPriority("High")}
              >
                🟠 High
              </button>

              <button
                onClick={() =>
                  setDeliveryPriority("Normal")
                }
              >
                🟢 Normal
              </button>
            </div>

            <div className="alert-box">
              <p>
                Current Priority:
                <strong> {deliveryPriority}</strong>
              </p>

              {deliveryPriority === "Emergency" && (
                <p>
                  🚨 Delivery receives highest routing
                  priority.
                </p>
              )}

              {deliveryPriority === "High" && (
                <p>
                  🟠 Delivery receives high routing
                  priority.
                </p>
              )}

              {deliveryPriority === "Normal" && (
                <p>
                  🟢 Delivery follows normal routing
                  priority.
                </p>
              )}
            </div>
          </section>
        </>
      );
    }

    // =========================
    // AI ROUTE INTELLIGENCE
    // =========================

    if (activePage === "AI Route Intelligence") {
  const routeARiskPenalty =
  roadRisk === "High"
    ? 40
    : roadRisk === "Medium"
    ? 20
    : 5;

const routeAWeatherPenalty =
  weatherRisk === "High"
    ? 25
    : weatherRisk === "Medium"
    ? 12
    : 3;

const routeAAccessibility = Math.max(
  0,
  accessibilityScore - routeARiskPenalty
);

const routeAReliability = Math.max(
  0,
  routeReliability -
    Math.round(routeARiskPenalty / 2) -
    Math.round(routeAWeatherPenalty / 2)
);

const routeAScore = Math.round(
  routeAAccessibility * 0.45 +
    routeAReliability * 0.35 +
    65 * 0.20
);

const routeBAccessibility = Math.min(
  100,
  accessibilityScore + (roadRisk === "High" ? 25 : 5)
);

const routeBReliability = Math.min(
  100,
  routeReliability + (roadRisk === "High" ? 25 : 5)
);

const routeBScore = Math.round(
  routeBAccessibility * 0.45 +
    routeBReliability * 0.35 +
    55 * 0.20
);

const routeCAccessibility = Math.min(
  100,
  accessibilityScore + 15
);

const routeCReliability = Math.min(
  100,
  routeReliability + 15
);

const routeCScore = Math.round(
  routeCAccessibility * 0.45 +
    routeCReliability * 0.35 +
    50 * 0.20
);

const routeDAccessibility = Math.min(
  100,
  accessibilityScore + 10
);

const routeDReliability = Math.min(
  100,
  routeReliability + 10
);

const routeDScore = Math.round(
  routeDAccessibility * 0.45 +
    routeDReliability * 0.35 +
    40 * 0.20
);

const routeScores = {
  "Route A": routeAScore,
  "Route B": routeBScore,
  "Route C": routeCScore,
  "Route D": routeDScore,
};

let recommendedRoute = "Route A";

if (roadRisk === "High") {
  recommendedRoute = "Route B";
} else if (roadRisk === "Medium") {
  recommendedRoute = "Route B";
} else {
  recommendedRoute = "Route A";
}

  return (
    <>
      <section className="welcome">
        <h2>🧠 AI Route Intelligence</h2>
        <p>
          NER-LOGIX evaluates distance, road risk, weather
          conditions, accessibility and reliability to recommend
          the most dependable route for essential logistics.
        </p>
      </section>

      {/* ROUTE OVERVIEW */}

      <section className="cards">

        <div className="card">
          <h3>Current Route</h3>
          <strong>Route A</strong>
          <p>Shortest available route</p>
        </div>

        <div className="card">
          <h3>Road Risk</h3>
          <strong>{roadRisk}</strong>
          <p>Current road condition</p>
        </div>

        <div className="card">
          <h3>Weather Risk</h3>
          <strong>{weatherRisk}</strong>
          <p>Weather impact</p>
        </div>

        <div className="card">
          <h3>Accessibility</h3>
          <strong>{accessibilityScore}/100</strong>
          <p>Dynamic accessibility score</p>
        </div>

      </section>

      {/* ROUTE COMPARISON */}

      <section className="route-comparison">

        {/* ROUTE A */}

        <div className="route-option route-a">

          <div className="route-option-header">

            <div>
              <span>ROUTE A</span>
              <h3>Shortest Route</h3>
            </div>

            <div className="route-status">
              {recommendedRoute === "Route A"
                ? "Recommended"
                : "Risky"}
            </div>

          </div>

          <div className="route-metrics">

            <div>
              <small>Distance</small>
              <strong>42 km</strong>
            </div>

            <div>
              <small>Risk</small>
              <strong>{roadRisk}</strong>
            </div>

            <div>
              <small>Accessibility</small>
              <strong>{routeAAccessibility}</strong>
            </div>

            <div>
              <small>Reliability</small>
              <strong>{routeAReliability}%</strong>
            </div>

            <div>
              <small>Route Score</small>
              <strong>{routeAScore}/100</strong>
            </div>

          </div>

        </div>

        {/* ROUTE B */}

        <div className="route-option route-b">

          <div className="route-option-header">

            <div>
              <span>ROUTE B</span>
              <h3>Reliable Alternate Route</h3>
            </div>

            <div className="route-status recommended">
              {recommendedRoute === "Route B"
                ? "Recommended"
                : "Available"}
            </div>

          </div>

          <div className="route-metrics">

            <div>
              <small>Distance</small>
              <strong>49 km</strong>
            </div>

            <div>
              <small>Risk</small>
              <strong>Low</strong>
            </div>

            <div>
              <small>Accessibility</small>
              <strong>{routeBAccessibility}</strong>
            </div>

            <div>
              <small>Reliability</small>
              <strong>{routeBReliability}%</strong>
            </div>

            <div>
              <small>Route Score</small>
              <strong>{routeBScore}/100</strong>
            </div>

          </div>

        </div>

        {/* ROUTE C */}

        <div className="route-option route-c">

          <div className="route-option-header">

            <div>
              <span>ROUTE C</span>
              <h3>Backup Route</h3>
            </div>

            <div className="route-status">
              {recommendedRoute === "Route C"
                ? "Recommended"
                : "Available"}
            </div>

          </div>

          <div className="route-metrics">

            <div>
              <small>Distance</small>
              <strong>55 km</strong>
            </div>

            <div>
              <small>Risk</small>
              <strong>Low</strong>
            </div>

            <div>
              <small>Accessibility</small>
              <strong>{routeCAccessibility}</strong>
            </div>

            <div>
              <small>Reliability</small>
              <strong>{routeCReliability}%</strong>
            </div>

            <div>
              <small>Route Score</small>
              <strong>{routeCScore}/100</strong>
            </div>

          </div>

        </div>


        {/* ROUTE D */}

        <div className="route-option route-d">

          <div className="route-option-header">

            <div>
              <span>ROUTE D</span>
              <h3>Long Safe Corridor</h3>
            </div>

            <div className="route-status">
              {recommendedRoute === "Route D"
                ? "Recommended"
                : "Available"}
            </div>

          </div>

          <div className="route-metrics">

            <div>
              <small>Distance</small>
              <strong>62 km</strong>
            </div>

            <div>
              <small>Risk</small>
              <strong>Very Low</strong>
            </div>

            <div>
              <small>Accessibility</small>
              <strong>{routeDAccessibility}</strong>
            </div>

            <div>
              <small>Reliability</small>
              <strong>{routeDReliability}%</strong>
            </div>

            <div>
              <small>Route Score</small>
              <strong>{routeDScore}/100</strong>
            </div>

          </div>

        </div>


      </section>

      {/* DECISION */}

      <section className="vehicle-status">

        <h2>🛣️ AI Route Decision</h2>

        <div className="vehicle-info">

          <div>
            <span>Route A</span>
            <strong>42 km</strong>
          </div>

          <div>
            <span>Route A Score</span>
            <strong>{routeAScore}/100</strong>
          </div>

          <div>
            <span>Route B</span>
            <strong>49 km</strong>
          </div>

          <div>
            <span>Route B Score</span>
            <strong>{routeBScore}/100</strong>
          </div>

          <div>
            <span>AI Decision</span>
            <strong>
              {recommendedRoute === "Route B"
                ? "🟢 Route B"
                : "🟢 Route A"}
            </strong>
          </div>

        </div>

      </section>

      {/* AI EXPLANATION */}

      <section className="alert-panel">

        <h2>🤖 AI Recommendation</h2>

        <div className="alert-box">

          {recommendedRoute === "Route B" ? (
            <>
              <p>
                🔄{" "}
                <strong>
                  Reliable Alternate Route Recommended
                </strong>
              </p>

              <p>
                Route A is shorter, but current road and weather
                conditions reduce its accessibility and reliability.
              </p>

              <p>
                Route B is slightly longer but provides better
                accessibility and route reliability.
              </p>

              <p>
                <strong>
                  Decision: Use Route B for safer and more
                  reliable logistics movement.
                </strong>
              </p>
            </>
          ) : (
            <>
              <p>
                🟢{" "}
                <strong>
                  Shortest Route Recommended
                </strong>
              </p>

              <p>
                Current road and weather conditions are acceptable.
              </p>

              <p>
                Route A currently provides a suitable balance of
                distance, accessibility and reliability.
              </p>
            </>
          )}

        </div>

      </section>

      {/* SIMULATION */}

      <section className="field-report-panel">

        <h2>🎯 AI Route Simulation</h2>

        <p>
          Simulate road disruption and observe how NER-LOGIX
          changes its route recommendation.
        </p>

        <div className="risk-buttons">

          <button
            onClick={() => {
              setRoadRisk("Low");
              setRerouteRecommended(false);
              setVehicleRiskStatus("Safe");
              setActiveAlerts(0);
              setHighRiskRoads(0);
            }}
          >
            🟢 Normal Road
          </button>

          <button
            onClick={() => {
              setRoadRisk("High");
              setRerouteRecommended(true);
              setVehicleRiskStatus("At Risk");
              setActiveAlerts(2);
              setHighRiskRoads(2);
            }}
          >
            🔴 Simulate Disruption
          </button>

        </div>

      </section>
    </>
  );
}

    // =========================
    // WEATHER
    // =========================

    if (activePage === "Weather") {
  const weatherImpact =
    weatherRisk === "High"
      ? "High impact on logistics"
      : weatherRisk === "Medium"
      ? "Moderate impact on logistics"
      : "Low impact on logistics";

  const weatherRecommendation =
    weatherRisk === "High"
      ? "Consider alternate accessible routes and closely monitor road conditions."
      : weatherRisk === "Medium"
      ? "Monitor affected routes and prepare for possible accessibility changes."
      : "Current weather conditions are suitable for normal logistics movement.";

  return (
    <>
      <section className="welcome">
        <h2>🌦️ Weather Intelligence</h2>
        <p>
          Weather conditions are continuously analyzed to
          identify potential logistics and road accessibility
          risks across the region.
        </p>
      </section>

      {/* WEATHER OVERVIEW */}

      <section className="cards">

        <div className="card">
          <h3>🌡️ Temperature</h3>
          <strong>{temperature}°C</strong>
          <p>Current temperature</p>
        </div>

        <div className="card">
          <h3>🌧️ Rainfall</h3>
          <strong>{rainfall} mm</strong>
          <p>Current precipitation</p>
        </div>

        <div className="card">
          <h3>⚠️ Weather Risk</h3>
          <strong>{weatherRisk}</strong>
          <p>Weather-based risk assessment</p>
        </div>

        <div className="card">
          <h3>🛣️ Accessibility</h3>
          <strong>{accessibilityScore}/100</strong>
          <p>Weather-adjusted accessibility</p>
        </div>

      </section>

      {/* WEATHER ANALYSIS */}

      <section className="weather-panel">

        <h2>🌧️ Weather Risk Analysis</h2>

        <div className="weather-info">

          <div className="weather-card">
            <h3>🌡️ Temperature</h3>
            <strong>{temperature}°C</strong>
            <p>Current atmospheric temperature</p>
          </div>

          <div className="weather-card">
            <h3>🌧️ Rainfall</h3>
            <strong>{rainfall} mm</strong>
            <p>Current precipitation level</p>
          </div>

          <div className="weather-card">
            <h3>⚠️ Weather Risk</h3>
            <strong>{weatherRisk}</strong>
            <p>Calculated from weather conditions</p>
          </div>

        </div>

      </section>

      {/* LOGISTICS IMPACT */}

      <section className="alert-panel">

        <h2>🚚 Weather Impact on Logistics</h2>

        <div className="alert-box">

          <p>
            <strong>Impact Level:</strong>{" "}
            {weatherImpact}
          </p>

          {weatherRisk === "High" ? (
            <>
              <p>
                🔴 Heavy rainfall can increase the possibility
                of flooding, landslides and road disruption.
              </p>

              <p>
                🛣️ Road accessibility may decrease on
                vulnerable routes.
              </p>

              <p>
                ⏱️ Delivery delays and ETA uncertainty may
                increase.
              </p>
            </>
          ) : weatherRisk === "Medium" ? (
            <>
              <p>
                🟡 Moderate rainfall may affect road
                accessibility on vulnerable corridors.
              </p>

              <p>
                ⏱️ Logistics routes should be monitored for
                changing conditions.
              </p>
            </>
          ) : (
            <>
              <p>
                🟢 Current weather conditions indicate low
                weather-related disruption risk.
              </p>

              <p>
                🚚 Logistics movement can continue under
                normal monitoring.
              </p>
            </>
          )}

        </div>

      </section>

      {/* AI RECOMMENDATION */}

      <section className="alert-panel">

        <h2>🧠 NER-LOGIX Route Recommendation</h2>

        <div className="alert-box">

          {weatherRisk === "High" ? (
            <>
              <p>
                🔴{" "}
                <strong>
                  High weather risk detected.
                </strong>
              </p>

              <p>
                NER-LOGIX recommends considering an alternate
                accessible route for essential logistics.
              </p>

              <p>
                Current accessibility score:{" "}
                <strong>{accessibilityScore}/100</strong>
              </p>
            </>
          ) : weatherRisk === "Medium" ? (
            <>
              <p>
                🟡{" "}
                <strong>
                  Moderate weather risk detected.
                </strong>
              </p>

              <p>
                Continue monitoring the route and prepare
                for possible rerouting.
              </p>

              <p>
                Current accessibility score:{" "}
                <strong>{accessibilityScore}/100</strong>
              </p>
            </>
          ) : (
            <>
              <p>
                🟢{" "}
                <strong>
                  Weather conditions are currently acceptable.
                </strong>
              </p>

              <p>
                No major weather-based route intervention
                is currently required.
              </p>

              <p>
                Current accessibility score:{" "}
                <strong>{accessibilityScore}/100</strong>
              </p>
            </>
          )}

          <p>
            <strong>Recommendation:</strong>{" "}
            {weatherRecommendation}
          </p>

        </div>

      </section>

      {/* WEATHER SIMULATION */}

      <section className="field-report-panel">

        <h2>🎯 Weather Risk Simulation</h2>

        <p>
          Simulate changing rainfall conditions to
          demonstrate NER-LOGIX risk analysis during the
          SIH presentation.
        </p>

        <div className="risk-buttons">

          <button
            onClick={() => {
              setWeatherRisk("Low");
              setRainfall(2);
            }}
          >
            🟢 Clear Weather
          </button>

          <button
            onClick={() => {
              setWeatherRisk("Medium");
              setRainfall(35);
            }}
          >
            🟡 Moderate Rain
          </button>

          <button
            onClick={() => {
              setWeatherRisk("High");
              setRainfall(85);
            }}
          >
            🔴 Heavy Rain
          </button>

        </div>

      </section>
    </>
  );
}

    // =========================
    // ANALYTICS
    // =========================

    if (activePage === "Analytics") {
      return (
        <>
          <section className="welcome">
            <h2>📊 Logistics Analytics</h2>
            <p>
              Monitor logistics performance, accessibility and
              route reliability across the NER network.
            </p>
          </section>

          <section className="cards">
            <div className="card">
              <h3>Route Reliability</h3>
              <strong>{routeReliability}/100</strong>
              <p>Current recommended route</p>
            </div>

            <div className="card">
              <h3>Accessibility Score</h3>
              <strong>{accessibilityScore}/100</strong>
              <p>Network accessibility</p>
            </div>

            <div className="card">
              <h3>Active Alerts</h3>
              <strong>{activeAlerts}</strong>
              <p>Current risk alerts</p>
            </div>

            <div className="card">
              <h3>High Risk Roads</h3>
              <strong>{highRiskRoads}</strong>
              <p>Roads requiring attention</p>
            </div>
          </section>

          <section className="vehicle-status">
            <h2>📈 Network Performance</h2>

            <div className="weather-info">
              <div className="weather-card">
                <h3>🚚 Active Vehicles</h3>
                <strong>3</strong>
                <p>Vehicles currently monitored</p>
              </div>

              <div className="weather-card">
                <h3>📦 Essential Deliveries</h3>
                <strong>2</strong>
                <p>Active priority deliveries</p>
              </div>

              <div className="weather-card">
                <h3>📍 Field Reports</h3>
                <strong>
                  {submittedReport ? "1" : "0"}
                </strong>
                <p>Verified field incidents</p>
              </div>
            </div>
          </section>

          <section className="vehicle-status">
            <h2>🧠 AI Decision Metrics</h2>

            <div className="vehicle-info">
              <div>
                <span>Weather Risk</span>
                <strong>{weatherRisk}</strong>
              </div>

              <div>
                <span>Road Risk</span>
                <strong>{roadRisk}</strong>
              </div>

              <div>
                <span>Accessibility</span>
                <strong>{accessibilityScore}/100</strong>
              </div>

              <div>
                <span>Reliability</span>
                <strong>{routeReliability}/100</strong>
              </div>

              <div>
                <span>Reroute</span>
                <strong>
                  {rerouteRecommended
                    ? "🔄 Required"
                    : "✅ Not Required"}
                </strong>
              </div>
            </div>
          </section>

          <section className="alert-panel">
            <h2>🎯 System Impact</h2>

            <div className="alert-box">
              <p>
                <strong>NER-LOGIX objective:</strong>
              </p>

              <p>
                Convert fragmented road, weather, GPS and field
                information into actionable logistics
                intelligence.
              </p>

              <p>🚚 Prioritize essential deliveries</p>
              <p>🛣️ Identify unreliable routes</p>
              <p>🌧️ Detect weather-related disruption risk</p>
              <p>🔄 Recommend reliable alternate routes</p>
            </div>
          </section>
        </>
      );
    }

    // =========================
    // SETTINGS
    // =========================

    if (activePage === "Settings") {
      return (
        <div className="card">
          <h2>⚙️ Settings</h2>
          <p>NER-LOGIX system settings.</p>
        </div>
      );
    }

    return null;
  };

  // =========================
  // MAIN UI
  // =========================

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <Header activePage={activePage} />

      <main className="dashboard">
        {activePage === "Dashboard" ? (
          <>
            <section className="welcome">
              <h2>
                North Eastern Region Logistics Dashboard
              </h2>

              <p>
                Most Reliable Route, Not Simply the Shortest Route.
              </p>
            </section>

            {/* OVERVIEW */}

            <div className="dashboard-overview">
              <div className="overview-card overview-primary">
                <div className="overview-icon">🛰️</div>

                <div>
                  <span>Network Status</span>
                  <strong>Operational</strong>
                  <small>
                    NER logistics network monitored
                  </small>
                </div>
              </div>

              <div className="overview-card">
                <div className="overview-icon">🚚</div>

                <div>
                  <span>Active Deliveries</span>
                  <strong>2</strong>
                  <small>Essential logistics in transit</small>
                </div>
              </div>

              <div className="overview-card">
                <div className="overview-icon">⚠️</div>

                <div>
                  <span>Risk Monitoring</span>
                  <strong>{highRiskRoads}</strong>
                  <small>High-risk roads detected</small>
                </div>
              </div>

              <div className="overview-card">
                <div className="overview-icon">📡</div>

                <div>
                  <span>Field Intelligence</span>
                  <strong>{activeAlerts}</strong>
                  <small>Active field alerts</small>
                </div>
              </div>
            </div>

            {/* DASHBOARD CARDS */}

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
                    onClick={() =>
                      setDeliveryStatus("In Transit")
                    }
                  >
                    🟢 In Transit
                  </button>

                  <button
                    onClick={() =>
                      setDeliveryStatus("Delayed")
                    }
                  >
                    🟡 Delayed
                  </button>

                  <button
                    onClick={() =>
                      setDeliveryStatus("Delivered")
                    }
                  >
                    🔵 Delivered
                  </button>
                </div>
              </div>
            </section>

            {/* ROUTE RELIABILITY */}

            <section className="reliability-panel">
              <h2>🛣️ Route Reliability</h2>

              <div className="reliability-score">
                <strong>{routeReliability}/100</strong>

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

            {/* ACCESSIBILITY */}

            <section className="accessibility-panel">
              <h2>🗺️ Road Accessibility Score</h2>

              <div className="accessibility-score">
                <strong>{accessibilityScore}/100</strong>

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
                Score is calculated using current weather and
                road risk conditions.
              </p>
            </section>

            {/* WEATHER */}

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
                      {weatherRisk === "Low" &&
                        "🟢 Low"}

                      {weatherRisk === "Medium" &&
                        "🟡 Medium"}

                      {weatherRisk === "High" &&
                        "🔴 High"}
                    </strong>
                  </div>
                </div>
              )}
            </section>

            {/* LIVE VEHICLE */}

            <section className="vehicle-status">
              <h2>🚚 Live Vehicle Status</h2>

              <div className="vehicle-info">
                <div>
                  <span>Vehicle</span>
                  <strong>MED-01</strong>
                </div>

                <div>
                  <span>Cargo</span>

                  <strong>
                    Essential Medicine
                  </strong>

                  <p>
                    🚨 Priority:{" "}
                    <b>
                      {deliveryPriority}
                    </b>
                  </p>

                  <div className="delivery-buttons">
                    <button
                      onClick={() =>
                        setDeliveryPriority("Emergency")
                      }
                    >
                      🚨 Emergency
                    </button>

                    <button
                      onClick={() =>
                        setDeliveryPriority("High")
                      }
                    >
                      🔴 High
                    </button>

                    <button
                      onClick={() =>
                        setDeliveryPriority("Normal")
                      }
                    >
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
                    {vehicleRiskStatus === "Safe" &&
                      "🟢 Safe"}

                    {vehicleRiskStatus === "Caution" &&
                      "🟡 Caution"}

                    {(vehicleRiskStatus === "At Risk" ||
                      vehicleRiskStatus === "High Risk") &&
                      "🔴 At Risk"}
                  </strong>
                </div>

                <div>
                  <span>GPS</span>

                  <strong>🟢 Active</strong>

                  <p>📍 {vehicleLocation}</p>

                  <p>
                    📏 Distance:
                    <b> {distanceRemaining} km</b>
                  </p>

                  <p>
                    ⏱️ ETA:
                    <b> {eta} min</b>
                  </p>
                </div>

                <div>
                  <span>Risk Level</span>

                  <strong>
                    {riskLevel === "High"
                      ? "🔴 High"
                      : riskLevel === "Medium"
                      ? "🟡 Medium"
                      : "🟢 Low"}
                  </strong>

                  <div className="risk-buttons">
                    <button
                      onClick={() =>
                        setRiskLevel("Low")
                      }
                    >
                      Low Risk
                    </button>

                    <button
                      onClick={() =>
                        setRiskLevel("Medium")
                      }
                    >
                      Medium Risk
                    </button>

                    <button
                      onClick={() =>
                        setRiskLevel("High")
                      }
                    >
                      High Risk
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* VEHICLE TRACKING */}

            <section className="vehicle-tracking-panel">
              <div className="vehicle-tracking-header">
                <div>
                  <span>
                    LIVE VEHICLE INTELLIGENCE
                  </span>

                  <h2>
                    🚚 MED-01 — Essential Medicine Delivery
                  </h2>
                </div>

                <div
                  className={
                    vehicleRiskStatus === "At Risk" ||
                    vehicleRiskStatus === "High Risk"
                      ? "vehicle-live-status danger"
                      : "vehicle-live-status"
                  }
                >
                  ● {vehicleRiskStatus}
                </div>
              </div>

              <div className="vehicle-tracking-grid">
                <div className="vehicle-track-item">
                  <span>📍 Current Location</span>
                  <strong>{vehicleLocation}</strong>
                </div>

                <div className="vehicle-track-item">
                  <span>📏 Distance Remaining</span>
                  <strong>
                    {distanceRemaining} km
                  </strong>
                </div>

                <div className="vehicle-track-item">
                  <span>⏱️ Estimated Arrival</span>
                  <strong>{eta} min</strong>
                </div>

                <div className="vehicle-track-item">
                  <span>📦 Delivery Priority</span>
                  <strong>{deliveryPriority}</strong>
                </div>
              </div>

              <div className="vehicle-route-status">
                <div>
                  <span>Route Reliability</span>
                  <strong>{routeReliability}%</strong>
                </div>

                <div>
                  <span>Accessibility</span>
                  <strong>
                    {accessibilityScore}/100
                  </strong>
                </div>

                <div>
                  <span>Reroute</span>

                  <strong>
                    {rerouteRecommended
                      ? "🔄 Required"
                      : "✓ Not Required"}
                  </strong>
                </div>
              </div>

              <div className="vehicle-intelligence-message">
                {rerouteRecommended ? (
                  <>
                    <strong>
                      ⚠️ Route Change Recommended
                    </strong>

                    <p>
                      Current road conditions indicate
                      increased risk. An alternate route
                      should be considered for this
                      essential delivery.
                    </p>
                  </>
                ) : (
                  <>
                    <strong>
                      🟢 Delivery Operating Normally
                    </strong>

                    <p>
                      MED-01 is currently following the
                      recommended route for essential
                      logistics.
                    </p>
                  </>
                )}
              </div>
            </section>

            {/* ACTIVE ALERTS */}

            <section className="alert-panel">
              <h2>🚨 Active Alerts</h2>

              {activeAlerts > 0 ||
              n8nResult?.riskLevel === "High" ? (
                <div className="alert-box">
                  <div className="alert-title">
                    🚨 ROAD BLOCK DETECTED
                  </div>

                  <p>
                    📍 {incidentLocationText}
                  </p>

                  <p>
                    ⚠️ Risk Level:
                    <strong>
                      {" "}
                      {n8nResult?.riskLevel ||
                        riskLevel}
                    </strong>
                  </p>

                  <p>
                    {n8nResult?.alert ||
                      (rerouteRecommended
                        ? "🔄 Alternate Route Recommended"
                        : "🟢 Current Route Recommended")}
                  </p>
                </div>
              ) : (
                <div className="no-alert">
                  🟢 No active disruptions
                </div>
              )}
            </section>

            {/* FIELD REPORT */}

            <section className="field-report-panel">
              <h2>📋 Field Incident Report</h2>

              <label>Incident Type</label>

              <select
                value={incidentType}
                onChange={(e) =>
                  setIncidentType(e.target.value)
                }
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
                onChange={(e) =>
                  setIncidentSeverity(e.target.value)
                }
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <label>Field Report</label>

              <textarea
                value={fieldReport}
                onChange={(e) =>
                  setFieldReport(e.target.value)
                }
                placeholder="Describe the incident..."
              />

              <button onClick={submitFieldReport}>
                📤 Submit Field Report
              </button>
            </section>

            {/* LATEST FIELD INCIDENT */}

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
      📍 Location:
      <b> {submittedReport.location}</b>
    </p>

    <p>
      📝 Report:
      <b>
        {" "}
        {submittedReport.description ||
          "No description provided"}
      </b>
    </p>

    {n8nResult && (
      <div
        className={`alert-box ${
          n8nResult.riskLevel === "High"
            ? "risk-high"
            : n8nResult.riskLevel === "Medium"
            ? "risk-medium"
            : "risk-low"
        }`}
>
        <p>
          🤖 <strong>Workflow Risk Analysis</strong>
        </p>

        <p>
          Risk Score:{" "}
          <strong>
            {n8nResult.riskScore}/100
          </strong>
        </p>

        <p>
          Risk Level:{" "}
          <strong>
            {n8nResult.riskLevel}
          </strong>
        </p>

        <p>
          🚨 Alert:{" "}
          <strong>
            {n8nResult.alert}
          </strong>
        </p>
      </div>
    )}
  </section>
)}
            {/* ROUTE RECOMMENDATION */}

            {rerouteRecommended && (
              <section className="alert-panel">
                <h2>🔄 Route Recommendation</h2>

                <div className="alert-box">
                  <div className="alert-title">
                    🔄 ALTERNATE ROUTE RECOMMENDED
                  </div>

                  <p>
                    ⚠️ Current route has an
                    accessibility risk.
                  </p>

                  <p>
                    🚚 Vehicle:
                    <b> MED-01</b>
                  </p>

                  <p>
                    🛣️ Recommendation:
                    <b> Use Alternate Route</b>
                  </p>
                </div>
              </section>
            )}

            {/* REGIONAL MAP */}

            <section className="map-box">
              <h2>🗺️ Regional Accessibility Map</h2>

              <div className="map-placeholder">
                <MapView
                  incidentLocation={incidentLocation}
                  onRoadBlockChange={handleRoadBlockChange}
                  onVehicleMove={handleVehicleMove}
                />
              </div>
            </section>
          </>
        ) : (
          renderPage()
        )}
      </main>
    </div>
  );
}

export default App;