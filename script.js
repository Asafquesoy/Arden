let network = null;

window.onload = function() {
    drawAutomaton();
};

function addNewState() {
    const statesInput = document.getElementById('states');
    let states = statesInput.value.split(',').map(s => s.trim()).filter(s => s);
    
    let nextIndex = states.length;
    let newStateName = `q${nextIndex}`;
    
    while(states.includes(newStateName)) {
        nextIndex++;
        newStateName = `q${nextIndex}`;
    }
    
    states.push(newStateName);
    statesInput.value = states.join(', ');
    drawAutomaton(); 
}

function getAlphabet() {
    return document.getElementById('alphabet').value.split(',').map(s => s.trim()).filter(s => s);
}

function validateSymbolInput(inputElement) {
    const val = inputElement.value.trim();
    const alphabet = getAlphabet();
    
    if (val !== '' && val !== 'ε' && !alphabet.includes(val)) {
        alert(`⚠️ ERROR DE VALIDACIÓN:\nEl símbolo '${val}' no está definido en tu alfabeto (${alphabet.join(', ')}).`);
        inputElement.value = ''; 
        drawAutomaton();
    }
}

function addTransitionRow(from = '', symbol = '', to = '') {
    const container = document.getElementById('transitions');
    const row = document.createElement('div');
    row.className = 'transition-row';
    
    row.innerHTML = `
        <input type="text" placeholder="Origen" class="t-from" oninput="drawAutomaton()" value="${from}">
        <input type="text" placeholder="Símbolo" class="t-symbol" oninput="drawAutomaton()" onchange="validateSymbolInput(this)" value="${symbol}">
        <input type="text" placeholder="Destino" class="t-to" oninput="drawAutomaton()" value="${to}">
        <button class="btn btn-secondary" style="width: auto; padding: 0.6rem; margin-bottom: 0;" onclick="this.parentElement.remove(); drawAutomaton();">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
}

function enableEdgeDrawing() { 
    if (network) network.addEdgeMode(); 
}

function log(message, isTitle = false) {
    const consoleDiv = document.getElementById('console');
    const step = document.createElement('div');
    step.className = 'step';
    if (isTitle) step.classList.add('step-title');
    step.innerHTML = message;
    consoleDiv.appendChild(step);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function drawAutomaton() {
    const states = document.getElementById('states').value.split(',').map(s => s.trim()).filter(s => s);
    const initial = document.getElementById('initial').value.trim();
    const finals = document.getElementById('final').value.split(',').map(s => s.trim());

    let nodesArray = states.map(stateName => {
        let isInitial = stateName === initial;
        let isFinal = finals.includes(stateName);
        return {
            id: stateName, label: stateName, shape: isFinal ? 'box' : 'circle', borderWidth: isFinal ? 3 : 2,
            color: { 
                background: '#1e0a3c', 
                border: isInitial ? '#059669' : (isFinal ? '#a21caf' : '#6d28d9'), 
                highlight: { border: '#fff', background: '#2e1065' } 
            },
            font: { color: '#f3e8ff', face: 'Inter', size: 16 }, 
            shadow: isFinal ? { enabled: true, color: 'rgba(162, 28, 175, 0.3)', size: 15 } : false
        };
    });

    const transFrom = document.querySelectorAll('.t-from');
    const transSymbol = document.querySelectorAll('.t-symbol');
    const transTo = document.querySelectorAll('.t-to');
    
    let edgeMap = {};

    for (let i = 0; i < transFrom.length; i++) {
        let from = transFrom[i].value.trim(), sym = transSymbol[i].value.trim(), to = transTo[i].value.trim();
        if(from && sym && to) {
            let key = `${from}|${to}`;
            if (!edgeMap[key]) edgeMap[key] = [];
            if (!edgeMap[key].includes(sym)) edgeMap[key].push(sym);
        }
    }

    let edgesArray = [];
    for (let key in edgeMap) {
        let [from, to] = key.split('|');
        let combinedSymbols = edgeMap[key].join(','); 
        
        edgesArray.push({ 
            from: from, to: to, label: combinedSymbols, arrows: 'to', 
            font: { align: 'top', color: '#c4b5fd', size: 14, strokeWidth: 0, background: 'rgba(9, 2, 18, 0.7)' }, 
            color: { color: '#6d28d9', highlight: '#a21caf' }, 
            smooth: { type: 'curvedCW', roundness: 0.2 } 
        });
    }

    if (network !== null) {
        network.setData({ nodes: nodesArray, edges: edgesArray });
    } else {
        const container = document.getElementById('mynetwork');
        const data = { nodes: nodesArray, edges: edgesArray };
        
        const options = {
            locale: 'es', locales: { es: { edgeDescription: 'Arrastra de un estado a otro.', back: 'Cancelar' } },
            manipulation: {
                enabled: false,
                addEdge: function (data, callback) {
                    let symbol = prompt("Símbolo para esta ruta (ej. 0, 1, ε):");
                    if (symbol && symbol.trim() !== "") {
                        symbol = symbol.trim();
                        const alphabet = getAlphabet();
                        
                        if (symbol !== 'ε' && !alphabet.includes(symbol)) {
                            alert(`⚠️ ERROR DE VALIDACIÓN:\nEl símbolo '${symbol}' no pertenece al alfabeto (${alphabet.join(', ')}).`);
                            callback(null); 
                            return;
                        }

                        callback(null); 
                        addTransitionRow(data.from, symbol, data.to);
                        setTimeout(() => drawAutomaton(), 20);
                    } else { 
                        callback(null); 
                    }
                }
            },
            physics: { solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.01, springLength: 100 } },
            interaction: { hover: true, dragNodes: true }
        };

        network = new vis.Network(container, data, options);
    }
}

function reorderDiagram() {
    if (network !== null) {
        network.destroy();
        network = null;
    }
    drawAutomaton(); 
    setTimeout(() => {
        if (network !== null) {
            network.fit({ animation: { duration: 800, easingFunction: 'easeInOutQuad' } });
        }
    }, 100);
}

// ==========================================
// MOTOR LÓGICO EXACTO (VERSIÓN PYTHON PORTADA A JS)
// ==========================================

function parseTopLevel(expr) {
    let terms = [];
    let current = [];
    let depth = 0;
    
    for (let char of expr) {
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === '+' && depth === 0) {
            terms.push(current.join('').trim());
            current = [];
            continue;
        }
        current.push(char);
    }
    terms.push(current.join('').trim());
    return terms;
}

function solveArden() {
    document.getElementById('console').innerHTML = '';
    drawAutomaton(); 

    const estados_declarados = document.getElementById('states').value.split(',').map(s => s.trim()).filter(s => s);
    const inicial = document.getElementById('initial').value.trim();
    const finales = document.getElementById('final').value.split(',').map(s => s.trim()).filter(s => s);
    
    if (estados_declarados.length === 0 || !inicial) {
        alert("Faltan datos: Por favor define los estados y el estado inicial.");
        return;
    }

    // Recopilar transiciones de la UI
    let transiciones = [];
    const transFrom = document.querySelectorAll('.t-from');
    const transSymbol = document.querySelectorAll('.t-symbol');
    const transTo = document.querySelectorAll('.t-to');

    for (let i = 0; i < transFrom.length; i++) {
        let from = transFrom[i].value.trim(), sym = transSymbol[i].value.trim(), to = transTo[i].value.trim();
        if(from && sym && to && estados_declarados.includes(from) && estados_declarados.includes(to)) {
            transiciones.push({origen: from, simbolo: sym, destino: to});
        }
    }

    if (transiciones.length === 0) {
        log("<span style='color:var(--warning)'>Advertencia: No has agregado ninguna transición.</span>");
        return;
    }

    let ecuaciones = {};
    estados_declarados.forEach(est => ecuaciones[est] = []);
    
    transiciones.forEach(t => {
        ecuaciones[t.origen].push({sim: t.simbolo, dest: t.destino});
    });

    log("--- PASO 1: Ecuaciones Originales ---", true);
    let eqs_raw = {};
    for (let est of estados_declarados) {
        let terminos = ecuaciones[est] || [];
        let str_terminos = terminos.length > 0 ? terminos.map(t => `${t.sim}${t.dest}`).join(' + ') : "ε";
        eqs_raw[est] = str_terminos;
        log(`${est} = ${str_terminos}`);
    }

    // 2. Ordenar estados (de mayor a menor subíndice)
    const obtener_numero = (estado) => {
        let match = estado.match(/\d+/);
        return match ? parseInt(match[0], 10) : -1;
    };

    let orden_resolucion = [...estados_declarados].sort((a, b) => obtener_numero(b) - obtener_numero(a));
    
    if (orden_resolucion.includes(inicial)) {
        orden_resolucion = orden_resolucion.filter(s => s !== inicial);
        orden_resolucion.push(inicial); // Forzar el inicial hasta el final
    }

    log("<br/>--- PASO 2: Orden de Resolución ---", true);
    log(orden_resolucion.join(' ➔ '));

    log("<br/>--- PASO 3 y 4: Sustitución y Ley de Arden ---", true);
    let resultados = {};

    for (let q_actual of orden_resolucion) {
        let expr = eqs_raw[q_actual] || "ε";
        
        if (expr === "ε") {
            resultados[q_actual] = expr;
            continue;
        }

        // 1. Arden de Primer Nivel
        let terms = parseTopLevel(expr);
        let self_loops = [];
        let other_terms = [];
        
        for (let t of terms) {
            if (t.endsWith(q_actual)) {
                self_loops.push(t.slice(0, -q_actual.length).trim());
            } else {
                other_terms.push(t);
            }
        }

        if (self_loops.length > 0) {
            if (finales.includes(q_actual) && other_terms.length === 0) {
                expr = self_loops.map(s => `${s}*`).join('');
            } else {
                let prefix = self_loops.join("+");
                if (self_loops.length > 1) prefix = `(${prefix})`;

                if (other_terms.length > 0) {
                    let other_str = other_terms.join(" + ");
                    if (other_terms.length > 1) other_str = `(${other_str})`;
                    expr = `${prefix}*${other_str}`;
                } else {
                    expr = `${prefix}*`;
                }
            }
        } else {
            expr = other_terms.join(" + ");
        }

        // 2. Sustitución Profunda Recursiva (Usando (?!\d) traducido a JS)
        let changed = true;
        while (changed) {
            changed = false;
            for (let q_res of orden_resolucion) {
                if (q_res === q_actual) continue;
                
                let resRegex = new RegExp(`${q_res}(?!\\d)`);
                if (resultados[q_res] && resRegex.test(expr)) {
                    let res_val = resultados[q_res];
                    let rep = (res_val.includes('+') || res_val.length > 2) ? `(${res_val})` : res_val;
                    
                    // Reemplazar globalmente usando el Lookahead negativo
                    expr = expr.replace(new RegExp(`${q_res}(?!\\d)`, 'g'), rep);
                    changed = true;
                }
            }
        }

        // 3. Arden Profundo (Dentro de paréntesis)
        let deepArdenRegex = new RegExp(`${q_actual}(?!\\d)`);
        if (deepArdenRegex.test(expr)) {
            // Patrón A q_i + B (Se vuelve A* B)
            let pat_suma = new RegExp(`([a-zA-Z0-9)]\\**)\\s*${q_actual}(?!\\d)\\s*\\+\\s*(.*?)(?=\\)|$)`, 'g');
            expr = expr.replace(pat_suma, '$1*$2');

            // Patrón A q_i solitario (Se vuelve A*)
            let pat_solo = new RegExp(`([a-zA-Z0-9)]\\**)\\s*${q_actual}(?!\\d)(?!\\s*\\+)`, 'g');
            expr = expr.replace(pat_solo, '$1*');
        }

        // Limpieza visual de asteriscos dobles (como tu expr.replace('**', '*'))
        expr = expr.replace(/\*\*/g, '*');

        resultados[q_actual] = expr;
        
        log(`<b>Resolviendo ${q_actual}:</b>`);
        log(`<b style="color:#f0abfc;">${q_actual} = ${expr}</b><br/>`);
    }

    log("--- RESULTADO FINAL ---", true);
    let expresion_final = resultados[inicial] || "∅";
    log(`<span style="color:var(--success); font-size:1.1em;">Expresión Regular = <b>${expresion_final}</b></span>`);
    
    document.getElementById('final-regex').innerText = expresion_final;
}

// ==========================================
// UTILIDADES (EXPORTAR / CARGAR / GUARDAR)
// ==========================================
function exportImage() {
    const networkCanvas = document.querySelector('#mynetwork canvas');
    const resultText = document.getElementById('final-regex').innerText;
    
    if (!networkCanvas) {
        alert("El diagrama no está listo para exportarse.");
        return;
    }

    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    
    exportCanvas.width = networkCanvas.width;
    exportCanvas.height = networkCanvas.height + 80;

    ctx.fillStyle = '#090212';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(networkCanvas, 0, 0);

    ctx.fillStyle = '#1e0a3c'; 
    ctx.fillRect(0, networkCanvas.height, exportCanvas.width, 80);
    
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillStyle = '#f0abfc'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Resultado Arden: ${resultText}`, exportCanvas.width / 2, networkCanvas.height + 40);

    const imageURL = exportCanvas.toDataURL("image/png");
    const downloadLink = document.createElement('a');
    downloadLink.href = imageURL;
    downloadLink.download = 'Automata_Arden.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function saveAutomatonJSON() {
    const data = {
        states: document.getElementById('states').value,
        alphabet: document.getElementById('alphabet').value,
        initial: document.getElementById('initial').value,
        final: document.getElementById('final').value,
        transitions: []
    };

    const transFrom = document.querySelectorAll('.t-from');
    const transSymbol = document.querySelectorAll('.t-symbol');
    const transTo = document.querySelectorAll('.t-to');

    for (let i = 0; i < transFrom.length; i++) {
        if(transFrom[i].value && transSymbol[i].value && transTo[i].value) {
            data.transitions.push({
                from: transFrom[i].value,
                symbol: transSymbol[i].value,
                to: transTo[i].value
            });
        }
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "configuracion_automata.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function loadAutomatonJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            document.getElementById('states').value = data.states || '';
            document.getElementById('alphabet').value = data.alphabet || '';
            document.getElementById('initial').value = data.initial || '';
            document.getElementById('final').value = data.final || '';

            document.getElementById('transitions').innerHTML = '';

            if (data.transitions && data.transitions.length > 0) {
                data.transitions.forEach(t => {
                    addTransitionRow(t.from, t.symbol, t.to);
                });
            }
            
            drawAutomaton();
            
            document.getElementById('console').innerHTML = '';
            log('<span style="color:var(--success); font-weight:bold;"><i class="fas fa-check-circle"></i> Autómata cargado exitosamente.</span>', true);
            
        } catch (err) {
            alert("⚠️ Error: El archivo seleccionado no es un JSON válido para este programa.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}