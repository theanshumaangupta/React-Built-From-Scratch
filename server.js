import http from "http";
import fs from "fs";
import { WebSocketServer } from 'ws';
import path from "path";
import { compile } from "./mybabel.js";
const dirPath = "./";
const wss = new WebSocketServer({ port: 8080 });


// Function for Adding script before </body> tag
function injection(fileName) {
    let data = fs.readFileSync(fileName, 'utf-8')
    data = data.replace('</body>',
        `
    <script >
            // Code is injected for Live Reloading
            const ws = new WebSocket("ws://localhost:8080");

            ws.onopen = () => {
                ws.send("Hello server");
            };
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data)
                if (data.message === "reload") {
                    if (data.type == "js") {
                        window.location.reload();
                    }
                    else if(data.type == "html"){
                        let current = location.pathname.split("/").pop();
                        
                        if (!current || current === "") current = "home.html";
                        if (!current.includes(".")) current += ".html";

                        if (current === data.fileName) {
                            window.location.reload();
                        }
                    }
                    else if (data.type == "css") {
                        let links = document.querySelectorAll('link[rel="stylesheet"]')
                        Array.from(links).forEach((link) => {
                            if (link.href.includes(data.fileName)){
                                const url = new URL(link.href)
                                url.searchParams.set("v", Date.now())
                                link.href = url.toString()
                            }
                        });
                    }
                }
        };
    </script>
</body> `
    )
    return data;
}
// Websocket Server Created
const clients = new Set()
wss.on("connection", (socket) => {
    clients.add(socket);
    socket.on("close", () => clients.delete(socket));
});

// For every client connection and detecting file changes in source folder
fs.watch("./src", (eventType, filename) => {
    if (!filename || eventType !== "change") return;
    else if (![".html", ".css", ".js", ".ansh"].includes(path.extname(filename))) return;
    for (const socket of clients) {
        const ext = path.extname(filename)

        socket.send(JSON.stringify({
            type: ext === ".css" ? "css" :
                ext === ".js" ? "js" : "html",
            message: "reload",
            fileName: filename
        }));
    }
});

// Server Created

const server = http.createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
        res.end(injection("index.html"))
    }

    else if (req.method == "GET") {
        const urlObj = new URL(req.url, `http://${req.headers.host}`)
        // converting path name to file and storing in urlobj.filename like /style.css to style.css
        urlObj.fileName = (urlObj.pathname).replace("/", "")
        // if no extension → try .html
        if (!path.extname(urlObj.fileName)) {
            urlObj.fileName += ".html"
        }
        if (fs.existsSync(urlObj.fileName)) {
            if (path.extname(urlObj.fileName) === ".html") {
                res.end(injection(urlObj.fileName))
            }
            else if (path.extname(urlObj.fileName) === ".css") {
                res.end(fs.readFileSync(urlObj.fileName, 'utf-8'))
            }
            else if (path.extname(urlObj.fileName) === ".js") {
                res.end(fs.readFileSync(urlObj.fileName, 'utf-8'))
            }
            else if (urlObj.fileName.startsWith("public/")) {
                const ext = path.extname(urlObj.fileName)
                const mimeTypes = {
                    ".png": "image/png",
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".gif": "image/gif",
                    ".svg": "image/svg+xml",
                    ".webp": "image/webp"
                }
                const contentType = mimeTypes[ext] || "application/octet-stream"
                res.writeHead(200, { "Content-Type": contentType })
                res.end(fs.readFileSync(urlObj.fileName))
            }

        } else {
            res.writeHead(404, { "Content-Type": "text/html" });
            res.end("<h1>404 File not Found</h1>");
        }
    }


})
server.listen(3000)

