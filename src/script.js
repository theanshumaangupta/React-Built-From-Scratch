function App() {
    
    let [count, setCount] = Mystate(0)

    Myeffect(() => {
        const id = setInterval(() => {
            setCount(prev => prev + 1)
        }, 1000)
        return () => clearInterval(id)  // cleanup old interval on every rerender
    }, [count])
    

    return (
        `<div  style={{background:"gray", margin:"20px", padding: "10px"}} >${count} Hello</div>`
    )
}
        const __componentRegistry = {
            
        }
    document.querySelector("#root").appendChild(createDom(parseJSX(App())))