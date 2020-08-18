const { WebhookClient } = require('dialogflow-fulfillment');

exports.agent = new WebhookClient({ request, response });
console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

// class for firebase operation

// function for checking if string has a number

// function getUserLocation(agent, navigator) {
//   navigator.geolocation.getCurrentPosition((x) => {
//     var latitude = x.coords.latitude;
//     var longitude = x.coords.longitude;

//     agent.add(`your latitude ${latitude}, your longitude ${longitude}`);
//   });
// }

//function saveInfo(table) {
//admin.database().ref(table).push({
// userName: userData.userName,
// phoneNumber: userData.phoneNumber,
// motherName: userData.motherName,
// idCard: userData.idCard,
// amountRequest: userData.amountRequest
// });
// }

// function for set the agent context easily
function setContext(yourContext, lifeSpan = 1) {
  return agent.setContext({
    name: yourContext,
    lifespan: lifeSpan
  });
}

function log(someInfo) {
  return console.log(someInfo);
}

function amountIsNumber(yourString) {
  /* To Do */
}

// function for converting number to currency format
function format2(n) {
  return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1.');
}

// function for checking the loan amount
function checkAmount(totalAmount) {
  if (totalAmount < 1000000) {
    const context = new Context();
    context.setContext('awaiting_loan', 5);
    setContext('awaiting_loan', 5);
    agent.add(`Kalo kamu mau minjem dibawah 1 juta, minjem aja sama tetangga ya`);
  } else if (totalAmount > 50000000) {
    setContext('awaiting_loan', 5);
    agent.add(`Aduh, jumlah pinjeman yang kamu pengen ketinggian nih, coba dibawah 50 juta ya`);
  } else {
    agent.setContext({
      name: 'awaiting_name',
      lifespan: 1
    });
    agent.add(`Baik, selanjutnya tolong isi nama kamu yah. Nama kamu siapa?`);
  }
}

function userProvidesLoanAmount(agent) {
  var amount = agent.parameters.loanRequest.replace(/\s/g, '').toLowerCase();
  console.log(amount);
  var fixedAmount = '';
  var numberAmount;
  if (amount.includes('jt')) {
    fixedAmount = amount.replace('jt', '000000');
    numberAmount = parseInt(fixedAmount);
    checkAmount(numberAmount);
  } else if (amount.includes('juta')) {
    fixedAmount = amount.replace('juta', '000000');
    numberAmount = parseInt(fixedAmount);
    checkAmount(numberAmount);
  } else if (stringIsNumber(amount)) {
    numberAmount = parseInt(amount);
    checkAmount(numberAmount);
  } else {
    setContext('awaiting_loan', 5);
    agent.add(`Hah?`);
  }
}

function userProvidesName(agent) {
  const name = agent.parameters.name;
  userData.userName = name;

  if (onlyLetters(name)) {
    if (name.length < 3) {
      setContext('awaiting_name', 1);
      setContext('user_data', 5);
      return agent.add(`Masa nama kamu cuma ${name.length} karakter doang sih?
Masukkin lagi ya nama kamu yang bener`);
    } else {
      setContext('awaiting_mother', 1);
      return agent.add(`ok ${name}, selanjutnya siapa nama ibu kandung kamu? 💁`);
    }
  }
  if (hasNumber(name)) {
    setContext('awaiting_name', 1);
    setContext('user_data', 5);
    return agent.add('Masukkan nama kamu dengan benar ya, tidak mengandung angka');
  } else {
    setContext('awaiting_mother');
    return agent.add(`Ok ${name}, selanjutnya siapa nama ibu kandung kamu? 💁`);
  }
}

function formatNumber(amount, currency) {
  let fixedAmount = amount.replace(currency, '000000');
  let numberAmount = parseInt(fixedAmount);

  return format2(numberAmount);
}

function userProvidesPhone(agent) {
  const phoneNumber = agent.parameters['phone-number'];
  userData.phoneNumber = phoneNumber;

  if (phoneNumber.length < 9 || phoneNumber.length > 13) {
    setContext('user_data', 4);
    setContext('awaiting_phone');
    return agent.add('Nomor telfon harus sesuai format antara 9 - 13 digit');
  } else if (onlyLetters(phoneNumber)) {
    setContext('awaiting_phone');
    setContext('user_data', 4);
    return agent.add('Masukkan nomor telfon kamu dengan benar ya');
  } else {
    setContext('awaiting_address');
    setContext('user_data', 4);
    return agent.add('Mantapp, selanjutnya tolong isi alamat rumah kamu ya sesuai ktp');
  }
}

function userWantToLoanFromFirst(agent) {
  var amount = agent.parameters.loanRequest.replace(/\s/g, '').toLowerCase();
  var example = 'string';
  console.log(amount);
  var fixedAmount = '';
  var numberAmount;
  if (amount.includes('jt')) {
    fixedAmount = amount.replace('jt', '000000');
    numberAmount = parseInt(fixedAmount);
    return checkAmount(numberAmount);
  } else if (amount.includes('juta')) {
    fixedAmount = amount.replace('juta', '000000');
    numberAmount = parseInt(fixedAmount);
    return checkAmount(numberAmount);
    //agent.add(`Baik, pinjaman anda sebesar Rp. ${format2(numberAmount)}`);
  } else if (stringIsNumber(amount)) {
    numberAmount = parseInt(amount);
    return checkAmount(numberAmount);
    //agent.add(`Baik, pinjaman anda sebesar Rp. ${fixedAmount}`);
  } else {
    setContext('awaiting_loan');
    agent.add(`Hah?`);
  }
}

function userProvidesMotherName(agent) {
  const motherName = agent.parameters.motherName;
  userData.motherName = motherName;
  const name = agent.getContext('user_data').parameters.name;

  if (onlyLetters(motherName)) {
    if (motherName.length < 3) {
      setContext('awaiting_mother', 3);
      return agent.add(`Masa nama ibu kamu cuma ${motherName.length} karakter doang sih?
Masukkin lagi ya nama ibu kamu yang bener`);
    } else {
      setContext('awaiting_phone', 1);
      return agent.add(`Okee ${name}, selanjutnya berapa nomor telfon kamu?`);
    }
  }
  if (hasNumber(motherName)) {
    setContext('awaiting_mother', 1);
    return agent.add('Masukkan nama ibu kamu dengan benar ya, tidak mengandung angka');
  } else {
    setContext('awaiting_mother');
    return agent.add(`Ok ${name}, selanjutnya berapa nomor telfon kamu? 💁`);
  }
}

function userProvidesAddress(agent) {
  const address = agent.getContext('user_data').parameters.address;
  userData.address = address;

  if (address.length < 5) {
    setContext('awaiting_address', 1);
    setContext('user_data', 5);
    return agent.add(
      `Masa alamat kamu cuma ${address.length} karakter doang sih? Masukkin lagi ya nama kamu yang bener`
    );
  } else {
    setContext('awaiting_job');
    return agent.add('Good! Selanjutnya, pekerjaan kamu apa? 💁');
  }
}

function userProvidesJob(agent) {
  const job = agent.getContext('user_data').parameters.job;
  userData.job = job;

  if (hasNumber(job)) {
    setContext('awaiting_job');
    setContext('user_data', 4);
    return agent.add('Maaf, pekerjaan tidak dapat berisi angka, hanya alphabet');
  } else {
    setContext('awaiting_income');
    return agent.add('Ok, berapa pendapatan kamu? Ketik dalam format nominal seperti contoh => 1.000.000');
  }
}

function userProvidesIncome(agent) {
  let income = agent.getContext('user_data').parameters.income;
  let convertIncome = income.split('.').join('');

  if (stringIsNumber(convertIncome)) {
    if (convertIncome > 300000) {
      userData.income = income;
      setContext('awaiting_ktp');
      return agent.add('Oke, data pendapatan kamu sukses kami simpan. Selanjutnya tolong upload foto selfie kamu ya');
    } else {
      setContext('awaiting_income');
      setContext('user_data');
      return agent.add('Maaf, format yang kamu masukkan salah, coba lagi ya dengan format yang sudah kami berikan');
    }
  } else {
    setContext('awaiting_income');
    return agent.add('Maaf, masukkan data pendatapan kamu sesuai format nominal');
  }
}

function userProvidesSelfie(agent) {
  const twilio = agent.originalRequest.payload.data;

  if (twilio !== null) {
    const selfieUrl = twilio.MediaUrl0;
    const blobType = twilio.MediaContentType0 === 'image/jpeg';
    const isImage = twilio.NumMedia > 0;

    if (isImage) {
      userData.selfieUrl = selfieUrl;
      setContext('awaiting_ktp');
      return agent.add('Terimakasih sudah upload foto selfie kamu! Yang terakhir, tolong upload foto ktp kamu ya!');
    } else {
      setContext('awaiting_selfie');
      return agent.add('Maaf, tolong kirim fotonya ya, bukan yang lain');
    }
  } else {
    return agent.add('Hanya khusus untuk chat melalui whatsapp, belum tersedia melalui web');
  }
}

function ktpFallback(agent) {
  const twilioPayload = agent.originalRequest.payload.data;
  const ktpImageUrl = twilioPayload.MediaUrl0;
  const isImage = twilioPayload.NumMedia;
  const amount = agent.getContext('user_data').parameters.loanRequest.replace(/\s/g, '').toLowerCase();
  var fixedAmount = '';
  var numberAmount;
  var currency;
  userData.amount = currency;

  if (amount.includes('jt')) {
    fixedAmount = amount.replace('jt', '000000');
    numberAmount = parseInt(fixedAmount);
    currency = format2(numberAmount);
  } else if (amount.includes('juta')) {
    fixedAmount = amount.replace('juta', '000000');
    numberAmount = parseInt(fixedAmount);
    currency = format2(numberAmount);
    //agent.add(`Baik, pinjaman anda sebesar Rp. ${format2(numberAmount)}`);
  } else if (stringIsNumber(amount)) {
    numberAmount = parseInt(amount);
    currency = format2(numberAmount);
    //agent.add(`Baik, pinjaman anda sebesar Rp. ${fixedAmount}`);
  }

  if (isImage > 0) {
    userData.ktpImage = ktpImageUrl;
    FirebaseAction.saveData('users');
    agent.add(`Terimakasih sudah upload ktp nya!
Berikut data kamu yang sudah kami rekap :

Nama	: ${userData.name}
Nama Ibu Kandung	: ${userData.motherName}
Alamat	: ${userData.address}
Pekerjaan : ${userData.job}
Pendapatan: ${userData.income}
No Telfon	: ${userData.phoneNumber}
Jumlah Pinjaman	: Rp. ${userData.amount}

Terimakasih sudah menghubungi layanan chat kami! Pengajuan kamu akan kami proses dalam waktu 1x24 Jam! Terimakasih 💁`);
  } else {
    setContext('awaiting_ktp');
    setContext('user_data');
    agent.add('Tolong upload ktp anda');
  }
}

// // Uncomment and edit to make your own intent handler
// // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
// // below to get this function to be run when a Dialogflow intent is matched
// function yourFunctionHandler(agent) {
//   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
//   agent.add(new Card({
//       title: `Title: this is a card title`,
//       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
//       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
//       buttonText: 'This is a button',
//       buttonUrl: 'https://assistant.google.com/'
//     })
//   );
//   agent.add(new Suggestion(`Quick Reply`));
//   agent.add(new Suggestion(`Suggestion`));
//   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
// }

// // Uncomment and edit to make your own Google Assistant intent handler
// // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
// // below to get this function to be run when a Dialogflow intent is matched
// function googleAssistantHandler(agent) {
//   let conv = agent.conv(); // Get Actions on Google library conv instance
//   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
//   agent.add(conv); // Add Actions on Google library responses to your agent's response
// }
// // See https://github.com/dialogflow/fulfillment-actions-library-nodejs
// // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

// Run the proper function handler based on the matched Dialogflow intent name
let intentMap = new Map();
intentMap.set('UserRequestLoanWithMoney', userProvidesLoanAmount);
intentMap.set('UserProvidesName', userProvidesName);
intentMap.set('UserProvidesPhoneNumber', userProvidesPhone);
intentMap.set('UserProvidesMothersName', userProvidesMotherName);
intentMap.set('UserProvidesAddress', userProvidesAddress);
intentMap.set('UserProvidesJob', userProvidesJob);
intentMap.set('UserProvidesIncome', userProvidesIncome);
intentMap.set('UserWantToLoanFromFirst', userWantToLoanFromFirst);
intentMap.set('UserWantToUpload - fallback', ktpFallback);
intentMap.set('UserProvidesSelfie - fallback', userProvidesSelfie);

// intentMap.set('GetLocation', getUserLocation);
// intentMap.set('UserUploadSelfie - fallback', selfieFallback);
// intentMap.set('your intent name here', yourFunctionHandler);
// intentMap.set('your intent name here', googleAssistantHandler);
agent.handleRequest(intentMap);
