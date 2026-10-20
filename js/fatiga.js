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
        { type: "warning", icon: "!", label: "Senal triangular de advertencia" },
        { type: "speed", icon: "60", label: "Senal circular de velocidad maxima" },
        { type: "stop", icon: "!", label: "Senal octogonal de detencion" },
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
    let startAlertness = null;

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
        roadEvent.hidden = true;
        road?.classList.remove("is-driving");
        respondButton?.classList.remove("fatiga-btn--alert");
    }

    function resetView() {
        intro.hidden = false;
        game.hidden = true;
        results.hidden = true;
        $("#fatiga-final-checkin").hidden = false;
        $("#fatiga-final-results").hidden = true;
        $("#fatiga-start-error").hidden = true;
        $("#fatiga-final-error").hidden = true;
        $("#fatiga-start-alertness").value = "";
        $("#fatiga-final-alertness").value = "";
    }

    function openPanel() {
        stopTest();
        ["#dax-panel", "#atencion-panel", "#reflejos-panel"].forEach(selector => {
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
        $("#fatiga-feedback").textContent = "Senal visible: registrala antes de que desaparezca.";
        respondButton.classList.add("fatiga-btn--alert");

        eventTimer = window.setTimeout(() => {
            if (!running || !eventActive) return;

            omissions++;
            eventActive = false;
            roadEvent.hidden = true;
            respondButton.classList.remove("fatiga-btn--alert");
            $("#fatiga-feedback").textContent = "Senal no registrada. Segui observando la ruta.";
            scheduleEvent();
        }, EVENT_WINDOW);
    }

    function respond() {
        if (!running) return;

        if (!eventActive) {
            errors++;
            $("#fatiga-feedback").textContent =
                "No hay una senal activa. Espera a que aparezca la proxima.";
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
        $("#fatiga-feedback").textContent = "Senal registrada. Manten la atencion en la ruta.";
        scheduleEvent();
    }

    function startTest() {
        const rating = $("#fatiga-start-alertness").value;

        if (!rating) {
            $("#fatiga-start-error").hidden = false;
            $("#fatiga-start-alertness").focus();
            return;
        }

        stopTest();
        hits = 0;
        omissions = 0;
        errors = 0;
        reactionTimes = [];
        startAlertness = Number(rating);
        running = true;
        deadline = performance.now() + DURATION;

        intro.hidden = true;
        results.hidden = true;
        game.hidden = false;
        roadEvent.hidden = true;
        road?.classList.add("is-driving");
        $("#fatiga-progress").textContent = "Observacion continua";
        $("#fatiga-feedback").textContent = "Observa el entorno y espera una senal.";
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
        $("#fatiga-final-checkin").hidden = false;
        $("#fatiga-final-results").hidden = true;
        $("#fatiga-final-alertness").value = "";
        $("#fatiga-final-error").hidden = true;
        results.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function showResults() {
        const finalValue = $("#fatiga-final-alertness").value;

        if (!finalValue) {
            $("#fatiga-final-error").hidden = false;
            $("#fatiga-final-alertness").focus();
            return;
        }

        const finalAlertness = Number(finalValue);
        const average = mean(reactionTimes);
        const midpoint = Math.ceil(reactionTimes.length / 2);
        const first = mean(reactionTimes.slice(0, midpoint));
        const last = mean(reactionTimes.slice(midpoint));
        const delta = finalAlertness - startAlertness;

        $("#fatiga-start-result").textContent = `${startAlertness} / 3`;
        $("#fatiga-final-result").textContent = `${finalAlertness} / 3`;
        $("#fatiga-hits").textContent = hits;
        $("#fatiga-omissions").textContent = omissions;
        $("#fatiga-errors").textContent = errors;
        $("#fatiga-average").textContent = average === null ? "Sin registros" : `${average} ms`;
        $("#fatiga-first").textContent = first === null ? "Sin registros" : `${first} ms`;
        $("#fatiga-last").textContent = last === null ? "Sin registros" : `${last} ms`;

        let comparison = "Tu percepcion de somnolencia se mantuvo igual.";
        if (delta > 0) comparison = `Tu percepcion de somnolencia aumento ${delta} punto(s).`;
        if (delta < 0) comparison = `Tu percepcion de somnolencia disminuyo ${Math.abs(delta)} punto(s).`;
        $("#fatiga-alertness-change").textContent = comparison;

        $("#fatiga-summary").textContent =
            `Durante la simulacion registraste ${hits} senales, omitiste ${omissions} y respondiste sin una senal activa ${errors} vez/veces. Son observaciones de una unica sesion y pueden verse influidas por multiples factores.`;

        $("#fatiga-final-checkin").hidden = true;
        $("#fatiga-final-results").hidden = false;
        $("#fatiga-back").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    $("#fatiga-start")?.addEventListener("click", startTest);
    $("#fatiga-respond")?.addEventListener("click", respond);
    $("#fatiga-final-submit")?.addEventListener("click", showResults);
    $("#fatiga-restart")?.addEventListener("click", startTest);

    document.addEventListener("keydown", event => {
        if (event.code !== "Space" || !running || panel.hidden) return;
        if (event.target instanceof HTMLElement &&
            (event.target.closest("button") || event.target.closest("select"))) return;
        event.preventDefault();
        respond();
    });
});