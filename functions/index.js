'use strict';

const functions = require('firebase-functions');
const { db } = require('./utils/admin');
const { WebhookClient } = require('dialogflow-fulfillment');
const app = require('express')();
const request = require('request');
const cors = require('cors');
const bodyParser = require('body-parser');
const lodash = require('lodash/lang');
const { sms } = require('./controllers');

process.env.DEBUG = 'dialogflow:debug';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/sms', sms);

exports.api = functions.https.onRequest(app);

// enables lib debugging statements

class TwilioPayload {
  static twilioPayload(agent) {
    console.log(agent.originalRequest.payload.data);
    return agent.originalRequest.payload.data;
  }
}

class Context {
  setContext(yourContext, lifeSpan = 1) {
    return agent.setContext({
      name: yourContext,
      lifespan: lifeSpan
    });
  }
}

let userData = {
  userName: '',
  phoneNumber: '',
  motherName: '',
  amountRequest: '',
  address: '',
  ktpImage: '',
  selfieUrl: '',
  job: '',
  income: ''
};

function hasNumber(myString) {
  return /\d/.test(myString);
}

// function for checking if string contains only a number
function stringIsNumber(myString) {
  return /^\d+$/.test(myString);
}

// function for checking if string contains only letters
function onlyLetters(myString) {
  return /^[a-zA-Z]+$/.test(myString);
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function setContext(yourContext, lifeSpan = 1) {
    return agent.setContext({
      name: yourContext,
      lifespan: lifeSpan
    });
  }
  // function for converting number to currency format
  function format2(n) {
    return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1.');
  }

  // function for checking the loan amount
  function checkAmount(totalAmount) {
    if (totalAmount >= 1000000) {
      setContext('awaiting_name');
      setContext('user_data', 20);
      return agent.add(`Baik, selanjutnya tolong isi nama kamu yah. Nama kamu siapa?`);
    } else if (totalAmount > 50000000) {
      return agent.add(`Aduh, jumlah pinjeman yang kamu pengen ketinggian nih, coba dibawah 50 juta ya`);
    } else {
      return agent.add(`Kalo kamu mau minjem dibawah 1 juta, minjem aja sama tetangga ya`);
    }
  }

  function userProvidesName(agent) {
    const name = agent.parameters.name;
    userData.userName = name;

    if (onlyLetters(name)) {
      if (name.length < 3) {
        setContext('awaiting_name', 1);
        setContext('user_data', 12);
        return agent.add(`Masa nama kamu cuma ${name.length} karakter doang sih?
Masukkin lagi ya nama kamu yang bener`);
      } else {
        setContext('awaiting_mother', 1);
        return agent.add(`ok ${name}, selanjutnya siapa nama ibu kandung kamu? 💁`);
      }
    }
    if (hasNumber(name)) {
      setContext('awaiting_name', 1);
      setContext('user_data', 12);
      return agent.add('Masukkan nama kamu dengan benar ya, tidak mengandung angka');
    } else {
      setContext('awaiting_mother');
      return agent.add(`Ok ${name}, selanjutnya siapa nama ibu kandung kamu? 💁`);
    }
  }

  function userProvidesPhone(agent) {
    const phoneNumber = agent.parameters['phone-number'];
    userData.phoneNumber = phoneNumber;

    if (stringIsNumber(phoneNumber)) {
      if (phoneNumber.length < 9 || phoneNumber.length > 13) {
        setContext('awaiting_phone');
        setContext('user_data', 12);
        return agent.add('Nomor telfon harus sesuai format antara 9 - 13 digit');
      } else {
        setContext('awaiting_address');
        setContext('user_data', 12);
        return agent.add('Mantapp, selanjutnya tolong isi alamat rumah kamu ya sesuai ktp');
      }
    } else {
      setContext('awaiting_phone');
      setContext('user_data', 12);
      return agent.add('Masukkan nomor telfon hanya berisi angka');
    }
  }

  function userWantToLoanFromFirst(agent) {
    const amount = agent.parameters.loanRequest;
    const amountWithoutSpace = amount.replace(/\s/g, '').toLowerCase();

    if (amountWithoutSpace.includes('.')) {
      userData.amountRequest = amountWithoutSpace;
      const numberAmount = amountWithoutSpace.split('.').join('');
      return checkAmount(numberAmount);
    }

    if (amountWithoutSpace.includes('jt')) {
      const fixedAmount = amountWithoutSpace.replace('jt', '000000');
      const numberAmount = parseInt(fixedAmount);
      const currency = format2(numberAmount);
      userData.amountRequest = currency;
      return checkAmount(numberAmount);
    } else if (amountWithoutSpace.includes('juta')) {
      const fixedAmount = amountWithoutSpace.replace('juta', '000000');
      const numberAmount = parseInt(fixedAmount);
      const currency = format2(numberAmount);
      userData.amountRequest = currency;
      return checkAmount(numberAmount);
    } else if (stringIsNumber(amountWithoutSpace)) {
      const numberAmount = parseInt(amountWithoutSpace);
      const currency = format2(numberAmount);
      userData.amountRequest = currency;
      return checkAmount(numberAmount);
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
      agent.add('Masukkan nama ibu kamu dengan benar ya, tidak mengandung angka');
    } else {
      setContext('awaiting_phone');
      agent.add(`Ok ${name}, selanjutnya berapa nomor telfon kamu? 💁`);
    }
  }

  function userProvidesAddress(agent) {
    const address = agent.getContext('user_data').parameters.address;
    userData.address = address;

    if (stringIsNumber(address)) {
      setContext('awaiting_address');
      setContext('user_data', 5);
      return agent.add(`Masukkan alamat kamu dengan benar, bukannya angka ${address}`);
    }

    if (!address.length < 5) {
      setContext('awaiting_job');
      agent.add('Good! Selanjutnya, pekerjaan kamu apa? 💁');
    } else {
      setContext('awaiting_address', 1);
      setContext('user_data', 5);
      agent.add(`Masa alamat kamu cuma ${address.length} karakter doang sih? Masukkin lagi ya nama kamu yang bener`);
    }
  }

  function userProvidesJob(agent) {
    const job = agent.getContext('user_data').parameters.job;
    userData.job = job;

    if (!hasNumber(job)) {
      setContext('awaiting_income');
      return agent.add('Ok, berapa pendapatan perbulan kamu?');
    } else {
      setContext('awaiting_job');
      setContext('user_data', 10);
      return agent.add('Maaf, pekerjaan tidak dapat berisi angka, hanya alphabet');
    }
  }

  function userProvidesIncome(agent) {
    let income = agent.parameters.income;
    let income2 = agent.parameters.income.split(' ').join('');

    if (income.includes('.')) {
      let convertIncome = parseInt(income.split('.').join(''));
      if (stringIsNumber(convertIncome)) {
        if (convertIncome >= 1000000) {
          userData.income = income;
          setContext('awaiting_selfie', 1);
          console.log(userData.amountRequest);
          console.log(agent.queryText);
          return agent.add(
            'Oke, data pendapatan kamu sukses kami simpan. Selanjutnya tolong upload foto selfie kamu ya'
          );
        } else {
          setContext('awaiting_income', 1);
          setContext('user_data', 9);
          console.log(userData.amountRequest);
          return agent.add(
            'Maaf pendapatan kamu dibawah range yang sudah kami tentukan. Tolong bekerja dulu sebelum meminjam uang ya! :)'
          );
        }
      } else {
        setContext('awaiting_income');
        setContext('user_data', 9);
        return agent.add('Maaf sepertinya ada kesalahan dalam inputan kamu, coba kamu ulangi ya');
      }
    }

    if (income2.includes('jt')) {
      const fixedAmount = income2.replace('jt', '000000');
      const numberAmount = parseInt(fixedAmount);
      const currency = format2(numberAmount);
      if (numberAmount >= 1000000) {
        userData.income = currency;
        setContext('awaiting_selfie');
        return agent.add('Ok, data pendapatan kamu sukses kami simpan. Selanjutnya tolong upload foto selfie kamu ya');
      } else {
        setContext('awaiting_income');
        set;
        return agent.add(
          'Maaf, pendapatan kamu dibawah persyaratan kami. Untuk dapat meminjam, pastikan pendapatan kamu diatas 500 ribu ya'
        );
      }
    } else if (income2.includes('juta')) {
      const fixedAmount = income2.replace('juta', '000000');
      const numberAmount = parseInt(fixedAmount);
      const currency = format2(numberAmount);
      if (numberAmount >= 1000000) {
        userData.income = currency;
        setContext('awaiting_selfie');
        return agent.add('Ok, data pendapatan kamu sukses kami simpan. Selanjutnya tolong upload foto selfie kamu ya');
      } else {
        setContext('awaiting_income');
        setContext('user_data', 3);
        return agent.add('Maaf, pendapatan kamu dibawah persyaratan kami');
      }
    }

    if (stringIsNumber(income)) {
      const incomes = parseInt(income);
      if (incomes >= 1000000) {
        userData.income = income;
        setContext('awaiting_selfie', 1);
        return agent.add('Oke, data pendapatan kamu sukses kami simpan. Selanjutnya tolong upload foto selfie kamu ya');
      } else {
        setContext('awaiting_income', 1);
        setContext('user_data', 9);
        return agent.add(
          'Maaf pendapatan kamu dibawah range yang sudah kami tentukan. Tolong bekerja dulu sebelum meminjam uang ya! :)'
        );
      }
    } else {
      setContext('awaiting_income', 1);
      setContext('user_data', 9);
      return agent.add('Maaf, masukkan data pendapatan kamu dengan benar ya!');
    }
  }

  function userProvidesSelfie(agent) {
    const twilio = agent.originalRequest.payload.data;
    if (lodash.isEmpty(twilio)) {
      setContext('user_data', 0);
      return agent.add('Hanya bisa diakses melalui Mobile Phone');
    }

    const isImage = twilio.NumMedia > 0;

    if (isImage) {
      const selfieUrl = twilio.MediaUrl0;
      userData.selfieUrl = selfieUrl;
      setContext('awaiting_ktp');
      return agent.add('Terimakasih sudah upload selfie kamu! Yang terakhir mohon upload foto ktp kamu ya!!');
    } else {
      setContext('awaiting_selfie');
      setContext('user_data', 2);
      return agent.add('Tolong upload ktp anda');
    }

    if (isImage) {
      const selfieUrl = twilio.MediaUrl0;
      const blobType = twilio.MediaContentType0 === 'image/jpeg';

      userData.selfieUrl = selfieUrl;
      setContext('awaiting_ktp');
      return agent.add('Terimakasih sudah upload foto selfie kamu! Yang terakhir, tolong upload foto ktp kamu ya');
    } else {
      setContext('awaiting_selfie');
      setContext('user_data', 3);
      return agent.add('Masukkan selfie kamu dengan benar ya, hanya kirimkan foto');
    }
  }

  async function ktpFallback(agent) {
    //agent.setFollowupEvent('TWILIO_MMS_RECEIVED');
    const twilioPayload = agent.originalRequest.payload.data;
    const ktpImageUrl = twilioPayload.MediaUrl0;
    const isImage = twilioPayload.NumMedia > 0;

    if (lodash.isEmpty(twilioPayload)) {
      return agent.add('Maaf, hanya bisa diakses melalui layanan whatsapp mobile phone');
    }

    if (isImage) {
      userData.ktpImage = ktpImageUrl;
      let agentConv = agent.add(`Terimakasih sudah upload ktp nya! Berikut data kamu yang sudah kami rekap :
      
Nama	: ${userData.userName}    
Nama Ibu Kandung	: ${userData.motherName}      
Alamat	: ${userData.address}
Pekerjaan : ${userData.job}      
Pendapatan: Rp. ${userData.income}
No Telfon	: ${userData.phoneNumber}
Jumlah Pinjaman	: Rp. ${userData.amountRequest}

Terimakasih sudah menghubungi layanan chat kami! Pengajuan kamu akan kami proses dalam waktu 1x24 Jam! Terimakasih 💁`);

      return db.collection('users').add(userData).then(agentConv).catch((err) => agent.add('Maaf ada kesalahan'));
    } else {
      setContext('awaiting_ktp');
      return agent.add('Tolong kirimkan foto, bukan yang lain-lain okee!!');
    }
  }

  let intentMap = new Map();
  //intentMap.set('UserRequestLoanWithMoney', userProvidesLoanAmount);
  intentMap.set('UserWantToLoanFromFirst', userWantToLoanFromFirst);
  intentMap.set('UserProvidesName', userProvidesName);
  intentMap.set('UserProvidesPhoneNumber', userProvidesPhone);
  intentMap.set('UserProvidesMothersName', userProvidesMotherName);
  intentMap.set('UserProvidesAddress', userProvidesAddress);
  intentMap.set('UserProvidesJob', userProvidesJob);
  intentMap.set('UserProvidesIncome', userProvidesIncome);
  //intentMap.set('UserWantToUpload', ktpFallback);
  //intentMap.set('Selfie Upload - fallback', selfieFallback);
  intentMap.set('Selfie Upload - fallback', userProvidesSelfie);
  intentMap.set('Ktp Upload - fallback', ktpFallback);

  // intentMap.set('GetLocation', getUserLocation);
  // intentMap.set('UserUploadSelfie - fallback', selfieFallback);
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
