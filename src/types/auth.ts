export type AuthFeedbackState =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "failure"; message: string; focusSummary: boolean };
