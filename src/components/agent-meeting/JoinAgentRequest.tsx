import { AgentSettings, PROMPTS, VIDEOSDK_TOKEN } from "./types";

export const joinAgent = async (meetingId: string, agentSettings: AgentSettings, backendUrl: string = "https://aiendpoint.tryvideosdk.live") => {
  try {
    // Determine the system prompt based on personality
    let systemPrompt = "";
    if (agentSettings.personality === "Custom" && agentSettings.customPrompt) {
      systemPrompt = agentSettings.customPrompt;
    } else {
      systemPrompt = PROMPTS[agentSettings.personality as keyof typeof PROMPTS] || "";
    }

    // Create base request body matching backend MeetingReqConfig exactly
    const requestBody: any = {
      meeting_id: meetingId,
      token: VIDEOSDK_TOKEN,
      pipeline_type: agentSettings.pipelineType === "openai" 
        ? (agentSettings.realtimeModel || "gpt-4o-realtime-preview-2025-06-03")
        : agentSettings.pipelineType,
      personality: agentSettings.personality,
      system_prompt: systemPrompt,
      detection: agentSettings.detection || true, // Default to true as per server model
      avatar: agentSettings.agentType === 'avatar' // Convert agentType to avatar boolean
    };

    // Add optional fields only if they exist and are relevant
    if (agentSettings.pipelineType === "cascading") {
      requestBody.stt = agentSettings.stt;
      requestBody.tts = agentSettings.tts;
      requestBody.llm = agentSettings.llm;
    }

    // Add MCP URL only if provided
    if (agentSettings.mcpUrl && agentSettings.mcpUrl.trim() !== "") {
      requestBody.mcp_url = agentSettings.mcpUrl;
    }

    console.log("Joining agent with request body matching MeetingReqConfig:", requestBody);

    const response = await fetch(`${backendUrl}/join-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Agent joined successfully:", data);
      return data;
    } else {
      const errorData = await response.text();
      console.error("Error joining agent:", response.status, errorData);
      throw new Error(`Failed to join agent: ${response.status} - ${errorData}`);
    }
  } catch (error) {
    console.error("Error in joinAgent:", error);
    throw error;
  }
};

export const leaveAgent = async (meetingId: string, backendUrl: string = "https://aiendpoint.tryvideosdk.live") => {
  try {
    const requestBody = {
      meeting_id: meetingId
    };

    console.log("Leaving agent with request:", requestBody);

    const response = await fetch(`${backendUrl}/leave-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Agent left successfully:", data);
      return data;
    } else {
      const errorData = await response.text();
      console.error("Error leaving agent:", response.status, errorData);
      throw new Error(`Failed to leave agent: ${response.status} - ${errorData}`);
    }
  } catch (error) {
    console.error("Error in leaveAgent:", error);
    throw error;
  }
};
