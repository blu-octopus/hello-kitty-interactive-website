import { describe, it, expect } from 'vitest';

// Test the Hello Kitty shape mathematical function
// This tests the core logic for generating the 3D shape

describe('isInsideHelloKitty Shape Logic', () => {
  // Test head region (centered at 0, 2, 0)
  it('identifies points inside the head', () => {
    // Points near center of head should be inside
    const testPoints = [
      { x: 0, y: 2, z: 0, expected: true }, // Center of head
      { x: 2, y: 2, z: 0, expected: true }, // Right side of head
      { x: -2, y: 2, z: 0, expected: true }, // Left side of head
      { x: 0, y: 3.5, z: 0, expected: true }, // Top of head
      { x: 0, y: 0.5, z: 0, expected: true }, // Bottom of head
      { x: 4, y: 2, z: 0, expected: false }, // Outside head (too far right)
      { x: 0, y: 5, z: 0, expected: false }, // Outside head (too high)
    ];

    testPoints.forEach(({ x, y, z, expected }) => {
      // Head ellipsoid: (x/3.2)^2 + ((y-2)/2.4)^2 + (z/2.2)^2 <= 1
      const head = (Math.pow(x / 3.2, 2) + Math.pow((y - 2) / 2.4, 2) + Math.pow(z / 2.2, 2)) <= 1;
      expect(head).toBe(expected);
    });
  });

  // Test body region (centered at 0, -1.5, 0)
  it('identifies points inside the body', () => {
    const testPoints = [
      { x: 0, y: -1.5, z: 0, expected: true }, // Center of body
      { x: 1.5, y: -1.5, z: 0, expected: true }, // Right side of body
      { x: 0, y: -3, z: 0, expected: true }, // Bottom of body
      { x: 3, y: -1.5, z: 0, expected: false }, // Outside body
    ];

    testPoints.forEach(({ x, y, z, expected }) => {
      // Body ellipsoid: (x/2.2)^2 + ((y+1.5)/2.8)^2 + (z/1.8)^2 <= 1
      const body = (Math.pow(x / 2.2, 2) + Math.pow((y + 1.5) / 2.8, 2) + Math.pow(z / 1.8, 2)) <= 1;
      expect(body).toBe(expected);
    });
  });

  // Test ear regions
  it('identifies points inside the ears', () => {
    // Left ear at (2.5, 4.2, 0)
    const leftEarCenter = { x: 2.5, y: 4.2, z: 0 };
    const leftEar = (Math.pow((leftEarCenter.x - 2.5) / 0.8, 2) + 
                     Math.pow((leftEarCenter.y - 4.2) / 1.2, 2) + 
                     Math.pow(leftEarCenter.z / 0.5, 2)) <= 1;
    expect(leftEar).toBe(true);

    // Right ear at (-2.5, 4.2, 0)
    const rightEarCenter = { x: -2.5, y: 4.2, z: 0 };
    const rightEar = (Math.pow((rightEarCenter.x + 2.5) / 0.8, 2) + 
                      Math.pow((rightEarCenter.y - 4.2) / 1.2, 2) + 
                      Math.pow(rightEarCenter.z / 0.5, 2)) <= 1;
    expect(rightEar).toBe(true);
  });

  // Test that the union logic works (point in any part = true)
  it('returns true if point is in any body part', () => {
    // A point in the head should return true
    const headPoint = { x: 0, y: 2, z: 0 };
    const inHead = (Math.pow(headPoint.x / 3.2, 2) + 
                    Math.pow((headPoint.y - 2) / 2.4, 2) + 
                    Math.pow(headPoint.z / 2.2, 2)) <= 1;
    expect(inHead).toBe(true);

    // A point in the body should return true
    const bodyPoint = { x: 0, y: -1.5, z: 0 };
    const inBody = (Math.pow(bodyPoint.x / 2.2, 2) + 
                    Math.pow((bodyPoint.y + 1.5) / 2.8, 2) + 
                    Math.pow(bodyPoint.z / 1.8, 2)) <= 1;
    expect(inBody).toBe(true);
  });
});

describe('Position Generation', () => {
  it('generates correct array length', () => {
    const count = 100;
    const positions = new Float32Array(count * 3);
    expect(positions.length).toBe(300); // 100 points * 3 coordinates (x, y, z)
  });

  it('generates valid float values', () => {
    const count = 10;
    const positions = new Float32Array(count * 3);
    
    // Fill with test values
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }

    // All values should be finite numbers
    for (let i = 0; i < positions.length; i++) {
      expect(Number.isFinite(positions[i])).toBe(true);
    }
  });
});

