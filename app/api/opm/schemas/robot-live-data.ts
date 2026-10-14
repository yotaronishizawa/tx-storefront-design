import { z } from "zod"

/**
 * The detector part of `RobotLiveData` (`Entities/Robot/RobotLiveData.cs`).
 * Each field is itself a `JsonSerializer.Serialize` string, or null before the
 * robot reports it:
 * - `humanDetectionResult`: `HumanObstacleDetection`, ROS snake_case, one entry per camera
 * - `stopStatus`: `RobotStopStatusDto`, PascalCase
 * - `eStopStatus`: `std_msgs/UInt8` (`RobotEStopStatus`: 0 Released, 1 Pressed, 2 NeedsReset).
 *   Newer than the generated `RobotLiveData` type, so it is read loosely.
 * - `serializedJointStates`: `sensor_msgs/JointState`; only the arm's lift joint is read.
 * - `serializedHumanDetectionCamRgb1/2`: `sensor_msgs/CompressedImage`, `data` base64.
 *   Only `GetRobotLiveData` carries them; `GetRobotLiveDataWithoutCameras` does not.
 */
export type RobotLiveDetector = "human" | "obstacle" | "fallenDrink"

export type RobotLiveEStop = "released" | "pressed" | "needsReset" | "unknown"

export type RobotLiveCamera = {
  camera: 1 | 2
  /** `data:` URL, ready for an `<img>`. */
  src: string
  /** Epoch ms from the image header; `null` when it carries none. */
  capturedAt: number | null
}

export type RobotLiveDetection = {
  /** Any camera sees it. `null` until the robot reports detection. */
  detected: Record<RobotLiveDetector, boolean> | null
  /** What stopped the robot, if a detector did. */
  stoppedBy: RobotLiveDetector | null
  eStop: RobotLiveEStop | null
  /** The arm's lift joint position, in metres; `null` until reported. */
  armHeight: number | null
  cameras: RobotLiveCamera[]
}

/**
 * The joint that raises and lowers the arm. Provisional: the name is not
 * confirmed with the robot team yet (the simulator reports this one).
 */
export const ROBOT_ARM_LIFT_JOINT = "lift_joint"

const liveDataSchema = z.looseObject({
  humanDetectionResult: z.string().nullish(),
  stopStatus: z.string().nullish(),
  eStopStatus: z.string().nullish(),
  serializedJointStates: z.string().nullish(),
  serializedHumanDetectionCamRgb1: z.string().nullish(),
  serializedHumanDetectionCamRgb2: z.string().nullish(),
})

const detectionSchema = z.looseObject({
  human_present: z.array(z.boolean()).catch([]),
  obstacle_present: z.array(z.boolean()).catch([]),
  fallen_drink_present: z.array(z.boolean()).catch([]),
})

const stopStatusSchema = z.looseObject({
  StoppedDueToHuman: z.boolean().catch(false),
  StoppedDueToObstacle: z.boolean().catch(false),
  StoppedDueToFallenDrink: z.boolean().catch(false),
})

const jointStatesSchema = z.looseObject({
  name: z.array(z.string()).catch([]),
  position: z.array(z.number()).catch([]),
})

const rosTimeSchema = z.looseObject({ secs: z.number(), nsecs: z.number() })

const imageSchema = z.looseObject({
  header: z.looseObject({ stamp: rosTimeSchema.optional() }).optional(),
  format: z.string().catch("jpeg"),
  data: z.string(),
})

const E_STOP: Record<number, RobotLiveEStop> = {
  0: "released",
  1: "pressed",
  2: "needsReset",
}

/** A JSON string field read with `schema`; null when absent or unreadable. */
function readNested<T extends z.ZodType>(
  schema: T,
  value: string | null | undefined
): z.output<T> | null {
  if (!value) return null
  try {
    const result = schema.safeParse(JSON.parse(value))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

function readCamera(
  camera: 1 | 2,
  value: string | null | undefined
): RobotLiveCamera | null {
  const image = readNested(imageSchema, value)
  if (!image) return null
  const stamp = image.header?.stamp
  const mime = image.format.includes("png") ? "image/png" : "image/jpeg"
  return {
    camera,
    src: `data:${mime};base64,${image.data}`,
    capturedAt: stamp ? stamp.secs * 1000 + stamp.nsecs / 1_000_000 : null,
  }
}

export function readRobotLiveDetection(value: unknown): RobotLiveDetection {
  const parsed = liveDataSchema.safeParse(value)
  const data = parsed.success ? parsed.data : {}
  const detection = readNested(detectionSchema, data.humanDetectionResult)
  const stop = readNested(stopStatusSchema, data.stopStatus)
  const eStop = readNested(
    z.looseObject({ data: z.number() }),
    data.eStopStatus
  )
  return {
    detected: detection && {
      human: detection.human_present.some(Boolean),
      obstacle: detection.obstacle_present.some(Boolean),
      fallenDrink: detection.fallen_drink_present.some(Boolean),
    },
    stoppedBy: stop?.StoppedDueToHuman
      ? "human"
      : stop?.StoppedDueToObstacle
        ? "obstacle"
        : stop?.StoppedDueToFallenDrink
          ? "fallenDrink"
          : null,
    eStop: eStop ? (E_STOP[eStop.data] ?? "unknown") : null,
    armHeight: readArmHeight(data.serializedJointStates),
    cameras: [
      readCamera(1, data.serializedHumanDetectionCamRgb1),
      readCamera(2, data.serializedHumanDetectionCamRgb2),
    ].filter((camera) => camera !== null),
  }
}

function readArmHeight(value: string | null | undefined): number | null {
  const joints = readNested(jointStatesSchema, value)
  const index = joints?.name.indexOf(ROBOT_ARM_LIFT_JOINT) ?? -1
  return joints && index >= 0 ? (joints.position[index] ?? null) : null
}
