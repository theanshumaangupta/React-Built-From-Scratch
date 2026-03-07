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
    testWritten += "document.querySelector(\"#root\").appendChild(createDom(parseJSX(App())))"
    fs.writeFileSync("src/script.js", testWritten)
}
compile()

fs.watch(".", { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith(".ansh")) {
        compile()
    }
})