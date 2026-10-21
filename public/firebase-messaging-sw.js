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

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || payload?.data?.title || "Homeocentrum";
  const body = payload?.notification?.body || payload?.data?.body || "";
  const options = {
    body,
    icon: "/favicon.ico",
    data: payload?.data || {},
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
      return undefined;
    })
  );
});
