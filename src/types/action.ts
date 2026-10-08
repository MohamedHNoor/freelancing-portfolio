export type ActionErrorCode =
  | "VALIDATION"
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "INVALID_TOKEN"
  | "UNAUTHENTICATED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNEXPECTED";

export type ActionFailure = {
  success: false;
  data: null;
  error: {
    code: ActionErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};

/** The result every dashboard and auth Server Action returns. */
export type ActionResult<T> = { success: true; data: T; error: null } | ActionFailure;
