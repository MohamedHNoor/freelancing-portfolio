import { z } from "zod";
import { clientFieldSchema } from "@/lib/validation/client";

const empty = z.object({}).strict();

/** The typed `data` payload of each activity type. Field names only, never values. */
export const activityDataSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("client_created"), data: empty }),
  z.object({
    type: z.literal("client_updated"),
    data: z.object({ changedFields: z.array(clientFieldSchema).nonempty() }).strict(),
  }),
  z.object({ type: z.literal("client_archived"), data: empty }),
]);

export type ActivityPayload = z.infer<typeof activityDataSchema>;
export type ActivityTypeName = ActivityPayload["type"];
