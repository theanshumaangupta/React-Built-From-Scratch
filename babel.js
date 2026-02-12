import fs from "fs"

const code = fs.readFileSync("App.jsx", "utf-8")

// extract JSX inside return(...)
const jsx = code.match(/return\s*\(([\s\S]*?)\)/)[1]

function parseJSX(input) {
    let i = 0

    function skipWs() {
        while (/\s/.test(input[i])) i++
    }

    function parseNode() {
        skipWs()

        if (input[i] !== "<") return parseText()

        i++ // <
        let tag = ""

        while (/[a-z]/i.test(input[i])) {
            tag += input[i++]
        }

        while (input[i] !== ">") i++
        i++ // >

        const children = []

        while (!input.startsWith(`</${tag}>`, i)) {
            skipWs()
            if (input[i] === "<") {
                children.push(parseNode())
            } else {
                const t = parseText()
                if (t) children.push(t)
            }
            skipWs()
        }

        i += tag.length + 3 // </tag>

        return {
            type: tag,
            props: {
                children: children.length === 1 ? children[0] : children
            }
        }
    }

    function parseText() {
        let start = i
        while (i < input.length && input[i] !== "<") i++
        return input.slice(start, i).trim()
    }

    return parseNode()
}

const tree = parseJSX(jsx)

const output = code.replace(
    /return\s*\([\s\S]*?\)/,
    "return (" + JSON.stringify(tree, null, 2) + ")"
)

fs.writeFileSync("script.js", output)
