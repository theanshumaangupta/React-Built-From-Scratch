import fs from "fs/promises";

const data = await fs.readFile("App.ansh", "utf-8");
let arrayLines = (data.split("\r\n"));
for (let index = 0; index < arrayLines.length; index++) {
    const line = arrayLines[index];
    let splitLine = line.split(" ")
    // let component = document.createElement(splitLine[0]).innerText = splitLine[1]
    fs.appendFile("script.js", `let content${index} = document.createElement('${splitLine[0]}');content${index}.innerText='${splitLine[1]}';document.querySelector("#root").appendChild(content${index});`)
}
