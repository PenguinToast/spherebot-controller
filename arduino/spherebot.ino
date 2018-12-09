#include <SoftwareSerial.h>

SoftwareSerial ble(13, 12);

const int NUM_OUTPUTS = 4;
const int MOTOR_PINS[] = {3, 5, 6, 9};

void setup() {
  Serial.begin(9600);
  Serial.println("Begin");
  ble.begin(9600);
  ble.println("Begin");

  for (int i = 0; i < NUM_OUTPUTS; i++) {
    pinMode(MOTOR_PINS[i], OUTPUT);
    digitalWrite(MOTOR_PINS[i], LOW);
  }
}

bool motorStates[] = {false, false, false, false};

void loop() {
  if (ble.available() > 0) {
    int motor = ble.parseInt();
    Serial.println(motor);
    if (motor < 0 || motor >= NUM_OUTPUTS) {
      ble.println("Invalid output");
      return;
    }

    bool newState = !motorStates[motor];
    motorStates[motor] = newState;
    digitalWrite(MOTOR_PINS[motor], newState ? HIGH : LOW);

    ble.print("Toggling motor ");
    ble.print(motor);
    ble.print(" to ");
    ble.println(newState);
  }
}
