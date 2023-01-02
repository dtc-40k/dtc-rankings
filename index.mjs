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

  let foundDocs = [];
  docs.forEach((doc) => {
    foundDocs.push(doc.data());
  });
  console.info(`Found data for ${foundDocs.length} events`);
  return foundDocs;
};

retrieveEvents()
  .then((data) => {
    console.info(`Writing ranking file.`);
    fs.writeFileSync(`./rankings/rankings.json`, JSON.stringify(data, null, 2));
  })
  .finally(() => {
    process.exit(0);
  });
