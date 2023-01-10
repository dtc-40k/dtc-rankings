import { initializeApp } from 'firebase/app';
import { parse } from 'json2csv';

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

const generatePlayerRanking = (events) => {
  let players = [];
  events.forEach((event) => {
    console.info(` Generate ranking for event: ${event.name}`);
    event.eventPlayers.forEach((player) => {
      console.info(` -  generate ranking for player: ${player.firstName} ${player.lastName}`);
      const oldPlayerIndex = players.findIndex((item) => item.userId === player.userId);
      if (oldPlayerIndex > -1) {
        const oldPlayer = players[oldPlayerIndex];
        let armies = oldPlayer.armies;
        let teams = oldPlayer.teams;

        const score = Number(player.dtcScore) + Number(oldPlayer.dtcScore);
        const armyIndex = armies.findIndex((a) => a.name === player.army);
        if (armyIndex > -1) {
          const armyScore = Number(armies[armyIndex].score) + Number(player.dtcScore);
          armies[armyIndex] = {
            name: player.army,
            count: armies[armyIndex].count + 1,
            score: armyScore.toFixed(2),
            totalRank: Number(player.rank) + Number(armies[armyIndex].totalRank),
            averageRank: (
              (Number(player.rank) + Number(armies[armyIndex].totalRank)) /
              Number(armies[armyIndex].count + 1)
            ).toFixed(1),
            numWins: Number(player.numWins) + Number(armies[armyIndex].numWins),
          };
        } else {
          armies.push({
            name: player.army,
            count: 1,
            score: player.dtcScore,
            totalRank: Number(player.rank),
            averageRank: Number(player.rank),
            numWins: Number(player.numWins),
          });
        }

        if (player.team) {
          const teamIndex = teams.findIndex((a) => a.name === player.team.name);
          if (teamIndex > -1) {
            teams[teamIndex] = {
              name: player.team.name,
              count: teams[teamIndex].count + 1,
            };
          } else {
            teams.push({
              name: player.team.name,
              count: 1,
            });
          }
        }
        players[oldPlayerIndex] = {
          ...oldPlayer,
          dtcScore: score.toFixed(2),
          numEvents: oldPlayer.numEvents + 1,
          armies,
          teams,
          numWins: player.numWins + oldPlayer.numWins,
          totalRank: Number(player.rank) + Number(oldPlayer.totalRank),
          averageRank: ((Number(player.rank) + Number(oldPlayer.totalRank)) / Number(oldPlayer.numEvents + 1)).toFixed(
            1
          ),
        };
      } else {
        let armies = [];
        let teams = [];

        if (player.team) {
          teams.push({ name: player.team.name, count: 1 });
        }
        armies.push({
          name: player.army,
          count: 1,
          score: player.dtcScore,
          totalRank: Number(player.rank),
          averageRank: Number(player.rank),
          numWins: Number(player.numWins),
        });

        players.push({
          userId: player.userId,
          name: `${player.firstName} ${player.lastName}`,
          dtcScore: Number(player.dtcScore),
          numEvents: 1,
          armies,
          teams,
          numWins: Number(player.numWins),
          totalRank: Number(player.rank),
          averageRank: Number(player.rank),
        });
      }
    });
  });
  players.sort((a, b) => b.dtcScore - a.dtcScore);
  console.info(`Sorting overal list`);

  players.forEach((_player, index) => {
    players[index].rank = index + 1;
    players[index].armies.sort((a, b) => {
      return b.count - a.count;
    });
    players[index].teams.sort((a, b) => {
      return b.count - a.count;
    });
  });
  return players;
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
        teams: undefined,
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
