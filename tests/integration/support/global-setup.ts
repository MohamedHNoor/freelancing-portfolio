import { rebuildDatabase, testDatabaseUrl } from "./database";

export default async function globalSetup(): Promise<void> {
  await rebuildDatabase(testDatabaseUrl());
}
