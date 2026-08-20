export interface LiveActivityUpdate {
  activityToken: string;
  timestamp: number;
  event: "update" | "end";
  contentState: Record<string, string | number | boolean>;
  staleDate?: number;
  dismissalDate?: number;
}

export interface LiveActivityPushGateway {
  send(update: LiveActivityUpdate): Promise<void>;
}

export class LoggingLiveActivityPushGateway implements LiveActivityPushGateway {
  async send(update: LiveActivityUpdate): Promise<void> {
    console.info(JSON.stringify({ kind: "live_activity_push_dry_run", update }));
  }
}

// Production implementation boundary: sign an APNs JWT, send to the Live Activity
// token with apns-push-type=liveactivity and topic=<bundle>.push-type.liveactivity.
export class APNsLiveActivityPushGateway implements LiveActivityPushGateway {
  async send(_update: LiveActivityUpdate): Promise<void> {
    throw new Error("BLOCKED_BY_CREDENTIALS: APNs key, key ID, team ID, and production bundle ID are required");
  }
}
