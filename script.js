function playSound(id) {
    const s = document.getElementById(id);
    if (!s) return;
    s.currentTime = 0; // restart sound quickly
    s.play().catch(() => {}); // prevents errors if blocked
}

function add(value) {
    playSound("clickSound");
    document.getElementById("display").value += value;
}

function backspace() {
    playSound("clickSound");
    let display = document.getElementById("display");
    display.value = display.value.slice(0, -1);
}

// Get unique variables
function getVariables(expr) {
    return [...new Set(expr.match(/[A-Z]/g))];
}

// Generate truth combinations
function generateRows(n) {
    let rows = [];
    let total = Math.pow(2, n);

    for (let i = total - 1; i >= 0; i--) { // reverse order
        let row = [];
        for (let j = n - 1; j >= 0; j--) {
            row.push((i >> j) & 1);
        }
        rows.push(row);
    }
    return rows;
}

// Convert logic symbols to JS
function convert(expr) {
    return expr
        .replace(/¬/g, "!")
        .replace(/∧/g, "&&")
        .replace(/∨/g, "||")
        .replace(/→/g, "=>") // handled manually
        .replace(/↔/g, "==");
}

function getSubExpressions(expr) {
    let matches = expr.match(/\([^()]+\)/g);
    if (!matches) return [];

    // Remove duplicates
    return [...new Set(matches)];
}

// Evaluate expression safely
function evaluate(expr, values, vars) {
    let temp = expr;

    // Replace variables
    vars.forEach((v, i) => {
        temp = temp.replaceAll(v, values[i]);
    });

    // NOT
    while (temp.includes("¬")) {
        temp = temp.replace(/¬(\d+|\([^()]*\))/g, "(!$1)");
    }

    // NAND ⊼ → !(A && B)
    while (temp.includes("⊼")) {
        temp = temp.replace(/(\d+|\([^()]*\))\s*⊼\s*(\d+|\([^()]*\))/g,
            "(!($1 && $2))");
    }

    // NOR ⊽ → !(A || B)
    while (temp.includes("⊽")) {
        temp = temp.replace(/(\d+|\([^()]*\))\s*⊽\s*(\d+|\([^()]*\))/g,
            "(!($1 || $2))");
    }

    // XOR ⇹ → (A != B)
    while (temp.includes("⇹")) {
        temp = temp.replace(/(\d+|\([^()]*\))\s*⇹\s*(\d+|\([^()]*\))/g,
            "(($1 + $2) == 1)");
    }

    // AND / OR
    temp = temp
        .replace(/∧/g, "&&")
        .replace(/∨/g, "||");

    // IMPLIES
    while (temp.includes("→")) {
        temp = temp.replace(/(\d+|\([^()]*\))\s*→\s*(\d+|\([^()]*\))/g,
            "(!$1 || $2)");
    }

    // BICONDITIONAL
    temp = temp.replace(/↔/g, "==");

    try {
        return eval(temp) ? 1 : 0;
    } catch {
        return "ERR";
    }
}

function calculate() {
    playSound("equalSound");
    let expr = document.getElementById("display").value;

    let error = validateExpression(expr);

    if (error) {
        showError(error); // ✅ correct place
        document.getElementById("result").innerHTML = "";
        return;
    }

    // Clear error if valid input
    document.getElementById("error").innerHTML = "";

    let vars = [...new Set(expr.match(/[A-Z]/g))];
    let subExprs = getSubExpressions(expr);

    let rows = generateRows(vars.length);

    let html = "<table class='result-table'><tr>";

    // Headers
    vars.forEach(v => html += `<th>${v}</th>`);

    subExprs.forEach(se => html += `<th>${se}</th>`);

    html += `<th>${expr}</th></tr>`;

    // Rows
    rows.forEach(row => {
        html += "<tr>";

        let context = {};

        // Variables
        vars.forEach((v, i) => {
            context[v] = row[i];
            html += `<td>${row[i] ? 'T' : 'F'}</td>`;
        });

        // Sub-expressions
        subExprs.forEach(se => {
            let val = evaluate(se, row, vars);
            context[se] = val;
            html += `<td>${val === 1 ? 'T' : 'F'}</td>`;
        });

        // Final expression
        let result = evaluate(expr, row, vars);
        html += `<td>${result === 1 ? 'T' : 'F'}</td>`;

        html += "</tr>";
    });

    html += "</table>";

    document.getElementById("resultTableContainer").innerHTML = html;

    // Show modal
    let modal = document.getElementById("resultModal");
    modal.style.display = "flex";
}
function closeResult() {
    // Hide modal
    document.getElementById("resultModal").style.display = "none";

    // Clear table
    document.getElementById("resultTableContainer").innerHTML = "";

    // Enable help button again
    document.querySelector(".help").classList.remove("disabled");

    // Optional: clear input
    document.getElementById("display").value = "";
}

function validateExpression(expr) {
    if (!expr || expr.trim() === "") {
        return "Expression is empty";
    }

    // Check balanced parentheses
    let stack = 0;
    for (let char of expr) {
        if (char === "(") stack++;
        if (char === ")") stack--;
        if (stack < 0) return "Unmatched parentheses";
    }
    if (stack !== 0) return "Unmatched parentheses";

    // Check invalid endings
    if (/[∧∨→↔⊼⊽⇹]$/.test(expr)) {
        return "Incomplete expression";
    }

    // Check invalid beginnings
    if (/^[∧∨→↔⊼⊽⇹]/.test(expr)) {
        return "Invalid start of expression";
    }

    // Double operators (basic check)
    if (/[∧∨→↔⊼⊽⇹]{2,}/.test(expr)) {
        return "Invalid operator usage";
    }

    return null; // valid
}

let errorTimeout;

function showError(message) {
    let errorDiv = document.getElementById("error");

    errorDiv.innerHTML = `Error: ${message}`;

    // Clear previous timer
    if (errorTimeout) {
        clearTimeout(errorTimeout);
    }

    // Start new timer
    errorTimeout = setTimeout(() => {
        errorDiv.innerHTML = "";
    }, 1500);
}

function showHelp() {
    playSound("infoSound");
    document.getElementById("helpModal").style.display = "flex";
}

function closeHelp() {
    playSound("infoSound");
    document.getElementById("helpModal").style.display = "none";
}

// Optional: click outside to close
window.onclick = function(event) {
    let modal = document.getElementById("helpModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

window.onclick = function(event) {
    let modal = document.getElementById("resultModal");
    if (event.target === modal) {
        closeResult();
    }
}