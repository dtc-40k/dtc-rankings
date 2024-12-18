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

const factions = {
  'Adepta Sororitas': ['adepta sororitas', 'adeptus ministorum'],
  'Space Wolves': ['space wolves'],
  Deathwatch: ['deathwatch'],
  'Adeptus Custodes': ['adeptus custodes'],
  'Adeptus Mechanicus': ['adeptus titanicus', 'adeptus mechanicus', 'cult mechanicus', 'skitarii', 'dark mechanicus'],
  Aeldari: ['aeldari', 'alaitoc', 'asuryani', 'iyanden', 'ulthwe'],
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
  "T'au Empire": ["t'au sept", "t'au empire", 'farsightr enclaves', "vior'la sept"],
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
  ],
  Ynnari: ['ynnari'],
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
  let mappedFactionName = Object.keys(factions).find((f) => {
    return factions[f].includes(player.army.toLowerCase());
  });

  if (!mappedFactionName) {
    console.error(' --- UNKNOWN FACTION ---', player?.army);
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
  const seasons = ['2024', '2023', '2022'];
  const seasonRankings = [];

  seasons.forEach((season) => {
    let rankings = [];
    console.info(`Starting generation for season: ${season}`);
    const seasonEvents = events.filter((event) => event.dtcSeason === season);
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

          let mappedFactionName = Object.keys(factions).find((f) => {
            return factions[f].includes(player.army.toLowerCase());
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
    seasonRankings.push({ season, rankings });
  });
  return seasonRankings;
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
        gtHobbyScore = gtEvents?.reduce((total, event) => Number(total) + Number(event.eventHobbyScore || 0), 0);
      }
      if (gtEvents && gtEvents.length === 1) {
        gtHobbyScore = Number(gtEvents[0].eventHobbyScore || 0);
      }
      if (rttEvents && rttEvents.length > 1) {
        rttHobbyScore = rttEvents?.reduce((total, event) => Number(total) + Number(event.eventHobbyScore || 0), 0);
      }
      if (rttEvents && rttEvents.length === 1) {
        rttHobbyScore = Number(rttEvents[0].eventHobbyScore || 0);
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

const generateFactionRanking = (seasonalRanking) => {
  const seasonalFactionRanking = [];

  seasonalRanking.forEach((season) => {
    const factionLists = [];
    const players = season.rankings;
    console.info(` Generating faction ranking list`);
    players.forEach((_player, index) => {
      _player.armies.forEach((army) => {
        let mappedFactionName = Object.keys(factions).find((f) => {
          return factions[f].includes(army.name?.toLowerCase());
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

          allEvents = allEvents.slice(0, 7);

          scoringNumEvents = allEvents.length;

          rttScore = allEvents?.reduce((total, event) => Number(total) + Number(event.eventDtcScore), 0);
        } else {
          if (gtEvents.length > 3) {
            console.log('  Player with more then 3 GT events found...', _player.name);
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
          scoringNumEvents = gtEvents.length + rttEvents.length;
        }
        const armyScore = (Number(gtScore) + Number(rttScore)).toFixed(2);

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
    fs.writeFileSync(`./rankings/rankings.json`, JSON.stringify(playerRanking, null, 2));

    const factionRanking = generateFactionRanking(playerRanking);
    console.info(`Writing faction ranking file.`);
    fs.writeFileSync(`./rankings/factions.json`, JSON.stringify(factionRanking, null, 2));
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    process.exit(0);
  });
