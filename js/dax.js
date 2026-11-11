
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

        const distractors = ["B", "C", "D"];

        return letters.map(letter =>
            letter ?? distractors[Math.floor(Math.random() * distractors.length)]
        );
    }

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

    function finishTest() {
        if (!running) return;

        stopTest();

        game.hidden = true;
        results.hidden = false;

        document.querySelector("#dax-hits").textContent = hits;
        document.querySelector("#dax-omissions").textContent = omissions;
        document.querySelector("#dax-errors").textContent = errors;

        const average = reactionTimes.length
            ? `${Math.round(
                reactionTimes.reduce((sum, value) => sum + value, 0) /
                reactionTimes.length
            )} ms`
            : "Sin registros";

        document.querySelector("#dax-average").textContent = average;

        const summary = document.querySelector("#dax-summary");

        summary.textContent = errors > 0 || omissions > 0
            ? "Revisá los errores y las omisiones. Repetir el ejercicio en condiciones tranquilas puede ayudarte a observar tus respuestas."
            : "En esta ronda no registraste errores ni omisiones. Este resultado no demuestra por sí solo que estés en condiciones de conducir.";
    }

    document.querySelector("#dax-start").addEventListener("click", startTest);
    document.querySelector("#dax-restart").addEventListener("click", startTest);
    respondButton.addEventListener("click", respond);

    document.addEventListener("keydown", event => {
        if (event.code !== "Space" || !running || panel.hidden) return;

        event.preventDefault();
        respond();
    });
});
