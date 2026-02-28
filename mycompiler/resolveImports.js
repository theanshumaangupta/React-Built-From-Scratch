    function resolveImports(code, basePath = ".") {
        const importRegex = /^import\s+(\w+)\s+from\s+"([^"]+)"\s*$/gm
        let matches = []
        let match
        let componentNames = []

        while ((match = importRegex.exec(code)) !== null) {
            matches.push({ full: match[0], name: match[1], path: match[2] })
            componentNames.push(match[1])
        }

        let injected = ""
        for (const m of matches) {
            let filePath = m.path
            if (!filePath.endsWith(".ansh")) filePath += ".ansh"
            const fullPath = path.join(basePath, filePath)
            const fileCode = fs.readFileSync(fullPath, "utf-8")
            const resolved = resolveImports(fileCode, path.dirname(fullPath))
            injected += `{\n${resolved.code}\n}\n`    // for isolating the variables to eachother
            componentNames.push(...resolved.componentNames)
            code = code.replace(m.full, "")
        }

        return { code: injected + code, componentNames }
    }