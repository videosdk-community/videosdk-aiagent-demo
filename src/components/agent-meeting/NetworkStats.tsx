
import React, { useState, useEffect } from "react";
import { useParticipant } from "@videosdk.live/react-sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Activity, Bot } from "lucide-react";

interface NetworkStatsProps {
  participantId: string;
  agentParticipantId?: string;
  isVisible: boolean;
}

interface AudioStats {
  jitter?: number;
  rtt?: number;
}

export const NetworkStats: React.FC<NetworkStatsProps> = ({
  agentParticipantId,
  isVisible,
}) => {
  const [agentStats, setAgentStats] = useState<AudioStats>({});
  const [isAvailable, setIsAvailable] = useState(false);

  const { getAudioStats: getAgentAudioStats } = useParticipant(agentParticipantId || "");

  useEffect(() => {
    if (!isVisible || !agentParticipantId || !getAgentAudioStats) {
      setAgentStats({});
      setIsAvailable(false);
      return;
    }

    let isMounted = true;

    const updateStats = async () => {
      if (!isMounted) return;
      
      try {
        const statsArray = await getAgentAudioStats();
        
        if (!isMounted) return;
        
        if (statsArray && statsArray.length > 0) {
          const stats = statsArray[0];
          const newStats = {
            jitter: stats.jitter,
            rtt: stats.rtt,
          };

          setAgentStats(newStats);
          setIsAvailable(true);
        } else {
          setAgentStats({});
          setIsAvailable(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error getting agent stats:", error);
          setAgentStats({});
          setIsAvailable(false);
        }
      }
    };

    // Update stats every 3 seconds
    const interval = setInterval(updateStats, 3000);
    updateStats(); // Initial call

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isVisible, getAgentAudioStats, agentParticipantId]);

  if (!isVisible || !agentParticipantId) return null;

  const getLatencyStatus = () => {
    if (!isAvailable) return { status: "unknown", color: "gray" };
    
    const { rtt = 0 } = agentStats;

    if (rtt > 300) {
      return { status: "poor", color: "red" };
    } else if (rtt > 150) {
      return { status: "fair", color: "yellow" };
    } else {
      return { status: "good", color: "green" };
    }
  };

  const { status, color } = getLatencyStatus();

  return (
    <Card className="bg-gray-900 border-gray-700 text-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            Agent Latency
          </CardTitle>
          <div className="flex items-center gap-2">
            {isAvailable ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <Badge 
              variant="outline" 
              className={`text-xs ${
                color === 'green' ? 'border-green-500 text-green-500' :
                color === 'yellow' ? 'border-yellow-500 text-yellow-500' :
                color === 'red' ? 'border-red-500 text-red-500' :
                'border-gray-500 text-gray-500'
              }`}
            >
              {status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isAvailable ? (
          <div className="text-center text-gray-400 py-8">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Waiting for agent connection...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">RTT</div>
              <div className="font-mono text-lg">
                {agentStats.rtt ? `${agentStats.rtt}ms` : "N/A"}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">Jitter</div>
              <div className="font-mono text-lg">
                {agentStats.jitter ? `${agentStats.jitter.toFixed(1)}ms` : "N/A"}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
