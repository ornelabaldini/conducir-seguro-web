
document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector) => document.querySelector(selector);
    const panel = $("#atencion-panel");
    if (!panel) return;

    const intro = $("#atencion-intro");
    const game = $("#atencion-game");
    const results = $("#atencion-results");
    const symbol = $("#atencion-symbol");
    const feedback = $("#atencion-feedback");
    const progress = $("#atencion-progress");
    const clock = $("#atencion-clock");
    const respondButton = $("#atencion-respond");

    // Configuración general de las etapas y presentación de estímulos.
    const PRACTICE_PER_DIGIT = 1;
    const TEST_PER_DIGIT = 4;
    const DIGIT_TIME = 700;
    const MASK_TIME = 600;
    const NO_GO_DIGIT = 3;
    const FONT_SIZES = [8, 10, 12, 14, 16];

    // Variables que conservan el estado de la prueba durante su ejecución.
    let sequence = [];
    let index = 0;
    let responded = false;
    let isNoGo = false;
    let shownAt = 0;
    let responseTime = null;
    let hits = 0;
    let omissions = 0;
    let errors = 0;
    let reactionTimes = [];
    let timer = null;
    let running = false;
    let practice = false;

    // Detiene la prueba y cancela el temporizador pendiente.
    function stopTest() {
        running = false;

        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    }

    // Mezcla los estímulos para evitar que aparezcan siempre en el mismo orden.
    function shuffle(items) {
        const result = [...items];

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }

        return result;
    }

    // Genera los números del 1 al 9 y asigna un tamaño aleatorio a cada uno.
    function createSequence(repetitions) {
        const digits = [];

        for (let digit = 1; digit <= 9; digit++) {
            for (let count = 0; count < repetitions; count++) {
                digits.push({
                    digit,
                    size: FONT_SIZES[Math.floor(Math.random() * FONT_SIZES.length)]
                });
            }
        }

        return shuffle(digits);
    }

    // Abre el panel de Atención y oculta los demás estados de esta prueba.
    function openPanel() {
        stopTest();

        const daxPanel = $("#dax-panel");
        if (daxPanel) daxPanel.hidden = true;

        intro.hidden = false;
        game.hidden = true;
        results.hidden = true;
        panel.hidden = false;

        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Reinicia los resultados y comienza con una etapa breve de práctica.
    function startTest() {
        stopTest();

        const daxPanel = $("#dax-panel");
        if (daxPanel) daxPanel.hidden = true;

        panel.hidden = false;
        intro.hidden = true;
        results.hidden = true;
        game.hidden = false;

        hits = 0;
        omissions = 0;
        errors = 0;
        reactionTimes = [];

        practice = true;
        sequence = createSequence(PRACTICE_PER_DIGIT);
        index = 0;
        running = true;

        symbol.textContent = "";
        progress.textContent = "Preparación";
        clock.textContent = "3 segundos";
        feedback.textContent = "Preparáte. La prueba está por comenzar.";
        respondButton.disabled = true;

        game.scrollIntoView({ behavior: "smooth", block: "center" });

        timer = setTimeout(() => {
            if (!running) return;
            showStimulus();
        }, 3000);
    }

    // Prepara la prueba principal y reinicia los contadores para excluir la práctica.
    function startMainTest() {
        practice = false;
        sequence = createSequence(TEST_PER_DIGIT);
        index = 0;

        hits = 0;
        omissions = 0;
        errors = 0;
        reactionTimes = [];

        showStimulus();
    }

    // Presenta cada número, habilita la respuesta y controla su tiempo de exposición.
    function showStimulus() {
        if (!running) return;

        if (index >= sequence.length) {
            if (practice) {
                startMainTest();
            } else {
                finishTest();
            }
            return;
        }

        const trial = sequence[index];

        // El número 3 es No-Go: se debe evitar responder cuando aparece.
        isNoGo = trial.digit === NO_GO_DIGIT;
        responded = false;
        responseTime = null;
        shownAt = performance.now();

        symbol.textContent = String(trial.digit);
        symbol.style.fontSize = `clamp(2rem, ${trial.size}vw, 7rem)`;
        symbol.style.color = "#334155";

        progress.textContent = practice
            ? `Práctica ${index + 1} de ${sequence.length}`
            : `Estímulo ${index + 1} de ${sequence.length}`;

        const remaining = sequence.length - index;
        clock.textContent = `${Math.ceil(remaining * (DIGIT_TIME + MASK_TIME) / 1000)} s`;

        feedback.textContent = practice
            ? "Practicá: respondé a todos excepto al 3."
            : "Respondé a todos los números excepto al 3.";

        respondButton.disabled = false;

        // Al finalizar la exposición, se oculta el número y comienza la máscara.
        timer = setTimeout(() => {
            if (!running) return;

            symbol.textContent = "";
            respondButton.disabled = true;

            timer = setTimeout(completeTrial, MASK_TIME);
        }, DIGIT_TIME);
    }

    // Registra una única respuesta por estímulo y mide el tiempo desde su aparición.
    function respond() {
        if (!running || responded || respondButton.disabled) return;

        responded = true;
        responseTime = performance.now() - shownAt;

        // Efecto visual breve para confirmar que se registró la respuesta.
        respondButton.style.transition = "transform 120ms ease, filter 120ms ease";
        respondButton.style.transform = "scale(0.94)";
        respondButton.style.filter = "brightness(0.75)";

        setTimeout(() => {
            respondButton.style.transform = "";
            respondButton.style.filter = "";
        }, 180);
    }

    // Clasifica la respuesta al terminar cada estímulo de la prueba principal.
    function completeTrial() {
        if (!running) return;

        if (!practice) {
            if (isNoGo) {
                // Responder al número 3 cuenta como una respuesta incorrecta.
                if (responded) errors++;
            } else if (responded) {
                // Una respuesta a otro número cuenta como acierto.
                hits++;
                reactionTimes.push(responseTime);
            } else {
                // No responder a un número distinto del 3 cuenta como omisión.
                omissions++;
            }
        }

        index++;
        showStimulus();
    }

    // Finaliza la prueba, calcula el promedio y presenta los resultados obtenidos.
    // Finaliza la prueba, calcula los resultados y actualiza la tarjeta principal.
    function finishTest() {
        if (!running) return;

        stopTest();

        game.hidden = true;
        results.hidden = false;

        $("#atencion-hits").textContent = hits;
        $("#atencion-omissions").textContent = omissions;
        $("#atencion-errors").textContent = errors;

        const average = reactionTimes.length
            ? Math.round(
                reactionTimes.reduce((sum, value) => sum + value, 0) /
                reactionTimes.length
            )
            : null;

        // Configura la tarjeta compartida con el resultado de Atención.
        const resultCard = $("#atencion-result-card");

        if (resultCard) {
            resultCard.hidden = false;
            const correctInhibitions = TEST_PER_DIGIT - errors;
            const totalStimuli = 9 * TEST_PER_DIGIT;
            const accuracy = ((hits + correctInhibitions) / totalStimuli) * 100;

            resultCard.dataset.status = accuracy >= 90 ? "verde" : "amarillo";

            const eyebrow = resultCard.querySelector(".result-card__eyebrow");
            const status = resultCard.querySelector(".result-card__status");
            const description = resultCard.querySelector(".result-card__description");

            if (eyebrow) eyebrow.textContent = "RESULTADO DE LA PRUEBA";
            if (status) status.textContent = "Tiempo de reacción";
            if (description) {
                description.textContent = "Promedio de tus respuestas correctas";
            }
        }

        $("#atencion-average").textContent = average !== null
            ? `${average} ms`
            : "Sin registros";

        // Explica cada métrica para que los resultados sean comprensibles.
        $("#atencion-summary").textContent =
            `Aciertos: ${hits} respuestas correctas a números distintos del 3.\n` +
            `Omisiones: ${omissions} veces que no se respondió a un número que requería respuesta.\n` +
            `Respuestas incorrectas: ${errors} respuestas al número 3, ante el que había que inhibir la respuesta.\n` +
            `Tiempo medio de reacción: ${average !== null ? `${average} ms` : "sin registros"}.\n\n` +
            "Este ejercicio es orientativo y no determina por sí solo si estás en condiciones de conducir.";

        results.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Conecta los botones con las acciones correspondientes del test.
    $("#atencion-open")?.addEventListener("click", openPanel);

    $("#tests-cta-start")?.addEventListener("click", () => {
        $("#atencion-open")?.click();
    });

    $("#atencion-close")?.addEventListener("click", () => {
        stopTest();
        panel.hidden = true;
    });

    $("#atencion-start")?.addEventListener("click", startTest);
    $("#atencion-restart")?.addEventListener("click", startTest);
    respondButton?.addEventListener("click", respond);

    // Permite responder con la barra espaciadora sin interferir con los botones.
    document.addEventListener("keydown", (event) => {
        if (event.code !== "Space" || !running || panel.hidden) return;

        if (event.target instanceof HTMLElement &&
            event.target.closest("button")) return;

        event.preventDefault();
        respond();
    });

    // Cancela cualquier temporizador si el usuario abandona la página.
    window.addEventListener("pagehide", stopTest);
});
