import fs from "fs"

const code = fs.readFileSync("App.ansh", "utf-8")
const code2 = fs.readFileSync("Alpha.ansh", "utf-8")

function parseJSX(input) {
    let i = 0
    function skipWs() {
        while (/\s/.test(input[i])) i++
    }

    function parseText() {
        let start = i
        while (i < input.length && input[i] !== "<") i++
        return input.slice(start, i).trim()
    }

    function parseNode() {
        skipWs()

        if (input[i] !== "<") return parseText()

        i++ // <
        let tag = ""
        let wholeTag = ""
        skipWs()
        while (/[a-z]/i.test(input[i])) {
            tag += input[i++]
        }

        while (!input.startsWith(`>`, i) && !input.startsWith(`/>`, i)) {
            wholeTag += input[i]
            i++
        }


        const children = []
        let attrib = {}
        let extractAttrib = wholeTag.match(/\b[a-zA-Z]+="[^"]*"/g)
        let extractStyle = wholeTag.match(/style=\{(\{[^}]*\})\}/)?.[1]
        if (extractStyle) {
            attrib["style"] = JSON.parse(extractStyle)
        }
        // 
        extractAttrib && extractAttrib.forEach((a) => {
            const prop = (a).split("=");
            if (prop.length == 2) {
                // "theid" -> theid
                attrib[prop[0]] = prop[1].match(/"([^"]+)"/)?.[1]
            }
        })
        if (input.startsWith(`>`, i)) {
            i++ // >
        }
        else if (input.startsWith(`/>`, i)) {
            i += 2 // for self closing tag '/>'
            return {
                type: tag,
                props: {
                    ...attrib,
                    children: []
                }
            }
        }
        while (!input.startsWith(`</${tag}>`, i)) {
            skipWs()
            if (input[i] === "<") {
                children.push(parseNode())
            } else {
                const t = parseText()
                if (t && t != ",") children.push(t)
            }
            skipWs()
        }

        i += tag.length + 3 // </tag>

        return {
            type: tag,
            props: {
                ...attrib,
                children
            }
        }
    }

    return parseNode()
}

fs.writeFileSync("test.js", "")
let testWritten = ""
let index = 0

let inSingle = false
let inDouble = false
let inBacktick = false
function isJSXStart(code, i) {
    let j = i + 1
    while (/\s/.test(code[j])) j++

    if (!/[a-zA-Z]/.test(code[j])) return false
    
    let look = code.slice(j, j + 40)
    return look.includes(">")
}

while (index < code.length) {
    const char = code[index];
    if (char === "'" && !inDouble && !inBacktick) {
        inSingle = !inSingle
        testWritten += char
        index++
        continue
    }

    if (char === '"' && !inSingle && !inBacktick) {
        inDouble = !inDouble
        testWritten += char
        index++
        continue
    }

    if (char === "`" && !inSingle && !inDouble) {
        inBacktick = !inBacktick
        testWritten += char
        index++
        continue
    }

    if (char == "<" && !inSingle && !inDouble && !inBacktick && isJSXStart(code, index)) {
        let end = code.indexOf(";", index)
        if (end === -1) throw new Error("Missing ; after JSX chunk")
        let segment = code.slice(index, end)
        testWritten += `\`${segment}\``
        index = end
        index += 1
        continue
    }
    testWritten += char
    index += 1
}
console.log(testWritten);
let parseJSXFunction = `\n
    function parseJSX(input) {
        let i = 0
        function skipWs() {
            while (/\\s/.test(input[i])) i++
        }

        function parseText() {
            let start = i
            while (i < input.length && input[i] !== "<") i++
            return input.slice(start, i).trim()
        }

        function parseNode() {
            skipWs()

            if (input[i] !== "<") return parseText()

            i++ // <
            let tag = ""
            let wholeTag = ""
            skipWs()
            while (/[a-z]/i.test(input[i])) {
                tag += input[i++]
            }

            while (!input.startsWith(">", i) && !input.startsWith("/>", i)) {
                wholeTag += input[i]
                i++
            }


            const children = []
            let attrib = {}
            let extractAttrib = wholeTag.match(/\\b[a-zA-Z]+="[^"]*"/g)
            let extractStyle = wholeTag.match(/style=\\{(\\{[^}]*\})\}/)?.[1]
            if (extractStyle) {
                attrib["style"] = JSON.parse(extractStyle)
            }
            // 
            extractAttrib && extractAttrib.forEach((a) => {
                const prop = (a).split("=");
                if (prop.length == 2) {
                    // "theid" -> theid
                    attrib[prop[0]] = prop[1].match(/"([^"]+)"/)?.[1]
                }
            })
            if (input.startsWith(">", i)) {
                i++ // >
            }
            else if (input.startsWith("/>", i)) {
                i += 2 // for self closing tag '/>'
                return {
                    type: tag,
                    props: {
                        ...attrib,
                        children: []
                    }
                }
            }
            while (!input.startsWith(\`</\${tag}>\`, i)) {
                skipWs()
                if (input[i] === "<") {
                    children.push(parseNode())
                } else {
                    const t = parseText()
                    if (t && t !=",") children.push(t)
                }
                skipWs()
            }

            i += tag.length + 3 // </tag>

            return {
                type: tag,
                props: {
                    ...attrib,
                    children
                }
            }
        }
        return parseNode()    
    }
`
let domFunctions = `\n
    function createText(text) {
        let textDom = document.createTextNode(text)
        return textDom
    }
    function createDom(givenObject) {
        if (typeof (givenObject) == "string") {
            return createText(givenObject)
        }
        else {
            let el = document.createElement(givenObject.type)
            Object.entries(givenObject.props).forEach(([attrib, value]) => {
                // givenObject.props = {children : [], style:{}, id:""}
                if (attrib != 'children') {
                    if (attrib == "style") {
                        // value = {"color": "red"}
                        Object.entries(value).forEach(([styleKey, styleValue]) => {
                            el.style[styleKey] = styleValue
                        })
                    }
                    else {
                        el.setAttribute(attrib, value)
                    }
                }
            })
            givenObject.props.children.forEach(eachChild => {
                el.appendChild(createDom(eachChild))
        });
        return el
        }
    }
`
testWritten += parseJSXFunction
testWritten += domFunctions
testWritten += "document.querySelector(\"#root\").appendChild(createDom(parseJSX(App())))"
// testWritten += "\nconsole.dir(parseJSX(a()), {depth: null})"
fs.writeFileSync("script.js", testWritten)