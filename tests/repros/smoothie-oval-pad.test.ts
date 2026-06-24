import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

/**
 * Regression guard for #54: oval (DSN path) pads must keep their full long axis.
 *
 * A path padstack like `Oval[A]Pad_2844.8x1422.4_um` is
 * `(path Top 1422.4 -711.2 0 711.2 0)` — a 2.8448 x 1.4224 mm pill. The
 * converter set height = endpoint distance (1422.4um) and width = stroke width
 * (1422.4um), dropping the two cap radii, so the pad collapses to a 1.4224mm
 * square. The correct long dimension is endpointDist + strokeWidth.
 */
test("oval (path) pads keep their full long-axis dimension", () => {
  const circuitJson = convertDsnPcbToCircuitJson(
    parseDsnToDsnJson(smoothieDsn) as DsnPcb,
  ) as Array<Record<string, any>>

  const pads = circuitJson.filter((e) => e.type === "pcb_smtpad")

  // The square-bug signature: pads emitted as exactly 1.4224 x 1.4224.
  const squareBugged = pads.filter(
    (p) =>
      Math.abs(p.width - 1.4224) < 1e-6 && Math.abs(p.height - 1.4224) < 1e-6,
  )
  expect(squareBugged.length).toBe(0)

  // At least one pad from that family should be the full 2.8448 x 1.4224 pill.
  const fullPill = pads.find(
    (p) =>
      Math.abs(Math.max(p.width, p.height) - 2.8448) < 0.01 &&
      Math.abs(Math.min(p.width, p.height) - 1.4224) < 0.01,
  )
  expect(fullPill).toBeDefined()
})
