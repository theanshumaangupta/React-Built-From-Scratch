function createText(text) {
    return {
        type: "Text",
        props: {
            nodeValue: text,
            children: [],
        }
    }
}

function createElement({ type, props, children }) {
    
    let newChildArray = children.map(child => {
        if (typeof (child) == "string") {
            return createText(child)
        }else{
            return createElement(child)
        }
    });
    return  {
        type: type,
        props: {
            props: props,
            children : newChildArray
        }
    }

}
console.log(createElement({
    type: "main",
    props: {},
    children: [{ type: "div", props: {}, children: ["Hello"] }, { type: "div", props: {}, children: ["Hello"] } ],
}))

console.log(createElement({ type: "div", props: {}, children: ["Hello"] }));
