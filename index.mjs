import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  apiKey: 'AIzaSyBG04n27wFFiHr1RtkiaKxVCBkPdZ4MD0k',
  authDomain: 'dtc-admin.firebaseapp.com',
  projectId: 'dtc-admin',
  storageBucket: 'dtc-admin.appspot.com',
  messagingSenderId: '684280015310',
  appId: '1:684280015310:web:f05cffa923c36432e7e39f',
  measurementId: 'G-MP902QNY1H',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const factionsMapping = {
  'Adepta Sororitas': ['adepta sororitas', 'adeptus ministorum'],
  'Space Wolves': ['space wolves'],
  Deathwatch: ['deathwatch'],
  "Imperial Agents": ['imperial agents'],
  'Adeptus Custodes': ['adeptus custodes'],
  'Adeptus Mechanicus': ['adeptus titanicus', 'adeptus mechanicus', 'cult mechanicus', 'skitarii', 'dark mechanicus'],
  Aeldari: ['aeldari', 'alaitoc', 'asuryani', 'iyanden', 'ulthwe', 'ynnari'],
  'Astra Militarum': [
    'astra militarum',
    'cadian shock troops',
    'catachan jungle fighters',
    'death korps',
    'elysian droptroops',
    'militarum auxillia',
    'militarum tempestus',
    'officio prefectus',
    'steel legion',
    'tallarn',
    'vostroyan',
  ],
  'Black Templars': ['black templars'],
  'Adeptus Astartes': [
    'iron hands',
    'white scars',
    'ultramarines',
    'adeptus astartes',
    'salamanders',
    'inquisition',
    'imperial fists',
    'charcharodons',
    'space marines (astartes)',
  ],
  'Blood Angels': ['blood angels', 'fleshtearers', 'lamenters'],
  Chaos: ['chaos'],
  'Chaos Daemons': [
    'tzeentch',
    'khorne',
    'nurgle',
    'slaanesh',
    'chaos daemons',
    'tzeentch daemons',
    'khorne daemons',
    'nurgle daemons',
    'slaanesh daemons',
  ],
  'Chaos Knights': ['chaos knights', 'questoris traitoris'],
  'Chaos Space Marines': [
    'alpha legion',
    'black legion',
    'chaos space marines',
    'emperors children',
    "emperor's children",
    'fallen',
    'iron warriors',
    'night lords',
    'red corsairs',
    'legion of the damned',
  ],
  'World Eaters': ['world eaters'],
  'Death Guard': ['death guard'],
  'Thousand Sons': ['thousand sons'],
  'Dark Angels': ['dark angels', 'ravenwing', 'deathwing'],
  Drukhari: [
    'kabal of the blackheart',
    'kabal of the flayed skull',
    'kabal of the obsidian rose',
    'kabal of the poison tongue',
    'prophets of flesh',
    'the dark creed',
    'drukhari',
  ],
  'Genestealer Cult': ['genestealer cult'],
  'Grey Knights': ['grey knights'],
  Harlequins: ['harlequins'],
  'Imperial Knights': ['imperial knights', 'questor imperialis'],
  Imperium: ['imperium'],
  'Leagues of Votann': [
    'greater thurian league',
    'kronus hegemony',
    'leagues of votann',
    'trans-hyperian alliance',
    'urani-surtr regulates',
    'ymyr conglomerate',
  ],
  Necrons: ['maynarkh', 'necrons', 'nihilakh', 'sautek'],
  Orks: ['orks', 'bad moon', 'blood axe', 'deathskulls', 'evil sunz', 'freebooterz', 'goffs', 'snakebites'],
  "T'au Empire": ["t'au sept", "t'au empire", 'farsight enclaves', "vior'la sept"],
  Tyranids: [
    'hive fleet behemoth',
    'hive fleet hive fleet ',
    'hive fleet hydra',
    'hive fleet jormungandr',
    'hive fleet kraken',
    'hive fleet kronos',
    'hive fleet leviathan',
    'hive fleet gorgon',
    'tyranids',
    'forces of the hive mind',
  ],
};

const retrieveEvents = async () => {
  const bcpEventsRef = collection(db, 'BcpEvents');

  console.info('Retrieving data from firebase.');
  const docs = await getDocs(bcpEventsRef);

  let events = [];
  docs.forEach((doc) => {
    events.push(doc.data());
  });
  console.info(`Found data for ${events.length} events`);
  return events;
};

const updateArmies = (player, armies, event) => {
  let mappedFactionName = Object.keys(factionsMapping).find((f) => {
    return factionsMapping[f].includes(player.army.toLowerCase());
  });

  if (!mappedFactionName) {
    console.error(' --- UNKNOWN FACTION 1 ---', player?.army.toLowerCase());
    mappedFactionName = 'Unknown';
  }

  const armyIndex = armies.findIndex((a) => a.name === mappedFactionName);

  if (armyIndex > -1) {
    armies[armyIndex] = {
      name: mappedFactionName,
      count: armies[armyIndex].count + 1,
      score: Number((Number(armies[armyIndex].score) + Number(player.dtcScore)).toFixed(2)),
      events: [
        ...armies[armyIndex].events,
        {
          name: event.name,
          eventId: event.id,
          numberOfRounds: player.event.numberOfRounds,
          eventDtcScore: player.dtcScore,
          excludeScore: player.excludeScore,
        },
      ],
    };
  } else {
    armies.push({
      name: mappedFactionName,
      count: 1,
      score: Number(Number(player.dtcScore).toFixed(2)),
      events: [
        {
          name: event.name,
          eventId: event.id,
          numberOfRounds: player.event.numberOfRounds,
          eventDtcScore: player.dtcScore,
          excludeScore: player.excludeScore,
        },
      ],
    });
  }
  return armies;
};
const updateTeams = (player, teams) => {
  if (player.team) {
    const teamIndex = teams.findIndex((a) => a.name === player.team.name);
    if (teamIndex > -1) {
      teams[teamIndex] = { name: player.team.name, count: teams[teamIndex].count + 1 };
    } else {
      teams.push({ name: player.team.name, count: 1 });
    }
  }
  return teams;
};
const updateEvents = (player, events, event) => {
  events.push({
    name: event.name,
    eventId: event.id,
    numberOfRounds: player.event.numberOfRounds,
    eventDtcScore: player.dtcScore,
    eventHobbyScore: player?.hobbyScore?.toFixed(2) || '0',
    userId: player.userId,
    rank: player.rank,
    excludeScore: player.excludeScore,
    army: player.army,
    team: player?.team?.name,
  });
  return events;
};

const generatePlayerRanking = (events) => {
  const seasons = ['2025', '2024', '2023', '2022'];
  const seasonalRankings = [];
  const seasonalTeamRankings = []; // Nieuwe array voor team rankings

  seasons.forEach(async (season) => {
    // Async functie om team rankings af te wachten
    let rankings = [];
    let teamRankings = {}; // Nieuwe teamRankings per seizoen

    console.info(`Starting generation for season: ${season}`);
    const seasonEvents = events.filter((event) => event.dtcSeason === season);

    // Team ranking berekenen (voorheen in TeamRankings.jsx)
    teamRankings = calculateTeamRanking(seasonEvents);
    seasonalTeamRankings.push({ season, teamRanking: teamRankings }); // Team rankings toevoegen aan seasonalTeamRankings

    seasonEvents.forEach((event) => {
      console.info(` Generate ranking for event: ${event.name}`);
      event.eventPlayers.forEach((player) => {
        console.info(`  -  generate ranking for player: ${player.firstName} ${player.lastName}`);
        const oldPlayerIndex = rankings.findIndex((item) => item.userId === player.userId);
        if (oldPlayerIndex > -1) {
          const oldPlayer = rankings[oldPlayerIndex];
          let armies = updateArmies(player, oldPlayer.armies, event);
          let teams = updateTeams(player, oldPlayer.teams);

          let events = updateEvents(player, oldPlayer.events, event);
          rankings[oldPlayerIndex] = {
            ...oldPlayer,
            numEvents: oldPlayer.numEvents + 1,
            armies,
            teams,
            events,
            numWins: player.numWins + oldPlayer.numWins,
            totalRank: Number(player.rank) + Number(oldPlayer.totalRank),
            averageRank: (
              (Number(player.rank) + Number(oldPlayer.totalRank)) /
              Number(oldPlayer.numEvents + 1)
            ).toFixed(1),
          };
        } else {
          let armies = [];
          let teams = [];
          let events = [];

          let mappedFactionName = Object.keys(factionsMapping).find((f) => {
            return factionsMapping[f].includes(player.army.toLowerCase());
          });

          if (!mappedFactionName) {
            console.error(' --- UNKNOWN FACTION ---', player.army?.toLowerCase());
            mappedFactionName = 'Unknown';
          }

          if (player.team) {
            teams.push({ name: player.team.name, count: 1 });
          }
          armies.push({
            name: mappedFactionName,
            count: 1,
            score: Number(player.dtcScore),
            events: [
              {
                name: event.name,
                eventId: event.id,
                numberOfRounds: player.event.numberOfRounds,
                eventDtcScore: player.dtcScore,
                excludeScore: player.excludeScore,
              },
            ],
          });
          events.push({
            name: event.name,
            eventId: event.id,
            numberOfRounds: player.event.numberOfRounds,
            eventDtcScore: player.dtcScore,
            eventHobbyScore: player?.hobbyScore?.toFixed(2) || '0',
            userId: player.userId,
            rank: player.rank,
            excludeScore: player.excludeScore,
            army: mappedFactionName,
            team: player?.team?.name,
          });
          rankings.push({
            userId: player.userId,
            name: `${player.firstName} ${player.lastName}`,
            numEvents: 1,
            armies,
            teams,
            events,
            numWins: Number(player.numWins),
            totalRank: Number(player.rank),
            averageRank: Number(player.rank),
          });
        }
      });
    });
    console.info(` Excluding events with more then 5 rounds to a max of 3`);
    rankings = generateDtcScores(rankings);
    rankings = generateHobbyScores(rankings);

    rankings.sort((a, b) => b.dtcScore - a.dtcScore);
    console.info(` Sorting overal list`);
    rankings.forEach((_player, index) => {
      rankings[index].rank = index + 1;
      rankings[index].armies.sort((a, b) => {
        return b.count - a.count;
      });
      rankings[index].teams.sort((a, b) => {
        return b.count - a.count;
      });
    });
    seasonalRankings.push({ season, rankings });
  });
  return { seasonalRankings, seasonalTeamRankings }; // Return player en team rankings
};

const generateDtcScores = (rankings) => {
  const newRankings = [...rankings];
  newRankings.forEach((player, index) => {
    let gtEvents = player.events.filter((event) => event.numberOfRounds >= 5 && !event.excludeScore);
    let rttEvents = player.events.filter((event) => event.numberOfRounds <= 4 && !event.excludeScore);

    let gtScore = 0;
    let rttScore = 0;

    const numberOfEvents = gtEvents?.length + rttEvents?.length;

    if (numberOfEvents > 7) {
      console.log('  Player with more then 7 events found...', player.name);

      if (gtEvents.length > 3) {
        console.log('    and with more then 3 GT events found...');
        gtEvents.sort((a, b) => {
          return b.eventDtcScore - a.eventDtcScore;
        });
        gtEvents = gtEvents.slice(0, 3);
      }

      let allEvents = [...gtEvents, ...rttEvents];

      allEvents.sort((a, b) => {
        return b.eventDtcScore - a.eventDtcScore;
      });

      allEvents = allEvents.slice(0, 7);

      newRankings[index].events.forEach((event, eventIndex) => {
        const usedForRankings = allEvents.findIndex((allEvent) => allEvent.eventId === event.eventId) > -1;

        newRankings[index].events[eventIndex] = {
          ...event,
          usedForRankings,
        };
      });

      rttScore = allEvents?.reduce((total, event) => Number(total) + Number(event.eventDtcScore), 0);
    } else {
      if (gtEvents.length > 3) {
        console.log('  Player with more then 3 GT events found...', player.name);
        gtEvents.sort((a, b) => {
          return b.eventDtcScore - a.eventDtcScore;
        });
        gtEvents = gtEvents.slice(0, 3);
      }

      if (gtEvents && gtEvents.length > 1) {
        gtScore = gtEvents?.reduce((total, event) => Number(total) + Number(event.eventDtcScore), 0);
      }
      if (gtEvents && gtEvents.length === 1) {
        gtScore = Number(gtEvents[0].eventDtcScore);
      }
      if (rttEvents && rttEvents.length > 1) {
        rttScore = rttEvents?.reduce((total, event) => Number(total) + Number(event.eventDtcScore), 0);
      }
      if (rttEvents && rttEvents.length === 1) {
        rttScore = Number(rttEvents[0].eventDtcScore);
      }
      newRankings[index].events.forEach((event, eventIndex) => {
        const usedForRankings =
          gtEvents.findIndex((gtEvent) => gtEvent.eventId === event.eventId) > -1 ||
          rttEvents.findIndex((rttEvent) => rttEvent.eventId === event.eventId) > -1;

        newRankings[index].events[eventIndex] = {
          ...event,
          usedForRankings,
        };
      });
    }
    newRankings[index].events.sort((a, b) => b.eventDtcScore - a.eventDtcScore);
    newRankings[index].dtcScore = (Number(gtScore) + Number(rttScore)).toFixed(2);
  });
  return newRankings;
};

const generateHobbyScores = (rankings) => {
  const newRankings = [...rankings];
  newRankings.forEach((player, index) => {
    let gtEvents = player.events.filter((event) => event.numberOfRounds >= 5 && !event.excludeScore);
    let rttEvents = player.events.filter((event) => event.numberOfRounds <= 4 && !event.excludeScore);

    let gtHobbyScore = 0;
    let rttHobbyScore = 0;

    const numberOfEvents = gtEvents?.length + rttEvents?.length;

    if (numberOfEvents > 7) {
      if (gtEvents.length > 3) {
        gtEvents.sort((a, b) => {
          return b.eventHobbyScore - a.eventHobbyScore;
        });
        gtEvents = gtEvents.slice(0, 3);
      }

      let allEvents = [...gtEvents, ...rttEvents];

      allEvents.sort((a, b) => {
        return b.eventHobbyScore - a.eventHobbyScore;
      });

      allEvents = allEvents.slice(0, 7);

      newRankings[index].events.forEach((event, eventIndex) => {
        const usedForHobbyRankings = allEvents.findIndex((allEvent) => allEvent.eventId === event.eventId) > -1;

        newRankings[index].events[eventIndex] = {
          ...event,
          usedForHobbyRankings,
        };
      });

      rttHobbyScore = allEvents?.reduce((total, event) => Number(total) + Number(event.eventHobbyScore || 0), 0);
    } else {
      if (gtEvents.length > 3) {
        gtEvents.sort((a, b) => {
          return b.eventHobbyScore - a.eventHobbyScore;
        });
        gtEvents = gtEvents.slice(0, 3);
      }

      if (gtEvents && gtEvents.length > 1) {
        gtHobbyScore = gtEvents?.reduce((total, event) => Number(total) + Number(event?.eventHobbyScore || 0), 0);
      }
      if (gtEvents && gtEvents.length === 1) {
        gtHobbyScore = Number(gtEvents[0].eventHobbyScore || 0);
      }
      if (rttEvents && rttEvents.length > 1) {
        rttHobbyScore = rttEvents?.reduce((total, event) => Number(total) + Number(event?.eventHobbyScore || 0), 0);
      }
      if (rttEvents && rttEvents.length === 1) {
        rttHobbyScore = Number(rttEvents[0]?.eventHobbyScore || 0);
      }
      newRankings[index].events.forEach((event, eventIndex) => {
        const usedForHobbyRankings =
          gtEvents.findIndex((gtEvent) => gtEvent.eventId === event.eventId) > -1 ||
          rttEvents.findIndex((rttEvent) => rttEvent.eventId === event.eventId) > -1;

        newRankings[index].events[eventIndex] = {
          ...event,
          usedForHobbyRankings,
        };
      });
    }
    newRankings[index].hobbyScore = (Number(gtHobbyScore) + Number(rttHobbyScore)).toFixed(2);
  });
  return newRankings;
};

const calculateTeamRanking = (events) => {
  // Hergebruik calculateTeamRanking functie van TeamRankings.jsx
  let teamRankings = {};

  events.forEach((event) => {
    const eventTeamScores = {};
    event.eventPlayers.forEach((player) => {
      if (player.team && player.team.name) {
        const teamName = player.team.name.trim();
        if (!eventTeamScores[teamName] || Number(player.dtcScore) > Number(eventTeamScores[teamName].score)) {
          eventTeamScores[teamName] = {
            score: player.dtcScore,
            playerId: player.userId,
            playerName: `${player.firstName} ${player.lastName}`,
            eventId: event.id,
            eventName: event.name,
            playerObject: player,
            numberOfRounds: player.event.numberOfRounds, // Voeg numberOfRounds toe
          };
        }
      }
    });

    for (const teamName in eventTeamScores) {
      const eventScore = eventTeamScores[teamName];
      if (!teamRankings[teamName]) {
        teamRankings[teamName] = {
          name: teamName,
          players: {},
          eventScores: [],
          teamEventPlayers: {},
          totalScore: 0,
          numEvents: 0,
        };
      }
      const team = teamRankings[teamName];
      team.numEvents += 1;
      team.eventScores.push({
        score: Number(eventScore.score),
        eventName: eventScore.eventName,
        eventId: eventScore.eventId,
        playerId: eventScore.playerId,
        playerName: eventScore.playerName,
        // player: eventScore.playerObject,
        numberOfRounds: eventScore.numberOfRounds, // Voeg numberOfRounds toe
      });
      if (!teamRankings[teamName].players[eventScore.playerId]) {
        // Gebruik teamRankings.team.players
        teamRankings[teamName].players[eventScore.playerId] = {
          playerId: eventScore.playerId,
          playerName: eventScore.playerName,
          scores: [],
          topScoresWithEvents: [],
          // player: eventScore.playerObject,
        };
      }
      teamRankings[teamName].players[eventScore.playerId].scores.push(Number(eventScore.score)); // Gebruik teamRankings.team.players
    }
  });

  // Calculate team total score based on rules and identify contributing scores
  for (const teamName in teamRankings) {
    const team = teamRankings[teamName];
    let allPlayerTopScoresWithEvents = [];

    for (const playerId in team.players) {
      const player = team.players[playerId];
      player.scores.sort((a, b) => b - a);
      const topPlayerScores = player.scores.slice(0, 3);

      const topScoresWithEvents = topPlayerScores.map((score) => {
        const eventForScore = team.eventScores.find((es) => es.playerId === playerId && Number(es.score) === score);
        return {
          score,
          eventName: eventForScore ? eventForScore.eventName : 'Unknown Event',
          numberOfRounds: eventForScore?.numberOfRounds,
        }; // Voeg numberOfRounds toe
      });
      team.players[playerId].topScoresWithEvents = topScoresWithEvents;
      allPlayerTopScoresWithEvents = [...allPlayerTopScoresWithEvents, ...topScoresWithEvents];
      player.topScores = topPlayerScores;
    }

    // GT Event Limiet Toepassen
    let gtEvents = allPlayerTopScoresWithEvents.filter((scoreEvent) => scoreEvent.numberOfRounds >= 5);
    let rttEvents = allPlayerTopScoresWithEvents.filter((scoreEvent) => scoreEvent.numberOfRounds < 5);

    gtEvents.sort((a, b) => b.score - a.score);
    gtEvents = gtEvents.slice(0, 3); // Maximaal 3 GT events

    let allAllowedEvents = [...gtEvents, ...rttEvents];
    allAllowedEvents.sort((a, b) => b.score - a.score);
    const topTeamScoresWithEvents = allAllowedEvents.slice(0, 7);

    team.totalScore = topTeamScoresWithEvents.reduce((sum, scoreEvent) => sum + scoreEvent.score, 0).toFixed(2);
    team.topTeamScoresWithEvents = topTeamScoresWithEvents;

    for (const playerId in team.players) {
      const player = team.players[playerId];
      player.topScoresWithEvents = player.topScoresWithEvents.map((scoreEvent) => {
        const inTop7 = topTeamScoresWithEvents.some(
          (topTeamScoreEvent) =>
            topTeamScoreEvent.score === scoreEvent.score && topTeamScoreEvent.eventName === scoreEvent.eventName
        );
        const isGTEvent = scoreEvent.numberOfRounds >= 5; // Bepaal of event GT is
        return { ...scoreEvent, inTop7, isGTEvent }; // Voeg isGTEvent toe
      });
    }
  }

  let rankingArray = Object.values(teamRankings);
  rankingArray.sort((a, b) => b.totalScore - a.totalScore);

  rankingArray.forEach((team, index) => {
    team.rank = index + 1;
    team.eventScores.sort((a, b) => b.score - a.score);
  });

  return rankingArray;
};

const generateTeamRankings = (seasonalEvents) => {
  // Nieuwe functie om team rankings te genereren
  const seasonalTeamRankings = [];

  seasonalEvents.forEach(async (season) => {
    // Async loop voor seizoenen (optioneel, kan ook sync)
    let teamRankings = {};
    const seasonEvents = season.rankings; // Gebruik rankings array als events voor team ranking berekening

    teamRankings = calculateTeamRanking(seasonEvents); // Hergebruik calculateTeamRanking

    seasonalTeamRankings.push({ season: season.season, teamRanking: teamRankings }); // Voeg team rankings toe aan seasonalTeamRankings
  });

  return seasonalTeamRankings; // Return team rankings array
};
const generateFactionRanking = (seasonalRanking) => {
  const seasonalFactionRanking = [];

  seasonalRanking.forEach((season) => {
    const factionLists = [];
    const players = season.rankings;
    console.info(` Generating faction ranking list`);
    players.forEach((_player, index) => {
      _player.armies.forEach((army) => {
        let mappedFactionName = Object.keys(factionsMapping).find((f) => {
          return factionsMapping[f].includes(army.name?.toLowerCase());
        });
        if (!mappedFactionName) {
          console.error(' --- UNKNOWN FACTION ---', army.name?.toLowerCase());
          mappedFactionName = 'Unknown';
        }
        let gtEvents = army.events.filter((event) => event.numberOfRounds >= 5 && !event.excludeScore);
        let rttEvents = army.events.filter((event) => event.numberOfRounds <= 4 && !event.excludeScore);

        let gtScore = 0;
        let rttScore = 0;

        const numberOfEvents = gtEvents?.length + rttEvents?.length;
        let scoringNumEvents = 0;
        let usedEventsForFactionRanking = []; // Array om gebruikte events op te slaan
        let allScoresWithRankingInfo = []; // Alle scores met ranking info

        if (numberOfEvents > 7) {
          console.log('  Faction Ranking Player with more then 7 events found...', _player.name);

          if (gtEvents.length > 3) {
            console.log('    and with more then 3 GT events found...');
            gtEvents.sort((a, b) => {
              return b.eventDtcScore - a.eventDtcScore;
            });
            gtEvents = gtEvents.slice(0, 3);
          }

          let allEvents = [...gtEvents, ...rttEvents];

          allEvents.sort((a, b) => {
            return b.eventDtcScore - a.eventDtcScore;
          });

          usedEventsForFactionRanking = allEvents.slice(0, 7); // Gebruikte events voor faction ranking
          scoringNumEvents = usedEventsForFactionRanking.length;

          rttScore = usedEventsForFactionRanking?.reduce(
            (total, event) => Number(total) + Number(event.eventDtcScore),
            0
          );
        } else {
          if (gtEvents.length > 3) {
            console.log('  Player with more then 3 GT events found...', _player.name);
            gtEvents.sort((a, b) => {
              return b.eventDtcScore - a.eventDtcScore;
            });
            gtEvents = gtEvents.slice(0, 3);
          }

          usedEventsForFactionRanking = [...gtEvents, ...rttEvents]; // Gebruikte events voor faction ranking
          scoringNumEvents = usedEventsForFactionRanking.length;

          if (gtEvents && gtEvents.length > 1) {
            gtScore = gtEvents?.reduce((total, event) => Number(total) + Number(event.eventDtcScore), 0);
          }
          if (gtEvents && gtEvents.length === 1) {
            gtScore = Number(gtEvents[0].eventDtcScore);
          }
          if (rttEvents && rttEvents.length > 1) {
            rttScore = rttEvents?.reduce((total, event) => Number(total) + Number(event.eventDtcScore), 0);
          }
          if (rttEvents && rttEvents.length === 1) {
            rttScore = Number(rttEvents[0].eventDtcScore);
          }
          scoringNumEvents = gtEvents.length + rttEvents.length;
        }
        const armyScore = (Number(gtScore) + Number(rttScore)).toFixed(2);

        // Alle scores verzamelen en markeren of ze gebruikt zijn voor ranking
        army.events.forEach((eventScore) => {
          const isUsedForRanking = usedEventsForFactionRanking.some(
            (usedEvent) => usedEvent.eventId === eventScore.eventId
          );
          allScoresWithRankingInfo.push({
            ...eventScore,
            isUsedForRanking, // Markeer of score gebruikt is voor ranking
            isGTEvent: eventScore.numberOfRounds >= 5, // Markeer of event een GT event is
          });
        });

        const factionIndex = factionLists.findIndex((a) => a.name === mappedFactionName);
        const factionPlayer = {
          ..._player,
          armies: undefined,
          events: undefined,
          teams: undefined,
          totalRank: undefined,
          dtcScore: Number(armyScore),
          numEvents: scoringNumEvents,
          averageRank: army.averageRank,
          numWins: army.numWins,
          scores: allScoresWithRankingInfo.sort((a, b) => {
            // Sorteer scores array
            if (a.isUsedForRanking !== b.isUsedForRanking) {
              return b.isUsedForRanking ? 1 : -1; // Gebruikte scores eerst
            }
            if (a.isGTEvent !== b.isGTEvent) {
              return b.isGTEvent ? 1 : -1; // GT events binnen gebruikte scores eerst
            }
            return b.eventDtcScore - a.eventDtcScore; // Binnen groepen sorteer op score
          }),
        };
        if (scoringNumEvents > 0) {
          if (factionIndex > -1) {
            factionLists[factionIndex] = {
              name: mappedFactionName,
              players: [...factionLists[factionIndex].players, factionPlayer],
            };
          } else {
            factionLists.push({ name: mappedFactionName, players: [factionPlayer] });
          }
        }
      });
    });

    console.info(` Sorting faction ranking list`);

    factionLists.forEach((faction) => {
      faction.players.sort((a, b) => {
        return b.dtcScore - a.dtcScore;
      });
      faction.players.forEach((_player, index) => {
        faction.players[index].rank = index + 1;
      });
    });

    seasonalFactionRanking.push({ season: season.season, factionRanking: factionLists });
  });
  return seasonalFactionRanking;
};

retrieveEvents()
  .then((events) => {
    const playerRanking = generatePlayerRanking(events);
    console.info(`Writing player ranking file.`);
    fs.writeFileSync(`./rankings/rankings.json`, JSON.stringify(playerRanking.seasonalRankings, null, 2)); // seasonalRankings gebruiken

    const factionRanking = generateFactionRanking(playerRanking.seasonalRankings); // seasonalRankings gebruiken
    console.info(`Writing faction ranking file.`);
    fs.writeFileSync(`./rankings/factions.json`, JSON.stringify(factionRanking, null, 2));

    const teamRanking = generateTeamRankings(playerRanking.seasonalRankings); // seasonalRankings gebruiken voor team rankings
    console.info(`Writing team ranking file.`);
    fs.writeFileSync(`./rankings/teams.json`, JSON.stringify(teamRanking, null, 2)); // Schrijf team rankings naar teams.json
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    process.exit(0);
  });
