
#include <SPI.h>
#include <LoRa.h>
#include <string.h>

#define LED_PIN 2

// Sensor ESP32 TX0 -> this ESP32 GPIO16 (RX2)
#define SENSOR_RX 16
#define SENSOR_TX 17
#define SENSOR_BAUD 115200

#define LORA_SCK   18
#define LORA_MISO  19
#define LORA_MOSI  23
#define LORA_SS     5
#define LORA_RST   14
#define LORA_DIO0  26

// Transmitter and receiver must use matching settings.
#define LORA_FREQUENCY 433E6
#define LORA_BANDWIDTH 500E3
#define LORA_SF        7

HardwareSerial SensorUART(2);

char rxBuffer[300];
char latestData[300];

volatile bool txDone = false;
volatile bool txBusy = false;

bool pendingData = false;
unsigned long packetID = 0;

void onTxDone() {
  txDone = true;
}

void setup() {
  Serial.begin(115200);

  SensorUART.begin(
    SENSOR_BAUD,
    SERIAL_8N1,
    SENSOR_RX,
    SENSOR_TX
  );

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

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

  // Enable asynchronous transmission completion callback.
  LoRa.onTxDone(onTxDone);

  Serial.println("UART-to-LoRa transmitter ready");
}

void loop() {
  static size_t index = 0;

  // 1. Read incoming UART data without blocking for a timeout.
  while (SensorUART.available() > 0) {
    char c = (char)SensorUART.read();

    if (c == '\n') {
      rxBuffer[index] = '\0';

      // Accept complete JSON lines only.
      if (index >= 2 &&
          rxBuffer[0] == '{' &&
          rxBuffer[index - 1] == '}') {

        // Keep the newest sample if the radio is busy.
        memcpy(latestData, rxBuffer, index + 1);
        pendingData = true;
      }

      index = 0;
    }
    else if (c != '\r') {
      if (index < sizeof(rxBuffer) - 1) {
        rxBuffer[index++] = c;
      } else {
        // Discard an oversized line.
        index = 0;
      }
    }
  }

  // 2. Handle completion of the previous transmission.
  if (txDone) {
    txDone = false;
    txBusy = false;

    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
  }

  // 3. Start the next packet when the radio is free.
  if (!txBusy && pendingData) {
    pendingData = false;
    txBusy = true;
    packetID++;

    LoRa.beginPacket();
    LoRa.print("ID:");
    LoRa.print(packetID);
    LoRa.print('\n');
    LoRa.print(latestData);

    // true = asynchronous transmission.
    int result = LoRa.endPacket(true);

    if (result != 1) {
      txBusy = false;
      Serial.println("LoRa transmission start failed");
    } else {
      Serial.print("TX packet #");
      Serial.println(packetID);
      Serial.print("Payload: ");
      Serial.println(latestData);
    }
  }
}
