import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

const firebaseConfig = { 
    apiKey: "AIzaSyDb2IukMeXHNvhqL8GLiaY_4GYF60dv81A", 
    authDomain: "mavikent-aa820.firebaseapp.com", 
    databaseURL: "https://mavikent-aa820-default-rtdb.firebaseio.com", 
    projectId: "mavikent-aa820", 
    storageBucket: "mavikent-aa820.firebasestorage.app", 
    messagingSenderId: "540042704807", 
    appId: "1:540042704807:web:c52463450a28bb25e7a882" 
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const db = firebase.database();