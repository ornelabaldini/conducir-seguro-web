
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

    const PRACTICE_PER_DIGIT = 1;
    const TEST_PER_DIGIT = 4;
    const DIGIT_TIME = 700;
    const MASK_TIME = 600;
    const NO_GO_DIGIT = 3;
    const FONT_SIZES = [8, 10, 12, 14, 16];

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

    function stopTest() {
        running = false;

        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    }

    function shuffle(items) {
        const result = [...items];

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }

        return result;
    }

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

        timer = setTimeout(() => {
            if (!running) return;

            symbol.textContent = "";

            timer = setTimeout(completeTrial, MASK_TIME);
        }, DIGIT_TIME);
    }

    function respond() {
        if (!running || responded) return;

        responded = true;
        responseTime = performance.now() - shownAt;

        respondButton.style.transition = "transform 120ms ease, filter 120ms ease";
        respondButton.style.transform = "scale(0.94)";
        respondButton.style.filter = "brightness(0.75)";

        setTimeout(() => {
            respondButton.style.transform = "";
            respondButton.style.filter = "";
        }, 180);
    }

    function finishTest() {
        if (!running) return;

        stopTest();

        game.hidden = true;
        results.hidden = false;

        $("#atencion-hits").textContent = hits;
        $("#atencion-omissions").textContent = omissions;
        $("#atencion-errors").textContent = errors;

        const average = reactionTimes.length
            ? `${Math.round(
                reactionTimes.reduce((sum, value) => sum + value, 0) /
                reactionTimes.length
            )} ms`
            : "Sin registros";

        $("#atencion-average").textContent = average;

        $("#atencion-summary").textContent =
            "Revisá tus aciertos, omisiones, respuestas incorrectas y tiempo medio de reacción. El resultado es orientativo y no determina por sí solo si estás en condiciones de conducir.";
    }

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

    document.addEventListener("keydown", (event) => {
        if (event.code !== "Space" || !running || panel.hidden) return;

        if (event.target instanceof HTMLElement &&
            event.target.closest("button")) return;

        event.preventDefault();
        respond();
    });

    window.addEventListener("pagehide", stopTest);
});
