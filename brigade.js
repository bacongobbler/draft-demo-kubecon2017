const { events, Job, Group} = require("brigadier")

// This is the tiller version that is running in the cluster
const helmTag = "v2.7.2"
const name = "draft-demo-kubecon2017"

events.on("push", (e, p) => {
  var payload = JSON.parse(e.payload)

  if (e.provider == "github") {
    if (payload.ref == "refs/heads/master") {
      var buildJob = new Job("docker-build")
      buildJob.env = {
        "IMAGE_NAME": [p.secrets.DOCKER_REGISTRY, name+":git-"+payload.after].join("/"),
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
  var imageName = [p.secrets.DOCKER_REGISTRY, name].join("/")
  var payload = JSON.parse(e.payload)

  if (payload.action != "push") {
    console.log(`ignoring action ${payload.action}`)
    return
  }

  var version = payload.target.tag || "latest"
  if (version == "latest") {
    console.log("ignoring 'latest'")
    return
  }

  var helm = new Job("helm", "lachlanevenson/k8s-helm:" + helmTag)
  helm.tasks = [
    "helm upgrade --reuse-values --set image.tag='" + version + "',image.repository='" + imageName + "' " + name + " /src/charts/uuid-generator"
  ]

  helm.run().then( result => {
    var message = ":helm: upgraded " + name
    if (p.secrets.SLACK_WEBHOOK) {
      var slack = new Job("slack-notify", "technosophos/slack-notify:latest", ["/slack-notify"])
      slack.env = {
        SLACK_WEBHOOK: p.secrets.SLACK_WEBHOOK,
        SLACK_USERNAME: "KubeConBot",
        SLACK_TITLE: message,
        SLACK_MESSAGE: result.toString(),
        SLACK_COLOR: "#00ff00"
      }
      slack.run()
    } else {
      console.log(message)
    }
  })
})
