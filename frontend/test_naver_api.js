const https = require('https');

const options = {
  hostname: 'api-gw.sports.naver.com',
  path: '/schedule/games/live/kbaseball', // try some paths
  method: 'GET',
};

// Also let's just search the web for the naver sports kbo schedule api
