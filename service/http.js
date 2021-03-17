const axios = require('axios');
const config = require('../config.json');

const request = axios.create({
  baseURL: config['API_HOT_REDDIT'],   
  withCredentials: false, 
  headers: {
    'Content-Type': 'application/json',    
	  'Access-Control-Allow-Origin': '*'
  },
});

module.exports = request;