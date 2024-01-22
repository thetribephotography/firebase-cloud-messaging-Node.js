const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { messaging } = require("firebase-admin");
admin.initializeApp();

// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase on Mac!");
// });


// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

// get the user id
// go into his db and get particulars cliqs Idss
// run a loop :
// that goes into their domain,
// gets their devicetokenId then sends a push notification to them.
/// Users/pDCVFha0iEVqe77apZnyLVhnoeT2/notifications/444QZRJJVTEjmm23TJwc
// This Function is working as expected.
exports.sendNotification = functions.firestore.document("Users/{userId}/notifications/{notificationMessageId}")
    .onCreate(  async (snap, context) => {
      const title =  snap.data().title;
      const subject =  snap.data().subject;
      const url =  snap.data().url;
      const time = snap.data().timeSent;
      const notification_type =  snap.data().notificationType;
      const picUrl =  snap.data().picUrl;
      const cliqName =  snap.data().cliqName;
      const deviceToken = snap.data().deviceToken;
      const originatorId =  snap.data().originatorId;

        console.log("Data from Notifications");
        console.log(title);
        console.log(cliqName);
        console.log(deviceToken);
        console.log("Data types")
        console.log(typeof title);
        console.log(typeof subject);
        console.log(typeof url);
        console.log(typeof time);
        console.log(typeof notification_type);
        console.log(typeof picUrl);
        console.log(typeof cliqName);
        console.log(typeof deviceToken);
        console.log(typeof originatorId);

        var payload = {
          token: deviceToken,
            notification: {
              title: title,
              body: subject ,
            },
            data : { 
              url :  "url",
              time : time,
              notification_type: notification_type,
              picUrl: picUrl,
              cliqName : cliqName,
              deviceToken : deviceToken,
              originatorId : originatorId, 
            }
          }; 
    
          admin.messaging().send(payload)
          .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
          })
          .catch((error) => {
            console.log('Error sending message:', error);
          });

} );



    // users can create check ups at any time, so try to notify them every 30 min
    //################
exports.periodicCheckUps = functions.pubsub.schedule('every 30 minutes').onRun( async (context) => {
      console.log('<<<<<<<< This will be run every 30 minutes! >>>>>>>>');
      console.log('<<<<< deloying from Mac >>>>>>>>')

      function addHoursandMinutes(sTimeCreated , sHours, sMinutes ) {
        const newData = new Date(sTimeCreated);
        newData.setHours(newData.getHours() + sHours);
        newData.setMinutes( newData.getMinutes() + sMinutes );
        return newData;
      };
  
      function isAfterCurrentTime(sTimeruning, currentTime ){
        return sTimeruning > currentTime;
      }
      // is diference between time less than 30 miutes
      function differencBetweenTime(sTimeruning ){
        const timeNow = new Date();
        // const hours = parseInt(Math.abs(sTimeruning - timeNow) / (1000 * 60 * 60) % 24);
        const minutes = parseInt(Math.abs(sTimeruning.getTime() - timeNow.getTime()) / (1000 * 60) % 60);
        // ###############
        // false if timecreated and currentime diff are less than #####  5
        if(minutes < 29 ) {

          return false;
        }else {
          return true;
        }

      }

     await admin.firestore().collection('CheckUpList').get().then( function(querySnapshot){
        querySnapshot.forEach(function(doc){

          var payload = {

            notification: {
              title: 'Hi  just checking on you',
              body: ' if every thing is all good ignore this message otherwise tap on it' ,
              sound : "default"
            },
            data : { 
              route : "quick_connect",
              notificationType : "random",
            }
      
          }; 
          function sendMessage(userId){
            console.log('sending message to $userId ' )
            admin.firestore().collection('Users').doc(userId).get().then( value => {
              var userDeviceId =  value.data().deviceToken;
              admin.messaging().sendToDevice( userDeviceId, payload).then( val => {
                console.log( ">>>>>> Periodic check up  message sent successfuly <<<<<<<<", val );
              } ).catch( error => {
                console.log('Error while trying to send message:', error );
              }  )
            }  )
          }

          const pTimeCreated = new Date(doc.data().timeCreated);
          const pHours = doc.data().hours;
          const pMinutes = doc.data().minutes;
          console.log('Time created');
          console.log(pTimeCreated.toString());
          
          // adds to the time it was created
          const pTimeRunning = addHoursandMinutes(pTimeCreated, pHours, pMinutes );
          console.log('<<<<< Time Running >>>>>>>');
          console.log(pTimeRunning.toString());

          const nownow = new Date();
          console.log('<<<<< Time.now() >>>>>>>');
          console.log( nownow.toString() );
          console.log('<<<<< Checking if its time has elasped >>>>>>>');
          
          // should return true if Running time is greater than current time  
          if( isAfterCurrentTime(pTimeRunning, nownow )  ){
            console.log('<<<Return true it is after current time >>>');
            // we check a variable that has the time notification was last sent *** don't wanna do it ***
            // In situations where cliqs has just been created and not up to 30 minutes ### 5 min now
            // send notifion if greater than ### 4 min
            if( differencBetweenTime(pTimeCreated) ){
              // * ooooooooooooooooooooooooooooooooo
              console.log('<<<<<< Sending periodic notification')
              sendMessage(doc.data().originator_id)
            } else {
              console.log('<<<< Recently created, not up to required time to send notification  >>>>>> ' )
            }


          } else {
            console.log('<<<Return false it is before current time. should be deleted. it has expaire >>>');
            //Todo: delete old(expaired check ups)
            
          }

        })
      }  )
      
    });