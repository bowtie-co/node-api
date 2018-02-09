const Api = require('./src/Api');

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./.local-storage');
}
 
localStorage.setItem('myFirstKey', 'myFirstValue');
console.log(localStorage.getItem('myFirstKey'));

const api = new Api({
  root: 'http://api.example.com', 
  version: 'v1', 
  secureOnly: false, 
  verbose: true,
  authorization: 'Bearer'
});

api.authorize({
  token: () => localStorage.getItem('access_token')
})

const authUser = {
  email: 'user@example.com',
  password: 'password'
};

api.post('auth/login', authUser)
  .then(resp => {
    console.log(resp);
    localStorage.setItem('access_token', resp.access_token);

    api.get('users')
      .then(users => {
        console.log('users', users);
        localStorage._deleteLocation();
      })
      .catch(console.error)
  })
  .catch(console.error)

