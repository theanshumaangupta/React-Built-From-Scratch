{
let a = 199
function Alpha() {
    return(
        `<div>${a} </div>`
    )
}



}
{
let a = 300008
function Gamma(){
    return (
        `<div> ${a} </div>`
    )
}
}


function App() {
    let f = 7+7
    let a = `<section><div>GREATER</div></section>`
    let b = `<section><div>LESSER</div></section>`
    let arr = [`<div><div><input placeholder="hello"/></div></div>`,`<div>${f}</div>`,`<div>arr3</div>`]
    return (
        `<div><Alpha/>${b}<Gamma/></div>`
    )
}
        const __componentRegistry = {
            "Alpha": Alpha,
    "Gamma": Gamma
        }
    

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

            while (!input.startsWith(">", i) && !input.startsWith("/>", i)) {
                wholeTag += input[i]
                i++
            }


            const children = []
            let attrib = {}
            let extractAttrib = wholeTag.match(/\b[a-zA-Z]+="[^"]*"/g)
            let extractStyle = wholeTag.match(/style=\{(\{[^}]*})}/)?.[1]
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
            while (!input.startsWith(`</${tag}>`, i)) {
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
    document.querySelector("#root").appendChild(createDom(parseJSX(App())))