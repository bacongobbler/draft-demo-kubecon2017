const { events, Job, Group} = require("brigadier")

events.on("pull_request", (e, p) => {
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
})

events.on("push", (e, p) => {
  var payload = JSON.parse(e.payload)

  if (e.provider == "github") {
    if (payload.ref == "refs/heads/master") {
      var buildJob = new Job("docker-build")
      buildJob.env = {
        "IMAGE_NAME": [p.secrets.DOCKER_REGISTRY, "draft-demo-kubecon2017"].join("/"),
        "DOCKER_REGISTRY": p.secrets.DOCKER_REGISTRY,
        "DOCKER_USER": p.secrets.DOCKER_USER,
        "DOCKER_PASS": p.secrets.DOCKER_PASS,
      }

      buildJob.image = "docker:17.06.0-ce"
      buildJob.docker.enabled = true
      buildJob.tasks = [
        "cd /src",
        "docker login --username $DOCKER_USER --password $DOCKER_PASS $DOCKER_REGISTRY",
        "docker build -t $IMAGE_NAME .",
        "docker push $IMAGE_NAME"
      ]
      buildJob.run()
    } else {
        console.log("skipping branch push events not on master.")
    }
  }
})

events.on("imagePush", (e, p) => {
  console.log(e.payload)
  var m = "New image pushed"

  if (p.secrets.SLACK_WEBHOOK) {
    var slack = new Job("slack-notify")

    slack.image = "technosophos/slack-notify:latest"
    slack.env = {
      SLACK_WEBHOOK: p.secrets.SLACK_WEBHOOK,
      SLACK_USERNAME: "KubeConBot",
      SLACK_TITLE: "DockerHub Image",
      SLACK_MESSAGE: m + " <https://" + p.repo.name + ">",
      SLACK_COLOR: "#00ff00"
    }

    slack.tasks = ["/slack-notify"]
    slack.run()
  } else {
    console.log(m)
  }
})
