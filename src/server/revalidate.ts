import "server-only";
import { revalidatePath } from "next/cache";

/** Every dashboard page a project or payment-plan change can alter. Not an action: never callable from the browser. */
export function revalidateProject({ projectId, clientId }: { projectId: string; clientId: string }): void {
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard/clients/${clientId}`);
}
