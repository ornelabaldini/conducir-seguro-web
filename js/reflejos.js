(() => {
    "use strict";

    // REFLEJOS-CONTINUO-45S-V1
    const panel = document.querySelector("#reflejos-panel");
    if (!panel) return;

    const intro = document.querySelector("#reflejos-intro");
    const game = document.querySelector("#reflejos-game");
    const results = document.querySelector("#reflejos-results");
    const target = document.querySelector("#reflejos-target");
    const feedback = document.querySelector("#reflejos-feedback");
    const progress = document.querySelector("#reflejos-progress");
    const clock = document.querySelector("#reflejos-clock");

    const MAX_DURATION = 45000;

    const signals = [
        { type: "go", label: "\u00A1AHORA!", color: "reflejos-target--ready" },
        { type: "go", label: "\u00A1TOC\u00C1!", color: "reflejos-target--ready" },
        { type: "go", label: "\u00A1REACCION\u00C1!", color: "reflejos-target--ready" },
        { type: "stop", label: "AMARILLO \u00B7 NO TOQUES", color: "reflejos-target--caution" },
        { type: "stop", label: "AMARILLO \u00B7 ESPER\u00C1", color: "reflejos-target--caution" }
    ];

    let reactionTimes = [];
    let earlyResponses = 0;
    let errors = 0;
    let missedGreens = 0;
    let correctStops = 0;
    let signalsShown = 0;
    let state = "idle";
    let signalTime = 0;
    let timerId = null;
    let deadlineTimer = null;
    let deadlineAt = 0;
    let currentSignal = null;
    let lastSignalType = "";

    const clearTimer = () => {
        if (timerId !== null) {
            window.clearTimeout(timerId);
            timerId = null;
        }
    };

    const clearDeadline = () => {
        if (deadlineTimer !== null) {
            window.clearInterval(deadlineTimer);
            deadlineTimer = null;
        }
    };

    const scrollToCenter = (element) => {
        window.requestAnimationFrame(() => {
            window.setTimeout(() => {
                if (!panel.hidden && element && !element.hidden) {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                        inline: "nearest"
                    });
                }
            }, 60);
        });
    };

    const resetView = () => {
        clearTimer();
        clearDeadline();

        state = "idle";
        reactionTimes = [];
        earlyResponses = 0;
        errors = 0;
        missedGreens = 0;
        correctStops = 0;
        signalsShown = 0;
        currentSignal = null;
        lastSignalType = "";

        intro.hidden = false;
        game.hidden = true;
        results.hidden = true;

        target.disabled = false;
        target.className = "reflejos-target reflejos-target--waiting";
        target.textContent = "Prepar\u00E1 la vista...";
        feedback.textContent = "Esper\u00E1 a que aparezca la se\u00F1al verde.";
        progress.textContent = "Listo para comenzar";
        clock.textContent = "Duraci\u00F3n: 45 segundos";
    };

    const closePanel = () => {
        resetView();
        panel.hidden = true;

        const allFilter = Array.from(
            document.querySelectorAll(".tests-filter")
        ).find((control) => control.textContent.trim() === "Todos los tests");

        if (allFilter) {
            allFilter.click();
        } else {
            document.querySelectorAll(".test-card").forEach((card) => {
                card.hidden = false;
            });
        }

        document.querySelector(".tests-section")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    };

    const openPanel = () => {
        document.querySelector("#dax-close")?.click();
        document.querySelector("#atencion-close")?.click();

        resetView();
        panel.hidden = false;
        scrollToCenter(intro);
    };

    const chooseSignal = () => {
        let available = signals.filter(
            (signal) => signal.type !== lastSignalType
        );

        if (!available.length) available = signals;

        const signal = available[Math.floor(Math.random() * available.length)];
        lastSignalType = signal.type;
        return signal;
    };

    const showResults = (timeExpired = false) => {
        if (state === "done") return;

        clearTimer();
        clearDeadline();
        state = "done";
        currentSignal = null;

        game.hidden = true;
        intro.hidden = true;
        results.hidden = false;

        const count = reactionTimes.length;
        const average = count
            ? Math.round(
                reactionTimes.reduce((sum, time) => sum + time, 0) / count
            )
            : null;
        const best = count ? Math.min(...reactionTimes) : null;

        document.querySelector("#reflejos-average").textContent =
            average === null ? "\u2014" : `${average} ms`;

        document.querySelector("#reflejos-best").textContent =
            best === null ? "\u2014" : `${best} ms`;

        document.querySelector("#reflejos-rounds").textContent = String(count);
        document.querySelector("#reflejos-early").textContent =
            String(earlyResponses);

        const summary = document.querySelector("#reflejos-summary");

        if (count === 0) {
            summary.textContent = timeExpired
                ? "Terminaron los 45 segundos sin registrar aciertos verdes. Podes repetir la prueba."
                : "No se registraron respuestas verdes validas.";
        } else {
            summary.textContent =
                `Prueba finalizada. Registraste ${count} aciertos verdes, ` +
                `con una reaccion media de ${average} ms y un mejor tiempo de ${best} ms.`;
        }

        let errorNote = results.querySelector("#reflejos-error-note");

        if (!errorNote) {
            errorNote = document.createElement("p");
            errorNote.id = "reflejos-error-note";
            errorNote.className = "reflejos-error-note";

            const heading = results.querySelector("h2");
            if (heading) {
                heading.insertAdjacentElement("afterend", errorNote);
            } else {
                results.prepend(errorNote);
            }
        }

        errorNote.textContent =
            `Errores totales: ${errors}. ` +
            `Verdes perdidas: ${missedGreens}. ` +
            `Amarillas respetadas: ${correctStops}. ` +
            `Respuestas anticipadas: ${earlyResponses}.`;

        scrollToCenter(results);
    };

    const scheduleNext = (delay) => {
        clearTimer();
        timerId = window.setTimeout(() => {
            timerId = null;
            beginRound();
        }, delay);
    };

    const beginRound = () => {
        clearTimer();

        if (state === "done") return;

        if (performance.now() >= deadlineAt) {
            showResults(true);
            return;
        }

        state = "waiting";
        currentSignal = null;

        progress.textContent = `Se\u00F1al ${signalsShown + 1}`;
        feedback.textContent =
            "Verde: toca lo mas rapido posible. Amarillo: no toques.";

        target.disabled = false;
        target.className = "reflejos-target reflejos-target--waiting";
        target.textContent = "PREPARATE";

        const delay = 650 + Math.random() * 1450;

        timerId = window.setTimeout(() => {
            timerId = null;

            if (state !== "waiting") return;

            if (performance.now() >= deadlineAt) {
                showResults(true);
                return;
            }

            currentSignal = chooseSignal();
            state = "ready";
            signalTime = performance.now();
            signalsShown += 1;

            target.className = `reflejos-target ${currentSignal.color}`;
            target.textContent = currentSignal.label;

            if (currentSignal.type === "go") {
                feedback.textContent = "\u00A1Verde! Toca lo mas rapido posible.";
            } else {
                feedback.textContent = "Amarillo: no toques y espera la proxima se\u00F1al.";
            }

            const signalShown = currentSignal;
            const duration = signalShown.type === "stop"
                ? 850 + Math.random() * 450
                : 1450 + Math.random() * 500;

            timerId = window.setTimeout(() => {
                timerId = null;

                if (state !== "ready" || currentSignal !== signalShown) return;

                state = "feedback";
                currentSignal = null;
                target.disabled = true;
                target.className = "reflejos-target reflejos-target--waiting";

                if (signalShown.type === "stop") {
                    correctStops += 1;
                    target.textContent = "\u00A1BIEN!";
                    feedback.textContent = "No tocaste el amarillo. Respuesta correcta.";
                } else {
                    errors += 1;
                    missedGreens += 1;
                    target.textContent = "SE\u00D1AL PERDIDA";
                    feedback.textContent = "No alcanzaste a tocar el verde. Cuenta como error.";
                }

                scheduleNext(300);
            }, duration);
        }, delay);
    };

    const startTest = () => {
        resetView();

        intro.hidden = true;
        results.hidden = true;
        game.hidden = false;

        reactionTimes = [];
        earlyResponses = 0;
        errors = 0;
        missedGreens = 0;
        correctStops = 0;
        signalsShown = 0;
        currentSignal = null;
        lastSignalType = "";

        deadlineAt = performance.now() + MAX_DURATION;
        state = "waiting";

        clock.textContent = "Quedan 45 s";
        feedback.textContent =
            "La prueba comenzo. Verde: toca. Amarillo: no toques.";

        deadlineTimer = window.setInterval(() => {
            const remaining = Math.max(
                0,
                Math.ceil((deadlineAt - performance.now()) / 1000)
            );

            if (state !== "done") {
                clock.textContent = `Quedan ${remaining} s`;
            }

            if (remaining <= 0) {
                showResults(true);
            }
        }, 100);

        scrollToCenter(target);
        beginRound();
    };

    target.addEventListener("click", () => {
        if (state === "waiting") {
            earlyResponses += 1;
            errors += 1;
            clearTimer();

            state = "early";
            target.disabled = true;
            target.className = "reflejos-target reflejos-target--early";
            target.textContent = "\u00A1TE ADELANTASTE!";
            feedback.textContent = "Espera a que aparezca la se\u00F1al.";

            scheduleNext(500);
            return;
        }

        if (state !== "ready" || !currentSignal) return;

        clearTimer();

        if (currentSignal.type === "stop") {
            errors += 1;
            currentSignal = null;
            state = "feedback";
            target.disabled = true;
            target.className = "reflejos-target reflejos-target--early";
            target.textContent = "\u00A1ERA AMARILLO!";
            feedback.textContent = "En amarillo tenias que esperar sin tocar.";

            scheduleNext(400);
            return;
        }

        const elapsed = Math.round(performance.now() - signalTime);
        reactionTimes.push(elapsed);
        currentSignal = null;
        state = "feedback";
        target.disabled = true;
        target.className = "reflejos-target reflejos-target--waiting";
        target.textContent = `${elapsed} ms`;
        feedback.textContent =
            `Reaccion registrada: ${elapsed} ms. Segui atento a la proxima se\u00F1al.`;

        scheduleNext(300);
    });

    document.querySelector("#reflejos-open")?.addEventListener("click", openPanel);
    document.querySelector("#reflejos-close")?.addEventListener("click", closePanel);
    document.querySelector("#reflejos-start")?.addEventListener("click", startTest);
    document.querySelector("#reflejos-restart")?.addEventListener("click", startTest);
    document.querySelector("#reflejos-back")?.addEventListener("click", closePanel);
})();