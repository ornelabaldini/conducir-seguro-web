
document.addEventListener("DOMContentLoaded", () => {
    const panel = document.querySelector("#dax-panel");
    if (!panel) return;

    const intro = document.querySelector("#dax-intro");
    const game = document.querySelector("#dax-game");
    const results = document.querySelector("#dax-results");
    const letter = document.querySelector("#dax-letter");
    const feedback = document.querySelector("#dax-feedback");
    const progress = document.querySelector("#dax-progress-label");
    const clock = document.querySelector("#dax-clock");
    const respondButton = document.querySelector("#dax-respond");

    let TOTAL = 60;
    const totalSelect = document.querySelector("#dax-total");
    const TARGETS = {
        30: 3,
        60: 6,
        90: 9
    };
    const STIMULUS_TIME = 900;

    let sequence = [];
    let index = 0;
    let responded = false;
    let target = false;
    let shownAt = 0;
    let hits = 0;
    let omissions = 0;
    let errors = 0;
    let reactionTimes = [];
    let timer = null;
    let running = false;
    let deadline = 0;

    function openPanel() {
        stopTest();
        intro.hidden = false;
        game.hidden = true;
        results.hidden = true;
        panel.hidden = false;
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    document.querySelector("#dax-open")?.addEventListener("click", openPanel);

    document.querySelector("#dax-close")?.addEventListener("click", () => {
        stopTest();
        panel.hidden = true;
    });

    if (window.location.hash === "#dax") openPanel();

    function stopTest() {
        running = false;

        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    }

    // Genera la secuencia de estímulos y distribuye los blancos A-X.
    function createSequence() {
        const totalTargets = TARGETS[TOTAL];
        const letters = Array(TOTAL).fill(null);
        const positions = [];

        while (positions.length < totalTargets) {
            const position = Math.floor(Math.random() * (TOTAL - 1)) + 1;

            if (
                letters[position] === null &&
                letters[position - 1] === null
            ) {
                positions.push(position);
                letters[position - 1] = "A";
                letters[position] = "X";
            }
        }

        const distractors = ["B", "C", "D", "X"];

        return letters.map(letter =>
            letter ?? distractors[Math.floor(Math.random() * distractors.length)]
        );
    }

    // Inicializa la prueba y reinicia los contadores.
    function startTest() {
        stopTest();

        TOTAL = Number(totalSelect.value);
        sequence = createSequence();
        index = 0;
        hits = 0;
        omissions = 0;
        errors = 0;
        reactionTimes = [];
        running = true;

        intro.hidden = true;
        results.hidden = true;
        game.hidden = false;

        window.requestAnimationFrame(() => {
            window.setTimeout(() => {
                if (panel.hidden || game.hidden || !running) return;

                const esMovil = window.matchMedia("(max-width: 700px)").matches;

                game.scrollIntoView({
                    behavior: "smooth",
                    block: esMovil ? "center" : "nearest",
                    inline: "nearest"
                });
            }, 100);
        });

        deadline = performance.now() + TOTAL * STIMULUS_TIME;
        showStimulus();
    }

    // Muestra cada estímulo y registra las omisiones.
    function showStimulus() {
        if (!running) return;

        if (index >= sequence.length || performance.now() >= deadline) {
            finishTest();
            return;
        }

        target = sequence[index] === "X" &&
            index > 0 &&
            sequence[index - 1] === "A";

        responded = false;
        shownAt = performance.now();

        letter.textContent = sequence[index];
        progress.textContent = `Estímulo ${index + 1} de ${TOTAL}`;
        clock.textContent = `${Math.max(0, Math.ceil((deadline - shownAt) / 1000))} s`;
        feedback.textContent = "Observá la secuencia.";
        respondButton.disabled = false;

        timer = setTimeout(() => {
            if (target && !responded) {
                omissions++;
            }

            index++;
            showStimulus();
        }, STIMULUS_TIME);
    }

    // Registra la respuesta y el tiempo de reacción ante cada estímulo.
    function respond() {
        if (!running || responded) return;

        responded = true;

        if (target) {
            hits++;
            reactionTimes.push(performance.now() - shownAt);
            feedback.textContent = "¡Acierto!";
        } else {
            errors++;
            feedback.textContent = "Respuesta incorrecta.";
        }
    }

    // Calcula los indicadores, determina la clasificación y muestra los resultados.
    function finishTest() {
        running = false;
        clearTimeout(timer);

        const totalTargets = TARGETS[TOTAL];
        const average = reactionTimes.length
            ? reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length
            : 0;

        const ip = (hits / totalTargets) * 100;
        const fdPercentage = (errors / TOTAL) * 100;

        const ic = fdPercentage < 10
            ? 100 - 5 * fdPercentage
            : null;

        const iv = average <= 600
            ? 100
            : average <= 800
                ? 100 - 0.5 * (average - 600)
                : null;

        // Límites de omisiones críticas según la cantidad de estímulos.
        const criticalOmissions = {
            30: 1,
            60: 2,
            90: 3
        };

        // Determina si existe al menos un criterio crítico.
        const critical =
            ip < 66 ||
            omissions > criticalOmissions[TOTAL] ||
            fdPercentage >= 10 ||
            average > 800;

        // El IEG no se calcula cuando existe un criterio crítico.
        const ieg = critical
            ? null
            : 0.45 * ip + 0.35 * ic + 0.20 * iv;

        // Clasificación individual de esta prueba.
        let status = "AZUL";

        if (!critical) {
            status = ieg < 70
                ? "AZUL"
                : ieg < 90
                    ? "AMARILLO"
                    : "VERDE";
        }

        // Descripción correspondiente a cada clasificación.
        const descriptions = {
            VERDE: "Resultado favorable",
            AMARILLO: "Resultado intermedio",
            AZUL: critical
                ? "Se identificaron criterios críticos"
                : "Resultado por debajo del nivel esperado"
        };

        // Oculta el juego y muestra la sección de resultados.
        game.hidden = true;
        results.hidden = false;

        // Actualiza el estado visual de la tarjeta según la clasificación.
        const resultCard = document.querySelector("#dax-result-card");
        resultCard.dataset.status = status.toLowerCase();

        // Muestra la clasificación, su descripción y el índice obtenido.
        document.querySelector("#dax-result-status").textContent = status;
        document.querySelector("#dax-result-description").textContent = descriptions[status];
        document.querySelector("#dax-result-score").textContent = ieg === null
            ? "No aplicable"
            : `${ieg.toFixed(1)} / 100`;

        // Muestra los indicadores individuales de la prueba.
        document.querySelector("#dax-hits").textContent = hits;
        document.querySelector("#dax-omissions").textContent = omissions;
        document.querySelector("#dax-errors").textContent = errors;
        document.querySelector("#dax-average").textContent = `${average.toFixed(0)} ms`;

        // Presenta los indicadores complementarios sin repetir la clasificación.
        document.querySelector("#dax-summary").textContent =
            `Aciertos en blancos A-X: ${ip.toFixed(1)}%.\n` +
            `Falsas detecciones: ${fdPercentage.toFixed(1)}%.\n` +
            `Tiempo medio de reacción: ${average.toFixed(0)} ms.`;
    }

    document.querySelector("#dax-start").addEventListener("click", startTest);
    document.querySelector("#dax-restart").addEventListener("click", startTest);
    respondButton.addEventListener("click", respond);

    // Permite responder con la barra espaciadora.
    document.addEventListener("keydown", event => {
        if (event.code !== "Space" || !running || panel.hidden) return;

        event.preventDefault();
        respond();
    });
});

// CÁLCULO DE RESULTADOS SEGÚN CRITERIOS MEC v2.1
// IP: porcentaje de aciertos sobre el total de blancos A-X.
// IC: 100 - (5 x porcentaje de falsas detecciones).
// IV: 100 hasta 600 ms; luego disminuye 0.5 puntos por ms
// por encima de 600, hasta los 800 ms.
// IEG: (IP x 0.45) + (IC x 0.35) + (IV x 0.20).
// Condiciones críticas: IP < 66%, omisiones sobre el límite,
// falsas detecciones >= 10% o TR promedio > 800 ms.
// Si existe una condición crítica: AZUL, IEG NO APLICABLE.
// Clasificación: AZUL < 70; AMARILLO >= 70 y < 90;
// VERDE >= 90.
/*
 * MODELO DE EVALUACIÓN COGNITIVA (MEC v2.1)
 *
 * El generador DAX crea secuencias de 30, 60 o 90 estímulos,
 * con un 10 % de blancos A→X: 3, 6 o 9 respectivamente.
 *
 * INDICADORES:
 *
 * IP — Índice de Aciertos:
 * (Aciertos en blancos A→X / Blancos previstos) × 100.
 *
 * IC — Índice de Control Inhibitorio:
 * Penaliza las falsas detecciones según la fórmula definida
 * por el MEC v2.1.
 *
 * IV — Índice de Velocidad:
 * Evalúa el tiempo medio de reacción. La referencia es de
 * 600 ms; los tiempos superiores reciben una penalización
 * progresiva hasta el límite de 800 ms.
 *
 * IEG — Índice de Eficiencia General:
 * IP × 0.45 + IC × 0.35 + IV × 0.20.
 *
 * CONDICIONES CRÍTICAS:
 * IP inferior al 66 %, omisiones por encima del límite
 * establecido, falsas detecciones iguales o superiores
 * al 10 % o tiempo medio de reacción superior a 800 ms.
 *
 * Los resultados describen el desempeño en el ejercicio.
 * No constituyen un diagnóstico médico ni determinan
 * por sí solos la aptitud para conducir.
 */
