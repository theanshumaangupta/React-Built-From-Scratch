import { Children } from "react"

function App() {
  return (
    <main>
      <div>
        Hello
      </div>
      <div>
        Hello2
      </div>
    </main>
  )
}
// myBabel (eq to babel) convert upper code into ---
(main, {},
  (div, {}, "Hello")
    (div, {}, "Hello")
)






// createVdom funcn(eq to React.createElement) Convert upper To AppObject(vdom)
function createVdom(type, props, ...children) {
  function createText(text) {
    return {
      type: "Text",
      props: {
        nodeValue: text,
        children: [],
      }
    }
  }
  children.map(e => {
    e = typeof (e) == "string" ? createText(e) : createVdom(e)
  })

  if (typeof (children) == "string") {
    return createText(children)
  }
  else {
    children.forEach(e => {
      createVdom()
    })
  }

  // CreateVdom will return
  returnTypeOfCreatevdom(
    {
      type: type,
      props: {
        ...props,
        children,
      }
    }
  )
}


const AppObject = {
  type: "main",
  propse: {
    children: [
      {
        type: "div",
        props: {
          children: [
            "Hello"
          ]
        }
      }, {

        type: "div",
        props: {
          children: [
            "Hello2"
          ]

        }
      }
    ]
  }
}

// createRDom(eq to React.render) function will AppObject (vdom) to realdom 

