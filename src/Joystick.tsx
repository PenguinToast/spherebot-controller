import React, { Component, createRef } from "react";

import { ResizeSensor } from "@blueprintjs/core";

export interface IJoystickProps {
  className?: string;
  value: number;
  onChange: (newValue: number) => void;
}

const WIDTH = 30;

export class Joystick extends Component<IJoystickProps, {}> {
  private divRef = createRef<HTMLDivElement>();
  private canvasRef = createRef<HTMLCanvasElement>();

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    return ctx;
  }

  private drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = "#BFCCD6";
    this.roundRect(ctx, 0, 0, width, height, width / 2).fill();
    this.roundRect(ctx, 0, 0, width, height, width / 2).stroke();
  }

  private sizeCanvas(canvas: HTMLCanvasElement, div: HTMLDivElement) {
    canvas.width = div.clientWidth;
    canvas.height = div.clientHeight;
  }

  private radius(canvas: HTMLCanvasElement): number {
    return canvas.width / 2 - 1;
  }

  private valueToY(canvas: HTMLCanvasElement, value: number): number {
    const height = canvas.height;
    return height / 2 + -value * (height / 2 - this.radius(canvas));
  }

  private yToValue(canvas: HTMLCanvasElement, y: number): number {
    const height = canvas.height;
    const value = (height / 2 - y) / (height / 2 - this.radius(canvas));
    if (value > 1) {
      return 1;
    } else if (value < -1) {
      return -1;
    }
    return value;
  }

  private redraw = () => {
    const canvas = this.canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d")!;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    this.drawBackground(ctx, width, height);

    // Draw slider
    ctx.beginPath();
    ctx.arc(
      width / 2,
      this.valueToY(canvas, this.props.value),
      this.radius(canvas),
      0,
      2 * Math.PI
    );
    ctx.closePath();
    ctx.fillStyle = "#394B59";
    ctx.fill();
    ctx.stroke();
  };

  private windowToCanvas(canvas: HTMLCanvasElement, x: number, y: number) {
    const bbox = canvas.getBoundingClientRect();

    return {
      x: x - bbox.left * (canvas.width / bbox.width),
      y: y - bbox.top * (canvas.height / bbox.height),
    };
  }

  handleResize = () => {
    const canvas = this.canvasRef.current;
    const div = this.divRef.current;
    if (!canvas || !div) {
      return;
    }
    this.sizeCanvas(canvas, div);
    setTimeout(this.redraw, 1);
  };

  handleMouseEvent = (e: MouseEvent) => {
    const canvas = this.canvasRef.current;
    if (!canvas) {
      return;
    }
    const loc = this.windowToCanvas(canvas, e.clientX, e.clientY);
    this.props.onChange(this.yToValue(canvas, loc.y));
  };

  componentDidMount() {
    const canvas = this.canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.addEventListener("mousedown", e => {
      this.handleMouseEvent(e);
      window.addEventListener("mousemove", this.handleMouseEvent);
      window.addEventListener("mouseup", () => {
        window.removeEventListener("mousemove", this.handleMouseEvent);
        window.removeEventListener("mouseup", this.handleMouseEvent);
      });
    });
    this.handleResize();
  }

  componentDidUpdate() {
    this.redraw();
  }

  render() {
    return (
      <ResizeSensor onResize={this.handleResize}>
        <div className={this.props.className} ref={this.divRef}>
          <canvas ref={this.canvasRef} />
        </div>
      </ResizeSensor>
    );
  }
}
