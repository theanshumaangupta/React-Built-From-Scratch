let stateStore = []
let stateIndex = 0
// let __componentRegistry = {}
let effectStore = []
let effectIndex = 0

function Myeffect(fn, deps) {
    const index = effectIndex++
    const prev = effectStore[index]

    // first run OR deps changed
    if (!prev || deps.some((d, i) => d !== prev.deps[i])) {
        if (prev?.cleanup) prev.cleanup()  // run cleanup if returned from fn
        const cleanup = fn()
        effectStore[index] = { deps, cleanup }
    }
}
function Mystate(initial) {
    const index = stateIndex++
    if (stateStore[index] === undefined) {
        stateStore[index] = initial
    }
    function setter(newVal) {
        if (typeof newVal === "function") {
            stateStore[index] = newVal(stateStore[index])  // pass current value in
        } else {
            stateStore[index] = newVal
        }
        rerender()
    }
    return [stateStore[index], setter]
}
function rerender() {
    stateIndex = 0
    effectIndex = 0
    const root = document.querySelector("#root")
    root.innerHTML = ""
    root.appendChild(createDom(parseJSX(App())))
}
//  converting `<div attrib="hello"> hello </div>`      to 
// {
//     type: div,
//     props: {
//         attrib:"hello",
//         children: ['hello']
//     }
// }
function parseJSX(input) {
    let i = 0

    function parseStyle(str) {
        let result = {}
        str.split(",").forEach(pair => {
            let [key, val] = pair.split(":")
            key = key.trim().replace(/['"]/g, "")
            val = val.trim().replace(/['"]/g, "")
            if (key && val) result[key] = val
        })
        return result
    }

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
        i++
        let tag = "", wholeTag = ""
        skipWs()
        while (/[a-z]/i.test(input[i])) { tag += input[i]; i++ }
        while ((input.startsWith(">", i) && input.startsWith("=", i-1)) || (!input.startsWith(">", i) && !input.startsWith("/>", i))) { wholeTag += input[i]; i++ }
        let attrib = {}
        if (wholeTag.trim() !== "") {
            let extractAttrib = wholeTag.match(/\b[a-zA-Z]+=(?:"[^"]*"|\([^)]*\)=>[^\s>]*|[^\s>"{}][^\s>]*)/g)
            let extractStyle = wholeTag.match(/style=\{\{([^}]*)\}\}/)?.[1]
            if (extractStyle) attrib["style"] = parseStyle(extractStyle)
            extractAttrib && extractAttrib.forEach(a => {
                const eqIndex = a.indexOf("=")
                if (eqIndex === -1) return
                let key = a.slice(0, eqIndex)
                let val = a.slice(eqIndex + 1)
                attrib[key] = val.startsWith('"') ? val.match(/"([^"]+)"/)?.[1] : val
            })
        }

        if (input.startsWith("/>", i)) {
            i += 2
            return { type: tag, props: { ...attrib, children: [] } }
        }
        if (input.startsWith(">", i)) i++

        const children = []
        while (!input.startsWith(`</${tag}>`, i)) {
            skipWs()
            if (input[i] === "<") children.push(parseNode())
            else { const t = parseText(); if (t && t !== ",") children.push(t) }
            skipWs()
        }
        i += tag.length + 3

        return { type: tag === "" ? "span" : tag, props: { ...attrib, children } }
    }

    return parseNode()
}

function createText(text) {
    return document.createTextNode(text)
}

function createDom(givenObject) {
    if (typeof givenObject === "string") return createText(givenObject)

    if (__componentRegistry[givenObject.type]) {
        return createDom(parseJSX(__componentRegistry[givenObject.type](givenObject.props)))
    }

    let el = document.createElement(givenObject.type)
    Object.entries(givenObject.props).forEach(([attrib, value]) => {
        if (attrib === "children") return
        if (attrib === "style") {
            Object.entries(value).forEach(([k, v]) => { el.style[k] = v })
        }
        else {
            el.setAttribute(attrib, value)
        }
    })
    givenObject.props.children.forEach(child => el.appendChild(createDom(child)))
    return el
}