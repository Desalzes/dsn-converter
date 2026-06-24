import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

/**
 * Regression guard for #54: back-side component pads must land on the bottom layer.
 *
 * The Smoothie Board places SJ1/SJ2/SJ3 on the DSN `back` side, but the
 * rect/path/polygon SMT-pad branches derive the layer only from the padstack
 * shape name ("Top") and ignore `place.side`, so every back-side pad is emitted
 * on layer "top".
 */
test("back-side component pads are emitted on the bottom layer", () => {
  const circuitJson = convertDsnPcbToCircuitJson(
    parseDsnToDsnJson(smoothieDsn) as DsnPcb,
  ) as Array<Record<string, any>>

  const pads = circuitJson.filter((e) => e.type === "pcb_smtpad")
  const backRefdes = ["_SJ1", "_SJ2", "_SJ3", "_U$9", "_U$12"]
  const backPads = pads.filter((p) =>
    backRefdes.some((r) => String(p.pcb_component_id).endsWith(r)),
  )

  expect(backPads.length).toBeGreaterThan(0)
  expect(backPads.every((p) => p.layer === "bottom")).toBe(true)
})
