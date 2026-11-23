import { afterEach, describe, expect, it } from "vitest";
import { enqueue, readQueue, type QueuedEncounter } from "./offline-queue";

const entry = (city_id: string, client_ref: string): QueuedEncounter => ({
  city_id,
  client_ref,
  lat: null,
  lng: null,
  service_chips: ["Water/Hygiene Kit"],
  private_clinical_note: null,
  created_at: "2026-11-23T00:00:00.000Z",
});

afterEach(() => localStorage.clear());

describe("offline city separation", () => {
  it("only returns queued encounters belonging to the active city", () => {
    enqueue(entry("city-a", "encounter-a"));
    enqueue(entry("city-b", "encounter-b"));

    expect(readQueue("city-a").map((item) => item.client_ref)).toEqual(["encounter-a"]);
    expect(readQueue("city-b").map((item) => item.client_ref)).toEqual(["encounter-b"]);
  });
});
