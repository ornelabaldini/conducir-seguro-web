
(() => {
    "use strict";

    const MAX_DURATION = 45000;

    const panel = document.querySelector("#reflejos-panel");
    if (!panel) return;

    const intro = document.querySelector("#reflejos-intro");
    const game = document.querySelector("#reflejos-game");
    const results = document.querySelector("#reflejos-results");
    const target = document.querySelector("#reflejos-target");
    const feedback = document.querySelector("#reflejos-feedback");
    const progress = document.querySelector("#reflejos-progress");
    const clock = document.querySelector("#reflejos-clock");

    const average = document.querySelector("#reflejos-average");
    const best = document.querySelector("#reflejos-best");
    const rounds = document.querySelector("#reflejos-rounds");
    const early = document.querySelector("#reflejos-early");
    const summary = document.querySelector("#reflejos-summary");

    let state = "idle";
    let reactionTimes = [];
    let anticipations = 0;
    let missed = 0;
    let stimuliShown = 0;
    let signalTime = 0;
    let deadlineAt = 0;
    let trialTimer = null;
    let deadlineTimer = null;
    let clockTimer = null;

    const clearTimers = () => {
        clearTimeout(trialTimer);
        clearTimeout(deadlineTimer);
        clearInterval(clockTimer);
        trialTimer = null;
        deadlineTimer = null;
        clockTimer = null;
    };

    const scrollToCenter = (element) => {
        window.requestAnimationFrame(() => {
            element.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        });
    };

    const resetTarget = () => {
        target.disabled = false;
        target.className =
            "reflejos-target reflejos-target--waiting";
        target.textContent = "Esperá la señal...";
    };

    const closePanel = () => {
        clearTimers();
        state = "idle";
        panel.hidden = true;

        document.querySelector(".tests-section")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    };

    const openPanel = () => {
        clearTimers();
        state = "idle";

        document.querySelector("#dax-close")?.click();
        document.querySelector("#atencion-close")?.click();

        intro.hidden = false;
        game.hidden = true;
        results.hidden = true;
        panel.hidden = false;

        scrollToCenter(intro);
    };

    const showResults = () => {
        if (state === "done") return;

        if (state === "ready") missed++;

        clearTimers();
        state = "done";

        game.hidden = true;
        results.hidden = false;

        const count = reactionTimes.length;

        const averageTime = count
            ? Math.round(
                reactionTimes.reduce((sum, value) => sum + value, 0) / count
            )
            : null;

        const bestTime = count
            ? Math.min(...reactionTimes)
            : null;

        average.textContent =
            averageTime === null ? "—" : `${averageTime} ms`;

        best.textContent =
            bestTime === null ? "—" : `${bestTime} ms`;

        rounds.textContent = String(count);
        early.textContent = String(anticipations);

        summary.textContent =
            `Estímulos presentados: ${stimuliShown}. ` +
            `Respuestas registradas: ${count}. ` +
            `Estímulos sin respuesta: ${missed}. ` +
            `Respuestas anticipadas: ${anticipations}.`;
    };

    const scheduleNext = () => {
        if (state === "done") return;

        state = "waiting";
        resetTarget();

        feedback.textContent =
            "Esperá a que aparezca la señal verde.";

        const delay = 1000 + Math.random() * 2000;

        trialTimer = window.setTimeout(() => {
            trialTimer = null;

            if (state === "done") return;

            if (performance.now() >= deadlineAt) {
                showResults();
                return;
            }

            state = "ready";
            stimuliShown++;
            signalTime = performance.now();

            progress.textContent = `Estímulo ${stimuliShown}`;
            target.className =
                "reflejos-target reflejos-target--ready";
            target.textContent = "¡AHORA!";
            feedback.textContent =
                "¡Respondé lo más rápido posible!";
        }, delay);
    };

    const startTest = () => {
        clearTimers();

        reactionTimes = [];
        anticipations = 0;
        missed = 0;
        stimuliShown = 0;

        intro.hidden = true;
        results.hidden = true;
        game.hidden = false;

        state = "waiting";
        deadlineAt = performance.now() + MAX_DURATION;

        clock.textContent = "Quedan 45 s";
        progress.textContent = "Preparado";
        feedback.textContent =
            "Esperá a que aparezca la señal verde.";

        resetTarget();

        deadlineTimer = window.setTimeout(showResults, MAX_DURATION);

        clockTimer = window.setInterval(() => {
            const remaining = Math.max(
                0,
                Math.ceil((deadlineAt - performance.now()) / 1000)
            );

            clock.textContent = `Quedan ${remaining} s`;
        }, 200);

        scrollToCenter(target);
        scheduleNext();
    };

    target.addEventListener("click", () => {
        if (state === "waiting") {
            anticipations++;
            feedback.textContent =
                "Te adelantaste. Esperá la señal verde.";
            return;
        }

        if (state !== "ready") return;

        const elapsed = Math.round(
            performance.now() - signalTime
        );

        reactionTimes.push(elapsed);
        state = "feedback";

        target.className =
            "reflejos-target reflejos-target--waiting";
        target.textContent = `${elapsed} ms`;

        feedback.textContent =
            `Respuesta registrada: ${elapsed} ms.`;

        scheduleNext();
    });

    document.querySelector("#reflejos-open")
        ?.addEventListener("click", openPanel);

    document.querySelector("#reflejos-close")
        ?.addEventListener("click", closePanel);

    document.querySelector("#reflejos-start")
        ?.addEventListener("click", startTest);

    document.querySelector("#reflejos-restart")
        ?.addEventListener("click", startTest);

    document.querySelector("#reflejos-back")
        ?.addEventListener("click", closePanel);
})();
