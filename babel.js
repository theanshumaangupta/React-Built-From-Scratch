import fs from "fs"

const code = fs.readFileSync("App.ansh", "utf-8")

fs.writeFileSync("test.js", "")
let testWritten = ""
let index = 0
while (index < code.length) {
    const char = code[index];
    if (char == "<") {
        let end = code.indexOf(";", index)
        let segment = code.slice(index, end)
        testWritten+=`\`${segment}\``
        index = end
        index+=1
    }   
    else{
        testWritten+=char
        index+=1
    }
}

let c = `\nfunction parseJSX(input) {
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
        console.log(extractAttrib);
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
}`

let output = `\n
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
    }`
testWritten+=c
testWritten +=output
testWritten += "document.querySelector(\"#root\").appendChild(createDom(parseJSX(a())))"
testWritten += "\nconsole.log(createDom(parseJSX(a())))"
// testWritten += "\nconsole.dir(parseJSX(a()), {depth: null})"
fs.writeFileSync("script.js", testWritten)