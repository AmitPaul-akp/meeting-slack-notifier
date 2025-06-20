export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { summary, description, startTime, agentEmail, joinLink } = req.body;

  const agentMap = JSON.parse(process.env.AGENT_MAP);
  const slackUserId = agentMap[agentEmail];

  if (!slackUserId) return res.status(400).send("No Slack ID for this agent");

  const message = {
    channel: slackUserId,
    text: `📅 *New Client Meeting Scheduled!*\n\n*Client/Event:* ${summary}\n*Time:* ${startTime}\n*Join Link:* ${joinLink || "N/A"}\n*Details:* ${description || "No extra info"}`
  };

  const resp = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(message)
  });

  const data = await resp.json();
  if (!data.ok) return res.status(500).json({ error: data.error });

  res.status(200).send("Notification sent!");
}
