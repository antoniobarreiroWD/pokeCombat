document.getElementById('iniciarCombateAleatorio').addEventListener('click', () => iniciarCombate(true));
document.getElementById('iniciarCombateSeleccionado').addEventListener('click', () => iniciarCombate(false));

function obtenerPokemonAleatorio() {
    return Math.floor(Math.random() * 898) + 1;
}

function mostrarInformacionPokemon(id, pokemon) {
    document.getElementById(`nombrePokemon${id}`).textContent = pokemon.name.toUpperCase();
    document.getElementById(`imagenPokemon${id}`).src = pokemon.sprites.front_default;
    document.getElementById(`hpPokemon${id}`).textContent = `HP: ${pokemon.stats[0].base_stat}`;
}

function calcularDaño(ataque, defensa) {
    return Math.max(ataque - defensa, 1);
}

let chart; 

function iniciarCombate(aleatorio) {
    let idPokemon1, idPokemon2;
    if (aleatorio) {
        idPokemon1 = obtenerPokemonAleatorio();
        idPokemon2 = obtenerPokemonAleatorio();
    } else {
        idPokemon1 = document.getElementById('pokemon1Nombre').value.toLowerCase();
        idPokemon2 = document.getElementById('pokemon2Nombre').value.toLowerCase();
        if (!idPokemon1 || !idPokemon2) {
            alert('Por favor, introduce los nombres o IDs de ambos Pokémon.');
            return;
        }
    }

    Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${idPokemon1}`).then(res => res.json()),
        fetch(`https://pokeapi.co/api/v2/pokemon/${idPokemon2}`).then(res => res.json())
    ]).then(pokemons => {
        mostrarInformacionPokemon(1, pokemons[0]);
        mostrarInformacionPokemon(2, pokemons[1]);

        const hpInicial1 = pokemons[0].stats[0].base_stat;
        const hpInicial2 = pokemons[1].stats[0].base_stat;

        prepararGrafico(hpInicial1, hpInicial2, pokemons[0].name, pokemons[1].name);

        realizarTurno(hpInicial1, hpInicial2, pokemons, 0);
    }).catch(error => {
        alert('Ha ocurrido un error al obtener los datos de los Pokémon. Asegúrate de que los nombres o IDs sean correctos.');
        console.error('Error al obtener datos de Pokémon:', error);
    });
}

function realizarTurno(hp1, hp2, pokemons, turno) {
    if (hp1 <= 0 || hp2 <= 0) {
        console.log('Combate terminado');
        return; 
    }

    setTimeout(() => {
        let daño;
        if (turno % 2 === 0) {
            daño = calcularDaño(pokemons[0].stats[1].base_stat, pokemons[1].stats[2].base_stat);
            hp2 = Math.max(0, hp2 - daño);
        } else {
            daño = calcularDaño(pokemons[1].stats[1].base_stat, pokemons[0].stats[2].base_stat);
            hp1 = Math.max(0, hp1 - daño);
        }

        actualizarGrafico(hp1, hp2);

        if (hp1 > 0 && hp2 > 0) {
            realizarTurno(hp1, hp2, pokemons, turno + 1); 
        } else {
            console.log('Combate terminado');
        }
    }, 1000);
}

function prepararGrafico(hp1, hp2, nombre1, nombre2) {
    const ctx = document.getElementById('resultadoCombate').getContext('2d');
    const maxHp = Math.max(hp1, hp2);

    if (chart) {
        chart.destroy();
    }
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [nombre1, nombre2],
            datasets: [{
                label: 'HP',
                data: [hp1, hp2],
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: maxHp,
                }
            }
        }
    });
}

function actualizarGrafico(hp1, hp2) {
    chart.data.datasets.forEach((dataset) => {
        dataset.data = [hp1, hp2];
    });
    chart.update();
}
