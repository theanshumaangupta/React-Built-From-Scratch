
    let vDom = {
  "type": "section",
  "props": {
    "style": {},
    "id": "ji",
    "class": "myclass",
    "children": [
      "Hello",
      {
        "type": "div",
        "props": {
          "class": "text-blue",
          "children": [
            "I am div, {b}, kiilk lkk"
          ]
        }
      },
      {
        "type": "img",
        "props": {
          "style": {
            "width": "200px"
          },
          "src": "/a.png",
          "alt": "image",
          "children": []
        }
      },
      {
        "type": "button",
        "props": {
          "style": {
            "color": "red",
            "font-size": "50px"
          },
          "children": [
            "SUBMIT"
          ]
        }
      }
    ]
  }
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
    document.querySelector("#root").appendChild(createDom(vDom))

