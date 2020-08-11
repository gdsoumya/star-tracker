const core = require("@actions/core");
const request = require("@octokit/request").request;
const fetch = require("node-fetch");

const StarTracker = async () => {
  try {
    let result = [],
      count = 0;
    for (let page = 1; ; ++page) {
      let res = await request("GET /repos/:owner/:repo/stargazers", {
        headers: {
          authorization: `token ${core.getInput("token")}`,
        },
        mediaType: {
          format: "star",
        },
        owner: core.getInput("owner"),
        repo: core.getInput("repo"),
        per_page: 100,
        page,
      });
      if (res.data.length == 0) break;
      count += res.data.length;
      res = res.data.filter((gazer) => {
        d1 = new Date(gazer.starred_at);
        d2 = new Date();
        return (d2.getTime() - d1.getTime()) / 1000 / 3600 <= 24;
      });
      result = [...result, ...res];
    }
    let slackValue = "";
    console.log(`The event payload: ${JSON.stringify(result)}`);
    result.forEach(({ user }, index) => {
      slackValue += `${index + 1}. <${user["html_url"]}|${user["login"]}>\n`;
    });
    const slackData = {
      text: "New users who have starred ChaosMesh",
      attachments: [
        {
          mrkdwn_in: ["value"],
          color: "#36a64f",
          fields: [
            {
              title: "Stars @ChaosMesh",
              value: `total = ${count}\ntoday = ${result.length}`,
              short: true,
            },
            {
              title: "Starred By",
              value: slackValue,
              short: true,
            },
          ],
        },
      ],
    };
    const resp = await fetch(core.getInput("slack_webhook"), {
      method: "post",
      body: JSON.stringify(slackData),
      headers: { "Content-Type": "application/json" },
    });
    console.log("SLACK RESPONSE ", resp);
  } catch (error) {
    core.setFailed(error.message);
  }
};

// Start Star Tracker
StarTracker();
