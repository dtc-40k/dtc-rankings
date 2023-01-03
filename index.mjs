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

  let foundDocs = [];
  docs.forEach((doc) => {
    foundDocs.push(doc.data());
  });
  console.info(`Found data for ${foundDocs.length} events`);
  let players = [];
  foundDocs.forEach((event) => {
    console.info(` Generate ranking for event: ${event.name}`);
    event.eventPlayers.forEach((player) => {
      console.info(` -  generate ranking for player: ${player.firstName} ${player.lastName}`);
      const oldPlayerIndex = players.findIndex((item) => item.userId === player.userId);
      if (oldPlayerIndex > -1) {
        const oldPlayer = players[oldPlayerIndex];
        const score = Number(player.dtcScore) + Number(oldPlayer.dtcScore);
        players[oldPlayerIndex] = {
          ...oldPlayer,
          dtcScore: score.toFixed(2),
          numEvents: oldPlayer.numEvents + 1,
          numWins: player.numWins + oldPlayer.numWins,
          totalRank: Number(player.rank) + Number(oldPlayer.totalRank),
          averageRank: ((Number(player.rank) + Number(oldPlayer.totalRank)) / Number(oldPlayer.numEvents + 1)).toFixed(
            1
          ),
        };
      } else {
        players.push({
          userId: player.userId,
          name: `${player.firstName} ${player.lastName}`,
          dtcScore: Number(player.dtcScore),
          numEvents: 1,
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
  });
  return players;
};

retrieveEvents()
  .then((data) => {
    console.info(`Writing ranking file.`);
    fs.writeFileSync(`./rankings/rankings.json`, JSON.stringify(data, null, 2));
    fs.writeFileSync(`./rankings/rankings.csv`, parse(data));
  })
  .finally(() => {
    process.exit(0);
  });
