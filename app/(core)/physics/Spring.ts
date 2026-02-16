// app/(core)/physics/Spring.ts
// Nature of Code - Daniel Shiffman
// Chapter 3: Oscillation
// FIXED: Now uses Y-UP physics coordinate system consistently

import type p5 from "p5";
import PhysicsBody from "./PhysicsBody.js";
import { physicsToScreen, toPixels } from "../constants/Utils.js";

interface SpringConfig {
  color?: string;
  anchorColor?: string;
  numCoils?: number;
  coilWidth?: number;
}

export default class Spring {
  public anchor: p5.Vector; // In physics coordinates (Y-up)
  public restLength: number; // meters
  public k: number; // N/m

  public readonly config: Required<SpringConfig>;
  private p: p5;

  constructor(
    p: p5,
    anchor: p5.Vector, // Physics coordinates (Y-up)
    restLengthMeters: number,
    k: number = 50,
    config: SpringConfig = {}
  ) {
    this.p = p;
    this.anchor = anchor.copy(); // Store in physics coords
    this.restLength = restLengthMeters;
    this.k = k;

    this.config = {
      color: config.color ?? "#ec4899",
      anchorColor: config.anchorColor ?? "#9ca3af",
      numCoils: config.numCoils ?? 10,
      coilWidth: config.coilWidth ?? 8,
    };
  }

  /**
   * Apply spring force based on Hooke's Law: F = -k * x
   * ALL calculations in physics coordinates (Y-up)
   */
  public connect(body: PhysicsBody): void {
    const Vector = (this.p.constructor as any).Vector;

    // Vector from body to anchor (in physics coords, Y-up)
    const force = Vector.sub(this.anchor, body.state.position);
    const currentLength = force.mag();

    if (currentLength < 0.0001) return;

    // Displacement from rest length
    const displacement = currentLength - this.restLength;

    // Hooke's Law: F = -k * x
    // displacement > 0 (stretched): force pulls toward anchor
    // displacement < 0 (compressed): force pushes away from anchor
    const springForceMag = -this.k * displacement;

    // Apply force in direction from body to anchor
    force.normalize().mult(springForceMag);
    body.applyForce(force);
  }

  /**
   * Constrain physical distance between anchor and body
   */
  public constrainLength(body: PhysicsBody, min: number, max: number): void {
    const Vector = (this.p.constructor as any).Vector;
    const direction = Vector.sub(body.state.position, this.anchor);
    const d = direction.mag();

    if (d < min || d > max) {
      const targetLen = this.p.constrain(d, min, max);
      direction.setMag(targetLen);
      body.state.position = Vector.add(this.anchor, direction);

      // Damp velocity to prevent infinite bouncing
      body.state.velocity.mult(0.5);
    }
  }

  /**
   * Draw anchor (fixed point)
   * Converts physics coords to screen coords
   */
  public show(): void {
    const screenPos = physicsToScreen(this.anchor, this.p);

    this.p.push();
    this.p.noStroke();
    this.p.fill(this.config.anchorColor);
    this.p.circle(screenPos.x, screenPos.y, 12);

    // Draw horizontal line above anchor (ceiling mount)
    this.p.stroke(this.config.anchorColor);
    this.p.strokeWeight(3);
    this.p.line(
      screenPos.x - 15,
      screenPos.y - 8,
      screenPos.x + 15,
      screenPos.y - 8
    );
    this.p.pop();
  }

  /**
   * Draw spring connection
   * Converts physics coords to screen coords
   */
  public showLine(body: PhysicsBody, stylized: boolean = true): void {
    const anchorScreen = physicsToScreen(this.anchor, this.p);
    const bodyScreen = physicsToScreen(body.state.position, this.p);

    this.p.push();
    this.p.stroke(this.config.color);
    this.p.strokeWeight(2);
    this.p.noFill();

    if (stylized) {
      this.drawCoils(
        anchorScreen.x,
        anchorScreen.y,
        bodyScreen.x,
        bodyScreen.y
      );
    } else {
      this.p.line(anchorScreen.x, anchorScreen.y, bodyScreen.x, bodyScreen.y);
    }
    this.p.pop();
  }

  private drawCoils(ax: number, ay: number, bx: number, by: number): void {
    const { numCoils, coilWidth } = this.config;
    const angle = Math.atan2(by - ay, bx - ax);
    const perpAngle = angle + Math.PI / 2;

    this.p.beginShape();
    for (let i = 0; i <= numCoils; i++) {
      const t = i / numCoils;
      let x = this.p.lerp(ax, bx, t);
      let y = this.p.lerp(ay, by, t);

      if (i > 0 && i < numCoils) {
        const offset = (i % 2 === 0 ? 1 : -1) * coilWidth;
        x += Math.cos(perpAngle) * offset;
        y += Math.sin(perpAngle) * offset;
      }
      this.p.vertex(x, y);
    }
    this.p.endShape();
  }

  /**
   * Get elastic potential energy: PE = 0.5 * k * x²
   */
  public getElasticPotentialEnergy(body: PhysicsBody): number {
    const displacement = this.getDisplacement(body);
    return 0.5 * this.k * displacement * displacement;
  }

  /**
   * Get spring force magnitude: F = -k * x
   */
  public getSpringForce(body: PhysicsBody): number {
    const displacement = this.getDisplacement(body);
    return -this.k * displacement;
  }

  /**
   * Set anchor position
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param isScreen - If true, converts from screen coords to physics coords
   */
  public setAnchor(x: number, y: number, isScreen: boolean = false): void {
    if (isScreen) {
      // Convert from screen coordinates to physics coordinates
      const { screenYToPhysicsY, toMeters } = require("../constants/Utils.js");
      this.anchor.set(toMeters(x), screenYToPhysicsY(y));
    } else {
      // Already in physics coordinates
      this.anchor.set(x, y);
    }
  }

  /**
   * Get current length of spring (in meters)
   */
  public getLength(body: PhysicsBody): number {
    const Vector = (this.p.constructor as any).Vector;
    return Vector.dist(this.anchor, body.state.position);
  }

  /**
   * Get displacement from rest length (in meters)
   * Positive = stretched, Negative = compressed
   */
  public getDisplacement(body: PhysicsBody): number {
    return this.getLength(body) - this.restLength;
  }
}
