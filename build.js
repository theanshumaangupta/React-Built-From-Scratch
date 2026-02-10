// build.js
import fs from "fs"

const input = fs.readFileSync("App.ansh", "utf-8");

let output = input
  .replace(/component (\w+)/, "function $1()")
  .replace(/view:/, "return (")
  + "\n)";

fs.writeFileSync("App.js", output);
