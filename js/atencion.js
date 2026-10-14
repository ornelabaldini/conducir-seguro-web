document.addEventListener("DOMContentLoaded", () => {
    const panel = document.querySelector("#atencion-panel");
    if (!panel) return;

    const intro = document.querySelector("#atencion-intro");
    const game = document.querySelector("#atencion-game");
    const results = document.querySelector("#atencion-results");
    const symbol = document.querySelector("#atencion-symbol");
    const feedback = document.querySelector("#atencion-feedback");
    const progress = document.querySelector("#atencion-progress");
    const clock = document.querySelector("#atencion-clock");
    const respondButton = document.querySelector("#atencion-respond");

    const TOTAL = 100;
    const INTERVAL = 900;
    const TARGET = "●";
    const DISTRACTORS = ["+", "×", "◆", "○", "△"];
    let sequence = [];
    let index = 0;
    let responded = false;
    let isTarget = false;
    let shownAt = 0;
    let hits = 0;
    let omissions = 0;
    let errors = 0;
    let reactionTimes = [];
    let timer = null;
    let running = false;
    let deadline = 0;

    function stopTest() {
        running = false;
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    }

    function openPanel() {
        stopTest();

        const daxPanel = document.querySelector("#dax-panel");
        if (daxPanel) daxPanel.hidden = true;

        intro.hidden = false;
        game.hidden = true;
        results.hidden = true;
        panel.hidden = false;
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    document.querySelector("#atencion-open")?.addEventListener("click", openPanel);
    document.querySelector("#tests-cta-start")?.addEventListener("click", () => {
        document.querySelector("#atencion-open")?.click();
    });

    document.querySelector("#atencion-close")?.addEventListener("click", () => {
        stopTest();
        panel.hidden = true;
    });

    function createSequence() {
        const items = [];
        let targets = 0;

        for (let i = 0; i < TOTAL; i++) {
            if (targets < 25 && (Math.random() < 0.25 || TOTAL - i <= 25 - targets)) {
                items.push(TARGET);
                targets++;
            } else {
                items.push(DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)]);
            }
        }

        return items;
    }

    function startTest() {
        stopTest();

        const daxPanel = document.querySelector("#dax-panel");
        if (daxPanel) daxPanel.hidden = true;

        panel.hidden = false;
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

        deadline = performance.now() + TOTAL * INTERVAL;
        showStimulus();
        game.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function showStimulus() {
        if (!running) return;

        if (index >= sequence.length || performance.now() >= deadline) {
            finishTest();
            return;
        }

        isTarget = sequence[index] === TARGET;
        responded = false;
        shownAt = performance.now();

        symbol.textContent = sequence[index];
        symbol.style.color = isTarget ? "#15803d" : "#334155";
        progress.textContent = `Estímulo ${index + 1} de ${TOTAL}`;
        clock.textContent = `${Math.max(0, Math.ceil((deadline - shownAt) / 1000))} s`;
        feedback.textContent = "Observá el símbolo.";
        respondButton.disabled = false;

        timer = setTimeout(() => {
            if (!running) return;

            if (isTarget && !responded) omissions++;

            index++;
            showStimulus();
        }, INTERVAL);
    }

    function respond() {
        if (!running || responded) return;

        responded = true;

        if (isTarget) {
            hits++;
            reactionTimes.push(performance.now() - shownAt);
            feedback.textContent = "¡Acierto!";
        } else {
            errors++;
            feedback.textContent = "Respuesta incorrecta.";
        }
    }

    function finishTest() {
        if (!running) return;
        stopTest();

        game.hidden = true;
        results.hidden = false;

        document.querySelector("#atencion-hits").textContent = hits;
        document.querySelector("#atencion-omissions").textContent = omissions;
        document.querySelector("#atencion-errors").textContent = errors;

        const average = reactionTimes.length
            ? `${Math.round(reactionTimes.reduce((sum, value) => sum + value, 0) / reactionTimes.length)} ms`
            : "Sin registros";

        document.querySelector("#atencion-average").textContent = average;

        document.querySelector("#atencion-summary").textContent =
            "Resultado orientativo: revisá los aciertos, las omisiones y las respuestas incorrectas. El resultado no demuestra por sí solo que estés en condiciones de conducir.";
    }

    document.querySelector("#atencion-start").addEventListener("click", startTest);
    document.querySelector("#atencion-restart").addEventListener("click", startTest);
    respondButton.addEventListener("click", respond);

    document.addEventListener("keydown", (event) => {
        if (event.code !== "Space" || !running || panel.hidden) return;
        if (event.target instanceof HTMLElement && event.target.closest("button")) return;
        event.preventDefault();
        respond();
    });
});




