document.addEventListener("DOMContentLoaded", () => {
    const $ = selector => document.querySelector(selector);
    const panel = $("#fatiga-panel");
    if (!panel) return;

    const intro = $("#fatiga-intro");
    const game = $("#fatiga-game");
    const results = $("#fatiga-results");
    const road = $(".fatiga-road");
    const roadEvent = $("#fatiga-event");
    const eventSign = $("#fatiga-event-sign");
    const eventIcon = $("#fatiga-event-icon");
    const respondButton = $("#fatiga-respond");

    const DURATION = 30000;
    const EVENT_MIN = 3000;
    const EVENT_MAX = 6000;
    const EVENT_WINDOW = 2600;

    const EVENTS = [
        { type: "warning", icon: "!", label: "Señal triangular de advertencia" },
        { type: "speed", icon: "60", label: "Señal circular de velocidad máxima" },
        { type: "stop", icon: "!", label: "Señal octogonal de detención" },
        { type: "curve", icon: "↗", label: "Advertencia de curva" }
    ];

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

        if (roadEvent) roadEvent.hidden = true;
        road?.classList.remove("is-driving");
        respondButton?.classList.remove("fatiga-btn--alert");
    }

    function resetView() {
        intro.hidden = false;
        game.hidden = true;
        results.hidden = true;

        const finalResults = $("#fatiga-final-results");
        if (finalResults) finalResults.hidden = true;

        const comparison = $(".fatiga-alertness-comparison");
        if (comparison) comparison.hidden = true;
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

    function scheduleEvent() {
        if (!running) return;

        const delay = EVENT_MIN + Math.random() * (EVENT_MAX - EVENT_MIN);
        eventTimer = window.setTimeout(showEvent, delay);
    }

    function showEvent() {
        if (!running) return;

        if (performance.now() >= deadline) {
            finishTest();
            return;
        }

        eventActive = true;
        eventShownAt = performance.now();

        const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];

        eventSign.className = `fatiga-sign fatiga-sign--${event.type}`;
        eventIcon.textContent = event.icon;
        roadEvent.setAttribute("aria-label", event.label);
        roadEvent.hidden = false;

        $("#fatiga-feedback").textContent =
            "Señal visible: registrala antes de que desaparezca.";

        respondButton.classList.add("fatiga-btn--alert");

        eventTimer = window.setTimeout(() => {
            if (!running || !eventActive) return;

            omissions++;
            eventActive = false;
            roadEvent.hidden = true;
            respondButton.classList.remove("fatiga-btn--alert");

            $("#fatiga-feedback").textContent =
                "Señal no registrada. Seguí observando la ruta.";

            scheduleEvent();
        }, EVENT_WINDOW);
    }

    function respond() {
        if (!running) return;

        if (!eventActive) {
            errors++;

            $("#fatiga-feedback").textContent =
                "No hay una señal activa. Esperá a que aparezca la próxima.";

            return;
        }

        hits++;
        reactionTimes.push(Math.round(performance.now() - eventShownAt));
        eventActive = false;

        if (eventTimer !== null) {
            clearTimeout(eventTimer);
            eventTimer = null;
        }

        roadEvent.hidden = true;
        respondButton.classList.remove("fatiga-btn--alert");

        $("#fatiga-feedback").textContent =
            "Señal registrada. Mantené la atención en la ruta.";

        scheduleEvent();
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

        const comparison = $(".fatiga-alertness-comparison");
        if (comparison) comparison.hidden = true;

        roadEvent.hidden = true;
        road?.classList.add("is-driving");

        $("#fatiga-progress").textContent = "Observación continua";
        $("#fatiga-feedback").textContent =
            "Observá el entorno y esperá una señal.";

        respondButton.classList.remove("fatiga-btn--alert");

        updateClock();

        if (running) {
            clockTimer = window.setInterval(updateClock, 250);
            scheduleEvent();
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
        const average = mean(reactionTimes);
        const midpoint = Math.ceil(reactionTimes.length / 2);
        const first = mean(reactionTimes.slice(0, midpoint));
        const last = mean(reactionTimes.slice(midpoint));

        const comparison = $(".fatiga-alertness-comparison");
        if (comparison) comparison.hidden = true;

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
            `Durante la simulación registraste ${hits} señales, omitiste ${omissions} y respondiste sin una señal activa ${errors} veces. Estos datos corresponden a una única sesión y pueden verse influidos por múltiples factores.`;

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