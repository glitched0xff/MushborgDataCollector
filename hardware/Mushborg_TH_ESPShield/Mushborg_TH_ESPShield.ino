/**
Mushborg device
Shield: ESP8266-S
Board: ESP8266-01S DHT 11 V1.0 TB IOTMCU
Ver:.1 pre
Author: Glitched
Date: 8-01-26

Simple device ready for communacate with every MQTT Broker.
Howto
-TurnOn the shield and wait 5 sec.
-Connect to mushborgDevice Wifi
-Open 192.168.4.1 on browser
-Set data and save
-The device reboot
-After some seconds the connection message appear on your mqtt broker

Serial command:
SHOW_DATA (Show config DATA)
RESET (factory reset)

MQTT Command:
mushborg/COD_DEVICE/edit 
 --- {"factory_reset":1} for factory reset
 --- {"interval":xxxxxx} time for interval in Ms
*/


#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <AsyncMqttClient.h>
#include <EEPROM.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Ticker.h>
#include <time.h>

/* ================== CONFIG ================== */
#define EEPROM_SIZE 512
#define CONFIG_MAGIC 0xDEADBEEF

#define AP_SSID "mushborgDevice"

#define DHTPIN 2
#define DHTTYPE DHT11
#define BTN_RESET 0
char willPayload[128];
char willTopic[64];

/* ================== OGGETTI ================== */
AsyncWebServer server(80);
AsyncMqttClient mqtt;
DHT dht(DHTPIN, DHTTYPE);
Ticker rebootTimer;
volatile bool doReboot = false;

void requestReboot(uint32_t sec) {
  rebootTimer.once(sec, []() {
    doReboot = true;
  });
}

/* ================== CONFIG STRUCT ================== */

struct Config {
  uint32_t magic;
  char ssid[32];
  char pass[32];
  char cod[16];
  char mqttServer[32];
  char mqttUser[16];
  char mqttPass[16];
  uint32_t interval;
} ;

Config cfg;
bool configured = false;
unsigned long lastSend = 0;
String scannedNetworks;

/* ================== EEPROM ================== */

void saveConfig() {
  cfg.magic = CONFIG_MAGIC;

  EEPROM.put(0, cfg);
  EEPROM.commit();
  if(EEPROM.commit()) {
      Serial.println("COMMIT OK!");
  } else {
      Serial.println("COMMIT FAILED!");
  }
  configured = true;
}



bool loadConfig() {
  EEPROM.get(0, cfg);

 Serial.print("MAGIC LETTA: 0x");
 Serial.println(cfg.magic, HEX);

  if (cfg.magic != CONFIG_MAGIC) {
    Serial.println("CONFIG EEPROM NON VALIDA");
    memset(&cfg, 0, sizeof(cfg));
    configured = false;
    return false;
  }
  delay(200);
  configured = true;
  return true;
}

void printConfig() {
  //loadConfig();
  Serial.println("---- CONFIG ----");
  Serial.printf("SSID: '%s'\n", cfg.ssid);
  Serial.printf("PASS: '%s'\n", cfg.pass);
  Serial.printf("COD: '%s'\n", cfg.cod);
  Serial.printf("MQTT SERVER: '%s'\n", cfg.mqttServer);
  Serial.printf("MQTT USER: '%s'\n", cfg.mqttUser);
  Serial.printf("MQTT PASS: '%s'\n", cfg.mqttPass);
  Serial.printf("INTERVAL: %lu\n", cfg.interval);
  Serial.println("----------------");
}



void resetConfig() {
  // EEPROM.begin(EEPROM_SIZE);
  for (int i = 0; i < EEPROM_SIZE; i++) EEPROM.write(i, 0);
  EEPROM.commit();
  EEPROM.end();

  memset(&cfg, 0, sizeof(cfg));
  configured = false;
}

/* ================== HTML ================== */
String htmlPage(String nets) {
  
  return 
    "<!DOCTYPE html><html><head>"
    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
    "<title>Mushborg setup</title>"
    "</head><body style='font-family:Arial;text-align:center;'>"
    "<h3>Mushborg</h3>" 
    "<h4>ESP8266 temp/hum setup</h3>"
    "<form action='/save'>"
    "<table style='margin:auto;'>"
    "<tr><td>WiFi:</td><td><select name='ssid'>" + nets + "</select></td></tr>"
    "<tr><td>Password:</td><td><input name='pass' type='password'></td></tr>"
    "<tr><td>Cod:</td><td><input name='cod'></td></tr>"
    "<tr><td>MQTT:</td><td><input name='mqtt'></td></tr>"
    "<tr><td>User:</td><td><input name='mu'></td></tr>"
    "<tr><td>Pass:</td><td><input name='mp'></td></tr>"
    "<tr><td>Intervallo ms:</td><td><input name='int'></td></tr>"
    "<tr><td colspan='2'><button>SALVA</button></td></tr>"
    "</table></form>"
    "</body></html>";
}

/* ================== WIFI SCAN ================== */

  void doWifiScan() {
    int n = WiFi.scanNetworks();
    scannedNetworks = "";
    for (int i = 0; i < n; i++) {
      scannedNetworks += "<option value='" + WiFi.SSID(i) + "'>";
      scannedNetworks += WiFi.SSID(i) + "</option>";
    }
    WiFi.scanDelete();
  }

/* ================== MQTT ================== */
void onMqttMessage(char* topic, char* payload,
                   AsyncMqttClientMessageProperties,
                   size_t len, size_t, size_t) {

  Serial.print("MQTT RX TOPIC: ");
  Serial.println(topic);

  String expected = "mushborg/" + String(cfg.cod) + "/edit";
  if (String(topic) != expected) return;

  char msg[len + 1];
  memcpy(msg, payload, len);
  msg[len] = 0;

  StaticJsonDocument<128> doc;
  if (deserializeJson(doc, msg)) {
    Serial.println("JSON parse error");
    return;
  }

  if (doc.containsKey("intervallo")) {
    cfg.interval = doc["intervallo"];
    saveConfig();
    Serial.println("INTERVALLO AGGIORNATO");
  }

  if (doc["factory_reset"] == 1) {
    Serial.println("FACTORY RESET VIA MQTT");
    sendOfflineStatus();
    delay(200);
    factoryReset();
  }
}


void onMqttConnect(bool) {
  Serial.print("Connected to MQTT");

  StaticJsonDocument<128> doc;
  doc["cod_device"] = cfg.cod;
  doc["type"] = "s";
  doc["status"] = 1;

  char buf[128];
  serializeJson(doc, buf);

  String base = "mushborg/" + String(cfg.cod);
  mqtt.publish((base + "/status").c_str(), 1, true, buf);
  mqtt.subscribe((base + "/edit").c_str(), 1);
}

void connectMqtt() {
  Serial.println("Connecting to MQTT");
  StaticJsonDocument<128> will;
  will["cod_device"] = cfg.cod;
  will["type"] = "s";
  will["status"] = 0;

  char buf[128];
  //serializeJson(will, buf);
  //String topic = "mushborg/" + String(cfg.cod) + "/status";
  serializeJson(will, willPayload);
  snprintf(willTopic, sizeof(willTopic),"mushborg/%s/status", cfg.cod);

  mqtt.setServer(cfg.mqttServer, 1883);
  if (strlen(cfg.mqttUser) > 0)
    mqtt.setCredentials(cfg.mqttUser, cfg.mqttPass);
   mqtt.setWill(willTopic, 1, true, willPayload);
  // mqtt.setWill(topic.c_str(), 1, true, buf);
  mqtt.connect();
}
void onMqttDisconnect(AsyncMqttClientDisconnectReason reason) {
  Serial.printf("MQTT DISCONNECTED, reason: %d\n", (int)reason);

  if (WiFi.isConnected()) {
    requestReboot(5);   // oppure reconnect
  }
}

void factoryReset() {
  Serial.println("PULIZIA EEPROM IN CORSO..."); 
  // Sovrascrive tutto il buffer con zeri
  for (int i = 0; i < EEPROM_SIZE; i++) {
    EEPROM.write(i, 0);
  }
  // Applica le modifiche alla Flash
  if (EEPROM.commit()) {
    Serial.println("EEPROM PULITA CON SUCCESSO");
  } else {
    Serial.println("ERRORE: COMMIT FALLITO");
  }
  memset(&cfg, 0, sizeof(cfg)); // Pulisce la variabile in RAM
  configured = false;
  Serial.println("RIAVVIO IN 1 SECONDO...");
  requestReboot(1);
}


void sendOfflineStatus() {
  StaticJsonDocument<128> doc;
  doc["cod_device"] = cfg.cod;
  doc["type"] = "S";
  doc["status"] = 0;

  char buf[128];
  serializeJson(doc, buf);

  String topic = "mushborg/" + String(cfg.cod) + "/status";
  mqtt.publish(topic.c_str(), 1, true, buf);
}

/* ================== AP ================== */
void startAP() {
  Serial.println("Start AP Mushborg: 192.168.4.1");

  WiFi.mode(WIFI_AP_STA);
  WiFi.disconnect(true);
  delay(300);

  WiFi.softAP(AP_SSID);
  doWifiScan();

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *req) {
    req->send(200, "text/html", htmlPage(scannedNetworks));
  });
  server.on("/save", HTTP_GET, [](AsyncWebServerRequest *req) {
    if (!req->hasParam("ssid") || !req->hasParam("cod")) {
      req->send(400, "text/plain", "Parametri mancanti");
      return;
    }
    memset(&cfg, 0, sizeof(cfg));

    strncpy(cfg.ssid, req->getParam("ssid")->value().c_str(), sizeof(cfg.ssid) - 1);
    strncpy(cfg.pass, req->getParam("pass")->value().c_str(), sizeof(cfg.pass) - 1);
    strncpy(cfg.cod,  req->getParam("cod")->value().c_str(),  sizeof(cfg.cod) - 1);
    strncpy(cfg.mqttServer, req->getParam("mqtt")->value().c_str(), sizeof(cfg.mqttServer) - 1);
    strncpy(cfg.mqttUser, req->getParam("mu")->value().c_str(), sizeof(cfg.mqttUser) - 1);
    strncpy(cfg.mqttPass, req->getParam("mp")->value().c_str(), sizeof(cfg.mqttPass) - 1);

    cfg.interval = req->getParam("int")->value().toInt();
    
    saveConfig();        // 🔥 SCRITTURA REALE EEPROM
    printConfig();

    req->send(200, "text/html", "Salvato! Riavvio tra 2s...");

    requestReboot(2);    // 🔥 reboot differito
  });
  server.begin();
}

/* ================== STA ================== */
void startSTA() {
  Serial.println("START STA");

  WiFi.mode(WIFI_STA);
  WiFi.setSleepMode(WIFI_NONE_SLEEP);
  WiFi.begin(cfg.ssid, cfg.pass);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > 15000) {
      Serial.println("WIFI FAIL → AP");
      startAP();
      return;
    }
    delay(300);
    yield();
  }

  Serial.println("WIFI OK");
  configTime(0, 0, "pool.ntp.org");
  mqtt.setServer(cfg.mqttServer, 1883);
  mqtt.setKeepAlive(30);
  mqtt.setCleanSession(true);
  mqtt.onMessage(onMqttMessage);
  mqtt.onConnect(onMqttConnect);
  // mqtt.onDisconnect([](AsyncMqttClientDisconnectReason) {
  //   Serial.println("MQTT DISCONNECTED");
  // });
  mqtt.onDisconnect(onMqttDisconnect);
  connectMqtt();
}

/* ================== checkResetButton ================== */


bool factoryResetButton() {
  if (digitalRead(BTN_RESET) == LOW) {
    unsigned long t = millis();
    while (digitalRead(BTN_RESET) == LOW) {
      if (millis() - t > 4000) return true; // 4 secondi
      delay(10);
    }
  }
  return false;
}
/* ================== SETUP ================== */
void setup() {
  Serial.begin(115200);
  delay(2000);
  dht.begin();
  EEPROM.begin(512);
// EEPROM.begin(512);
// for (int i = 0; i < 512; i++) EEPROM.write(i, 0xFF);
// EEPROM.commit();
// EEPROM.end();

//Serial.println("EEPROM PULITA");

  Serial.println("SETUP");

  Serial.println("LOAD CONFIG");

  if (!loadConfig()) {
    Serial.println("CONFIG NON VALIDA → AP");
    printConfig();
    startAP();
  } else {
    printConfig();
    startSTA();
  }
}

  // if (factoryResetButton()) {
  //   Serial.println("FACTORY RESET DA PULSANTE");
  //   resetConfig();
  // }


/* ================== LOOP ================== */
void loop() {

  // --- ASCOLTO COMANDI SERIALI ---
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n'); // Legge il comando fino all'invio
    input.trim(); // Rimuove spazi o caratteri nascosti (\r)

    if (input == "RESET") {
      Serial.println("!!! COMANDO RESET RICEVUTO !!!");
      factoryReset(); // Usa la funzione che hai già scritto nel tuo codice
    }
    if (input == "SHOW_DATA") {
     printConfig();
    }
  }

  if (doReboot) {
    delay(100);   // lascia finire Serial / EEPROM
    ESP.restart();
  }

  if (!configured || !mqtt.connected()) {  
    yield();
    return;
  }

  if (configured && WiFi.status() == WL_CONNECTED && !mqtt.connected()) {
  static unsigned long lastTry = 0;
  if (millis() - lastTry > 5000) {
    lastTry = millis();
    connectMqtt();
  }
}


  if (millis() - lastSend < cfg.interval) return;
  lastSend = millis();
  Serial.println("SEND..");
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h))
  {
    Serial.println("Errore sensore");
    //return;
    t=99;
    h=99;
  } 

  time_t now = time(nullptr);

  StaticJsonDocument<256> doc;
  doc["cod_device"] = cfg.cod;
  doc["type"] = "s";
  doc["temp"] = t;
  doc["hume"] = h;
  doc["timestamp"] = now;

  char buf[256];
  serializeJson(doc, buf);
  serializeJson(doc, Serial);
  String topic = "mushborg/" + String(cfg.cod) + "/data";
  mqtt.publish(topic.c_str(), 1, false, buf);
}
