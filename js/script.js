document.addEventListener("DOMContentLoaded", () => {
    console.log("Conducir Seguro cargado correctamente");

    const filtros = document.querySelectorAll(".tests-filter");
    const tarjetas = Array.from(document.querySelectorAll(".test-card"));
    const grilla = document.querySelector(".tests-grid");
    const botonOrden = document.querySelector(".tests-sort");

    const categorias = {
        "Atención": "atencion",
        "Reflejos": "reflejos",
        "Estado de alerta": "alerta",
        "Memoria": "memoria"
    };

    // Filtros por categoría
    filtros.forEach((filtro) => {
        filtro.addEventListener("click", () => {
            const nombre = filtro.textContent.trim();
            const categoria = categorias[nombre];

            filtros.forEach((boton) => boton.classList.remove("active"));
            filtro.classList.add("active");

            tarjetas.forEach((tarjeta) => {
                const coincide =
                    nombre === "Todos los tests" ||
                    tarjeta.dataset.category === categoria;

                tarjeta.hidden = !coincide;
            });
        });
    });

    // Ordenamiento por fecha
    if (grilla && botonOrden) {
        let orden = "recientes";

        const ordenarTarjetas = () => {
            const ordenadas = [...tarjetas].sort((a, b) => {
                const fechaA = Date.parse(a.dataset.date || "");
                const fechaB = Date.parse(b.dataset.date || "");
                const validaA = Number.isFinite(fechaA);
                const validaB = Number.isFinite(fechaB);

                if (validaA && validaB) {
                    return orden === "recientes"
                        ? fechaB - fechaA
                        : fechaA - fechaB;
                }

                if (validaA) return -1;
                if (validaB) return 1;

                return tarjetas.indexOf(a) - tarjetas.indexOf(b);
            });

            ordenadas.forEach((tarjeta) => grilla.appendChild(tarjeta));

            botonOrden.innerHTML =
                (orden === "recientes" ? "Más recientes" : "Más antiguos") +
                ' <span>⌄</span>';
        };

        ordenarTarjetas();

        botonOrden.addEventListener("click", () => {
            orden = orden === "recientes" ? "antiguos" : "recientes";
            ordenarTarjetas();
        });
    }
});


// INTEGRACION-FILTROS-TESTS-ACTIVOS
// Al filtrar u ordenar, cerramos el test abierto para detener su ejecucion
// y devolver el foco a la grilla antes de aplicar el cambio.
document.addEventListener("DOMContentLoaded", () => {
    const cerrarTestsAbiertos = () => {
        const abiertos = [
            ["#dax-panel", "#dax-close"],
            ["#atencion-panel", "#atencion-close"],
            ["#reflejos-panel", "#reflejos-close"],
            ["#fatiga-panel", "#fatiga-open"],
            ["#memoria-panel", "#memoria-close"]
        ];

        abiertos.forEach(([panelSelector, closeSelector]) => {
            const panel = document.querySelector(panelSelector);
            if (panel && !panel.hidden) {
                document.querySelector(closeSelector)?.click();
            }
        });
    };

    document.querySelectorAll(".tests-filter, .tests-sort").forEach((control) => {
        control.addEventListener("click", cerrarTestsAbiertos, true);
    });
});