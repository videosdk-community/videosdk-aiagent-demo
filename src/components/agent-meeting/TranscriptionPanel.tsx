
import React, { useState, useEffect, useRef } from "react";
import { useTranscription } from "@videosdk.live/react-sdk";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, MessageSquare, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { TranscriptionMessage } from "./TranscriptionMessage";

interface TranscriptionData {
  id: string;
  text: string;
  participantId: string;
  participantName: string;
  timestamp: Date;
  isPartial: boolean;
}

interface TranscriptionPanelProps {
  participants: Map<string, any>;
  localParticipantId?: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({
  participants,
  localParticipantId,
  isVisible,
  onToggleVisibility,
}) => {
  const [transcriptions, setTranscriptions] = useState<TranscriptionData[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { startTranscription, stopTranscription } = useTranscription({
    onTranscriptionStateChanged: ({ status }) => {
      console.log("Transcription status changed:", status);
      setIsTranscribing(status === "TRANSCRIPTION_STARTED");
      
      if (status === "TRANSCRIPTION_STARTED") {
        toast({
          title: "Transcription Started",
          description: "Real-time transcription is now active",
        });
      } else if (status === "TRANSCRIPTION_STOPPED") {
        toast({
          title: "Transcription Stopped",
          description: "Real-time transcription has been disabled",
        });
      }
    },
    onTranscriptionText: ({ participantId, participantName, text, type }) => {
      console.log("Transcription received:", { participantId, participantName, text, type });
      
      const isPartial = type === "realtime";
      const timestamp = new Date();
      
      setTranscriptions(prev => {
        // If this is a partial transcription, replace the last partial message from the same participant
        if (isPartial) {
          const filtered = prev.filter(t => 
            !(t.participantId === participantId && t.isPartial)
          );
          return [...filtered, {
            id: `${participantId}-${timestamp.getTime()}`,
            text,
            participantId,
            participantName: participantName || "Unknown",
            timestamp,
            isPartial: true,
          }];
        } else {
          // For final transcriptions, remove any partial messages from this participant and add the final one
          const filtered = prev.filter(t => 
            !(t.participantId === participantId && t.isPartial)
          );
          return [...filtered, {
            id: `${participantId}-${timestamp.getTime()}`,
            text,
            participantId,
            participantName: participantName || "Unknown",
            timestamp,
            isPartial: false,
          }];
        }
      });
    },
  });

  // Auto-scroll to bottom when new transcriptions arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [transcriptions]);

  const handleToggleTranscription = () => {
    try {
      if (isTranscribing) {
        stopTranscription();
      } else {
        startTranscription({});
      }
    } catch (error) {
      console.error("Error toggling transcription:", error);
      toast({
        title: "Transcription Error",
        description: "Failed to toggle transcription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearTranscriptions = () => {
    setTranscriptions([]);
    toast({
      title: "Transcriptions Cleared",
      description: "All transcription messages have been removed",
    });
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggleVisibility}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-[#1F1F1F] hover:bg-[#252A34] border border-[#252A34] shadow-lg"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-[#161616] border border-[#252A34] rounded-lg shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#252A34]">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-white" />
          <h3 className="text-sm font-medium text-white">Live Transcription</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleToggleTranscription}
            size="sm"
            className={cn(
              "w-8 h-8",
              isTranscribing 
                ? "bg-[#380b0b] hover:bg-[#380b0b] text-[#a13f3f]" 
                : "bg-[#0b3820] hover:bg-[#0b3820] text-[#3fa16d]"
            )}
          >
            {isTranscribing ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button
            onClick={onToggleVisibility}
            size="sm"
            className="w-8 h-8 bg-[#1F1F1F] hover:bg-[#252A34]"
          >
            <X className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-3">
          <div className="space-y-3">
            {transcriptions.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                {isTranscribing ? "Listening for speech..." : "Start transcription to see messages"}
              </div>
            ) : (
              transcriptions.map((transcription) => (
                <TranscriptionMessage
                  key={transcription.id}
                  message={transcription.text}
                  participantName={transcription.participantName}
                  timestamp={transcription.timestamp}
                  isUser={transcription.participantId === localParticipantId}
                  isPartial={transcription.isPartial}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {transcriptions.length > 0 && (
          <div className="p-3 border-t border-[#252A34]">
            <Button
              onClick={clearTranscriptions}
              size="sm"
              variant="outline"
              className="w-full text-xs"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
