#include <SPI.h>
#include <LoRa.h>

#define LED_PIN 2

#define LORA_SCK   18
#define LORA_MISO  19
#define LORA_MOSI  23
#define LORA_SS     5
#define LORA_RST   14
#define LORA_DIO0  26

#define ACK_TIMEOUT 1000
#define MAX_RETRIES 3

unsigned long packetID = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);

  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(433E6)) {
    Serial.println("LoRa initialization failed!");
    while (true);
  }

  Serial.println("Sender ready");

  LoRa.receive();
}

void loop() {

  packetID++;

  bool acknowledged = false;

  for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {

    Serial.print("Sending PING #");
    Serial.print(packetID);
    Serial.print(" | Attempt ");
    Serial.println(attempt);

    // Switch from receive to transmit
    LoRa.idle();

    LoRa.beginPacket();

    LoRa.print("PING:");
    LoRa.print(packetID);
    digitalWrite(LED_PIN, LOW);

    LoRa.endPacket();

    // Return to receive mode
    LoRa.receive();

    unsigned long startTime = millis();

    // Wait for ACK
    while (millis() - startTime < ACK_TIMEOUT) {

      int packetSize = LoRa.parsePacket();

      if (packetSize) {

        String message = "";

        while (LoRa.available()) {
          message += (char)LoRa.read();
        }

        Serial.print("Received: ");
        Serial.println(message);

        String expectedACK = "ACK:" + String(packetID);

        if (message == expectedACK) {

          digitalWrite(LED_PIN, HIGH);
          Serial.println("ACK RECEIVED!");
          acknowledged = true;

          break;
        }
      }
    }

    if (acknowledged) {
      break;
    }

    Serial.println("ACK timeout - retrying...");
  }

  if (!acknowledged) {
    Serial.println("ERROR: No ACK received!");
  }

  Serial.println("------------------------");

  delay(2000);
}