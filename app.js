document.getElementById('iniciarCombateAleatorio').addEventListener('click', () => iniciarCombate(true));
document.getElementById('iniciarCombateSeleccionado').addEventListener('click', () => iniciarCombate(false));

function obtenerPokemonAleatorio() {
    return Math.floor(Math.random() * 898) + 1;
}

const tipoEfectividad = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

function mostrarInformacionPokemon(id, pokemon) {
    const nombre = document.getElementById(`nombrePokemon${id}`);
    const imagen = document.getElementById(`imagenPokemon${id}`);
    const hp = document.getElementById(`hpPokemon${id}`);
    const hpBar = document.getElementById(`hpBar${id}`);
    const tiposDiv = document.getElementById(`tipo${id}`);

    nombre.textContent = pokemon.name.toUpperCase();
    imagen.src = pokemon.sprites.front_default;
    hp.textContent = `HP: ${pokemon.stats[0].base_stat}`;
    hpBar.style.width = "100%";

    
    tiposDiv.innerHTML = '';
    pokemon.types.forEach(type => {
        const tipoSpan = document.createElement('span');
        tipoSpan.className = `tipo ${type.type.name}`;
        tipoSpan.textContent = type.type.name.toUpperCase();
        tiposDiv.appendChild(tipoSpan);
    });
}

function calcularMultiplicadorTipo(tiposAtacante, tiposDefensor) {
    let multiplicador = 1;
    tiposAtacante.forEach(tipoAtaque => {
        tiposDefensor.forEach(tipoDefensa => {
            if (tipoEfectividad[tipoAtaque]?.[tipoDefensa]) {
                multiplicador *= tipoEfectividad[tipoAtaque][tipoDefensa];
            }
        });
    });
    return multiplicador;
}

function calcularDaño(pokemon1, pokemon2) {
    const ataque = pokemon1.stats[1].base_stat;
    const defensa = pokemon2.stats[2].base_stat;
    const tiposAtacante = pokemon1.types.map(t => t.type.name);
    const tiposDefensor = pokemon2.types.map(t => t.type.name);
    const multiplicador = calcularMultiplicadorTipo(tiposAtacante, tiposDefensor);
    
    const daño = Math.max(Math.floor((ataque - defensa * 0.5) * multiplicador), 1);
    const efectividad = multiplicador > 1 ? "¡Es super efectivo!" : 
                       multiplicador < 1 ? "No es muy efectivo..." : "";
    
    return { daño, efectividad };
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
    const mensajeCombate = document.getElementById('mensajeCombate');
    
    if (hp1 <= 0 || hp2 <= 0) {
        const ganador = hp1 > 0 ? pokemons[0].name : pokemons[1].name;
        mensajeCombate.textContent = `¡${ganador.toUpperCase()} es el ganador!`;
        mensajeCombate.style.animation = 'fadeIn 1s';
        return;
    }

    setTimeout(() => {
        let resultado;
        let pokemonAtacante, pokemonDefensor;
        let hpBarAtacante, hpBarDefensor;
        
        if (turno % 2 === 0) {
            pokemonAtacante = pokemons[0];
            pokemonDefensor = pokemons[1];
            resultado = calcularDaño(pokemons[0], pokemons[1]);
            hp2 = Math.max(0, hp2 - resultado.daño);
            hpBarDefensor = document.getElementById('hpBar2');
        } else {
            pokemonAtacante = pokemons[1];
            pokemonDefensor = pokemons[0];
            resultado = calcularDaño(pokemons[1], pokemons[0]);
            hp1 = Math.max(0, hp1 - resultado.daño);
            hpBarDefensor = document.getElementById('hpBar1');
        }

        
        const imgAtacante = document.getElementById(`imagenPokemon${turno % 2 === 0 ? '1' : '2'}`);
        imgAtacante.style.animation = 'atacar 0.5s';
        setTimeout(() => imgAtacante.style.animation = '', 500);

        
        const porcentajeHP = ((turno % 2 === 0 ? hp2 : hp1) / pokemonDefensor.stats[0].base_stat) * 100;
        hpBarDefensor.style.width = `${porcentajeHP}%`;
        hpBarDefensor.style.background = porcentajeHP > 50 ? '#27ae60' : 
                                       porcentajeHP > 20 ? '#f1c40f' : '#e74c3c';

        
        mensajeCombate.textContent = `${pokemonAtacante.name.toUpperCase()} atacó a ${pokemonDefensor.name.toUpperCase()}! ${resultado.efectividad}`;
        mensajeCombate.style.animation = 'fadeIn 0.5s';

        actualizarGrafico(hp1, hp2);

        if (hp1 > 0 && hp2 > 0) {
            realizarTurno(hp1, hp2, pokemons, turno + 1);
        } else {
            const ganador = hp1 > 0 ? pokemons[0].name : pokemons[1].name;
            mensajeCombate.textContent = `¡${ganador.toUpperCase()} es el ganador!`;
            mensajeCombate.style.animation = 'fadeIn 1s';
        }
    }, 1500);
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
