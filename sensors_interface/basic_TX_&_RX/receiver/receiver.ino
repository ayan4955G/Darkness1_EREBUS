#include <SPI.h>
#include <LoRa.h>

#define LED_PIN 2


#define LORA_SCK   18
#define LORA_MISO  19
#define LORA_MOSI  23
#define LORA_SS     5
#define LORA_RST   14
#define LORA_DIO0  26

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

  Serial.println("Receiver ready");

  LoRa.receive();
}

void loop() {

  int packetSize = LoRa.parsePacket();

  if (packetSize) {

    String message = "";

    while (LoRa.available()) {
      message += (char)LoRa.read();
    }

    Serial.print("Received: ");
    Serial.println(message);
    digitalWrite(LED_PIN, LOW);


    // Check whether this is a PING
    if (message.startsWith("PING:")) {

      String packetID = message.substring(5);

      Serial.print("PING ID: ");
      Serial.println(packetID);

      // Send ACK
      LoRa.idle();

      LoRa.beginPacket();

      LoRa.print("ACK:");
      LoRa.print(packetID);

      LoRa.endPacket();

      Serial.print("ACK sent for PING #");
      Serial.println(packetID);
      digitalWrite(LED_PIN, HIGH);


      // Return to receive mode
      LoRa.receive();
    }
  }
}