let network = null;
let convertedDFA = null;
let minimizedDFA = null;
let automatonType = 'AFD';
let typeOverridden = false;

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

    detectAutomatonType();
}

function drawAutomatonData(statesList, initial, finalsList, transList) {
    let nodesArray = statesList.map(stateName => {
        let isInitial = stateName === initial;
        let isFinal = finalsList.includes(stateName);
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

    let edgeMap = {};
    for (const t of transList) {
        let key = `${t.from}|${t.to}`;
        if (!edgeMap[key]) edgeMap[key] = [];
        if (!edgeMap[key].includes(t.symbol)) edgeMap[key].push(t.symbol);
    }

    let edgesArray = [];
    for (let key in edgeMap) {
        let [from, to] = key.split('|');
        edgesArray.push({
            from, to, label: edgeMap[key].join(','), arrows: 'to',
            font: { align: 'top', color: '#c4b5fd', size: 14, strokeWidth: 0, background: 'rgba(9, 2, 18, 0.7)' },
            color: { color: '#6d28d9', highlight: '#a21caf' },
            smooth: { type: 'curvedCW', roundness: 0.2 }
        });
    }

    if (network !== null) {
        network.setData({ nodes: nodesArray, edges: edgesArray });
    } else {
        const container = document.getElementById('mynetwork');
        const options = {
            physics: { solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.01, springLength: 100 } },
            interaction: { hover: true, dragNodes: true }
        };
        network = new vis.Network(container, { nodes: nodesArray, edges: edgesArray }, options);
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
    switchTab('arden');
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
            typeOverridden = false;

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

// ==========================================
// INTERFAZ: TABS Y TIPO DE AUTÓMATA
// ==========================================

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
}

function setAutomatonType(type) {
    automatonType = type;
    typeOverridden = true;
    document.getElementById('btn-afd').classList.toggle('active', type === 'AFD');
    document.getElementById('btn-afnd').classList.toggle('active', type === 'AFND');
    _updateTypeIndicator();
}

function resetToAutoDetect() {
    typeOverridden = false;
    detectAutomatonType();
}

function detectAutomatonType() {
    if (typeOverridden) return;

    const froms   = document.querySelectorAll('.t-from');
    const symbols = document.querySelectorAll('.t-symbol');
    const tos     = document.querySelectorAll('.t-to');

    // ε-transición → AFND
    for (let i = 0; i < symbols.length; i++) {
        if (symbols[i].value.trim() === 'ε') {
            _applyAutoType('AFND');
            return;
        }
    }

    // Mismo (estado, símbolo) con más de un destino → AFND
    const seen = {};
    for (let i = 0; i < froms.length; i++) {
        const from = froms[i].value.trim();
        const sym  = symbols[i].value.trim();
        const to   = tos[i].value.trim();
        if (!from || !sym || !to) continue;
        const key = `${from}|${sym}`;
        if (seen[key] !== undefined && seen[key] !== to) {
            _applyAutoType('AFND');
            return;
        }
        seen[key] = to;
    }

    _applyAutoType('AFD');
}

function _applyAutoType(type) {
    automatonType = type;
    document.getElementById('btn-afd').classList.toggle('active', type === 'AFD');
    document.getElementById('btn-afnd').classList.toggle('active', type === 'AFND');
    _updateTypeIndicator();
}

function _updateTypeIndicator() {
    const label    = document.getElementById('type-mode-label');
    const resetBtn = document.getElementById('btn-reset-type');
    if (!label) return;
    if (typeOverridden) {
        label.textContent = 'Manual';
        label.style.color = 'var(--warning)';
        if (resetBtn) resetBtn.style.display = '';
    } else {
        label.textContent = 'Auto-detectado';
        label.style.color = 'var(--success)';
        if (resetBtn) resetBtn.style.display = 'none';
    }
}

// ==========================================
// HELPERS COMPARTIDOS
// ==========================================

function getTransitions() {
    const froms   = document.querySelectorAll('.t-from');
    const symbols = document.querySelectorAll('.t-symbol');
    const tos     = document.querySelectorAll('.t-to');
    const result  = [];
    for (let i = 0; i < froms.length; i++) {
        const from = froms[i].value.trim();
        const sym  = symbols[i].value.trim();
        const to   = tos[i].value.trim();
        if (from && sym && to) result.push({ from, sym, to });
    }
    return result;
}

function epsilonClosure(states, transitions) {
    const closure = new Set(states);
    const stack = [...states];
    while (stack.length > 0) {
        const s = stack.pop();
        for (const t of transitions) {
            if (t.from === s && t.sym === 'ε' && !closure.has(t.to)) {
                closure.add(t.to);
                stack.push(t.to);
            }
        }
    }
    return [...closure].sort();
}

function move(states, symbol, transitions) {
    const result = new Set();
    for (const s of states) {
        for (const t of transitions) {
            if (t.from === s && t.sym === symbol) result.add(t.to);
        }
    }
    return [...result];
}

// ==========================================
// EVALUAR CADENA (AFD / AFND)
// ==========================================

function evaluarCadena() {
    const input      = document.getElementById('eval-input').value;
    const outputDiv  = document.getElementById('eval-output');
    outputDiv.innerHTML = '';

    const transitions = getTransitions();
    const initial     = document.getElementById('initial').value.trim();
    const finals      = document.getElementById('final').value.split(',').map(s => s.trim()).filter(s => s);
    const alphabet    = getAlphabet();

    if (!initial) {
        outputDiv.innerHTML = `<div class="step" style="color:var(--warning)">Define un estado inicial primero.</div>`;
        return;
    }

    const logE = (html) => {
        const div = document.createElement('div');
        div.className = 'step';
        div.innerHTML = html;
        outputDiv.appendChild(div);
    };

    const cadenaLabel = input === '' ? 'ε (cadena vacía)' : `"${input}"`;
    logE(`<b>Cadena:</b> ${cadenaLabel}`);
    logE(`<b>Tipo de simulación:</b> ${automatonType}`);

    // Usamos simulación NFA (funciona igual para DFA)
    let currentStates = epsilonClosure([initial], transitions);
    logE(`<b>Estado inicial:</b> ε-closure({${initial}}) = {${currentStates.join(', ')}}`);

    const symbols = [...input]; // carácter por carácter
    let valid = true;

    for (const sym of symbols) {
        if (!alphabet.includes(sym)) {
            logE(`<span style="color:var(--warning)">⚠️ El símbolo '<b>${sym}</b>' no está en el alfabeto (${alphabet.join(', ')}).</span>`);
            valid = false;
            break;
        }
        const nextRaw    = move(currentStates, sym, transitions);
        const nextStates = epsilonClosure(nextRaw, transitions);
        const currentStr = `{${currentStates.join(', ')}}`;
        const nextStr    = nextStates.length > 0 ? `{${nextStates.join(', ')}}` : '∅';
        logE(`δ(${currentStr}, <b>${sym}</b>) = ${nextStr}`);
        currentStates = nextStates;

        if (currentStates.length === 0) {
            logE(`<span style="color:#ef4444">Estado muerto alcanzado. La cadena será rechazada.</span>`);
            break;
        }
    }

    if (valid) {
        const finalAlcanzados = currentStates.filter(s => finals.includes(s));
        if (finalAlcanzados.length > 0) {
            logE(`<br><span style="color:var(--success); font-size:1.05em;"><b>CADENA ACEPTADA</b> — Estados finales alcanzados: {${finalAlcanzados.join(', ')}}</span>`);
        } else {
            logE(`<br><span style="color:#ef4444; font-size:1.05em;"><b>CADENA RECHAZADA</b> — Estado(s) actual(es): {${currentStates.join(', ')}} no son estados finales.</span>`);
        }
    }

    outputDiv.scrollTop = outputDiv.scrollHeight;
}

// ==========================================
// CONVERSIÓN AFND → AFD (SUBCONJUNTOS)
// ==========================================

function convertirAFD() {
    const outputDiv = document.getElementById('conversion-output');
    outputDiv.innerHTML = '';
    convertedDFA = null;
    document.getElementById('btn-cargar-afd').style.display = 'none';

    const transitions = getTransitions();
    const initial     = document.getElementById('initial').value.trim();
    const finals      = document.getElementById('final').value.split(',').map(s => s.trim()).filter(s => s);
    const alphabet    = getAlphabet().filter(s => s !== 'ε');

    if (!initial) {
        outputDiv.innerHTML = `<div class="step" style="color:var(--warning)">Define un estado inicial primero.</div>`;
        return;
    }

    const setKey = (arr) => [...arr].sort().join(',') || '∅';

    const startSet  = epsilonClosure([initial], transitions);
    const startKey  = setKey(startSet);

    // dfaStates: key -> { name, states, trans: { sym -> destKey } }
    const dfaStates = {};
    const worklist  = [startSet];
    const visited   = new Set([startKey]);
    let counter = 0;

    dfaStates[startKey] = { name: `q${counter++}`, states: startSet, trans: {} };

    while (worklist.length > 0) {
        const cur    = worklist.pop();
        const curKey = setKey(cur);

        for (const sym of alphabet) {
            const nextRaw  = move(cur, sym, transitions);
            const nextSet  = epsilonClosure(nextRaw, transitions);
            if (nextSet.length === 0) continue; // transición a estado muerto omitida

            const nextKey = setKey(nextSet);
            if (!dfaStates[nextKey]) {
                dfaStates[nextKey] = { name: `q${counter++}`, states: nextSet, trans: {} };
            }
            dfaStates[curKey].trans[sym] = nextKey;

            if (!visited.has(nextKey)) {
                visited.add(nextKey);
                worklist.push(nextSet);
            }
        }
    }

    // Estados finales del AFD
    const dfaFinals = [];
    for (const key in dfaStates) {
        if (dfaStates[key].states.some(s => finals.includes(s))) {
            dfaFinals.push(dfaStates[key].name);
        }
    }

    // Construir tabla HTML
    const startName = dfaStates[startKey].name;

    let html = `<div class="step step-title">Tabla de Transiciones AFD (construcción de subconjuntos)</div>`;
    html += `<table class="conversion-table"><thead><tr>`;
    html += `<th>Estado</th><th>Conjunto NFA</th>`;
    for (const sym of alphabet) html += `<th>${sym}</th>`;
    html += `<th>Final?</th></tr></thead><tbody>`;

    for (const key in dfaStates) {
        const ds      = dfaStates[key];
        const isFinal = dfaFinals.includes(ds.name);
        const isStart = ds.name === startName;
        html += `<tr>`;
        html += `<td><b>${isStart ? '→ ' : ''}${ds.name}${isFinal ? ' *' : ''}</b></td>`;
        html += `<td style="color:var(--text-muted); font-size:0.75rem;">{${ds.states.join(', ')}}</td>`;
        for (const sym of alphabet) {
            const dk = ds.trans[sym];
            html += `<td>${dk ? dfaStates[dk].name : '∅'}</td>`;
        }
        html += `<td>${isFinal ? '<span style="color:var(--success)">✓</span>' : '—'}</td>`;
        html += `</tr>`;
    }
    html += `</tbody></table>`;

    outputDiv.innerHTML = html;

    const resumen = document.createElement('div');
    resumen.className = 'step';
    resumen.style.marginTop = '0.5rem';
    resumen.innerHTML = `<b>Estado inicial AFD:</b> ${startName}<br>
<b>Estados finales AFD:</b> ${dfaFinals.join(', ') || 'ninguno'}<br>
<b>Total estados:</b> ${Object.keys(dfaStates).length}`;
    outputDiv.appendChild(resumen);
    outputDiv.scrollTop = outputDiv.scrollHeight;

    convertedDFA = { dfaStates, dfaFinals, startName, alphabet };
    document.getElementById('btn-cargar-afd').style.display = 'block';
    document.getElementById('btn-minimizar-convertido').style.display = 'block';

    // Dibujar el AFD resultante en el diagrama central
    const statesList = Object.values(dfaStates).map(ds => ds.name);
    const transList = [];
    for (const key in dfaStates) {
        const ds = dfaStates[key];
        for (const sym of alphabet) {
            if (ds.trans[sym]) {
                transList.push({ from: ds.name, symbol: sym, to: dfaStates[ds.trans[sym]].name });
            }
        }
    }
    drawAutomatonData(statesList, startName, dfaFinals, transList);
}

function cargarAFDConvertido() {
    if (!convertedDFA) return;
    const { dfaStates, dfaFinals, startName, alphabet } = convertedDFA;

    const stateNames = Object.values(dfaStates).map(ds => ds.name);
    document.getElementById('states').value   = stateNames.join(', ');
    document.getElementById('initial').value  = startName;
    document.getElementById('final').value    = dfaFinals.join(', ');
    document.getElementById('alphabet').value = alphabet.join(', ');

    document.getElementById('transitions').innerHTML = '';
    for (const key in dfaStates) {
        const ds = dfaStates[key];
        for (const sym of alphabet) {
            if (ds.trans[sym]) {
                addTransitionRow(ds.name, sym, dfaStates[ds.trans[sym]].name);
            }
        }
    }

    setAutomatonType('AFD');
    drawAutomaton();
    alert('AFD convertido cargado exitosamente.');
}

// ==========================================
// MINIMIZACIÓN DE AFD (LLENADO DE TABLA)
// ==========================================

function minimizarAFD() {
    const outputDiv = document.getElementById('minimizar-output');
    outputDiv.innerHTML = '';
    minimizedDFA = null;
    document.getElementById('btn-cargar-min').style.display = 'none';

    const transitions = getTransitions();
    const states      = document.getElementById('states').value.split(',').map(s => s.trim()).filter(s => s);
    const initial     = document.getElementById('initial').value.trim();
    const finals      = document.getElementById('final').value.split(',').map(s => s.trim()).filter(s => s);
    const alphabet    = getAlphabet().filter(s => s !== 'ε');

    const logM = (html) => {
        const div = document.createElement('div');
        div.className = 'step';
        div.innerHTML = html;
        outputDiv.appendChild(div);
    };

    // Verificar que no haya ε-transiciones
    if (transitions.some(t => t.sym === 'ε')) {
        logM(`<span style="color:var(--warning)">⚠️ El autómata tiene ε-transiciones. Usa la pestaña NFA→DFA para convertirlo primero.</span>`);
        return;
    }

    // Verificar determinismo
    for (const s of states) {
        for (const sym of alphabet) {
            const dests = transitions.filter(t => t.from === s && t.sym === sym);
            if (dests.length > 1) {
                logM(`<span style="color:var(--warning)">⚠️ No determinista: δ(${s}, ${sym}) tiene ${dests.length} destinos. Convierte a AFD primero.</span>`);
                return;
            }
        }
    }

    const delta = (s, sym) => {
        const t = transitions.find(t => t.from === s && t.sym === sym);
        return t ? t.to : null;
    };

    // 1. Eliminar estados inalcanzables
    const reachable = new Set([initial]);
    const queue = [initial];
    while (queue.length > 0) {
        const s = queue.shift();
        for (const sym of alphabet) {
            const next = delta(s, sym);
            if (next && !reachable.has(next)) { reachable.add(next); queue.push(next); }
        }
    }

    const Q = states.filter(s => reachable.has(s));
    const unreachable = states.filter(s => !reachable.has(s));
    if (unreachable.length > 0) {
        logM(`<span style="color:var(--text-muted)">Estados inalcanzables eliminados: {${unreachable.join(', ')}}</span>`);
    }

    // 2. Algoritmo de llenado de tabla
    const n   = Q.length;
    const idx = {};
    Q.forEach((s, i) => idx[s] = i);

    // dist[i][j] = true → estados i y j son distinguibles (i < j siempre)
    const dist = Array.from({ length: n }, () => Array(n).fill(false));

    // Inicializar: (final, no-final) son distinguibles
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (finals.includes(Q[i]) !== finals.includes(Q[j])) dist[i][j] = true;
        }
    }

    // Iterar hasta convergencia
    let changed = true;
    while (changed) {
        changed = false;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (dist[i][j]) continue;
                for (const sym of alphabet) {
                    const pi = delta(Q[i], sym);
                    const pj = delta(Q[j], sym);
                    if (pi === pj) continue; // misma dest (o ambas null) → no distingue
                    if (pi === null || pj === null) { dist[i][j] = true; changed = true; break; }
                    const a = Math.min(idx[pi], idx[pj]);
                    const b = Math.max(idx[pi], idx[pj]);
                    if (a !== b && dist[a][b]) { dist[i][j] = true; changed = true; break; }
                }
            }
        }
    }

    // 3. Construir clases de equivalencia
    const assigned = new Array(n).fill(false);
    const classes  = [];
    for (let i = 0; i < n; i++) {
        if (assigned[i]) continue;
        const cls = [Q[i]];
        assigned[i] = true;
        for (let j = i + 1; j < n; j++) {
            if (!dist[i][j]) { cls.push(Q[j]); assigned[j] = true; }
        }
        classes.push(cls);
    }

    // 4. Nombrar clases y construir AFD minimizado
    const classOf = {};
    classes.forEach((cls, i) => cls.forEach(s => classOf[s] = `M${i}`));

    const minInitial = classOf[initial];
    const minFinals  = [...new Set(finals.filter(s => reachable.has(s)).map(s => classOf[s]))];

    const minTrans = [];
    for (const cls of classes) {
        const rep     = cls[0];
        const clsName = classOf[rep];
        for (const sym of alphabet) {
            const dest = delta(rep, sym);
            if (dest) {
                const destClass = classOf[dest];
                if (!minTrans.some(t => t.from === clsName && t.sym === sym && t.to === destClass)) {
                    minTrans.push({ from: clsName, sym, to: destClass });
                }
            }
        }
    }

    // 5. Mostrar resultado
    logM(`<b>Clases de equivalencia:</b>`);
    classes.forEach((cls, i) => logM(`M${i} = {${cls.join(', ')}}`));

    logM(`<br><b>Estado inicial:</b> ${minInitial} &nbsp; <b>Estados finales:</b> ${minFinals.join(', ') || 'ninguno'}`);

    let html = `<div class="step step-title" style="margin-top:0.5rem">Tabla de Transiciones Minimizada</div>`;
    html += `<table class="conversion-table"><thead><tr><th>Estado</th>`;
    for (const sym of alphabet) html += `<th>${sym}</th>`;
    html += `<th>Final?</th></tr></thead><tbody>`;

    for (const cls of classes) {
        const clsName = classOf[cls[0]];
        const isFinal = minFinals.includes(clsName);
        const isStart = clsName === minInitial;
        html += `<tr>`;
        html += `<td><b>${isStart ? '→ ' : ''}${clsName}${isFinal ? ' *' : ''}</b></td>`;
        for (const sym of alphabet) {
            const t = minTrans.find(t => t.from === clsName && t.sym === sym);
            html += `<td>${t ? t.to : '∅'}</td>`;
        }
        html += `<td>${isFinal ? '<span style="color:var(--success)">✓</span>' : '—'}</td>`;
        html += `</tr>`;
    }
    html += `</tbody></table>`;

    const tableDiv = document.createElement('div');
    tableDiv.innerHTML = html;
    outputDiv.appendChild(tableDiv);

    logM(`<br><b>Reducción:</b> ${Q.length} estados → ${classes.length} estados minimizados`);
    outputDiv.scrollTop = outputDiv.scrollHeight;

    minimizedDFA = { states: classes.map((_, i) => `M${i}`), initial: minInitial, finals: minFinals, transitions: minTrans, alphabet };
    document.getElementById('btn-cargar-min').style.display = 'block';
}

function cargarAFDMinimizado() {
    if (!minimizedDFA) return;
    const { states, initial, finals, transitions, alphabet } = minimizedDFA;

    document.getElementById('states').value   = states.join(', ');
    document.getElementById('initial').value  = initial;
    document.getElementById('final').value    = finals.join(', ');
    document.getElementById('alphabet').value = alphabet.join(', ');

    document.getElementById('transitions').innerHTML = '';
    transitions.forEach(t => addTransitionRow(t.from, t.sym, t.to));

    setAutomatonType('AFD');
    drawAutomaton();
    alert('AFD minimizado cargado exitosamente.');
}

function minimizarAFDConvertido() {
    cargarAFDConvertido();
    minimizarAFD();
    switchTab('minimizar');
}