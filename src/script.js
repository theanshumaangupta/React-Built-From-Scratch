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
    let f = `<div>GREATER</div>`
    let [count, setCount] = Mystate(0)
    
    let a = `<section><div>GREATER</div></section>`
    let b = `<section><div>LESSER</div></section>`
    let arr = [`<div><div><input placeholder="hello"/></div></div>`,`<div>${f}</div>`,`<div>arr3</div>`]
    let c = "text-blue" 
    let inc = () => setCount(count+1)
    let kk = "text-red"
    return (
        __handlers["__h_inc"] = inc,
`<div  style={{background:"gray", margin:"20px", padding: "10px"}} onclick="__h_inc">${count}</div>`
    )
}
        const __componentRegistry = {
            "Alpha": Alpha,
    "Gamma": Gamma
        }
    

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
                let extractAttrib = wholeTag.match(/\b[a-zA-Z]+=(?:"[^"]*"|[^\s>"{}][^\s>]*)/g)
                let extractStyle = wholeTag.match(/style=\{\{([^}]*)\}\}/)?.[1]
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
                type: tag == "" ? 'span' : tag,
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
        document.querySelector("#root").appendChild(createDom(parseJSX(App())))