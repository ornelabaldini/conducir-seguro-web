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
    const finishButton = $("#memoria-finish");
    const feedback = $("#memoria-feedback");

    const SYMBOLS = ["★", "◆", "●", "▲", "♥", "☀", "☂", "♫", "✿", "☕", "⚽", "✈"];
    const STUDY_COUNT = 6;
    const STUDY_SECONDS = 12;

    let targets = [];
    let choices = [];
    let selected = new Set();
    let timer = null;
    let running = false;

    function stopTimer() {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
        running = false;
    }

    function shuffle(items) {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function resetPanel() {
        stopTimer();
        intro.hidden = false;
        study.hidden = true;
        game.hidden = true;
        results.hidden = true;
        studyGrid.replaceChildren();
        choiceGrid.replaceChildren();
        feedback.textContent = "";
        selected.clear();
        targets = [];
        choices = [];
    }

    function openPanel() {
        resetPanel();
        panel.hidden = false;
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    $("#memoria-open")?.addEventListener("click", openPanel);
    $("#memoria-close")?.addEventListener("click", () => {
        resetPanel();
        panel.hidden = true;
    });

    function renderStudy() {
        studyGrid.replaceChildren();
        targets.forEach((symbol) => {
            const item = document.createElement("div");
            item.className = "memoria-symbol";
            item.textContent = symbol;
            item.setAttribute("aria-label", "Símbolo para memorizar");
            studyGrid.appendChild(item);
        });
    }

    function startTest() {
        resetPanel();
        intro.hidden = true;
        study.hidden = false;
        running = true;

        targets = shuffle(SYMBOLS).slice(0, STUDY_COUNT);
        renderStudy();

        let remaining = STUDY_SECONDS;
        countdown.textContent = remaining + " segundos";

        timer = setInterval(() => {
            remaining -= 1;
            countdown.textContent = remaining + " segundos";

            if (remaining <= 0) {
                stopTimer();
                study.hidden = true;
                startRecognition();
            }
        }, 1000);
    }

    function startRecognition() {
        game.hidden = false;
        const distractors = shuffle(SYMBOLS.filter((symbol) => !targets.includes(symbol))).slice(0, 6);
        choices = shuffle([
            ...targets.map((symbol) => ({ symbol, target: true })),
            ...distractors.map((symbol) => ({ symbol, target: false }))
        ]);

        choiceGrid.replaceChildren();

        choices.forEach((choice, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "memoria-symbol memoria-choice";
            button.textContent = choice.symbol;
            button.setAttribute("aria-pressed", "false");
            button.setAttribute("aria-label", "Símbolo " + (index + 1));

            button.addEventListener("click", () => {
                if (!running) return;

                if (selected.has(index)) {
                    selected.delete(index);
                    button.classList.remove("is-selected");
                    button.setAttribute("aria-pressed", "false");
                } else {
                    selected.add(index);
                    button.classList.add("is-selected");
                    button.setAttribute("aria-pressed", "true");
                }

                selectionCount.textContent = selected.size + " seleccionados";
            });

            choiceGrid.appendChild(button);
        });

        selected.clear();
        selectionCount.textContent = "0 seleccionados";
        running = true;
    }

    function showResults() {
        if (!running) return;
        running = false;

        let hits = 0;
        let omissions = 0;
        let errors = 0;

        choices.forEach((choice, index) => {
            const button = choiceGrid.children[index];
            button.disabled = true;

            if (choice.target && selected.has(index)) {
                hits++;
                button.classList.add("is-correct");
            } else if (choice.target && !selected.has(index)) {
                omissions++;
                button.classList.add("is-missed");
            } else if (!choice.target && selected.has(index)) {
                errors++;
                button.classList.add("is-error");
            }
        });

        const accuracy = Math.round((hits / STUDY_COUNT) * 100);

        $("#memoria-hits").textContent = hits;
        $("#memoria-omissions").textContent = omissions;
        $("#memoria-errors").textContent = errors;
        $("#memoria-accuracy").textContent = accuracy + "%";

        $("#memoria-summary").textContent =
            hits === STUDY_COUNT && errors === 0
                ? "¡Excelente! Reconociste todos los símbolos sin marcar distractores."
                : "Reconociste " + hits + " de " + STUDY_COUNT +
                  " símbolos. Podés repetir la prueba para practicar.";

        game.hidden = true;
        results.hidden = false;
    }

    $("#memoria-start")?.addEventListener("click", startTest);
    finishButton?.addEventListener("click", showResults);
    $("#memoria-restart")?.addEventListener("click", startTest);

    window.addEventListener("pagehide", stopTimer);
});