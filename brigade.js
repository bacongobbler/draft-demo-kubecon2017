const { events, Job, Group} = require("brigadier")

function test(e, project) {
  // Create a new job
  var testJob = new Job("test-runner")

  // We want our job to run the stock Docker Python 2 image
  testJob.image = "python:2"

  // Now we want it to run these commands in order:
  testJob.tasks = [
    "cd /src",
    "pip install -r requirements.txt",
    "python setup.py test"
  ]

  // We're done configuring, so we run the job
  testJob.run()
}

events.on("pull_request", test)

events.on("imagePush", (e, p) => {
  console.log(e.payload)
  var m = "New image pushed"

  if (project.secrets.SLACK_WEBHOOK) {
    var slack = new Job("slack-notify")

    slack.image = "technosophos/slack-notify:latest"
    slack.env = {
      SLACK_WEBHOOK: project.secrets.SLACK_WEBHOOK,
      SLACK_USERNAME: "KubeConBot",
      SLACK_TITLE: "DockerHub Image",
      SLACK_MESSAGE: m + " <https://" + project.repo.name + ">",
      SLACK_COLOR: "#00ff00"
    }

    slack.tasks = ["/slack-notify"]
    slack.run()
  } else {
    console.log(m)
  }
})
