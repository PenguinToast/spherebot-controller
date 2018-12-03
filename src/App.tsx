import React, { Component } from "react";
import "./static/css/app.css";
import {
  Alignment,
  Button,
  Intent,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  NonIdealState,
  Spinner,
} from "@blueprintjs/core";
import { Controller } from "./Controller";

enum ConnectionState {
  Connected,
  Connecting,
  Disconnected,
  Disconnecting,
}

interface IAppState {
  connectionState: ConnectionState;
  characteristic: BluetoothRemoteGATTCharacteristic | null;
}

const SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";

class App extends Component<{}, IAppState> {
  public readonly state: IAppState = {
    connectionState: ConnectionState.Disconnected,
    characteristic: null,
  };

  handleConnectClick = async () => {
    try {
      this.setState({ connectionState: ConnectionState.Connecting });
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          {
            name: "Spherebot",
            services: [SERVICE_UUID],
          },
        ],
      });
      if (!device.gatt) {
        return;
      }
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
      this.setState({
        connectionState: ConnectionState.Connected,
        characteristic,
      });
    } catch (err) {
      console.log("Error: ", err);
      this.setState({
        connectionState: ConnectionState.Disconnected,
        characteristic: null,
      });
    }
  };

  handleDisconnectClick = async () => {
    try {
      this.setState({
        connectionState: ConnectionState.Disconnecting,
      });
      const characteristic = this.state.characteristic;
      if (!characteristic) {
        return;
      }
      const service = characteristic.service;
      if (!service) {
        return;
      }
      const gatt = service.device.gatt;
      if (!gatt) {
        return;
      }
      await gatt.disconnect();
    } catch (err) {
      console.log("Error: ", err);
    }
    this.setState({
      connectionState: ConnectionState.Disconnected,
      characteristic: null,
    });
  };

  renderConnectionButton() {
    switch (this.state.connectionState) {
      case ConnectionState.Disconnected:
        return <Button text="Connect" intent={Intent.PRIMARY} onClick={this.handleConnectClick} />;
      case ConnectionState.Connected:
        return (
          <Button text="Disconnect" intent={Intent.WARNING} onClick={this.handleDisconnectClick} />
        );
      case ConnectionState.Disconnecting:
        return <Button text="Disconnecting" disabled />;
      case ConnectionState.Connecting:
        return <Button text="Connecting" disabled />;
    }
  }

  renderController() {
    const characteristic = this.state.characteristic;
    if (!characteristic) {
      return <NonIdealState icon="offline" title="Disconnected from Spherebot!" />;
    }
    return <Controller characteristic={characteristic} />;
  }

  renderBody() {
    return <Controller />;
    switch (this.state.connectionState) {
      case ConnectionState.Disconnected:
        return <NonIdealState icon="offline" title="Please connect to Spherebot" />;
      case ConnectionState.Connecting | ConnectionState.Disconnecting:
        return <NonIdealState className="main-spinner" icon={<Spinner />} title="Loading..." />;
      case ConnectionState.Connected:
        return this.renderController();
    }
  }

  render() {
    return (
      <div className="main">
        <Navbar>
          <NavbarGroup align={Alignment.LEFT}>
            <NavbarHeading>Spherebot</NavbarHeading>
            <NavbarDivider />
            {this.renderConnectionButton()}
          </NavbarGroup>
        </Navbar>
        {this.renderBody()}
      </div>
    );
  }
}

export default App;
