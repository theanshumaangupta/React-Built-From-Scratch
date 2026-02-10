function createText(text) {
    return {
        type: "Text",
        props: {
            nodeValue: text,
            children: [],
        }
    }
}

function f({ type, props, children }) {
    childArray.forEach(child => {
        
    });
    if (typeof (child) == "string") {

    }

}
f({
    type: "main",
    props: {},
    child: [{ type: "div", props: {}, children: "Hello" }, { type: "div", props: {}, children: "Hello" } ],
})

f({ type: "div", props: {}, children: "Hello" })
