
#include <WiFi.h>
#include <Preferences.h>
#include <SPI.h>
#include <LoRa.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>

// ==================== LED ====================
#define LED_PIN 2

// ==================== LORA PINS ====================
#define LORA_SCK   18
#define LORA_MISO  19
#define LORA_MOSI  23
#define LORA_SS     5
#define LORA_RST   14
#define LORA_DIO0  26

// ==================== LORA CONFIG ====================
#define LORA_FREQUENCY 433E6
#define LORA_BANDWIDTH 500E3
#define LORA_SF        7

// ==================== WIFI / API ====================
Preferences preferences;
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

String wifiSSID;
String wifiPassword;

bool serverStarted = false;
unsigned long receivedPackets = 0;
unsigned long lastWiFiRetry = 0;

// Latest received telemetry
String latestPacketID = "";
String latestTelemetry = "{}";
int latestRSSI = 0;
float latestSNR = 0.0;

// ======================================================
// SERIAL WIFI CONFIGURATION
// ======================================================

String readSerialLine(const char* prompt) {
  Serial.print(prompt);

  while (true) {
    if (Serial.available()) {
      String value = Serial.readStringUntil('\n');
      value.trim();

      if (value.length() > 0) {
        return value;
      }
    }

    delay(10);
  }
}

void loadWiFiCredentials() {
  preferences.begin("darkness-wifi", false);

  wifiSSID = preferences.getString("ssid", "");
  wifiPassword = preferences.getString("password", "");

  if (wifiSSID.length() == 0) {
    Serial.println("\n=== WIFI CONFIGURATION ===");

    wifiSSID = readSerialLine("Enter WiFi SSID: ");
    wifiPassword = readSerialLine("Enter WiFi password: ");

    preferences.putString("ssid", wifiSSID);
    preferences.putString("password", wifiPassword);

    Serial.println("WiFi credentials saved to flash.");
  } else {
    Serial.println("\nSaved WiFi credentials loaded.");
    Serial.print("SSID: ");
    Serial.println(wifiSSID);
  }

  preferences.end();
}


// ======================================================
// CLEAR SAVED WIFI CREDENTIALS
// Serial Monitor command: CLEAR_WIFI
// ======================================================

void clearWiFiCredentials() {
  preferences.begin("darkness-wifi", false);

  preferences.remove("ssid");
  preferences.remove("password");

  preferences.end();

  Serial.println("WiFi credentials cleared from flash.");
  Serial.println("Restarting ESP32...");

  delay(500);
  ESP.restart();
}

// ======================================================
// WIFI CONNECTION
// ======================================================

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

  Serial.println("Connecting to WiFi...");

  unsigned long startTime = millis();

  while (WiFi.status() != WL_CONNECTED &&
         millis() - startTime < 15000) {
    delay(250);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi unavailable. Will retry in loop.");
  }
}

// ======================================================
// API SERVER
// ======================================================

void startWebServer() {
  if (serverStarted) {
    return;
  }

  // WebSocket: ws://ESP32_IP/ws
  ws.onEvent([](AsyncWebSocket* server,
                AsyncWebSocketClient* client,
                AwsEventType type,
                void* arg,
                uint8_t* data,
                size_t len) {

    if (type == WS_EVT_CONNECT) {
      Serial.printf(
        "WebSocket client connected: %u\n",
        client->id()
      );
    }

    if (type == WS_EVT_DISCONNECT) {
      Serial.printf(
        "WebSocket client disconnected: %u\n",
        client->id()
      );
    }
  });

  server.addHandler(&ws);

  // GET /api/status
  server.on("/api/status", HTTP_GET,
    [](AsyncWebServerRequest* request) {
      String response = "{";
      response += "\"wifi_connected\":";
      response +=
        (WiFi.status() == WL_CONNECTED) ? "true" : "false";
      response += ",\"ip\":\"";
      response += WiFi.localIP().toString();
      response += "\",\"packets_received\":";
      response += String(receivedPackets);
      response += "}";

      request->send(200, "application/json", response);
    }
  );

  // GET /api/telemetry/latest
  server.on("/api/telemetry/latest", HTTP_GET,
    [](AsyncWebServerRequest* request) {
      String response = "{";
      response += "\"packet_id\":\"";
      response += latestPacketID;
      response += "\",\"rssi\":";
      response += String(latestRSSI);
      response += ",\"snr\":";
      response += String(latestSNR, 2);
      response += ",\"telemetry\":";
      response += latestTelemetry;
      response += "}";

      request->send(200, "application/json", response);
    }
  );

  // GET /api/telemetry/count
  server.on("/api/telemetry/count", HTTP_GET,
    [](AsyncWebServerRequest* request) {
      String response = "{\"count\":";
      response += String(receivedPackets);
      response += "}";

      request->send(200, "application/json", response);
    }
  );

  // API-only server: no HTML page or root dashboard.
  server.on("/", HTTP_GET,
    [](AsyncWebServerRequest* request) {
      request->send(
        404,
        "application/json",
        "{\"error\":\"Not found\",\"available_endpoints\":["
        "\"/api/status\","
        "\"/api/telemetry/latest\","
        "\"/api/telemetry/count\","
        "\"/ws\"]}"
      );
    }
  );

  server.onNotFound(
    [](AsyncWebServerRequest* request) {
      request->send(
        404,
        "application/json",
        "{\"error\":\"Endpoint not found\"}"
      );
    }
  );

  server.begin();
  serverStarted = true;

  Serial.println("\nAPI server started.");
  Serial.println("GET /api/status");
  Serial.println("GET /api/telemetry/latest");
  Serial.println("GET /api/telemetry/count");
  Serial.println("WS  /ws");
}

// ======================================================
// SETUP
// ======================================================

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(30000);
  delay(1000);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Initialize LoRa
  SPI.begin(
    LORA_SCK,
    LORA_MISO,
    LORA_MOSI,
    LORA_SS
  );

  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("LoRa initialization failed!");

    while (true) {
      delay(1000);
    }
  }

  LoRa.setSpreadingFactor(LORA_SF);
  LoRa.setSignalBandwidth(LORA_BANDWIDTH);
  LoRa.setCodingRate4(5);
  LoRa.enableCrc();

  Serial.println("LoRa telemetry receiver ready.");

  // Load saved credentials or request them over Serial.
  loadWiFiCredentials();

  // WiFi failure must not prevent LoRa reception.
  connectWiFi();

  if (WiFi.status() == WL_CONNECTED) {
    startWebServer();
  }

  LoRa.receive();

  Serial.println("DARKNESS 1 gateway ready.");
}

// ======================================================
// MAIN LOOP
// ======================================================

void loop() {
  // Serial command to erase saved WiFi credentials.
  // In Serial Monitor, set line ending to Newline and type CLEAR_WIFI.
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command == "CLEAR_WIFI") {
      clearWiFiCredentials();
    } else if (command.length() > 0) {
      Serial.println("Unknown command. Type CLEAR_WIFI to erase WiFi credentials.");
    }
  }

  // Retry WiFi without a long blocking connection loop.
  if (WiFi.status() != WL_CONNECTED &&
      millis() - lastWiFiRetry >= 10000) {

    lastWiFiRetry = millis();

    Serial.println("Retrying WiFi...");
    WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
  }

  // Start the API if WiFi connects after startup.
  if (WiFi.status() == WL_CONNECTED && !serverStarted) {
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());

    startWebServer();
  }

  ws.cleanupClients();

  // ==================== RECEIVE LORA ====================
  int packetSize = LoRa.parsePacket();

  if (packetSize <= 0) {
    return;
  }

  String message;
  message.reserve(packetSize);

  while (LoRa.available()) {
    message += (char)LoRa.read();
  }

  receivedPackets++;

  int rssi = LoRa.packetRssi();
  float snr = LoRa.packetSnr();

  Serial.println();
  Serial.println("========== LORA PACKET ==========");

  Serial.print("Packet count: ");
  Serial.println(receivedPackets);

  Serial.print("RSSI: ");
  Serial.print(rssi);
  Serial.println(" dBm");

  Serial.print("SNR: ");
  Serial.print(snr);
  Serial.println(" dB");

  Serial.println("Full received payload:");
  Serial.println(message);

  // ==================== PARSE PACKET ====================
  int separator = message.indexOf('\n');

  if (message.startsWith("ID:") && separator >= 0) {
    String packetID = message.substring(3, separator);
    String json = message.substring(separator + 1);
    packetID.trim();
    json.trim();

    Serial.print("Packet ID: ");
    Serial.println(packetID);

    Serial.println("JSON telemetry:");
    Serial.println(json);

    // Save latest telemetry for REST API.
    latestPacketID = packetID;
    latestTelemetry = json;
    latestRSSI = rssi;
    latestSNR = snr;

    // Broadcast the packet to all connected WebSocket clients.
    // The incoming telemetry must be valid JSON.
    String broadcast = "{";
    broadcast += "\"packet_id\":\"";
    broadcast += packetID;
    broadcast += "\",\"rssi\":";
    broadcast += String(rssi);
    broadcast += ",\"snr\":";
    broadcast += String(snr, 2);
    broadcast += ",\"telemetry\":";
    broadcast += json;
    broadcast += "}";

    if (WiFi.status() == WL_CONNECTED && serverStarted) {
      ws.textAll(broadcast);
      Serial.println("Telemetry broadcasted over WebSocket.");
    } else {
      Serial.println("WiFi/API offline; packet not broadcast.");
    }

    // Preserve your existing ACK behavior.
    digitalWrite(LED_PIN, HIGH);

    LoRa.beginPacket();
    LoRa.print("ACK:");
    LoRa.print(packetID); 

    int result = LoRa.endPacket();

    if (result == 1) {
      Serial.print("ACK sent for packet ");
      Serial.println(packetID);
    } else {
      Serial.println("ACK transmission failed.");
    }

    digitalWrite(LED_PIN, LOW);

  } else {
    Serial.println("Invalid packet format: expected ID header.");
  }

  Serial.println("=================================");

  LoRa.receive();
}
