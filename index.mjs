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

const updateArmies = (player, armies) => {
  const armyIndex = armies.findIndex((a) => a.name === player.army);

  if (armyIndex > -1) {
    armies[armyIndex] = { name: player.army, count: armies[armyIndex].count + 1 };
  } else {
    armies.push({ name: player.army, count: 1 });
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
    eventDtcScore: player.dtcScore,
    userId: player.userId,
    excludeScore: player.excludeScore,
  });
  return events;
};

const calculateScore = (player, score) => {
  if (!player.excludeScore) {
    score = Number(score) + Number(player.dtcScore);
  }
  return Number(score);
};

const generatePlayerRanking = (events) => {
  let rankings = [];
  events.forEach((event) => {
    console.info(` Generate ranking for event: ${event.name}`);
    event.eventPlayers.forEach((player) => {
      const oldPlayerIndex = rankings.findIndex((item) => item.userId === player.userId);
      if (oldPlayerIndex > -1) {
        const oldPlayer = rankings[oldPlayerIndex];
        let armies = updateArmies(player, oldPlayer.armies);
        let teams = updateTeams(player, oldPlayer.teams);

        let events = updateEvents(player, oldPlayer.events, event);
        let score = calculateScore(player, oldPlayer.dtcScore);
        rankings[oldPlayerIndex] = {
          ...oldPlayer,
          dtcScore: score.toFixed(2),
          numEvents: oldPlayer.numEvents + 1,
          armies,
          teams,
          events,
          numWins: player.numWins + oldPlayer.numWins,
          totalRank: Number(player.rank) + Number(oldPlayer.totalRank),
          averageRank: ((Number(player.rank) + Number(oldPlayer.totalRank)) / Number(oldPlayer.numEvents + 1)).toFixed(
            1
          ),
        };
      } else {
        let armies = [];
        let teams = [];
        let events = [];

        let score = 0;
        if (!player.excludeScore) {
          score = score + Number(player.dtcScore);
        }

        if (player.team) {
          teams.push({ name: player.team.name, count: 1 });
        }
        armies.push({ name: player.army, count: 1 });
        events.push({
          name: event.name,
          eventId: event.id,
          eventDtcScore: player.dtcScore,
          userId: player.userId,
          excludeScore: player.excludeScore,
        });
        rankings.push({
          userId: player.userId,
          name: `${player.firstName} ${player.lastName}`,
          dtcScore: score.toFixed(2),
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
  rankings.sort((a, b) => b.dtcScore - a.dtcScore);
  console.info(`Sorting overal list`);

  rankings.forEach((_player, index) => {
    rankings[index].rank = index + 1;
    rankings[index].armies.sort((a, b) => {
      return b.count - a.count;
    });
    rankings[index].teams.sort((a, b) => {
      return b.count - a.count;
    });
  });
  return rankings;
};

const generateFactionRanking = (players) => {
  const factionLists = [];

  players.forEach((_player, index) => {
    players[index].rank = index + 1;
    players[index].armies.sort((a, b) => {
      return b.count - a.count;
    });
    players[index].teams.sort((a, b) => {
      return b.count - a.count;
    });

    _player.armies.forEach((army) => {
      const factionIndex = factionLists.findIndex((a) => a.name === army.name);
      const factionPlayer = {
        ..._player,
        armies: undefined,
        dtcScore: army.score,
        numEvents: army.count,
        averageRank: army.averageRank,
        numWins: army.numWins,
      };
      if (factionIndex > -1) {
        factionLists[factionIndex] = {
          name: army.name,
          players: [...factionLists[factionIndex].players, factionPlayer],
        };
      } else {
        factionLists.push({ name: army.name, players: [factionPlayer] });
      }
    });
  });

  console.info(`Sorting faction ranking list`);

  factionLists.forEach((faction) => {
    faction.players.sort((a, b) => {
      return b.dtcScore - a.dtcScore;
    });
    faction.players.forEach((_player, index) => {
      faction.players[index].rank = index + 1;
    });
  });

  return factionLists;
};

retrieveEvents()
  .then((events) => {
    const playerRanking = generatePlayerRanking(events);
    console.info(`Writing player ranking file.`);
    fs.writeFileSync(`./rankings/rankings.json`, JSON.stringify(playerRanking, null, 2));

    console.info(`Writing faction ranking file.`);
    const factionRanking = generateFactionRanking(playerRanking);
    fs.writeFileSync(`./rankings/factions.json`, JSON.stringify(factionRanking, null, 2));
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    process.exit(0);
  });
