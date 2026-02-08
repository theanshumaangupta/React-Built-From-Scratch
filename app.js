import fs from "fs/promises";
function createTag(uniqueIndex, tagname, content) {
    return(`let content${uniqueIndex} = document.createElement('${tagname}');\ncontent${uniqueIndex}.innerText='${content}';\ndocument.querySelector("#root").appendChild(content${uniqueIndex});\n`)
}
const data = await fs.readFile("App.ansh", "utf-8");
let arrayLines = (data.split("\r\n"));
for (let index = 0; index < arrayLines.length; index++) {
    const line = arrayLines[index];
    let splitLine = line.split(" ")
    // let component = document.createElement(splitLine[0]).innerText = splitLine[1]
    fs.appendFile("script.js", createTag(index, splitLine[0], splitLine[1]) )
}

<input className="itsinput" placeholder="somehting">fasdfd</input>
{
    tag: "input",
    attributes: {
        className: 
        placeholder: 
    },
    content: [
        {tag:"sad", content: [...]},
        {tag:"das", ...arrayLines.}
    ]
}

{
    tag,attributes, content
}