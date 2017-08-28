import chai, { expect } from "chai"
import spies from "chai-spies"

/*******************************/
/**           Stubs           **/
/*******************************/
chai.use(spies);
const fetch = (status, body)=>Promise.resolve({
        status,
        json: ()=>Promise.resolve({ body })
      }),
      fetchSpy = chai.spy(fetch),
      dispatch = chai.spy();
global.fetch = fetchSpy;
