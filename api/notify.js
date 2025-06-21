export default async function handler(req, res) {
  console.log("📥 Request received at /api/notify");

  const { summary, description, startTime, agentEmail, joinLink, clientEmail } = req.body;

  if (!summary || !startTime || !agentEmail) {
    console.error("❌ Missing required fields");
    return res.status(400).json({ error: "Missing required fields" });
  }

  const agentMap = process.env.AGENT_MAP;
  if (!agentMap) {
    console.error("❌ AGENT_MAP is not defined");
    return res.status(500).json({ error: "Agent map is not configured" });
  }

  let agentId;
  try {
    const parsedMap = JSON.parse(agentMap);
    agentId = parsedMap[agentEmail];
  } catch (e) {
    console.error("❌ Error parsing AGENT_MAP:", e);
    return res.status(500).json({ error: "Invalid agent map format" });
  }

  if (!agentId) {
    console.error("❌ Unknown agent email:", agentEmail);
    return res.status(400).json({ error: "Unknown agent email" });
  }

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.error("❌ SLACK_BOT_TOKEN not found");
    return res.status(500).json({ error: "Slack bot token not set" });
  }

  const message = `📅 *New Client Meeting Scheduled!*\n` +
    `👤 *Client:* ${clientEmail || "Not provided"}\n` +
    `📌 *Event:* ${summary}\n` +
    `🕒 *Time:* ${startTime}\n` +
    `🔗 *Join Link:* ${joinLink || "N/A"}\n` +
    `📝 *Details:* ${description || "No extra info"}`;

  try {
    const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: agentId,
        text: message,
      }),
    });

    const slackData = await slackRes.json();
    if (!slackData.ok) {
      console.error("❌ Slack API error:", slackData.error);
      return res.status(500).json({ error: slackData.error });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Request error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
