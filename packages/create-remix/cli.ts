import process from "node:process";

import { main } from "./create-remix";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

let argv = process.argv.slice(2).filter((arg) => arg !== "--");

main(argv).then(
  () => process.exit(0),
  () => process.exit(1)
);
