import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { clientKey, parseOrigins, parseTrustProxy } from "../src/config.js";
import { bearingBetween, decodeVehicles } from "../src/poller.js";
import routesData from "../data/routes.json" with { type: "json" };

// Fixture capturada el 2026-11-10 ~20:17 America/Bogota (header ts 1794359878).
const buf = fs.readFileSync(new URL("./fixtures/positions.pb", import.meta.url));
const NOW_S = 1794359900;

describe("decodeVehicles", () => {
  const { vehicles, feedTimestamp, unknownRouteIds } = decodeVehicles(buf, new Map(), NOW_S);

  it("lee el timestamp del header", () => {
    expect(feedTimestamp).toBe(1794359878);
  });

  it("solo devuelve buses de rutas troncales/duales", () => {
    expect(vehicles.length).toBeGreaterThan(300);
    expect(vehicles.length).toBeLessThan(1500);
    expect(vehicles.every((v) => v.routeId in routesData.trunk)).toBe(true);
  });

  it("todas las posiciones caen en Bogotá", () => {
    expect(vehicles.every((v) => v.lat > 4.4 && v.lat < 4.9 && v.lon > -74.3 && v.lon < -73.9)).toBe(true);
  });

  it("no reporta route_id desconocidos con el GTFS del mismo día", () => {
    expect(unknownRouteIds).toEqual([]);
  });

  it("sin historial el rumbo es null (el feed no trae bearing; protobufjs daría 0)", () => {
    expect(vehicles.every((v) => v.bearing === null)).toBe(true);
  });

  it("calcula el rumbo con la posición anterior", () => {
    const v = vehicles[0];
    const prev = new Map([[v.id, { ...v, lat: v.lat - 0.001 }]]); // venía del sur
    const again = decodeVehicles(buf, prev, NOW_S).vehicles.find((x) => x.id === v.id)!;
    expect(again.bearing).toBe(0);
  });

  it("conserva el rumbo previo si el bus casi no se movió", () => {
    const v = vehicles[0];
    const prev = new Map([[v.id, { ...v, bearing: 123 }]]);
    const again = decodeVehicles(buf, prev, NOW_S).vehicles.find((x) => x.id === v.id)!;
    expect(again.bearing).toBe(123);
  });

  it("descarta vehículos con reportes viejos", () => {
    expect(decodeVehicles(buf, new Map(), NOW_S + 3600).vehicles).toHaveLength(0);
  });
});

describe("bearingBetween", () => {
  it("norte ≈ 0° y este ≈ 90°", () => {
    expect(Math.round(bearingBetween(4, -74, 4.01, -74))).toBe(0);
    expect(Math.round(bearingBetween(4, -74, 4, -73.99))).toBe(90);
  });
});

describe("clientKey", () => {
  const headers = { "cf-connecting-ip": "190.0.0.1", "x-forwarded-for": "1.2.3.4" };
  it("usa el header configurado cuando viene", () => {
    expect(clientKey(headers, "10.0.0.1", "cf-connecting-ip")).toBe("190.0.0.1");
  });
  it("vuelve a la IP del request si no hay header configurado o no viene", () => {
    expect(clientKey(headers, "10.0.0.1", null)).toBe("10.0.0.1");
    expect(clientKey({}, "10.0.0.1", "cf-connecting-ip")).toBe("10.0.0.1");
    expect(clientKey({ "cf-connecting-ip": "  " }, "10.0.0.1", "cf-connecting-ip")).toBe("10.0.0.1");
  });
});

describe("parseTrustProxy", () => {
  it("interpreta vacío, booleanos, saltos y listas", () => {
    expect(parseTrustProxy(undefined)).toBe(false);
    expect(parseTrustProxy("false")).toBe(false);
    expect(parseTrustProxy("true")).toBe(true);
    const twoHops = parseTrustProxy("2") as (a: string, hop: number) => boolean;
    expect([0, 1, 2].map((hop) => twoHops("10.0.0.1", hop))).toEqual([true, true, false]);
    expect(parseTrustProxy("10.0.0.0/8, 127.0.0.1")).toEqual(["10.0.0.0/8", "127.0.0.1"]);
  });
});

describe("parseOrigins", () => {
  it("acepta strings y regex entre barras", () => {
    const [a, b] = parseOrigins("http://localhost:3000, /^https:\\/\\/([a-z0-9-]+\\.)?bus\\.pages\\.dev$/");
    expect(a).toBe("http://localhost:3000");
    expect(b).toBeInstanceOf(RegExp);
    expect((b as RegExp).test("https://abc123.bus.pages.dev")).toBe(true);
    expect((b as RegExp).test("https://evil.dev")).toBe(false);
  });
});
