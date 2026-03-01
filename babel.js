import fs from "fs"
import path from "path"
function compile() {
    const code = fs.readFileSync("App.ansh", "utf-8")

    // fs.writeFileSync("test.js", "")
    let testWritten = ""

    // putiing the code from all imported files
    function resolveImports(code, basePath = ".") {
        const importRegex = /^import\s+(\w+)\s+from\s+"([^"]+)"\s*$/gm
        let matches = []
        let match
        let componentNames = []

        while ((match = importRegex.exec(code)) !== null) {
            matches.push({ full: match[0], name: match[1], path: match[2] })
            componentNames.push(match[1])
        }

        let injected = ""
        for (const m of matches) {
            let filePath = m.path
            if (!filePath.endsWith(".ansh")) filePath += ".ansh"
            const fullPath = path.join(basePath, filePath)
            const fileCode = fs.readFileSync(fullPath, "utf-8")
            const resolved = resolveImports(fileCode, path.dirname(fullPath))
            injected += `{\n${resolved.code}\n}\n`    // for isolating the variables to eachother
            componentNames.push(...resolved.componentNames)
            code = code.replace(m.full, "")
        }

        return { code: injected + code, componentNames }
    }

    // converting       <div> hello </div>   ->    `<div> hello </div>`
    function stepOne(code) {
        let collectingString = ""
        let index = 0
        let inSingle = false
        let inDouble = false
        let inBacktick = false
        function isJSXStart(code, i) {
            if (code[i] !== "<") return false

            let j = i + 1
            if (code[j] == ">") return true
            if (code[j] === "=" || code[j] === "<") return false
            if (code[j] === "/") j++

            if (!/[A-Za-z]/.test(code[j])) return false

            while (/[A-Za-z]/.test(code[j])) j++

            if (!/[\s/>]/.test(code[j])) return false

            let quote = null

            for (; j < code.length; j++) {
                const c = code[j]

                if (quote) {
                    if (c === quote) quote = null
                    continue
                }

                if (c === '"' || c === "'") {
                    quote = c
                    continue
                }

                if (c === ">") return true
                if (c === ";" || c === "\n") return false
            }

            return false
        }
        while (index < code.length) {
            const char = code[index];

            // keep the quoted things as-it-is
            if (char === "'" && !inDouble && !inBacktick) {
                inSingle = !inSingle
                collectingString += char
                index++
                continue
            }
            if (char === '"' && !inSingle && !inBacktick) {
                inDouble = !inDouble
                collectingString += char
                index++
                continue
            }
            if (char === "`" && !inSingle && !inDouble) {
                inBacktick = !inBacktick
                collectingString += char
                index++
                continue
            }

            if (char == "<" && !inSingle && !inDouble && !inBacktick && isJSXStart(code, index)) {
                let end = code.indexOf(";", index)
                if (end === -1) throw new Error("Missing ; after JSX chunk")
                let segment = code.slice(index, end)

                // AUTO-EXTRACT on* handlers
                segment = segment.replace(/\bon(\w+)=\$\{([^}]+)\}/g, (_, event, expr) => {
                    const key = `__h_${expr.trim()}`
                    collectingString += `__handlers["${key}"] = ${expr.trim()},\n`
                    return `on${event}="${key}"`
                })

                collectingString += `\`${segment}\``
                index = end
                index += 1
                continue
            }
            collectingString += char
            index += 1
        }
        return collectingString
    }

    //  converting `<div attrib="hello"> hello </div>`      to 
    // {
    //     type: div,
    //     props: {
    //         attrib:"hello",
    //         children: ['hello']
    //     }
    // }
    let parseJSXFunction = `\n
    function parseJSX(input) {
        let i = 0
        // alternative of JSON.parse because it does not support {key:"value"} only supoort quoted keys
        function parseStyle(str) {
            // str = {color:"red"} or {"color":"red"}
            let result = {}
            // split by comma
            str.split(",").forEach(pair => {
                let [key, val] = pair.split(":")
                key = key.trim().replace(/['"]/g, "")   
                val = val.trim().replace(/['"]/g, "")   
                if (key && val) result[key] = val
            })
            return result
        }

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
                tag += input[i]
                i++
            }
            
            while (!input.startsWith(">", i) && !input.startsWith("/>", i)) {
                wholeTag += input[i]
                i++
            }


            const children = []
            let attrib = {}
            if(!(wholeTag.trim() == "")){
                let extractAttrib = wholeTag.match(/\\b[a-zA-Z]+=(?:"[^"]*"|[^\\s>"{}][^\\s>]*)/g)
                let extractStyle = wholeTag.match(/style=\\{\\{([^}]*)\\}\\}/)?.[1]
                if (extractStyle) {
                    attrib["style"] = parseStyle(extractStyle)
                }
                // 
                extractAttrib && extractAttrib.forEach((a) => {
                    const prop = (a).split("=");
                    if (prop.length == 2) {
                        key = prop[0]
                        val = prop[1]
                        if (val.startsWith('"')) {
                            // quoted: "myclass" -> myclass
                            attrib[key] = val.match(/"([^"]+)"/)?.[1]
                        } else {
                            // unquoted: myclass -> myclass
                            attrib[key] = val
                        }
                    }
                })
            }
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
                type: tag == "" ? 'span' : tag,
                props: {
                    ...attrib,
                    children
                }
            }
        }
        return parseNode()    
    }
    `
    //from {type...: } to  converting actual dom in client side 
    let domFunctions = `\n
    function createText(text) {
        let textDom = document.createTextNode(text)
        return textDom
    }
    function createDom(givenObject) {
        if (typeof (givenObject) == "string") {
            return createText(givenObject)
        }
        else if (__componentRegistry[givenObject.type]) {
                const result = __componentRegistry[givenObject.type](givenObject.props)
                return createDom(parseJSX(result))
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

                    else if (attrib.startsWith("on")) {
                        const eventName = attrib.slice(2)
                        el.addEventListener(eventName, __handlers[value])
                    } else {
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

    const { code: bundled, componentNames } = resolveImports(code, ".")

    // Building A registry string that Gets injected into script js
    // this will help in working with custom componnents
    const registryCode = `
        const __componentRegistry = {
            ${componentNames.map(name => `"${name}": ${name}`).join(",\n    ")}
        }
    `

    testWritten += stepOne(bundled)
    testWritten += registryCode
    testWritten += parseJSXFunction
    testWritten += domFunctions
    testWritten += `
        let stateStore = []
        let stateIndex = 0
        let __handlers = {}
        function Mystate(initial) {
            const index = stateIndex++
            if (stateStore[index] === undefined) {
                stateStore[index] = initial
            }
            function setter(newVal) {
                stateStore[index] = newVal
                rerender()
            }
            return [stateStore[index], setter]
        }
        function rerender() {
            stateIndex = 0
            __handlers = {}
            const root = document.querySelector("#root")
            root.innerHTML = ""
            root.appendChild(createDom(parseJSX(App())))
        }
        `
    testWritten += "document.querySelector(\"#root\").appendChild(createDom(parseJSX(App())))"
    fs.writeFileSync("src/script.js", testWritten)
}
compile()

fs.watch(".", { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith(".ansh")) {
        compile()
    }
})