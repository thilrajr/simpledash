var request = require("request");
var helloServer = require("../server.js")
var base_url = "http://localhost:8091/"

describe("Dashboard Server", function() {
  describe("GET /", function() {
    it("returns status code 200 for login page", function(done) {
      request.get(base_url, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    it("returns status code 200 for home page", function(done) {
      request.post(base_url+"home", function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    it("returns error for non-existing project", function(done) {
      request.post({url:base_url+"dashboard", form: {projectName:'testing'}}, function(error, response, body) {
        expect(response.statusCode).toBe(500);
        // console.log(JSON.parse(response    ));
        // expect(JSON.parse(body).message).toBe("Dashboard successfully removed");
        done();
      });
    });

    it("returns status code 200 for adding project", function(done) {
      request.post({url:base_url+"addProject", form: {projectName:'testing'}}, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    it("returns status code 200 for dashboard page", function(done) {
      request.post({url:base_url+"dashboard", form: {dashboardName:'testing'}}, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    it("returns status code 200 for delete project", function(done) {
      request.post({url:base_url+"deleteProject", form: {projectName:'testing'}}, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(body).message).toBe("Dashboard successfully removed");
        helloServer.closeServer();
        done();
      });
    });

  });
  
});