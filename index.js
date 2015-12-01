'use strict';
const GitHubApi = require("github");
const util = require('util');
const async = require('async');
const colors = require('colors/safe');
const Spinner = require('cli-spinner').Spinner;
const unicons = require('unicons');
const read = require('read');
const crypto = require('crypto');
const config = require('home-config').load('.gh-watchmyself', {token: '', user: ''});

let github = new GitHubApi({
  version: "3.0.0",
  debug: false,
  protocol: "https",
  host: "api.github.com", // should be api.github.com for GitHub
  pathPrefix: "", // for some GHEs; none for GitHub
  timeout: 5000,
  headers: {
    "user-agent": "Github-WatchMyself" // GitHub is happy with a unique user agent
  }
});

if (!config.token.length) {
  read({
    prompt: "Github Username:",
  }, (err, user, isDefault) => {
    read({
      prompt: "Password:",
      silent: true,
      replace: unicons.dot
    }, (err, pass) => {
      authBasic(user, pass);
    });
  });
} else {
  authToken();
}


function authBasic(user, pass) {
  github.authenticate({
      type: "basic",
      username: user,
      password: pass,
  });
  config.user = user;
  github.authorization.create({
    scopes: ["user", "public_repo", "repo", "repo:status", "gist"],
    note: "gh-watchmyself",
    note_url: "https://github.com/fritzy/gh-watchmyself",
  }, function(err, res) {
    if (err && JSON.parse(err.message).documentation_url === 'https://developer.github.com/v3/auth#working-with-two-factor-authentication') {
      read({
        prompt: "Two-Factor Code:",
      }, (err, otp) => {
        github.authorization.create({
          scopes: ["user", "public_repo", "repo", "repo:status", "gist"],
          note: "gh-watchmyself",
          note_url: "https://github.com/fritzy/gh-watchmyself",
          headers: {
            "X-GitHub-OTP": parseInt(otp, 10)
          }
        }, function(err, res) {
          if (err) {
            let errMsg = JSON.parse(err.message);
            console.log("Error:", errMsg.message, errMsg.documentation_url);
            if (errMsg.documentation_url === 'https://developer.github.com/v3/oauth_authorizations/#create-a-new-authorization') {
              console.log("You may already have a token named \"gh-watchmyself\" at https://github.com/settings/tokens");
            }
            process.exit(1);
          }
          config.token = res.token;
          config.save();
          authToken();
        });
      });
    } else {
      if (err) {
        let errMsg = JSON.parse(err.message);
        console.log("Error:", errMsg.message, errMsg.documentation_url);
        if (errMsg.documentation_url === 'https://developer.github.com/v3/oauth_authorizations/#create-a-new-authorization') {
          console.log("You may already have a token named \"gh-watchmyself\" at https://github.com/settings/tokens");
        }
        process.exit(1);
      }
      config.token = res.token;
      config.save();
      authToken();
    }
  });
}

function authToken() {
  github.authenticate({
      type: "oauth",
      token: config.token
  });
  console.log("=".repeat(80));
  start();
}

const repos = new Set();
const watched = new Set();

function addWatched(res) {
  res.forEach(function (repo) {
    watched.add(repo.full_name);
  });
};

function addRepo(res) {
  res.forEach(function (repo) {
    repos.add(repo.full_name);
  });
};


function start() {
  let lastRes = null;

  let spinner = new Spinner("Loading Watched " + "%s");
  spinner.setSpinnerString(3);
  spinner.start();

  let count = 0;
  github.repos.getSubscriptions({
      user: config.user,
  }, function(err, res) {
    addWatched(res);
    lastRes = res;
    async.whilst(function () {
      return !!github.hasNextPage(lastRes);
    }, function (acb) {
      github.getNextPage(lastRes, function (err, nres) {
        if (!err) {
          count ++;
          spinner.stop(false);
          spinner = new Spinner("Loading Watched " + '.'.repeat(count) + "%s");
          spinner.setSpinnerString(3);
          spinner.start();
          lastRes = nres
          addWatched(nres);
        }
        acb(err);
      });
    }, function (err) {
      if (err) {
        console.log(err);
      }
      spinner.stop(true);
      console.log("Loading Watched " + '.'.repeat(count));
      count = 0;
      spinner = new Spinner("Loading Repos " + '.'.repeat(count) + "%s");
      spinner.setSpinnerString(3);
      spinner.start();
      github.repos.getAll({
      }, function(err, res) {
        addRepo(res);
        lastRes = res;
        async.whilst(function () {
          return !!github.hasNextPage(lastRes);
        }, function (acb) {
          github.getNextPage(lastRes, function (err, nres) {
            if (!err) {
              count++;
              spinner.stop(false);
              spinner = new Spinner("Loading Repos " + '.'.repeat(count) + "%s");
              spinner.setSpinnerString(3);
              spinner.start();
              lastRes = nres
              addRepo(nres);
            }
            acb(err);
          });
        }, function (err) {
          if (err) {
            console.log(err);
          }
          spinner.stop(true);
          console.log("Loading Repos " + '.'.repeat(count));
          repos.forEach(function (repo) {
            if (watched.has(repo)) {
              console.log(colors.green(unicons.check) + ' ' + repo);
            } else {
              console.log(colors.red(unicons.cross) + ' ' + repo);
            }
          });
        });
      })
    });
  })
}
