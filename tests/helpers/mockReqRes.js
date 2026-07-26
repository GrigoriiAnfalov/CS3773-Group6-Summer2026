// Minimal Express-like req/res doubles, just enough to unit test the
// controllers without booting a real server.

function mockRequest({ body = {}, params = {}, query = {}, session = {}, file = undefined } = {}) {
  return { body, params, query, session, file };
}

function mockResponse() {
  const res = {
    statusCode: 200,
    body: undefined,
    view: undefined,
    viewData: undefined,
    redirectedTo: undefined,
  };
  res.status = (code) => { res.statusCode = code; return res; };
  res.render = (view, data) => { res.view = view; res.viewData = data; return res; };
  res.redirect = (url) => { res.redirectedTo = url; return res; };
  res.send = (body) => { res.body = body; return res; };
  return res;
}

// Swaps every function property of `moduleObj` for the ones in `mocks`,
// returning a restore function. Relies on Node's require cache: since the
// controller under test requires the very same cached module object, it
// sees these mocked functions too.
function withMocks(moduleObj, mocks) {
  const originals = {};
  for (const key of Object.keys(mocks)) {
    originals[key] = moduleObj[key];
    moduleObj[key] = mocks[key];
  }
  return () => {
    for (const key of Object.keys(originals)) {
      moduleObj[key] = originals[key];
    }
  };
}

module.exports = { mockRequest, mockResponse, withMocks };
