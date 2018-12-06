import React, { Component, createRef } from "react";
import "./static/css/controller.css";
import screenfull from "screenfull";

import { Button, Slider } from "@blueprintjs/core";
import { Joystick } from "./Joystick";

export interface IControllerProps {
  characteristic: BluetoothRemoteGATTCharacteristic;
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

  private lastSeqNo = 0;
  private lastAck = 0;
  private motorHandlers = {
    [Motor.Left]: this.getMotorHandler(Motor.Left),
    [Motor.Right]: this.getMotorHandler(Motor.Right),
  };

  private handleAck = async () => {
    const ackView = this.props.characteristic.value;
    if (!ackView) {
      return;
    }
    this.lastAck = ackView.getUint32(0, true);
  };

  async componentDidMount() {
    await this.props.characteristic.startNotifications();
    this.props.characteristic.addEventListener("characteristicvaluechanged", this.handleAck);
    await this.props.characteristic.writeValue(
      Uint8Array.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])
    );
  }

  async componentWillUnmount() {
    this.props.characteristic.removeEventListener("characteristicvaluechanged", this.handleAck);
    await this.props.characteristic.writeValue(
      Uint8Array.from([0xee, 0xee, 0xee, 0xee, 0xee, 0xee, 0xee, 0xee, 0xee])
    );
  }

  getMotorHandler(motor: Motor) {
    return async (value: number) => {
      this.setState({ [motor]: value });

      const lastSeqNo = this.lastSeqNo;
      const seqNo = lastSeqNo >= (1 << 31) * -2 - 1 ? 0 : lastSeqNo + 1;
      const buffer = new ArrayBuffer(9);
      const view = new DataView(buffer);
      view.setInt32(0, seqNo, true);
      view.setInt8(4, motor);
      view.setFloat32(5, value, true);

      if (this.lastAck != lastSeqNo) {
        return;
      }
      this.lastSeqNo = seqNo;
      await this.props.characteristic.writeValue(buffer);
    };
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
            onChange={this.motorHandlers[Motor.Left]}
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
            onChange={this.motorHandlers[Motor.Right]}
          />
        </div>
      </div>
    );
  }
}
