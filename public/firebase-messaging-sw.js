/* Firebase messaging service worker — must stay in /public so it is served at /firebase-messaging-sw.js */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB2X-8zpA8xot-17nCpTafNbOt-otrXgIo",
  authDomain: "homeocentrum-mobile.firebaseapp.com",
  projectId: "homeocentrum-mobile",
  storageBucket: "homeocentrum-mobile.firebasestorage.app",
  messagingSenderId: "991452928656",
  appId: "1:991452928656:web:05ddb3391e2e59f61b1615",
  measurementId: "G-NDL3H9Y401",
});

firebase.messaging();
