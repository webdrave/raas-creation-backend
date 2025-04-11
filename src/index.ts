
import ENV from './common/env.js';
import app from './server.js';



const SERVER_START_MSG = `Express server started on port: ${ENV.PORT}`;

app.listen(ENV.PORT, () => {
  console.log(SERVER_START_MSG);
});
