
document.addEventListener("DOMContentLoaded", () => {
    const $ = selector => document.querySelector(selector);
    const panel = $("#fatiga-panel");
    if (!panel) return;

    const intro = $("#fatiga-intro");
    const game = $("#fatiga-game");
    const results = $("#fatiga-results");
    const stimulus = $("#fatiga-stimulus");
    const respondButton = $("#fatiga-respond");

    const DURATION = 60000;
    const STIMULUS_MIN = 1500;
    const STIMULUS_MAX = 3500;
    const STIMULUS_WINDOW = 1500;

    let running = false;
    let deadline = 0;
    let eventTimer = null;
    let clockTimer = null;
    let eventActive = false;
    let eventShownAt = 0;
    let hits = 0;
    let omissions = 0;
    let errors = 0;
    let reactionTimes = [];

    function clearTimers() {
        if (eventTimer !== null) {
            clearTimeout(eventTimer);
            eventTimer = null;
        }

        if (clockTimer !== null) {
            clearInterval(clockTimer);
            clockTimer = null;
        }
    }

    function stopTest() {
        running = false;
        clearTimers();
        eventActive = false;

        if (stimulus) stimulus.hidden = true;
        respondButton?.classList.remove("fatiga-btn--alert");
    }

    function resetView() {
        intro.hidden = false;
        game.hidden = true;
        results.hidden = true;

        const finalResults = $("#fatiga-final-results");
        if (finalResults) finalResults.hidden = true;
    }

    function openPanel() {
        stopTest();

        ["#dax-panel", "#atencion-panel", "#reflejos-panel", "#memoria-panel"].forEach(selector => {
            const other = $(selector);
            if (other) other.hidden = true;
        });

        resetView();
        panel.hidden = false;
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    $("#fatiga-open")?.addEventListener("click", openPanel);

    $("#fatiga-close")?.addEventListener("click", () => {
        stopTest();
        panel.hidden = true;
    });

    $("#fatiga-back")?.addEventListener("click", () => {
        stopTest();
        panel.hidden = true;
        $(".tests-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    function updateClock() {
        if (!running) return;

        const remaining = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));

        $("#fatiga-clock").textContent =
            `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;

        if (remaining <= 0) finishTest();
    }

    function scheduleStimulus() {
        if (!running) return;

        const delay = STIMULUS_MIN + Math.random() * (STIMULUS_MAX - STIMULUS_MIN);

        eventTimer = window.setTimeout(showStimulus, delay);
    }

    function showStimulus() {
        if (!running) return;

        if (performance.now() >= deadline) {
            finishTest();
            return;
        }

        eventActive = true;
        eventShownAt = performance.now();
        stimulus.hidden = false;

        $("#fatiga-progress").textContent = "Estímulo visible";
        $("#fatiga-feedback").textContent = "¡Respondé ahora!";

        respondButton.classList.add("fatiga-btn--alert");

        eventTimer = window.setTimeout(() => {
            if (!running || !eventActive) return;

            omissions++;
            eventActive = false;
            stimulus.hidden = true;
            respondButton.classList.remove("fatiga-btn--alert");

            $("#fatiga-progress").textContent = "Esperando estímulo";
            $("#fatiga-feedback").textContent = "No hubo respuesta. Continuá atento.";

            scheduleStimulus();
        }, STIMULUS_WINDOW);
    }

    function respond() {
        if (!running) return;

        if (!eventActive) {
            errors++;

            $("#fatiga-feedback").textContent =
                "Respuesta anticipada. Esperá a que aparezca el estímulo.";

            return;
        }

        hits++;
        reactionTimes.push(Math.round(performance.now() - eventShownAt));
        eventActive = false;

        if (eventTimer !== null) {
            clearTimeout(eventTimer);
            eventTimer = null;
        }

        stimulus.hidden = true;
        respondButton.classList.remove("fatiga-btn--alert");

        $("#fatiga-progress").textContent = "Esperando estímulo";
        $("#fatiga-feedback").textContent = "Respuesta registrada. Continuá atento.";

        scheduleStimulus();
    }

    function startTest() {
        stopTest();

        hits = 0;
        omissions = 0;
        errors = 0;
        reactionTimes = [];

        running = true;
        deadline = performance.now() + DURATION;

        intro.hidden = true;
        results.hidden = true;
        game.hidden = false;

        const finalResults = $("#fatiga-final-results");
        if (finalResults) finalResults.hidden = true;

        stimulus.hidden = true;

        $("#fatiga-progress").textContent = "Esperando estímulo";
        $("#fatiga-feedback").textContent = "Mantené la atención y esperá.";

        respondButton.classList.remove("fatiga-btn--alert");

        updateClock();

        if (running) {
            clockTimer = window.setInterval(updateClock, 100);
            scheduleStimulus();
        }

        window.setTimeout(() => {
            if (running && !panel.hidden) {
                game.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 100);
    }

    function mean(values) {
        return values.length
            ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
            : null;
    }

    function finishTest() {
        if (!running) return;

        if (eventActive) omissions++;

        stopTest();

        game.hidden = true;
        results.hidden = false;

        showResults();

        results.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function showResults() {
        const midpoint = Math.ceil(reactionTimes.length / 2);
        const average = mean(reactionTimes);
        const first = mean(reactionTimes.slice(0, midpoint));
        const last = mean(reactionTimes.slice(midpoint));

        $("#fatiga-hits").textContent = hits;
        $("#fatiga-omissions").textContent = omissions;
        $("#fatiga-errors").textContent = errors;

        $("#fatiga-average").textContent =
            average === null ? "Sin registros" : `${average} ms`;

        $("#fatiga-first").textContent =
            first === null ? "Sin registros" : `${first} ms`;

        $("#fatiga-last").textContent =
            last === null ? "Sin registros" : `${last} ms`;

        $("#fatiga-summary").textContent =
            `Registraste ${hits} respuestas, ${omissions} omisiones y ${errors} respuestas anticipadas. Los tiempos corresponden únicamente a esta sesión y no permiten diagnosticar fatiga.`;

        const finalResults = $("#fatiga-final-results");
        if (finalResults) finalResults.hidden = false;
    }

    $("#fatiga-start")?.addEventListener("click", startTest);
    $("#fatiga-respond")?.addEventListener("click", respond);
    $("#fatiga-restart")?.addEventListener("click", startTest);

    document.addEventListener("keydown", event => {
        if (event.code !== "Space" || !running || panel.hidden) return;

        if (
            event.target instanceof HTMLElement &&
            (event.target.closest("button") || event.target.closest("select"))
        ) {
            return;
        }

        event.preventDefault();
        respond();
    });
});
