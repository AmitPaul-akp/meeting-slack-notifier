export default async function handler(req, res) {
  console.log("📥 Request received at /api/notify");

  // Step 1: Manually parse body if needed
  let body = req.body;

  if (req.headers["content-type"] === "application/json" && typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (err) {
      console.error("❌ JSON parse error:", err);
      return res.status(400).json({ error: "Invalid JSON format" });
    }
  }

  const { summary, description, startTime, agentEmail, clientEmail, joinLink } = body;

  // Step 2: Validate required fields
  if (!summary || !startTime || !agentEmail) {
    console.error("❌ Missing required fields");
    return res.status(400).json({ error: "Missing required fields" });
  }

  console.log("✅ Parsed body:", body);

  // Step 3: Load environment variables
  const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
  const AGENT_MAP = process.env.AGENT_MAP ? JSON.parse(process.env.AGENT_MAP) : {};

  if (!SLACK_BOT_TOKEN || !AGENT_MAP[agentEmail]) {
    console.error("❌ Slack token or agent email not configured");
    return res.status(400).json({ error: "Slack setup incomplete or agent email not found" });
  }

  const agentSlackId = AGENT_MAP[agentEmail];

  // Step 4: Compose Slack message
  const message = `
:date: *New Client Meeting Scheduled!*
*Client/Event:* ${summary}
*Client Email:* ${clientEmail || "N/A"}
*Time:* ${startTime}
*Join Link:* ${joinLink || "N/A"}
*Details:* ${description || "No extra info"}
  `;

  // Step 5: Send Slack message via chat.postMessage
  try {
    const slackResponse = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SLACK_BOT_TOKEN}`
      },
      body: JSON.stringify({
        channel: agentSlackId,
        text: message
      })
    });

    const result = await slackResponse.json();

    if (!result.ok) {
      console.error("❌ Slack API error:", result);
      return res.status(500).json({ error: "Slack API failed", details: result });
    }

    console.log("✅ Slack message sent successfully");
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
