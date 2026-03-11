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

    Myeffect(() => {
        const id = setInterval(() => {
            setCount(prev => prev + 1)
        }, 1000)
        return () => clearInterval(id)  // cleanup old interval on every rerender
    }, [count])
    
    let a = `<section><div>GREATER</div></section>`
    let b = `<section><div>LESSER</div></section>`
    let arr = [`<div><div><input placeholder="ello"/></div></div>`,`<div>${f}</div>`,`<div>arr3</div>`]
    let c = "text-blue" 
    let kk = "text-red"
    return (
        `<div  style={{background:"gray", margin:"20px", padding: "10px"}} >${count} Hello mk</div>`
    )
}
        const __componentRegistry = {
            "Alpha": Alpha,
    "Gamma": Gamma
        }
    document.querySelector("#root").appendChild(createDom(parseJSX(App())))