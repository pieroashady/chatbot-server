const { db, admin, lodash } = require('./utils/admin');
const { TWILIO } = require('./utils/admin');
const firebase = require('firebase');
const config = require('./utils/config');
const client = require('twilio')(TWILIO.accountSid, TWILIO.authToken);
const request = require('request');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const dialogflowSessionClient = require('./botlib/dialogflow_session_client');
const sessionClient = new dialogflowSessionClient(TWILIO.projectId);

firebase.initializeApp(config);
const auth = firebase.auth();

exports.sms = async (req, res) => {
  const body = req.body;
  const fex = body.Body;
  const id = body.From;
  const payload = {
    data: req.body
  };
  const dialogflowResponse = (await sessionClient.detectIntent(fex, id, body)).fulfillmentText;
  const twiml = new MessagingResponse();
  const message = twiml.message(dialogflowResponse);
  res.send(twiml.toString());
  // // if (body.MediaUrl0) {
  // //   const responsez = await sessionClient.detectIntent(
  // //     'TWILIO_MMS_RECEIVED',
  // //     '8d680c02-8af0-403b-9cb0-e52a8ae27f31',
  // //     payload
  // //   );

  // //   const dialogflowResponse = (await sessionClient.detectIntent(
  // //     'TWILIO_MMS_RECEIVED',
  // //     '8d680c02-8af0-403b-9cb0-e52a8ae27f31',
  // //     payload
  // //   )).fulfillmentText;
  // //   console.log('Response Mediaurl', responsez);
  // //   responsez.webhookSource = 'twilio';
  // //   responsez.webhookPayload = req.body;
  //   const twiml = new MessagingResponse();
  //   const message = twiml.message(dialogflowResponse);
  //   return res.send(twiml.toString());
  // }

  // const responsez = await sessionClient.detectIntent(fex, id, body);
  // responsez.webhookSource = 'twilio';
  // responsez.webhookPayload = req.body;
  // console.log('Response', responsez);
  //sessionClient.detectIntentWithEvent();

  // console.log(req.headers);
  // console.log(twiml.toString());
  // console.log('Request body', req.body);
  // //console.log('Reponse Body', res);
  // //res.send(message.toString());
  // console.log(message.toString());
};

// exports.helloWorld = (req, res) => {
//   let myJson = {
//     firstName: 'Aldi',
//     lastName: 'Piero'
//   };

//   return res.send(myJson);
// };

// exports.testPost = (req, res) => {
//   let name = req.body.name;

//   if (name !== null) {
//     return res.json({ name });
//   } else {
//     return res.status(500).json({ error: 'name cant be empty' });
//   }
// };

// exports.getUser = (req, res) => {
//   db
//     .collection('users')
//     .orderBy('createdAt', 'desc')
//     .get()
//     .then((data) => {
//       let users = [];
//       data.forEach((doc) => {
//         users.push({
//           id: doc.id,
//           firstName: doc.data().firstName,
//           lastName: doc.data().lastName,
//           createdAt: doc.data().createdAt
//         });
//       });
//       return res.send(users);
//     })
//     .catch((err) => res.send(err));
// };

// exports.createUser = (req, res) => {
//   const user = {
//     firstName: req.body.firstName,
//     lastName: req.body.lastName,
//     createdAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })
//   };

//   let message = {};

//   if (lodash.isEmpty(user.firstName)) message.firstName = 'first name cannot be empty';
//   if (user.firstName.length < 2) message.firstName2 = 'karakter nama tidak boleh kurang dari 2 karakter';
//   if (lodash.isEmpty(user.lastName)) message.lastName = 'last name cannot be empty';
//   if (user.lastName.length < 2) message.lastName2 = 'tidak boleh kurang dari 2 karakter';

//   if (!lodash.isEmpty(message)) {
//     return res.status(400).json({ errors: message });
//   } else {
//     return db.collection('users').add(user).then((doc) => {
//       res.json({
//         status: 1,
//         message: `User with id ${doc.id} was successfully created`
//       });
//     });
//   }
// };

// exports.signup = (req, res) => {
//   const newUser = {
//     email: req.body.email,
//     password: req.body.password,
//     confirmPassword: req.body.confirmPassword,
//     role: req.body.role
//   };

//   firebase
//     .auth()
//     .createUserWithEmailAndPassword(newUser.email, newUser.password)
//     .then((data) => {
//       return res.status(201).json({
//         status: 1,
//         message: `User with id ${data.user.uid} signed up successfully`
//       });
//     })
//     .catch((err) => {
//       return res.status(500).json({
//         status: 0,
//         message: err.code
//       });
//     });
// };

// exports.login = (req, res) => {
//   const user = {
//     email: req.body.email,
//     password: req.body.password
//   };

//   let errors = {};

//   if (lodash.isEmpty(user.email)) errors.email = 'Email cannot be empty';
//   if (lodash.isEmpty(user.password)) errors.password = 'Password cannot be empty';

//   if (!lodash.isEmpty(errors)) return res.status(400).json(errors);

//   auth
//     .signInWithEmailAndPassword(user.email, user.password)
//     .then((data) => {
//       return data.getIdToken();
//     })
//     .then((token) => {
//       return res.json({ token });
//     })
//     .catch((err) => {
//       console.log(err);
//       return res.json({ error: err.code });
//     });
// };
