function a() {
    let a = {"type":"section","props":{"children":[{"type":"div","props":{"children":[`GREATER`]}}]}}
    let b = {"type":"section","props":{"children":[{"type":"div","props":{"children":[`LESSER`]}}]}}
    let arr = [{"type":"div","props":{"children":[`arr1`]}},{"type":"div","props":{"children":[`arr2`]}}]
    return (
        {"type":"div","props":{"children":[`${2>3?a:b}`]}}
    )
}

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
     document.querySelector("#root").appendChild(createDom(a()))