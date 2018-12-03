import React, { Component, createRef } from "react";
import "./static/css/controller.css";
import screenfull from "screenfull";

import { Button, Slider } from "@blueprintjs/core";
import { Joystick } from "./Joystick";

export interface IControllerProps {
  characteristic?: BluetoothRemoteGATTCharacteristic;
}

enum Motor {
  Left = 0,
  Right = 1,
}

interface IControllerState {
  [Motor.Left]: number;
  [Motor.Right]: number;
}

export class Controller extends Component<IControllerProps, IControllerState> {
  public readonly state: IControllerState = {
    [Motor.Left]: 0,
    [Motor.Right]: 0,
  };

  private divRef = createRef<HTMLDivElement>();

  getMotorHandler(motor: Motor) {
    return (value: number) => this.setState({ [motor]: value });
  }

  handleCenterClick = () => {
    if (screenfull && screenfull.enabled && this.divRef.current) {
      screenfull.toggle(this.divRef.current);
    }
  };

  render() {
    return (
      <div className="controller" ref={this.divRef}>
        <div className="slider-container">
          <Joystick
            className="slider"
            value={this.state[Motor.Left]}
            onChange={this.getMotorHandler(Motor.Left)}
          />
        </div>
        <div className="center-icon-container">
          <Button
            className="center-icon"
            icon="horizontal-distribution"
            large
            onClick={this.handleCenterClick}
          />
        </div>
        <div className="slider-container">
          <Joystick
            className="slider"
            value={this.state[Motor.Right]}
            onChange={this.getMotorHandler(Motor.Right)}
          />
        </div>
      </div>
    );
  }
}
