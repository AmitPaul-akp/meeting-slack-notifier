export default async function handler(req, res) {
  console.log("Incoming request:", req.body);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { summary, description, startTime, agentEmail, clientEmail, joinLink } = req.body;

  if (!summary || !startTime || !agentEmail) {
    console.log("Missing fields", { summary, startTime, agentEmail });
    return res.status(400).json({ error: "Missing required fields" });
  }

  const agentMap = JSON.parse(process.env.AGENT_MAP || "{}");
  const slackUserId = agentMap[agentEmail];

  if (!slackUserId) {
    console.log("Unknown agent email:", agentEmail);
    return res.status(400).json({ error: "Unknown agent email" });
  }

  const message = `📅 *New Client Meeting Scheduled!*
*Client:* ${clientEmail || "N/A"}
*Event:* ${summary}
*Time:* ${startTime}
*Join Link:* ${joinLink || "N/A"}
*Details:* ${description || "No extra info"}`;

  const result = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: slackUserId,
      text: message,
    }),
  });

  const responseData = await result.json();

  if (!responseData.ok) {
    console.log("Slack error:", responseData);
    return res.status(500).json({ error: "Slack API error", details: responseData });
  }

  return res.status(200).json({ message: "Notification sent!" });
}

Add clientEmail support to Slack notifier
