
document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector) => document.querySelector(selector);
    const panel = $("#memoria-panel");
    if (!panel) return;

    const intro = $("#memoria-intro");
    const study = $("#memoria-study");
    const game = $("#memoria-game");
    const results = $("#memoria-results");
    const studyGrid = $("#memoria-study-grid");
    const choiceGrid = $("#memoria-choice-grid");
    const countdown = $("#memoria-countdown");
    const selectionCount = $("#memoria-selection-count");
    const feedback = $("#memoria-feedback");

    const BLOCK_COUNT = 9;
    const MIN_SPAN = 2;
    const MAX_SPAN = 8;
    const TRIALS_PER_LEVEL = 1;
    const FLASH_TIME = 700;
    const PAUSE_TIME = 350;
    const FEEDBACK_TIME = 1200;

    let sequence = [];
    let userSequence = [];
    let level = MIN_SPAN;
    let attempts = 0;
    let levelAttempts = 0;
    let levelSuccesses = 0;
    let correctSequences = 0;
    let failedSequences = 0;
    let maxSpan = 0;
    let timer = null;
    let running = false;
    let acceptingInput = false;

    function clearTimer() {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    }

    function stopTest() {
        clearTimer();
        running = false;
        acceptingInput = false;
    }

    function resetPanel() {
        stopTest();

        intro.hidden = false;
        study.hidden = true;
        game.hidden = true;
        results.hidden = true;

        studyGrid.replaceChildren();
        choiceGrid.replaceChildren();

        feedback.textContent = "";
        countdown.textContent = "Prepará tu atención";
        selectionCount.textContent = "Secuencia: 0";

        sequence = [];
        userSequence = [];
        level = MIN_SPAN;
        attempts = 0;
        levelAttempts = 0;
        levelSuccesses = 0;
        correctSequences = 0;
        failedSequences = 0;
        maxSpan = 0;
    }

    function openPanel() {
        resetPanel();
        panel.hidden = false;
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function createBoard(container, interactive) {
        container.replaceChildren();

        for (let index = 0; index < BLOCK_COUNT; index++) {
            const block = document.createElement(interactive ? "button" : "div");

            block.className = "memoria-symbol memoria-block";
            block.dataset.index = index;
            block.setAttribute("aria-label", "Bloque " + (index + 1));

            if (interactive) {
                block.type = "button";
                block.addEventListener("click", () => selectBlock(index));
            }

            container.appendChild(block);
        }
    }

    function showBlock(container, index, active) {
        const block = container.children[index];
        if (block) {
            block.classList.toggle("is-active", active);
        }
    }

    function generateSequence(length) {
        const values = Array.from(
            { length: BLOCK_COUNT },
            (_, index) => index
        );

        for (let i = values.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [values[i], values[j]] = [values[j], values[i]];
        }

        return values.slice(0, length);
    }

    function startTest() {
        resetPanel();

        intro.hidden = true;
        study.hidden = false;
        running = true;

        createBoard(studyGrid, false);
        createBoard(choiceGrid, true);

        startLevel();
    }

    function startLevel() {
        if (!running) return;

        sequence = generateSequence(level);
        userSequence = [];
        acceptingInput = false;

        study.hidden = false;
        game.hidden = true;

        countdown.textContent = "Secuencia de " + level + " bloques";
        feedback.textContent = "";
        selectionCount.textContent = "Secuencia: 0 de " + level;

        let position = 0;

        function flashNext() {
            if (!running) return;

            if (position >= sequence.length) {
                timer = setTimeout(() => {
                    if (!running) return;

                    study.hidden = true;
                    game.hidden = false;
                    acceptingInput = true;
                    feedback.textContent = "Reproducí la secuencia en el mismo orden.";
                }, PAUSE_TIME);

                return;
            }

            const index = sequence[position];
            showBlock(studyGrid, index, true);

            timer = setTimeout(() => {
                if (!running) return;

                showBlock(studyGrid, index, false);
                position++;

                timer = setTimeout(flashNext, PAUSE_TIME);
            }, FLASH_TIME);
        }

        flashNext();
    }

    function selectBlock(index) {
        if (!running || !acceptingInput) return;

        const expected = sequence[userSequence.length];

        userSequence.push(index);
        selectionCount.textContent =
            "Secuencia: " + userSequence.length + " de " + level;

        if (index !== expected) {
            finishAttempt(false);
            return;
        }

        showBlock(choiceGrid, index, true);

        if (userSequence.length === sequence.length) {
            finishAttempt(true);
        }
    }

    function finishAttempt(success) {
        acceptingInput = false;
        attempts++;
        levelAttempts++;

        if (success) {
            correctSequences++;
            levelSuccesses++;
            maxSpan = Math.max(maxSpan, level);
            feedback.textContent = "¡Correcto! Recordaste toda la secuencia.";
        } else {
            failedSequences++;
            feedback.textContent = "La secuencia no fue correcta.";
        }

        timer = setTimeout(() => {
            if (!running) return;

            choiceGrid.querySelectorAll(".memoria-block").forEach((block) => {
                block.classList.remove("is-active");
            });

            if (levelAttempts < TRIALS_PER_LEVEL) {
                startLevel();
                return;
            }

            if (levelSuccesses === 0) {
                showResults();
                return;
            }

            level++;
            levelAttempts = 0;
            levelSuccesses = 0;

            if (level > MAX_SPAN) {
                showResults();
            } else {
                startLevel();
            }
        }, FEEDBACK_TIME);
    }
    // Finaliza el ejercicio y actualiza la tarjeta principal de resultados.
    function showResults() {
        if (!running) return;

        stopTest();

        $("#memoria-hits").textContent = correctSequences;
        $("#memoria-omissions").textContent = failedSequences;
        $("#memoria-errors").textContent = attempts;
        $("#memoria-accuracy").textContent = maxSpan + " bloques";

        // Configura la tarjeta compartida con la secuencia máxima alcanzada.
        const resultCard = $("#memoria-result-card");

        if (resultCard) {
            resultCard.hidden = false;
            resultCard.dataset.status = "azul";

            const eyebrow = resultCard.querySelector(".result-card__eyebrow");
            const status = resultCard.querySelector(".result-card__status");
            const description = resultCard.querySelector(".result-card__description");

            if (eyebrow) eyebrow.textContent = "RESULTADO DE LA PRUEBA";
            if (status) status.textContent = maxSpan + " bloques";
            if (description) {
                description.textContent = "Secuencia más larga reproducida correctamente";
            }
        }

        $("#memoria-summary").textContent =
            "Tu secuencia más larga reproducida correctamente fue de " +
            maxSpan +
            " bloques. Este resultado describe únicamente tu rendimiento en este ejercicio.";

        study.hidden = true;
        game.hidden = true;
        results.hidden = false;
    }

    $("#memoria-open")?.addEventListener("click", openPanel);

    $("#memoria-close")?.addEventListener("click", () => {
        resetPanel();
        panel.hidden = true;
    });

    $("#memoria-start")?.addEventListener("click", startTest);
    $("#memoria-restart")?.addEventListener("click", startTest);

    window.addEventListener("pagehide", stopTest);
});
