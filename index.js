require('dotenv').config();
const ruuvi = require('node-ruuvitag');
const fetch = require('node-fetch');
const mathjs = require('mathjs');

const data = {};
const accelerationData={};
const {ADDRESS:addressEnv,API_ENDPOINT} = process.env;

const pushData = (tagid, payload) => { 
  
  const nowDate= Math.round(new Date().getTime()/1000);
  var nowMinusMinute = nowDate - 15*60;

  const accData = {
    accelerationX:payload.accelerationX,    
    accelerationY:payload.accelerationY,
    accelerationZ:payload.accelerationZ,
  }
  accelerationData[tagid]=accelerationData[tagid]||{}
  accelerationData[tagid].accelerationX=[...(accelerationData[tagid].accelerationX ||[]),accData.accelerationX];
  accelerationData[tagid].accelerationY=[...(accelerationData[tagid].accelerationY ||[]),accData.accelerationY];
  accelerationData[tagid].accelerationZ=[...(accelerationData[tagid].accelerationZ ||[]),accData.accelerationZ];

  if(!data[tagid] || data[tagid].created<nowMinusMinute ){
    const accelerationXstd=mathjs.std(accelerationData[tagid].accelerationX);
    const accelerationYstd=mathjs.std(accelerationData[tagid].accelerationY);
    const accelerationZstd=mathjs.std(accelerationData[tagid].accelerationZ);
    const body = {
      tagid,    
      payload:{...payload,accelerationXstd,accelerationYstd,accelerationZstd},
      created: nowDate,
      address:addressEnv,
    }
    data[tagid]=body;
    
    fetch(`${API_ENDPOINT}`, { 
        method: 'POST',
        body:    JSON.stringify(body, null, '\t'),
        headers: { 'Content-Type': 'application/json',
                  'x-api-key':`${API_KEY}`},
    })      
      .then(json => console.log("push",json.status));
      accelerationData[tagid]={};
  }
}

ruuvi.on('found', tag => {
  tag.on('updated', data => {
    console.log('Got data from RuuviTag ' + tag.id );
      pushData(tag.id, data);
  });
});
