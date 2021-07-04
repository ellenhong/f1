<script>
    import { onMount } from 'svelte';
    import races from './races.js';
    import teams from './teams.js';

    // get today's date
    let date = new Date();
    $: epoch = date.getTime();

    // get the upcoming race
    $: filteredRaces = races.filter(race => epoch < formatRaceDateTime(race));
    $: nextRace = filteredRaces[0];
    
    // countdown
    onMount(() => {
        setInterval(() => {   
            date = new Date();
        }, 1000);
    });

    function formatRaceDateTime(race) {
        return new Date(race.date + " " + race.race).getTime();
    }        

    $: delta = Math.abs(formatRaceDateTime(nextRace) - epoch) / 1000;
    $: days = Math.floor(delta / 86400);
    $: deltaMinusDays = delta - (days * 86400);
    $: hours = Math.floor(deltaMinusDays / 3600) % 24;
    $: deltaMinusHours = deltaMinusDays - (hours * 3600);
    $: minutes = Math.floor(deltaMinusHours / 60) % 60;
    $: deltaMinusMinutes = deltaMinusHours - (minutes * 60);
    $: seconds = Math.floor(deltaMinusMinutes % 60);

    $: months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    $: nextRaceDate = new Date(formatRaceDateTime(nextRace));
    $: nextQualifyingDate = new Date(formatRaceDateTime(nextRace) - (24 * 60 * 60 * 1000));

    // team color selection dropdown
    let textColor = '#FFA112';
    let bgColor = '#0059A6';
    let raceColor = '#FFA112';
    let raceTimeColor = '#0059A6';
    $: cssVarStyles = `--text-color:${textColor};--bg-color:${bgColor};--race-color:${raceColor};--race-time-color:${raceTimeColor}`;

    let selected;

    function handleChange() {
    	textColor = selected.textColor;
    	bgColor = selected.bgColor;
    	raceColor = selected.raceColor;
    	raceTimeColor = selected.bgColor;
    	if (selected.name == 'Haas') {
    		raceTimeColor = selected.textColor;
    	}
    }
</script>

<main style="{cssVarStyles}">
    <div class='colorSelector'>
    	my team is
        <form>
            <select bind:value={selected} on:change="{handleChange}">
            {#each teams as team}
                <option value={team}>
                    {team.name}
                </option>
            {/each}
        </select>
        </form>
    </div>

    <div class='outercard'>
        <div class='card'></div>
        <h1>next race in</h1>

        <div class='clockWrapper'>
            <p class='clockDisplay'> 
                <span>{days}</span> DAYS <span class="clockDisplaySpan">{hours}</span>H <span class="clockDisplaySpan">{minutes}</span>M <span class="clockDisplaySpan">{seconds}</span>S
            </p>
        </div>
    </div>
    
    <div class='race'>
        <p class='nextRace'>{nextRace.name}</p>
        <!-- svelte-ignore a11y-missing-attribute -->
        <img src={nextRace.img} alt={nextRace.track}/>
        <p class='nextTrack'>{nextRace.track}</p>
        <div class="raceTimes">
            <div class="raceTimeCol">
                <p>qualifying</p>
                <p class="raceTimeDay">sat {months[nextQualifyingDate.getMonth()]} {nextQualifyingDate.getDate()}</p>
                <p class="raceTime">{nextRace.qualifying}</p>
            </div>
            <div class="raceTimeCol">
                <p>race</p>
                <p class="raceTimeDay">sun {months[nextRaceDate.getMonth()]} {nextRaceDate.getDate()}</p>
                <p class="raceTime">{nextRace.race}</p>
            </div>
        </div>
    </div>
</main>

<style>
    @import url("https://fonts.googleapis.com/css?family=IBM+Plex+Mono:400,700&display=swap");

    main {
        text-align: center;
        margin: 0 auto;
        max-width: none;
    }

    .colorSelector {
    	padding: 1em;
    }

    h1 {
        color: var(--text-color, black);
        font-size: 1.5em;
        font-weight: 200;
        font-family: "IBM Plex Mono", monospace;
        position: relative;
        top: 35px;
    }

    .outercard {
        height: 220px;
        position: relative;
        top: -20px;
    }

    .card {
        background: var(--bg-color, black);
        width: 600px;
        height: 200px;
        margin: auto;
        position: absolute;
        left: 50%;
        transform: translate(-50%);
        z-index: -1;
        box-shadow: 5px 5px 0px var(--race-color, black);
        border-radius: 10px;
    }

    @media (max-width: 640px) {
        .card {
            width: 475px;
        }

        h1 {
            font-size: 1.2em;
        }

        .clockWrapper .clockDisplay {
            font-size: 1.4em;
            margin: 0;
        }
    }

    @media (max-width: 500px) {
        .card {
            width: 325px;
        }

        h1 {
            font-size: 0.8em;
        }

        .clockWrapper .clockDisplay {
            font-size: 1em;
            margin: 0;
        }

        p.clockDisplay {
            max-width: 200px;
            left: 50%;
            position: absolute;
            transform: translateX(-50%);
        }
    }

    .clockWrapper {
        position: relative;
        top: 35px;
    }

    p.clockDisplay {
        font-weight: 900;
        color: var(--text-color, black);
        font-family: "IBM Plex Mono", monospace;
    }

    .clockDisplay {
        font-size: 1.7em;
        margin: 0;
    }

    .clockDisplay span {
        font-size: 2em;
    }

    .clockDisplay .clockDisplaySpan {
        margin-left: 0.25em;
    }

    .race {
        text-transform: uppercase;
        letter-spacing: 0.8px;
        font-weight: 600;
        color: var(--race-color, black);
        position: relative;
        top: -70px;
    }

    .race img {
        width: 100px;
        opacity: 0.85;
    }

    p.nextRace {
        font-weight: 600;
        font-size: 1.5em;
        width: auto;
        padding-top: 50px;
        color: #484848;
        margin: 1em;
    }

    p.nextTrack {
        margin: 5px;
    }

    .raceTimes {
        width: 25em;
        margin: 1em auto;
        max-width: 100%;
    }
    
    .raceTimeCol {
        width: 50%;
        float: left;
        color: #484848;
    }

    p.raceTimeDay {
        margin: -10px;
        color: var(--race-time-color, black);
        font-weight: 900;
    }

    p.raceTime {
        font-weight: 900;
        font-size: 2em;
        margin: 15px;
    }
</style>